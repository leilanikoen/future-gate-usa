-- ============================================================================
-- Future Gate USA — 0002_security.sql
-- Helper functions + row-level security. Nothing is readable or writable until
-- a policy allows it. The four roles are: student, mentor, admin, super_admin.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER so a policy can look at profiles/students without
-- recursively triggering that same table's policies.
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() in ('admin','super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() = 'super_admin';
$$;

create or replace function public.is_mentor_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s
                 where s.id = p_student and s.mentor_id = auth.uid());
$$;

create or replace function public.is_shareable(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s
                 where s.id = p_student and s.privacy in ('Public','School-only'));
$$;

-- ---------------------------------------------------------------------------
-- Turn RLS on everywhere.
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.mentors          enable row level security;
alter table public.students         enable row level security;
alter table public.portfolio_items  enable row level security;
alter table public.feedback         enable row level security;
alter table public.feedback_replies enable row level security;
alter table public.share_events     enable row level security;
alter table public.activity_events  enable row level security;

-- ---------- profiles ----------
create policy profiles_select_self      on public.profiles for select using (id = auth.uid());
create policy profiles_select_staff     on public.profiles for select using (public.is_admin());
create policy profiles_select_mentor    on public.profiles for select using (
  public.my_role() = 'mentor'
  and exists (select 1 from public.students s where s.id = profiles.id and s.mentor_id = auth.uid())
);
create policy profiles_select_my_mentor on public.profiles for select using (
  exists (select 1 from public.students s where s.id = auth.uid() and s.mentor_id = profiles.id)
);
create policy profiles_select_public    on public.profiles for select using (public.is_shareable(profiles.id));
create policy profiles_update_self      on public.profiles for update using (id = auth.uid());
create policy profiles_update_staff     on public.profiles for update using (public.is_admin());

-- ---------- mentors ----------
create policy mentors_select_self   on public.mentors for select using (id = auth.uid());
create policy mentors_select_staff  on public.mentors for select using (public.is_admin());
create policy mentors_select_bystu  on public.mentors for select using (
  exists (select 1 from public.students s where s.mentor_id = mentors.id and s.id = auth.uid())
);
create policy mentors_update_self   on public.mentors for update using (id = auth.uid());
create policy mentors_update_staff  on public.mentors for update using (public.is_admin());

-- ---------- students ----------
create policy students_select_self   on public.students for select using (id = auth.uid());
create policy students_select_staff  on public.students for select using (public.is_admin());
create policy students_select_mentor on public.students for select using (mentor_id = auth.uid());
create policy students_select_public on public.students for select using (privacy in ('Public','School-only'));
create policy students_insert_self   on public.students for insert with check (id = auth.uid());
create policy students_insert_staff  on public.students for insert with check (public.is_admin());
create policy students_update_self   on public.students for update using (id = auth.uid());
create policy students_update_staff  on public.students for update using (public.is_admin());

-- ---------- portfolio_items ----------
create policy items_select_own    on public.portfolio_items for select using (student_id = auth.uid());
create policy items_select_staff  on public.portfolio_items for select using (public.is_admin());
create policy items_select_mentor on public.portfolio_items for select using (public.is_mentor_of(student_id));
create policy items_select_public on public.portfolio_items for select using (public.is_shareable(student_id));
create policy items_write_own     on public.portfolio_items for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------- feedback ----------
create policy feedback_select_student on public.feedback for select using (student_id = auth.uid());
create policy feedback_select_mentor  on public.feedback for select using (public.is_mentor_of(student_id));
create policy feedback_select_staff   on public.feedback for select using (public.is_admin());
create policy feedback_insert_mentor  on public.feedback for insert
  with check (author_id = auth.uid() and public.is_mentor_of(student_id));
create policy feedback_insert_staff   on public.feedback for insert
  with check (author_id = auth.uid() and public.is_admin());
create policy feedback_update_student on public.feedback for update using (student_id = auth.uid());
create policy feedback_update_author  on public.feedback for update using (author_id = auth.uid());
create policy feedback_update_staff   on public.feedback for update using (public.is_admin());

-- ---------- feedback_replies ----------
create policy replies_select on public.feedback_replies for select using (
  exists (select 1 from public.feedback f where f.id = feedback_id
          and (f.student_id = auth.uid() or public.is_mentor_of(f.student_id) or public.is_admin()))
);
create policy replies_insert on public.feedback_replies for insert with check (
  author_id = auth.uid()
  and exists (select 1 from public.feedback f where f.id = feedback_id
              and (f.student_id = auth.uid() or public.is_mentor_of(f.student_id) or public.is_admin()))
);

-- ---------- share_events ----------
create policy shares_select on public.share_events for select using (
  student_id = auth.uid() or public.is_admin() or public.is_mentor_of(student_id)
);
create policy shares_insert on public.share_events for insert with check (
  student_id = auth.uid() or public.is_admin()
);

-- ---------- activity_events ----------
-- Read-only for clients; rows are written by SECURITY DEFINER triggers (0003).
create policy activity_select on public.activity_events for select using (
  public.is_admin() or public.is_mentor_of(student_id) or student_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard on profiles.
--   * role can only be changed by the server (service_role) — i.e. the guarded
--     account-creation function. Clients can never change a role.
--   * is_active can be toggled by admins/super-admins (activate/deactivate) or
--     the server; a user can't reactivate or change their own status.
-- Any client attempt to change these fields is silently reverted to the old
-- value rather than erroring, so ordinary profile edits (name, photo, etc.)
-- still succeed.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_service boolean := (auth.role() = 'service_role');
begin
  if new.role is distinct from old.role and not is_service then
    new.role := old.role;
  end if;
  if new.is_active is distinct from old.is_active and not (is_service or public.is_admin()) then
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_changes on public.profiles;
create trigger guard_profile_changes
  before update on public.profiles
  for each row execute function public.guard_profile_changes();
