-- ============================================================================
-- Future Gate USA — 0007_entry_visibility.sql
-- Per-entry visibility, using the same vocabulary as students.privacy.
--   Public      — shown on the shared public link.
--   School-only — shown on the shared public link (link-only audience).
--   Private     — kept OFF the public page, but the owner, the assigned mentor,
--                 and admins can still see it (so drafts are reviewable).
-- Only the public-facing policies change; owner/mentor/admin reads are unchanged.
-- ============================================================================

alter table public.portfolio_entries
  add column if not exists visibility text not null default 'Public'
    check (visibility in ('Public','School-only','Private'));

-- Public sees only non-hidden, non-private entries of a shareable portfolio.
drop policy if exists entries_select_public on public.portfolio_entries;
create policy entries_select_public on public.portfolio_entries for select
  using (
    public.is_shareable(student_id)
    and not hidden
    and visibility in ('Public','School-only')
  );

-- Evidence files inherit their entry's public visibility.
drop policy if exists entry_files_select_public on public.portfolio_entry_files;
create policy entry_files_select_public on public.portfolio_entry_files for select
  using (
    public.is_shareable(student_id)
    and exists (
      select 1 from public.portfolio_entries e
      where e.id = entry_id
        and not e.hidden
        and e.visibility in ('Public','School-only')
    )
  );
