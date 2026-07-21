-- ============================================================================
-- Future Gate USA — 0005_admin_guard.sql
-- Hardens the profile guard so that:
--   * role changes still only happen via the server (service_role);
--   * is_active on an ADMIN / SUPER_ADMIN can only be changed by a super_admin
--     (or the server); on students/mentors, by any admin (or the server).
-- ============================================================================
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_service boolean := (auth.role() = 'service_role');
begin
  if new.role is distinct from old.role and not is_service then
    new.role := old.role;
  end if;

  if new.is_active is distinct from old.is_active then
    if old.role in ('admin','super_admin') then
      if not (is_service or public.is_super_admin()) then new.is_active := old.is_active; end if;
    else
      if not (is_service or public.is_admin()) then new.is_active := old.is_active; end if;
    end if;
  end if;

  return new;
end;
$$;
