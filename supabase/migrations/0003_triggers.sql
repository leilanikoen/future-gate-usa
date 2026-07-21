-- ============================================================================
-- Future Gate USA — 0003_triggers.sql
-- On-signup bootstrap, updated_at maintenance, and activity-feed logging.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_students on public.students;
create trigger touch_students before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user -> profile (+ role-specific row).
--
-- SECURITY NOTE: the role is read from app_metadata, NOT user_metadata.
-- user_metadata is writable by the client during sign-up, so it can't be
-- trusted for privilege. app_metadata is only settable by the admin API
-- (our service-role account-creation function), so a self-signed-up user is
-- always 'student'. Mentors/admins only exist because the server created them.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_app_meta_data->>'role', 'student');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_base text;
  v_slug text;
begin
  if v_role not in ('student','mentor','admin','super_admin') then
    v_role := 'student';
  end if;

  insert into public.profiles (id, role, email, full_name)
  values (new.id, v_role, new.email, v_name);

  if v_role = 'mentor' then
    insert into public.mentors (id, title, focus)
    values (new.id,
            coalesce(new.raw_user_meta_data->>'title', 'Admissions Mentor'),
            new.raw_user_meta_data->>'focus');

  elsif v_role = 'student' then
    v_base := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    if v_base is null or v_base = '' then v_base := 'student'; end if;
    v_slug := v_base;
    if exists (select 1 from public.students where slug = v_slug) then
      v_slug := v_base || '-' || substr(md5(new.id::text), 1, 4);
    end if;
    insert into public.students (id, slug) values (new.id, v_slug);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Activity feed. Each trigger writes one row into activity_events. They are
-- SECURITY DEFINER so they can insert regardless of the acting user's RLS.
-- ---------------------------------------------------------------------------
create or replace function public.log_student_joined()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (actor_id, verb, student_id)
  values (new.id, 'joined', new.id);
  return new;
end;
$$;
drop trigger if exists activity_student_joined on public.students;
create trigger activity_student_joined after insert on public.students
  for each row execute function public.log_student_joined();

create or replace function public.log_item_uploaded()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (actor_id, verb, student_id, meta)
  values (new.student_id, 'uploaded', new.student_id,
          jsonb_build_object('section', new.section, 'name', new.name));
  return new;
end;
$$;
drop trigger if exists activity_item_uploaded on public.portfolio_items;
create trigger activity_item_uploaded after insert on public.portfolio_items
  for each row execute function public.log_item_uploaded();

create or replace function public.log_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (actor_id, verb, student_id)
  values (new.author_id, 'feedback', new.student_id);
  return new;
end;
$$;
drop trigger if exists activity_feedback on public.feedback;
create trigger activity_feedback after insert on public.feedback
  for each row execute function public.log_feedback();

create or replace function public.log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.activity_events (actor_id, verb, student_id, meta)
    values (auth.uid(),
            case when new.status = 'approved' then 'approved'
                 when new.status = 'pending'  then 'submitted'
                 else 'status' end,
            new.id, jsonb_build_object('status', new.status));
  end if;
  return new;
end;
$$;
drop trigger if exists activity_status_change on public.students;
create trigger activity_status_change after update on public.students
  for each row execute function public.log_status_change();

create or replace function public.log_share()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_events (actor_id, verb, student_id)
  values (new.shared_by, 'shared', new.student_id);
  return new;
end;
$$;
drop trigger if exists activity_share on public.share_events;
create trigger activity_share after insert on public.share_events
  for each row execute function public.log_share();
