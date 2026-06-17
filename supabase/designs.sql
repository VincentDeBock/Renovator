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
