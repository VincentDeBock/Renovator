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

- `projects`: one renovation for now, structured for many. Holds `budget`, the
  single project-level budget target shown as the Budget summary card.
- `versions`: named, colored inclusion-sets per project (the V1/V2/V3 tabs). Lets
  you compare renovation scenarios that share the same line items.
- `entries`: ONE self-referencing table for both sections and items.
  `type` is 'section' (parent_id null) or 'item' (parent_id points at a section).
  Each row has `version_ids uuid[]` (which versions it belongs to),
  `position` (drag-and-drop ordering), and the three rollup amounts: `raming`,
  `offertes`, `facturen`. Totals roll up per version: a row counts in a version
  only when its id is in `version_ids` (section AND item membership both matter).
  (Legacy unused columns: `entries.included` and `entries.budget`.)
- `files`: metadata; binaries go in Supabase Storage.
- `audit_log` and `comments`: schema exists from Phase 0, surfaced in Phase 4.

## Roadmap and current state

- Phase 0 (DONE): scaffold, schema, deploy pipeline.
- Phase 1 (DONE): the Overzicht budget table. Sections containing items, each with
  the four amounts and the Y/N toggle, live totals rolling up from item to section
  to project, inline click-to-edit on every number and name, optimistic writes to
  Supabase. Data layer in `src/lib/entries.js`, pure rollups in `src/lib/totals.js`.
- Phase 2 (DONE): drag-and-drop reordering of sections and items via dnd-kit
  (handles + `position`, persisted in `src/lib/entries.js#updatePositions`; items
  reorder within their section). Budget became a project-level target set on a new
  Settings page (`src/components/Settings.jsx`); App.jsx now owns project + entries
  state and switches between Overzicht and Settings. Budget column removed from the
  table. Needs `supabase/project_budget.sql` run once.
- Versions (DONE): project version tabs (V1/V2/V3/+) backed by shared line items
  and per-row `version_ids` membership. The table's Y/N toggle, rollups and cards
  are scoped to the active version; a comparison strip shows each version's
  Offertes vs budget. Tabs in `src/components/VersionTabs.jsx`, comparison in
  `VersionCompare.jsx`, version-aware math in `src/lib/totals.js`. Needs
  `supabase/project_versions.sql` run once.
- Phase 3 (NEXT): file upload and an in-app viewer (images native, PDFs via pdf.js).
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
- Auth: Supabase email/password, login-only (accounts created in the dashboard).
  Gate lives in `src/components/AuthGate.jsx`, session in `src/context/AuthContext.jsx`,
  wrappers in `src/lib/auth.js`. App after login is unchanged.
- RLS: `supabase/policies_auth.sql` replaces the open Phase 0 policies with
  authenticated-only access. Once that file is run in the SQL editor, data is
  reachable only while logged in.

## Design system (READ BEFORE ANY UI WORK)

The look & feel is pinned in **`DESIGN.md`** — a warm identity (cream canvas, deep
indigo ink, Headspace-orange primary, soft rounded shapes) on a Geist-style token
structure. Rules, not suggestions:

- **Read `DESIGN.md` first.** Use the `:root` CSS variables in `src/index.css` —
  **never hardcode hex.** Reserve `--accent` (orange) for primary action / active
  nav / focus; `--indigo` is the Budget tile anchor; semantic `--ok`/`--err`/`--gold`
  for under-budget/over-budget/warning and pill states.
- **Reuse the component classes** (`.btn-*`, `.card`/`.panel`, `EditableCell`,
  `.prio-pill`/`.status-pill`, `.incl`, `.grid` rows, tiles, `.topnav`, `.modal`) and
  the **`Icon`** component (`src/components/Icon.jsx`) — never emoji as icons.
- Font is **DM Sans** (loaded in `index.html`). 8px spacing rhythm; radius/shadow
  tokens (`--r-*`, `--shadow`/`--shadow-lg`).
- **See your output before shipping:** after UI changes run `npm run shots`
  (Playwright; logs in, screenshots every page desktop + mobile into `shots/`) and
  review the PNGs. Setup: copy `scripts/.shots.env.example` → `scripts/.shots.env`.
