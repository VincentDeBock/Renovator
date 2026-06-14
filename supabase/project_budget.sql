-- Add a project-level budget target. Run once in the Supabase SQL editor.
--
-- Budget is no longer a per-entry amount: it is a single number for the whole
-- project, set on the Settings page and shown as the Budget summary card.
-- The old per-row entries.budget column is left in place (unused) to avoid a
-- destructive change; it can be dropped later if desired.

alter table projects
  add column if not exists budget numeric(12,2) not null default 0;
