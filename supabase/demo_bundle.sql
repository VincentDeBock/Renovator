-- ============================================================
-- schema.sql
-- ============================================================
-- Renovator schema (Phase 0)
-- The model is designed so later phases (drag-and-drop, files, auth, audit, comments)
-- are additive rather than rewrites. Run this whole file once in the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- Projects: one renovation for now, but structured so a second never needs a migration.
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Entries: a single self-referencing table for both sections and items.
-- type = 'section' (parent_id is null) or 'item' (parent_id points at a section).
-- This is what gives you unlimited, reorderable sections and items.
create table if not exists entries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  parent_id uuid references entries(id) on delete cascade,
  type text not null check (type in ('section', 'item')),
  name text not null default '',
  position double precision not null default 0,  -- fractional index for drag-and-drop (Phase 2)
  included boolean not null default true,        -- the Y/N toggle from the spec
  raming numeric(12,2) not null default 0,
  budget numeric(12,2) not null default 0,
  offertes numeric(12,2) not null default 0,
  facturen numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_project_idx on entries(project_id);
create index if not exists entries_parent_idx on entries(parent_id);

-- Files: metadata only. The binaries live in a Supabase Storage bucket (Phase 3).
create table if not exists files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  entry_id uuid references entries(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  category text check (category in ('plan', 'quote', 'invoice', 'picture', 'other')),
  uploaded_at timestamptz not null default now(),
  uploaded_by text
);

-- Audit log: who changed what. Populate from app writes; surface in the UI in Phase 4.
create table if not exists audit_log (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  entity_table text not null,
  entity_id text not null,
  field text,
  old_value text,
  new_value text,
  changed_by text,
  changed_at timestamptz not null default now()
);

-- Comments.
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  entry_id uuid references entries(id) on delete cascade,
  author text,
  body text not null,
  created_at timestamptz not null default now()
);

-- Keep updated_at fresh on entry edits.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists entries_set_updated_at on entries;
create trigger entries_set_updated_at
  before update on entries
  for each row execute function set_updated_at();

-- Row Level Security
-- NOTE: real auth arrives in Phase 4. Until then these permissive policies let the
-- anon key read and write. The anon key ships inside the frontend bundle, so anyone
-- who has your app URL can reach the data. Before you store anything you care about,
-- either put the Netlify site behind password protection
-- (Site settings > Access control > Visitor access) or switch on Supabase auth.
-- In Phase 4, replace these with policies scoped to authenticated users.
alter table projects enable row level security;
alter table entries enable row level security;
alter table files enable row level security;
alter table audit_log enable row level security;
alter table comments enable row level security;

create policy "phase0_all_projects" on projects for all using (true) with check (true);
create policy "phase0_all_entries" on entries for all using (true) with check (true);
create policy "phase0_all_files" on files for all using (true) with check (true);
create policy "phase0_all_audit" on audit_log for all using (true) with check (true);
create policy "phase0_all_comments" on comments for all using (true) with check (true);

-- Seed one project so the app has something to read on first load.
insert into projects (name)
select 'Onze verbouwing'
where not exists (select 1 from projects);

-- ============================================================
-- project_budget.sql
-- ============================================================
-- Add a project-level budget target. Run once in the Supabase SQL editor.
--
-- Budget is no longer a per-entry amount: it is a single number for the whole
-- project, set on the Settings page and shown as the Budget summary card.
-- The old per-row entries.budget column is left in place (unused) to avoid a
-- destructive change; it can be dropped later if desired.

alter table projects
  add column if not exists budget numeric(12,2) not null default 0;

-- ============================================================
-- project_versions.sql
-- ============================================================
-- Project versions (tabs + shared rows). Run once in the Supabase SQL editor.
--
-- A "version" is a named/colored inclusion-set. Each entry is a member of zero or
-- more versions via entries.version_ids (an array of version ids). The line items
-- and their amounts are shared across versions; only membership differs.
-- This replaces the single entries.included toggle (left in place but unused).

