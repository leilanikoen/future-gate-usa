-- ============================================================================
-- Future Gate USA — 0004_storage.sql
-- Two buckets:
--   * portfolio (private) — a student's uploaded documents/media.
--       path: portfolio/<student_id>/<section>/<filename>
--   * avatars   (public)  — profile photos (not sensitive).
--       path: avatars/<user_id>/<filename>
-- ============================================================================

insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- ---------- portfolio (private) ----------
-- Student writes only inside their own <student_id>/ folder.
create policy portfolio_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy portfolio_update_own on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy portfolio_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reads: owner, admins, the assigned mentor, or anyone if the portfolio is shareable.
create policy portfolio_read_own on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy portfolio_read_admin on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());
create policy portfolio_read_mentor on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and public.is_mentor_of(((storage.foldername(name))[1])::uuid));
create policy portfolio_read_public on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio' and public.is_shareable(((storage.foldername(name))[1])::uuid));

-- ---------- avatars (public read) ----------
create policy avatars_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');
create policy avatars_write_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
