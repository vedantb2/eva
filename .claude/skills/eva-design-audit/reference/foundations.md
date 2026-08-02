# Foundations

What already exists. Read before adding a token or a primitive — a near
duplicate is exactly the drift the system exists to stop.

Values live in `apps/web/tailwind.config.js` and `apps/web/src/globals.css`.
This file says what exists and why, not what the numbers are; the numbers have
one home.

---

## Type

Tailwind ships nothing below `xs` (12px). That gap is why 220+ call sites
hand-rolled `text-[Npx]` across ten values, half-pixels included.

- **`text-3xs`** (10px) — absorbs the old 9, 9.5, 10, 10.5
- **`text-2xs`** (11px) — absorbs 11, 11.5
- `xs` and up keep Tailwind's defaults untouched: 913 existing uses, do not
  shift them.

Deliberately **no 13px token** — `text-[13px]` resolves to `xs` or `sm` by
judgment. Adding a step between them would make the scale ambiguous, which is
how ten undocumented sizes happened in the first place.

Every step carries an explicit `lineHeight`. Without one, a 10px label inherits
whatever the parent set and lands on a 24px line.

**`tracking-heading`** replaces the `-0.02em` literal that was repeated in ~6
files.

## Colour tiers

`text-muted-foreground` appeared 811 times, and below it sat nine ad-hoc alphas
(`/70`, `/60`, `/50`, `/80`, `/40`, `/90`, `/72`, `/55`). One of them —
`text-muted-foreground/50` at `text-xs` — was well under WCAG AA.

**`text-subtle-foreground`** is the real tier below muted, defined per
appearance. It fixes the legibility floor by construction: the contract test
asserts it sits between muted and the canvas in all three appearances, so it
can never be tuned into invisibility.

Four tiers, in order: `foreground` → `muted-foreground` → `subtle-foreground` →
the timestamp. That is a hierarchy. Six is noise; two is a grey slab.

## Icons

- **One library.** Tabler. Lucide was removed from `apps/web/package.json`.
- **Stroke 1.5**, set once in `globals.css` on `.tabler-icon` rather than
  across 268 files. Tabler ships stroke-width 2, which at 14–16px reads
  visibly heavier. This was the single largest per-pixel divergence from the
  reference.
- **Class-based sizing only** — `size-3.5` / `size-4` / `size-5`. Never a
  `size={n}` prop; see trap 9.

## Radius

`--radius` is user-set from `0rem` to `9999px`, so every derived step is
bounded at both ends — `min()`/`clamp()` above, `max(0px, …)` below.

`lg` is deliberately raw: pill-able single-line rows are the intent per
`CLAUDE.md`, and `button.tsx` depends on it.

Named steps (`surface`, `control`, `menu-item`) exist so a call site says what
it is, not what number it wants.

## Shadows and edges

Five genuinely distinct steps per appearance, with dark and neutral given their
own values rather than a copy of light.

Elevated surfaces use **`border border-border`** plus a **`shadow-{size}`**
step — `sm` for resting cards, `md`/`lg` for menus and popovers, `xl` for
dialogs. Layout dividers, form affordances and accent bars keep a real border;
do not invent a darker canvas just to separate two regions.

## Per-font metrics

`FONT_FAMILIES` in `ThemeContext.tsx` carries a `trackingAdjust` per family.
Twelve families sharing one `--tracking-normal` meant Nunito and IBM Plex Sans
read at visibly different optical widths from Inter at the same nominal size.

Applied in `applyCustomThemeVars` alongside the existing `--radius` /
`--font-sans` writes, and mirrored into the FOUC guard in `index.html` so the
pre-mount pass matches.

## Primitives

In `packages/ui/src/ui/`:

| Primitive          | Replaces                                                       | Note                                                                |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Skeleton`         | 30 inline divs across 3 radii and 3 fills                      | there was no skeleton component anywhere                            |
| `Surface`          | ~30 hand-rolled `rounded-surface border bg-card p-{3,4,6,8}`   | density is a prop, not a re-typed padding                           |
| `ListRow`          | `ProjectCard` / `QuickTaskCard` / `NotificationRow` divergence | settles title weight, duration, accent width, inset, press feedback |
| `Button` size `xs` | 34 controls hand-sized at `size-6`/`size-7`                    | bakes in `.hit-target`, so a 28px control still has a 40px hit area |

`ListRow` uses a stretched overlay rather than a nested button — shell `<div>`,
absolute `<button>` at `z-[1]`, nested controls lifted to `z-[2]` with
`LIST_ROW_CONTROL_CLASS`. See trap 10 for why the previous `role="button"`
hand-roll needed a click-event workaround.

`Card` keeps its own header/content/footer insets, all unprefixed. See trap 1.

## Layout

**`ResizablePanelLayout`** is the one list/detail mechanism —
`react-resizable-panels`, `w-px bg-border` divider, sizes persisted per
`storageKey`, mobile stacked fallback under 768px. The app's nav sidebar is the
third pane; a view does not grow a rail of its own.

The Inbox is the reference implementation: list left, body right, no
navigate-away on select. Selecting used to navigate to the notification's
target, which emptied the inbox on every read and made working through a
backlog impossible. Selection opens the body in place; following the link is a
separate, deliberate action.

One detail worth copying: the selected notification resolves against the
**unfiltered** list. Under the Unread filter, marking a row read drops it from
the list — the detail pane should keep showing what is being read rather than
blanking underneath the reader.
