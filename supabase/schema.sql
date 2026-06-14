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
