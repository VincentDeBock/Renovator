-- In-DB snapshot safety net.
--
-- Running this whole file installs a backups schema + snapshot() function and
-- immediately takes one snapshot. Thereafter, take a fresh snapshot anytime with:
--     select backups.snapshot('before versions-rename feature');
--
-- Snapshots are copies of projects/versions/entries into timestamped tables in a
-- private `backups` schema. That schema is NOT exposed via the API (only `public`
-- is), so snapshots aren't reachable with the anon key. This protects against a
-- bad migration/feature; it is NOT disaster recovery (same DB instance) — the
-- pg_dump-to-iCloud script covers off-box backups.

create schema if not exists backups;

create table if not exists backups.snapshot_log (
  id bigserial primary key,
  label text not null,
  taken_at timestamptz not null default now(),
  note text
);

create or replace function backups.snapshot(note text default null)
returns text
language plpgsql
as $$
declare
  ts  text := to_char(now(), 'YYYYMMDD_HH24MISS');
  lbl text := 'snap_' || ts;
begin
  execute format('create table backups.projects_%s as select * from public.projects', ts);
  execute format('create table backups.versions_%s as select * from public.versions', ts);
  execute format('create table backups.entries_%s  as select * from public.entries',  ts);
  insert into backups.snapshot_log(label, note) values (lbl, note);
  return lbl;
end;
$$;

-- Take one now.
select backups.snapshot('initial safety-net snapshot');

-- List what you have:  select * from backups.snapshot_log order by taken_at desc;

-- ---------------------------------------------------------------------------
-- RESTORE (manual, deliberate). Replace <TS> with the timestamp suffix of the
-- snapshot tables you want (see snapshot_log). Inserts run in FK-safe order:
-- projects → versions → entries (sections before items). Run inside one txn.
--
-- begin;
--   delete from public.projects;  -- cascades to versions + entries
--   insert into public.projects select * from backups.projects_<TS>;
--   insert into public.versions select * from backups.versions_<TS>;
--   insert into public.entries  select * from backups.entries_<TS> where type = 'section';
--   insert into public.entries  select * from backups.entries_<TS> where type = 'item';
-- commit;
-- ---------------------------------------------------------------------------
