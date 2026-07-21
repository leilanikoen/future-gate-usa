-- ============================================================================
-- Future Gate USA — 0001_init.sql
-- Schema: profiles, students, mentors, portfolio items, feedback (+ replies),
-- share events, and an activity log. Timestamps everywhere so dashboard trends
-- ("vs last month", "this month", average completion) are computed from real data.
-- Run order: 0001 -> 0002 -> 0003 -> 0004.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user. role decides which area they land in.
-- Personal fields (dob/gender/nationality/city) are filled during onboarding.
-- `is_active` powers activate/deactivate (we never hard-delete accounts).
-- `email` is mirrored here from auth so admins can search the roster easily.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'student'
                check (role in ('student','mentor','admin','super_admin')),
  email       text,
  full_name   text not null default '',
  first_name  text,
  last_name   text,
  avatar_url  text,
  dob         date,
  gender      text check (gender in ('male','female') or gender is null),
  nationality text,
  city        text,
  onboarded   boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- mentors: mentor-specific fields. Shares its id with the mentor's profile.
-- ---------------------------------------------------------------------------
create table if not exists public.mentors (
  id         uuid primary key references public.profiles (id) on delete cascade,
  title      text not null default 'Admissions Mentor',
  focus      text,                       -- e.g. "Essays & interviews"
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- students: student-specific fields. Shares its id with the student's profile.
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id             uuid primary key references public.profiles (id) on delete cascade,
  grade          text,
  current_school text,
  service        text not null default 'Consulting',
  term           text not null default 'Fall 2026',
  mentor_id      uuid references public.profiles (id) on delete set null,
  status         text not null default 'in_progress'
                   check (status in ('in_progress','pending','approved')),
  privacy        text not null default 'Private'
                   check (privacy in ('Public','School-only','Private')),
  slug           text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists students_mentor_idx on public.students (mentor_id);
create index if not exists students_status_idx on public.students (status);

-- ---------------------------------------------------------------------------
-- portfolio_items: one row per uploaded/added item, grouped by section.
-- created_at lets us reconstruct completion at any past date (for trends)
-- without storing snapshots: a section counts as "done" as of date D if it
-- had at least one item created on or before D.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  section      text not null check (section in
                 ('academics','extracurriculars','leadership','awards','essays','media','recommendations')),
  name         text not null,
  type         text not null default 'Document' check (type in ('Document','Image','Video')),
  storage_path text,
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists items_student_idx on public.portfolio_items (student_id, section, position);
create index if not exists items_created_idx on public.portfolio_items (student_id, created_at);

-- ---------------------------------------------------------------------------
-- feedback + replies: mentor guidance with a threaded reply per comment.
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_student_idx on public.feedback (student_id);
create index if not exists feedback_author_idx  on public.feedback (author_id, created_at);

create table if not exists public.feedback_replies (
  id          uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- share_events: one row each time a student's public link is shared/copied.
-- Powers "Schools Shared / shared this month".
-- ---------------------------------------------------------------------------
create table if not exists public.share_events (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  shared_by  uuid references public.profiles (id) on delete set null,
  channel    text,
  created_at timestamptz not null default now()
);
create index if not exists share_student_idx on public.share_events (student_id, created_at);

-- ---------------------------------------------------------------------------
-- activity_events: feed for the mentor/admin "Recent Activity" and Activity
-- screens. Populated by triggers (see 0003) so the feed is always real.
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id) on delete set null,
  verb       text not null,   -- 'joined' | 'uploaded' | 'feedback' | 'submitted' | 'approved' | 'shared'
  student_id uuid references public.students (id) on delete cascade,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_created_idx on public.activity_events (created_at desc);
create index if not exists activity_student_idx on public.activity_events (student_id, created_at desc);
