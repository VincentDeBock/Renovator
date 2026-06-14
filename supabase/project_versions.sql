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
