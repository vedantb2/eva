# eva UI overhaul — Linear-philosophy restructure + design system

> **Status:** Workstream A (foundation, A1–A10) shipped 03 Aug 2026 on
> `feat/linear-design-system`. A0's before-screenshots were skipped.
> Workstream B (B1–B7 restructure passes) is outstanding — hence `todo/`.
> The rulebook now lives at `internal/design/DESIGN.md`.

## Context

App doesn't feel as clean as references (Linear = primary, plus Grok/xAI, Cursor, Vercel, interfere.com). Two-part job:

1. **Design system** (tokens, primitives, rulebook, gate) so UI generations can never drift again
2. **Restructure every surface** to Linear's design philosophy — improved look everywhere, not just consistency cleanup

Audit found the token foundation is decent (near-black dark ladder, hairline borders, overlay-only shadows) but drifting: 229 arbitrary `text-[Npx]`, two competing radius systems (191 raw vs 132 clamped), 127 raw `<button>`, loud filled status chips + 2 hand-rolled categorical palettes, inline-class soup in core chrome (QuickTaskModal, Sidebar, EnvVarsTable, session timeline).

Scope boundary: layout/visual restructure within existing routes and IA — no route renames or feature changes.

## Direction (locked with user)

- **Primary reference = Linear** (density, calm, small-radius controls, keyboard-first); Grok/Cursor flavor reserved for landing/marketing
- **Linear geometry**: controls clamped ~8–10px radius; surfaces clamped 12–16px; dense lists (~36–40px rows, 13px body); generous whitespace inside detail panes
- **Quiet monochrome**: status = small colored glyph + neutral text; muted categorical ramp; ~1 accent moment per view; no loud filled chips
- **Geist Sans default + Geist Mono** (self-host)
- **User theming kept but curated** (picker-only trims; Convex validators/value maps untouched → legacy values keep rendering, zero migration)
- **Appearances**: `dark` stays near-black (Grok); `neutral` retuned to Linear graphite; light stays

## Linear anatomy (the restructure targets — codified in DESIGN.md, applied in Workstream B)

- **Page header**: compact functional toolbar ~48–56px — breadcrumb/title left, actions right, hairline bottom border. No oversized page titles.
- **List**: dense rows (36–40px): leading status glyph, title, muted inline meta; right-aligned muted ID/timestamp; hover = bg shift; selected = tonal fill.
- **List/detail**: split panes divided by hairline; detail = content column + right properties rail (label/value rows, quiet buttons) where the surface has metadata (tasks, reviews, inbox, sessions).
- **Settings**: section title as plain text; `SettingsGroup` tonal card of `SettingsRow`s (label + muted description left, control right); settings sidebar stays.
- **Menus/popovers**: hairline + shadow, kbd hints right-aligned muted.
- **Dialogs**: compact, header/body/footer discipline; prefer popovers/panes over modals where trivial.
- **Empty states**: quiet, centered, small icon, one line + one action.
- **Motion**: fast and subtle (150–200ms); no bounce.

## Key mechanics (verified against source)

- `apps/web/tailwind.config.js` `borderRadius.control` → `"min(var(--radius),0.625rem)"` (tune 8–10px at screenshot pass) — Input/Select/InputGroup/Textarea inherit via `CONTROL_RADIUS_CLASS`, zero call-site edits. Same cap in globals.css native-tag rule.
- Button/tabs use raw `rounded-lg` (unclamped 16px) → `rounded-control`.
- Surface ceiling `1.25rem` → `1rem` in 3 lockstep spots (tailwind `borderRadius.surface`, globals.css `.rounded-surface/-t/-b`, `.qt-in-progress-border` calc).
- No `RADIUS_VALUES`/`FONT_FAMILIES`/`ACCENT_COLORS`/Convex `enums.ts` changes — curation = new `CURATED_*` arrays in picker components only. `index.html` FOUC script untouched (no keys renamed).
- New status primitive named `StatusDot` (not StatusChip — collides with `analytics/StatusChip.tsx`).
- Borders stay HeroUI-hairline for panes/cards; Linear tonal borderless card allowed only as the `SettingsGroup` recipe.

## Workstream A — Foundation (this session)

