-- Renovator auth policies (Phase 4).
-- Run this ONCE in the Supabase SQL editor AFTER you have:
--   1. turned off "allow new users to sign up" in Auth settings, and
--   2. created the two user accounts (Vincent and Karo).
--
-- It removes the permissive Phase 0 policies (which let anyone with the anon key
-- read and write) and replaces them with policies that allow access only to
-- logged-in users. RLS itself was already enabled in schema.sql.

-- Drop the open Phase 0 policies.
drop policy if exists "phase0_all_projects" on projects;
drop policy if exists "phase0_all_entries" on entries;
drop policy if exists "phase0_all_files" on files;
drop policy if exists "phase0_all_audit" on audit_log;
drop policy if exists "phase0_all_comments" on comments;

-- Authenticated-only access. auth.uid() is null for the anon role, non-null once
-- a valid session token is presented, so this gates every table behind login.
create policy "authenticated_all_projects" on projects
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "authenticated_all_entries" on entries
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "authenticated_all_files" on files
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "authenticated_all_audit" on audit_log
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "authenticated_all_comments" on comments
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
