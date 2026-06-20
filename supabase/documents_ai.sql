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