-- 1. Versions table -----------------------------------------------------------
create table if not exists versions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists versions_project_idx on versions(project_id);

-- Authenticated-only access, mirroring supabase/policies_auth.sql.
alter table versions enable row level security;
drop policy if exists "authenticated_all_versions" on versions;
create policy "authenticated_all_versions" on versions
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- 2. Membership column on entries ---------------------------------------------
alter table entries
  add column if not exists version_ids uuid[] not null default '{}';

-- 3. Seed V1/V2/V3 and put every existing row in all three (baseline) ---------
do $$
declare
  proj uuid;
  v1 uuid;
  v2 uuid;
  v3 uuid;
begin
  select id into proj from projects order by created_at asc limit 1;
  if proj is null then
    return;
  end if;

  if not exists (select 1 from versions where project_id = proj) then
    insert into versions (project_id, name, color, position)
      values (proj, 'V1', '#2dd4bf', 0) returning id into v1;
    insert into versions (project_id, name, color, position)
      values (proj, 'V2', '#ec4899', 1) returning id into v2;
    insert into versions (project_id, name, color, position)
      values (proj, 'V3', '#8b5cf6', 2) returning id into v3;

    update entries set version_ids = array[v1, v2, v3] where project_id = proj;
  end if;
end $$;

-- ============================================================
-- designs.sql
-- ============================================================
-- Designs build: tasks, item detail, files, tags, profiles.
-- Additive only. Applied via psql with the pooler connection. Authenticated-only
-- RLS on every new table, mirroring supabase/policies_auth.sql.

-- 1. Item description -------------------------------------------------------
alter table entries add column if not exists description text not null default '';

-- 2. Profiles (so the task owner picker has stable names/initials) -----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  initial text not null default ''
);
alter table profiles enable row level security;
drop policy if exists "authenticated_all_profiles" on profiles;
create policy "authenticated_all_profiles" on profiles
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

insert into profiles (id, display_name, initial)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'display_name',''), split_part(u.email,'@',1)),
       upper(left(coalesce(nullif(u.raw_user_meta_data->>'display_name',''), u.email), 1))
from auth.users u
on conflict (id) do update
  set display_name = excluded.display_name, initial = excluded.initial;

-- 3. Tasks ------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  entry_id uuid references entries(id) on delete set null,
  title text not null default '',
  owner_id uuid references profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  deadline date,
  completed boolean not null default false,
  position double precision not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists tasks_project_idx on tasks(project_id);
