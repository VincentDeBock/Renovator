# Renovator: project context for Claude Code

This file gives you (Claude Code) the full context for this project. Read it before
making changes.

## What this is

A webapp to track the expenses of a complete house renovation. Two end users:
Vincent and Karo. Built to get an MVP live fast while staying scalable.

## Stack and conventions

- Frontend: React + Vite, plain JavaScript (no TypeScript yet), functional
  components with hooks.
- Backend: Supabase (Postgres + auth + Storage + realtime). The client lives in
  `src/lib/supabase.js`.
- Hosting: Netlify, auto-deploy from GitHub `main`. Config in `netlify.toml`.
- Keep components small and the data layer in dedicated helpers, not inline in
  components, so it stays testable.
- Do not commit secrets. Env vars are `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`.

## Data model (see supabase/schema.sql)

- `projects`: one renovation for now, structured for many.
- `entries`: ONE self-referencing table for both sections and items.
  `type` is 'section' (parent_id null) or 'item' (parent_id points at a section).
  Each row has `included` (the Y/N toggle), `position` (drag-and-drop ordering),
  and four amounts: `raming`, `budget`, `offertes`, `facturen`.
  Totals roll up: item amounts sum to their section, sections sum to the project.
  Only rows where `included = true` count toward totals.
- `files`: metadata; binaries go in Supabase Storage.
- `audit_log` and `comments`: schema exists from Phase 0, surfaced in Phase 4.

## Roadmap and current state

- Phase 0 (DONE): scaffold, schema, deploy pipeline.
- Phase 1 (DONE): the Overzicht budget table. Sections containing items, each with
  the four amounts and the Y/N toggle, live totals rolling up from item to section
  to project, inline click-to-edit on every number and name, optimistic writes to
  Supabase. Data layer in `src/lib/entries.js`, pure rollups in `src/lib/totals.js`.
- Phase 2 (NEXT): drag-and-drop reordering (use the `position` field), add and delete
  with no limit on count.
- Phase 3: file upload and an in-app viewer (images native, PDFs via pdf.js).
- Phase 4: Supabase auth (just the two users), audit trail, comments. Replace the
  permissive RLS policies with authenticated-user policies.

## UI reference

The spec wireframe (Overzicht): four summary cards on top (Budget, Raming, Offertes,
Facturen as project totals), then a table with sections and indented items, columns
for R / O / F amounts, a Y/N checkbox per row, and a TOTAL row. Numbers are
click-to-edit inline. Mobile and desktop both need to work well.

## Live environment

- GitHub: https://github.com/VincentDeBock/Renovator (private), auto-deploys `main`.
- Netlify site: `renovatorv1` → https://renovatorv1.netlify.app
- Supabase project ref: `tsxtwwdpekkciyjyumcr` (EU region). The app reads
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, set as Netlify env vars and (for
  local `npm run dev`) in a local `.env`, which is gitignored.
- RLS is still the permissive Phase 0 policy (anyone with URL + anon key can
  read/write). Tighten in Phase 4; consider Netlify password protection until then.
