-- ============================================================================
-- Future Gate USA — 0006_portfolio_v2.sql
-- The structured, multi-module portfolio that replaces the fixed 7 sections.
--
-- Model:
--   portfolio_modules   — a student's sections (seeded from the FGU list;
--                         students may also add their own). Some are computed
--                         (Home), some hold a single entry (About Me, Contact),
--                         most hold many entries.
--   portfolio_entries   — one row per sub-page (a school, a research project,
--                         a book). The ~10 template fields are stored in a
--                         JSONB `fields` map keyed by field id; the field
--                         DEFINITIONS live in the app (src/lib/portfolioTemplates.js),
--                         so adding/adjusting fields never needs a migration.
--   portfolio_entry_files — supporting-evidence files for an entry, in the
--                         existing private `portfolio` bucket.
--
-- student_id is denormalised onto every table so the existing RLS helpers
-- (my_role / is_admin / is_mentor_of / is_shareable) and the storage path
-- convention (portfolio/<student_id>/...) apply unchanged.
--
-- NOTE: the old public.portfolio_items table is intentionally left in place so
-- nothing breaks mid-transition. It is retired in a later migration once the
-- new Portfolio Builder ships.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_modules (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  key        text not null,                       -- machine key, unique per student
  label      text not null,                       -- display name (editable)
  template   text not null default 'generic',     -- which field template drives entries
  kind       text not null default 'collection'
               check (kind in ('computed','singleton','collection')),
  icon       text,                                 -- optional lucide icon name
  is_custom  boolean not null default false,       -- student-created vs FGU default
  hidden     boolean not null default false,       -- hidden from nav / public page
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  unique (student_id, key)
);
create index if not exists modules_student_idx on public.portfolio_modules (student_id, position);

create table if not exists public.portfolio_entries (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  module_id  uuid not null references public.portfolio_modules (id) on delete cascade,
  title      text not null default '',
  subtitle   text,                                 -- e.g. organization / author
  fields     jsonb not null default '{}'::jsonb,   -- templated field values by field id
  entry_date date,                                 -- feeds the growth timeline
  featured   boolean not null default false,       -- surfaced on the dynamic Home
  hidden     boolean not null default false,       -- hidden from the public page
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_module_idx  on public.portfolio_entries (module_id, position);
create index if not exists entries_student_idx on public.portfolio_entries (student_id, created_at);

create table if not exists public.portfolio_entry_files (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  entry_id     uuid not null references public.portfolio_entries (id) on delete cascade,
  name         text not null,
  type         text not null default 'Document'
                 check (type in ('Document','Image','Video','Audio')),
  storage_path text,
  caption      text,
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists entry_files_entry_idx on public.portfolio_entry_files (entry_id, position);

-- keep updated_at fresh on entries (reuses touch_updated_at from 0003)
drop trigger if exists touch_entries on public.portfolio_entries;
create trigger touch_entries before update on public.portfolio_entries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security — mirrors the portfolio_items model exactly.
--   read : owner, admin, assigned mentor, or anyone if the portfolio is
--          shareable (Public / School-only). Public reads skip hidden rows.
--   write: the owning student only, and (for entries/files) only within their
--          own modules/entries.
-- ---------------------------------------------------------------------------
alter table public.portfolio_modules     enable row level security;
alter table public.portfolio_entries     enable row level security;
alter table public.portfolio_entry_files enable row level security;

-- modules
create policy modules_select_own    on public.portfolio_modules for select using (student_id = auth.uid());
create policy modules_select_staff  on public.portfolio_modules for select using (public.is_admin());
create policy modules_select_mentor on public.portfolio_modules for select using (public.is_mentor_of(student_id));
create policy modules_select_public on public.portfolio_modules for select
  using (public.is_shareable(student_id) and not hidden);
create policy modules_write_own     on public.portfolio_modules for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- entries
create policy entries_select_own    on public.portfolio_entries for select using (student_id = auth.uid());
create policy entries_select_staff  on public.portfolio_entries for select using (public.is_admin());
create policy entries_select_mentor on public.portfolio_entries for select using (public.is_mentor_of(student_id));
create policy entries_select_public on public.portfolio_entries for select
  using (public.is_shareable(student_id) and not hidden);
create policy entries_write_own     on public.portfolio_entries for all
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.portfolio_modules m
                where m.id = module_id and m.student_id = auth.uid())
  );

-- entry files
create policy entry_files_select_own    on public.portfolio_entry_files for select using (student_id = auth.uid());
create policy entry_files_select_staff  on public.portfolio_entry_files for select using (public.is_admin());
create policy entry_files_select_mentor on public.portfolio_entry_files for select using (public.is_mentor_of(student_id));
create policy entry_files_select_public on public.portfolio_entry_files for select
  using (public.is_shareable(student_id));
create policy entry_files_write_own     on public.portfolio_entry_files for all
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.portfolio_entries e
                where e.id = entry_id and e.student_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Seed the FGU default modules for a student. Idempotent, SECURITY DEFINER so
-- it can seed regardless of who triggers it (signup trigger, backfill, admin).
-- Editing this default list later won't retro-add modules to existing students
-- (they can add their own); a follow-up migration can top-up if needed.
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_modules(p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.portfolio_modules (student_id, key, label, template, kind, icon, position)
  values
    (p_student, 'home',             'Home',                'home',        'computed',   'LayoutDashboard', 0),
    (p_student, 'about_me',         'About Me',            'about_me',    'singleton',  'User',            1),
    (p_student, 'academic_journey', 'Academic Journey',    'school',      'collection', 'GraduationCap',   2),
    (p_student, 'research',         'Research Projects',   'research',    'collection', 'FlaskConical',    3),
    (p_student, 'publications',     'Publications & Papers','publication','collection', 'FileText',        4),
    (p_student, 'leadership',       'Leadership',          'leadership',  'collection', 'Users',           5),
    (p_student, 'community',        'Community Impact',    'community',   'collection', 'HeartHandshake',  6),
    (p_student, 'athletics',        'Athletics',           'sport',       'collection', 'Trophy',          7),
    (p_student, 'creative',         'Creative Portfolio',  'creative',    'collection', 'Palette',         8),
    (p_student, 'reading',          'Reading Journal',     'book',        'collection', 'BookOpen',        9),
    (p_student, 'travel',           'Travel & Learning',   'travel',      'collection', 'Plane',          10),
    (p_student, 'media',            'Media',               'media',       'collection', 'Image',          11),
    (p_student, 'resources',        'Resources',           'resource',    'collection', 'Link',           12),
    (p_student, 'contact',          'Contact',             'contact',     'singleton',  'Mail',           13)
  on conflict (student_id, key) do nothing;
end;
$$;

-- new students get the default modules automatically
create or replace function public.seed_modules_on_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_default_modules(new.id);
  return new;
end;
$$;
drop trigger if exists seed_modules_on_student on public.students;
create trigger seed_modules_on_student after insert on public.students
  for each row execute function public.seed_modules_on_student();

-- backfill the students that already exist
do $$
declare r record;
begin
  for r in select id from public.students loop
    perform public.seed_default_modules(r.id);
  end loop;
end;
$$;
