# Renovator design system

The single source of truth for the look & feel. **Read this before any UI work.**
Structure is borrowed from Vercel's Geist (systematic tokens, disciplined
primitives); the feel is warm and human, inspired by Headspace (cream canvas,
friendly orange, deep indigo, soft rounded shapes). All tokens live in
`src/index.css` `:root` — **use the CSS variables, never raw hex.**

## Principles

- **Warm & human, not techy.** Cream surfaces, rounded corners, soft shadows,
  generous spacing. Calm, approachable, confident.
- **Color = meaning.** Reserve the orange `--accent` for *primary actions, the
  active nav tab, and focus*. The indigo anchor is for the Budget tile. Don't paint
  neutral/default states with brand color (that was the old "green wall" mistake).
- **Hierarchy first.** One clear thing per view leads the eye; everything else is
  quieter. Numbers and names are content; chrome (handles, icons) is recessive.
- **8px rhythm.** Spacing and sizing step in multiples of 4/8.
- **Icons via the `Icon` component** (`src/components/Icon.jsx`) — never emoji.

## Color tokens (`:root`)

| Token | Value | Use for |
|---|---|---|
| `--bg` | `#fbf7f1` | App canvas (warm cream) |
| `--card` | `#ffffff` | Cards, panels, tables, inputs |
| `--ink` | `#20223d` | Primary text (deep indigo) |
| `--muted` | `#645f6e` | Secondary text, labels |
| `--faint` | `#6e6877` | Micro-labels, placeholders (AA-ok on cream) |
| `--line` | `#ece5da` | Borders, dividers |
| `--line-soft` | `#f4efe7` | Subtle row dividers |
| `--accent` | `#ff7a1a` | **Primary** action, active nav, focus, links-on-hover |
| `--accent-strong` | `#e86a0c` | Accent hover/pressed |
| `--accent-soft` | `#ffe9d6` | Accent tint bg, focus ring, checked checkbox |
| `--indigo` | `#2b2d5b` | Anchor surface (Budget tile) |
| `--section-bg` | `#f7f1e8` | Section row band, table header |
| `--row-hover` | `#f6f0e7` | Row hover |
| `--ok` / `--ok-bg` | `#2f8f6b` / `#dcf0e6` | Under budget, accepted, low priority, success |
| `--err` / `--err-bg` | `#d7493a` / `#fce7e2` | Over budget, declined, high priority, danger |
| `--gold` / `--gold-bg` | `#b47a12` / `#fbeed0` | Medium priority, warnings |
| `--prio-{high,med,low}-{bg,ink}` | (semantic) | Priority pills |

## Typography

- Family: **`--font-sans`** = `'DM Sans', system-ui, …` (warm geometric sans).
- Scale (size / weight): page title **26–28 / 700**; section heading **20 / 700**;
  panel title **15–16 / 700**; body **14–15 / 400–500**; micro-label **12 / 600**
  uppercase, `letter-spacing: .03em`, color `--muted`/`--faint`; amounts **15 / 600**
  with `font-variant-numeric: tabular-nums`. Body line-height ~1.5.

## Spacing · radii · elevation

- **Spacing**: 4px base — 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48. Panels & tiles get
  generous padding (22–24px).
- **Radii**: `--r-sm 10` (small controls), `--r-md 12` (buttons, inputs, pills-ish),
  `--r-lg 16` (modals), `--r-xl 20` (cards, panels, tiles), `--r-pill 999` (pills,
  avatars).
- **Shadows**: `--shadow` for cards/panels/tables; `--shadow-lg` for modals/overlays.
  Soft and warm — borders stay subtle.

## Components (reuse these classes — don't reinvent)

- **Buttons**: `.btn-add-section` / `.btn-primary` (orange, primary — one per view);
  `.btn-ghost` (bordered neutral); `.btn-danger` (`--err`); `.btn-add-item` (quiet
  dashed "add"); `.btn-icon` (recessive icon button, `--faint` → hover lifts).
- **Surfaces**: `.card`, `.panel` (+`.panel-head`/`.panel-title`), `.table` (`.grid`
  rows with `.row--section` band + `.row--item`).
- **Tiles**: `.cards` + `.card`; `.card--budget` is the indigo anchor; others show
  value + `.card-delta--{under,over,even}` + `.card-bar` usage bar.
- **Inputs**: `EditableCell` (click-to-edit), `.cell-input`, `.field` inputs,
  `.date-input` — `--r-md`, focus ring `--accent-soft`.
- **Pills**: `.prio-pill--{high,med,low}`, `.status-pill--{accepted,declined}`
  (rounded, semantic tint + caret).
- **Include**: `.incl` quiet checkbox (checked = `--accent-soft` + orange check;
  excluded row dims + strikes — the meaningful state).
- **Nav**: `.topnav` + `.navtab` (active = orange).
- **Overlays**: `.modal` / `.modal-overlay` + `ConfirmDialog`, `FileViewer`.
- **Icons**: `Icon` component only.

## Workflow — see the render before shipping

Designing blind causes drift. After any UI change:

```sh
npm run dev            # or: npm run build && npm run preview
npx playwright install webkit   # one-time, enables the Safari pass
npm run shots          # logs in + screenshots every page, Chromium + WebKit, desktop + mobile
```

Screenshots land in `shots/` (gitignored): Chromium as `<page>-<vp>.png`, Safari
as `safari-<page>-<vp>.png`. **Review both engines** — and fix before handing
back. Setup: copy `scripts/.shots.env.example` → `scripts/.shots.env` and fill
the login. (WebKit is optional — the run skips it with a hint if not installed —
but our users are on Safari, so don't skip it for real review.)

### Review checklist (the things screenshots-in-one-browser miss)

- **Render in Safari, not just Chrome.** Native form controls (`input[type=date]`,
  `select`) and many CSS edge cases differ per engine. The date-picker indicator
  spilling out of its box only showed in Safari — Chromium hid it. When in doubt,
  prefer a custom control (see `ItemSelect`) over a styled native one, and clip the
  container (`overflow: hidden`) so native glyphs can't escape.
- **Match the control to the interaction.** A binary on/off state is a `.toggle`
  switch, not orange link text. A pick-one is a pill/select; a pick-from-a-long-list
  is the `ItemSelect` popover. Don't ship a `<button>`/link where the affordance
  should read as a control.
- **Nothing overflows or clips its container** — icons, long labels, popovers,
  truncated text (check the longest realistic value, not the demo data).
- **Alignment & hierarchy** — columns line up, related controls share a baseline,
  section vs item weight is unambiguous.