create index if not exists tasks_entry_idx on tasks(entry_id);
alter table tasks enable row level security;
drop policy if exists "authenticated_all_tasks" on tasks;
create policy "authenticated_all_tasks" on tasks
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- 4. Tags + file_tags -------------------------------------------------------
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);
alter table tags enable row level security;
drop policy if exists "authenticated_all_tags" on tags;
create policy "authenticated_all_tags" on tags
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create table if not exists file_tags (
  file_id uuid not null references files(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (file_id, tag_id)
);
alter table file_tags enable row level security;
drop policy if exists "authenticated_all_file_tags" on file_tags;
create policy "authenticated_all_file_tags" on file_tags
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- 5. Files: amount, status, size -------------------------------------------
alter table files add column if not exists amount numeric(12,2);
alter table files add column if not exists status text check (status in ('accepted','declined'));
alter table files add column if not exists size_bytes bigint;

-- 6. Storage bucket for binaries (private; access via signed URLs) ----------
insert into storage.buckets (id, name, public)
values ('item-files', 'item-files', false)
on conflict (id) do nothing;

drop policy if exists "auth_item_files_select" on storage.objects;
create policy "auth_item_files_select" on storage.objects
  for select to authenticated using (bucket_id = 'item-files');
drop policy if exists "auth_item_files_insert" on storage.objects;
create policy "auth_item_files_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'item-files');
drop policy if exists "auth_item_files_update" on storage.objects;
create policy "auth_item_files_update" on storage.objects
  for update to authenticated using (bucket_id = 'item-files');
drop policy if exists "auth_item_files_delete" on storage.objects;
create policy "auth_item_files_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'item-files');

-- ============================================================
-- email_summaries.sql
-- ============================================================
-- Daily "Verbouwing" email summary feature. Run once in the SQL editor (or applied
-- via psql). Additive; never touches budget tables.
--
-- The daily job writes with the Supabase service role (bypasses RLS). The frontend
-- reads email_summaries while logged in. processing_runs is service-role only.

create extension if not exists "uuid-ossp";

create table if not exists email_summaries (
  id uuid primary key default uuid_generate_v4(),
  gmail_message_id text not null unique,            -- idempotency key
  gmail_thread_id text,
  rfc822_message_id text,                           -- Message-ID header, for Gmail deep links
  received_at timestamptz not null,                 -- UTC
  sender text,
  subject text,
  category text not null default 'other'
    check (category in ('quote', 'invoice', 'architect', 'other')),
  summary_text text,
  key_points jsonb not null default '[]'::jsonb,
  has_attachments boolean not null default false,
  attachment_names jsonb not null default '[]'::jsonb,
  action_needed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists email_summaries_received_idx on email_summaries (received_at desc);

create table if not exists processing_runs (
  id uuid primary key default uuid_generate_v4(),
  ran_at timestamptz not null default now(),
  cursor_used text,
  new_cursor text,
  messages_processed int not null default 0,
  status text check (status in ('success', 'partial', 'failed')),
  error_detail text
);
create index if not exists processing_runs_ran_idx on processing_runs (ran_at desc);

alter table email_summaries enable row level security;
alter table processing_runs enable row level security;

-- Frontend (authenticated) may read summaries. Writes happen via the service role,
-- which bypasses RLS, so no write policy is granted to authenticated users.
drop policy if exists "authenticated_read_email_summaries" on email_summaries;
create policy "authenticated_read_email_summaries" on email_summaries
  for select to authenticated using (auth.uid() is not null);

-- processing_runs has RLS enabled with no policy → only the service role can touch it.

-- ============================================================
-- documents_ai.sql
-- ============================================================
-- Documenten AI build: AI naming, dedup, archive, proactive tagging.
-- Additive only. Applied via the Supabase SQL editor (one-off), mirroring the
-- additive pattern of supabase/designs.sql. Existing files RLS already covers
-- the new columns; the Netlify Function writes with the service-role key.

-- 1. Files: AI-derived title/vendor, content hash (dedup), soft-delete, status --
alter table files add column if not exists ai_title text;
alter table files add column if not exists vendor text;
alter table files add column if not exists content_hash text;
alter table files add column if not exists archived_at timestamptz;
alter table files add column if not exists ai_status text
  check (ai_status in ('pending','done','error'));

-- Fast duplicate lookup per project (SHA-256 of the bytes).
create index if not exists files_project_hash_idx on files(project_id, content_hash);
-- Active vs archived filtering.
create index if not exists files_archived_idx on files(archived_at);

-- 2. Seed the fixed document tags per project (idempotent on name) ------------
-- These are the AI's proactive document-type tags. Section tags are created at
-- runtime by the Netlify Function (combination rule). Colors use the same hexes
-- the app's category badges map to (offerte=accent, factuur=gold, architect=indigo).
insert into tags (project_id, name, color)
select p.id, t.name, t.color
from projects p
cross join (values
  ('Offerte',   '#ff7a1a'),
  ('Factuur',   '#b47a12'),
  ('Architect', '#2b2d5b')
) as t(name, color)
where not exists (
  select 1 from tags x
  where x.project_id = p.id and lower(x.name) = lower(t.name)
);

-- ============================================================
-- policies_auth.sql
-- ============================================================
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