| # | Commit | Files | Size |
|---|--------|-------|------|
| A0 | Before-screenshots (agent-browser, core routes, 3 appearances) + `internal/design/DESIGN.md` (tokens, primitives, Linear anatomy recipes above, do/don't mirroring gate bans) + CLAUDE.md UI section → pointer + non-negotiables | internal/design/DESIGN.md, CLAUDE.md | S |
| A1 | Type tokens: `text-3xs` (10/14), `text-2xs` (11/16), `text-2sm` (13/18 — Linear UI body) | apps/web/tailwind.config.js | S |
| A2 | Radius rework: control cap 0.625rem, surface ceiling 1rem (3 spots), native-tag rule cap, surface-radius.ts doc rewrite (raw `rounded-lg` pill-trick = drift now) | tailwind.config.js, globals.css, surface-radius.ts | M |
| A3 | Quiet color: `--cat-1..8` muted categorical tokens (anchor hues = union of legacy palettes so assignments don't flip; RGBs tuned at screenshot pass) + tailwind `cat` family + `catColorForId()` (packages/ui/src/utils/cat-color.ts); demote `--status-*-bg/-subtle` to kanban-only (docs); retune `.dark.neutral` to Linear graphite (~#191A1C canvas / #1E1F22 card / #2A2B2E border, tuned visually) | tailwind.config.js, globals.css, packages/ui | M |
| A4 | Button/Tabs/InputGroup: button base→`rounded-control`, drop per-size radius overrides, `text-[11px]`→`text-2xs`; tabs list/trigger/.t-tabs-pill/.tabs-segmented→control radius; input-group: delete radius-fighting overrides, kbd calc→rounded-sm equivalent | packages/ui button.tsx, tabs.tsx, input-group.tsx, globals.css | M |
| A5 | Badge quiet variants + `StatusDot` primitive (colored glyph/dot via `--status-*-bar` + neutral text; keep existing status icons) + migrate TaskStatusBadge/ProjectPhaseBadge; in-primitive drift: select.tsx/_menu-classes.ts→`rounded-menu-item`, menuShortcut→`text-2xs`, dialog close→`rounded-full`, checkbox pragma | packages/ui badge.tsx, status-dot.tsx (new), select.tsx, _menu-classes.ts, dialog.tsx; TaskStatusBadge, ProjectPhaseBadge | M |
| A6 | Layout primitives for the restructure: `PageHeader` (breadcrumb/title/actions toolbar), `SettingsGroup`+`SettingsRow`, `EmptyState` (promote apps/web→packages/ui, quiet spec), ListRow compact-density variant. Consolidate SectionLabel duplicates | packages/ui (new files), apps/web consumers later | M |
| A7 | Fonts: Geist Mono woff2 (copy from geist npm pkg, no dep) + @font-face metric overrides; `--font-sans` default→Geist Sans, `--font-mono`→Geist Mono; ThemeContext default `fontFamily`→`geist`; verify FOUC fallback | globals.css, public/fonts/, ThemeContext.tsx | S/M |
| A8 | Categorical consumers: tabGroupColors.ts + repoTileColor.ts → `catColorForId()` + `cat-*` | 2 utils + ~5 consumers | S/M |
| A9 | Theme curation (picker-only): radius none/md/xl/full; accents zinc, stone, red, orange, amber, green, teal, sky, blue, indigo, violet, rose; fonts geist, inter, space-grotesk, jakarta, outfit, ibm-plex, figtree, source-serif; "Cool" preset lg→md; CURATED_* arrays | theme/_components/*, ThemeContext.tsx | M |
| A10 | Enforcement: `scripts/design-check.mjs` (clone compiler-check.mjs pattern) + baseline JSON + `// design-check-ignore-next-line` pragma; wire into the push gate next to compiler-check | scripts/ | M |

**Ban list**: `text-[Npx]` (allowlist model-picker 7px; skip routes/_components/landing/**), raw `rounded-sm|md|lg|xl|2xl`, `rounded-[...]` (allowlist checkbox), hex in className, `shadow-*` outside packages/ui overlays, raw `<button` outside packages/ui, raw palette classes (`bg-red-500`…). Baseline ratchets down every commit; zero-tolerance once sweeps finish.

## Workstream B — Restructure passes (follow-up sessions, one area per session, each shippable)

Each pass = **redesign to the Linear anatomy above**, not just class cleanup: apply PageHeader, list/detail + properties rail, density, quiet status; plus mechanical migrations (raw buttons→Button, raw rounded→clamped tokens, `text-[13px]`→`2sm` with titles bumped to `sm`, filled pills→StatusDot); before/after screenshots in 3 appearances; design-check baseline shrinks.

- **B1 Sidebar + app chrome**: Linear-quiet sidebar (13px, tight sections, flat rows, section labels); radius triage of the ~10 pill-trick files; decision point: keep/tone-down animated nav icons (user call at screenshot review)
- **B2 Sessions/IDE**: compact header toolbar, calm sandbox tab bar, timeline density (ProofTimelineItem/RunTimelineItem/PrRecapPanel/TaskDetailInline), chat composer polish
- **B3 Home + Projects + Quick-tasks**: quieter repo tiles (cat tokens), Linear-style kanban (flat columns, dense cards, glyph+neutral status), quick-tasks split-pane list/detail with properties rail; QuickTaskModal rebuild
- **B4 Reviews + Drafts + Inbox**: Linear triage is the literal model — dense list + detail + right properties rail
- **B5 Settings galaxy** (global + repo): SettingsGroup/SettingsRow recipe everywhere; EnvVarsTable rebuild
- **B6 Teams + Artifacts + Docs + Automations**: same anatomy; docs viewer typographic pass
- **B7 Landing**: Grok flavor kept; align tokens/type; its 79 facsimile `text-[Npx]` stay allowlisted

## Verification (per commit + final)

- `cd apps/web && npx tsc --noEmit`; packages/ui tsc; `node scripts/compiler-check.mjs`
- Visual: agent-browser (`/?agent`) screenshots — home, kanban, quick-tasks, session IDE, reviews, settings — light+dark+neutral vs A0 baselines; compare against Linear reference screenshots for anatomy passes
- `node scripts/design-check.mjs` exits 0; deliberate violation fails
- Watch: tailwind-merge Card `p-5` history (no mixed base+responsive insets), React Compiler bailouts

## Risks

- globals.css + 2 session files carry **uncommitted user WIP on staging** — stage explicit paths only, never `git add -A`
- TaskStatusBadge/kanban reach is wide — A5 own commit, easy revert
- Geist Mono asset must be sourced before A7
- B passes change layouts the team uses daily — one area per session so regressions stay isolated; user eyeballs staging before merging to main

## Logistics (confirmed with user)

- Build on top of WIP on staging; commits land on **staging**; user merges to main after review
- Radius/cat/graphite exact values tuned visually at screenshot passes — no false precision up front

## Final step

Run `/ship` skill (per repo rule). Move this plan to `internal/plans/` when implemented.
