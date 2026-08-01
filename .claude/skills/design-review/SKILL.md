---
name: design-review
description: Review UI changes against eva's design system — hierarchy, rhythm, focal point, and the CSS lies a linter cannot see. Use after changing any component under apps/web/src or packages/ui/src.
---

# Design review

Advisory review of the visual layer. Runs on a diff, not the whole repo.

`node scripts/design-check.mjs` already catches what regex can see (arbitrary
font sizes, muted alphas, double edges, missing focus rings). This skill covers
what it cannot: whether the result reads as one coherent surface.

Do not introduce a new design document. The system has three sources of truth
and they are the input to this review:

1. `CLAUDE.md` — the border-first model, surface tokens, shadow rules
2. `apps/web/src/globals.css` — the token values themselves
3. `apps/web/src/surfaceTokens.test.ts` and `designTokens.test.ts` — the
   contracts those tokens must hold

## Procedure

1. `git diff $(git merge-base HEAD main)...HEAD -- 'apps/web/src/**' 'packages/ui/src/**'`
   — if that is empty, fall back to `git diff HEAD`.
2. Read the changed components in full, not just the hunks. A hunk cannot show
   you what the row looks like next to its siblings.
3. Run `node scripts/design-check.mjs`. Fix anything new before reviewing by
   eye; there is no point judging rhythm on a surface that still has drift.
4. Work the checklist below against the changed screens.
5. Report findings ranked by how visible they are to a user, with a file:line
   for each. Say plainly when a screen is fine — a review that always finds
   something teaches people to ignore it.

## Checklist

### Hierarchy

- Count the distinct type tiers in the changed block. Three or four is a
  hierarchy. Six is noise, and two is a grey slab.
- A row where title, meta, and timestamp all sit at `text-muted-foreground`
  has one tier, whatever its font sizes say. Colour carries more hierarchy
  than size at these scales — `text-subtle-foreground` is the tier below muted.
- Is there exactly one focal point per screen region? If your eye lands
  nowhere, everything is competing at the same weight.

### Rhythm

- Do sibling rows share padding, height, title weight, and press feedback?
  Open two of them side by side and diff the class strings. Rows that differ
  by `font-semibold` vs `font-medium`, or `duration-200` vs `duration-150`,
  read as two different components.
- Do the spacing steps come from one scale? Mixed `gap-2`/`gap-3`/`gap-2.5`
  inside one stack is drift, not intent.
- Related things close, unrelated things separated — proximity before borders.
  A divider between two things that are already 24px apart is a third signal
  saying what whitespace already said.

### Surfaces and edges

- Elevated surfaces take their hairline from `smooth-shadow-ring-*`. A
  `border` on top of one draws a second edge. See the `smooth-shadow-ring`
  skill.
- Layout regions are separated by a hairline, not by a tonal step. If the new
  panel is darker than its neighbour to distinguish itself, that is the wrong
  mechanism.
- Active and selected states are a surface fill plus a `border-border` chip;
  inactive siblings need `border border-transparent` so nothing shifts.

### Motion

- Every animated property is named. `transition-all` animates layout
  properties too and is banned.
- Anything infinite must be inside the `prefers-reduced-motion` cap in
  `globals.css`.
- Entrance animations on a list mean the list re-animates on every keystroke
  that refilters it. Usually the wrong call.

### CSS lies

These pass every automated check and are still wrong:

- Negative margin cancelling a parent's padding — the padding is a lie; fix
  the parent.
- `absolute` positioning used to escape flow rather than to overlay. If the
  element would be in the right place with `flex`, it should be.
- A fixed `h-[Npx]` on something whose content can grow — it will clip in
  another language or at another font size, and all twelve font families are
  selectable here.
- `overflow-hidden` on an ancestor of a focus ring. A ring is a box-shadow, so
  it is clipped away and keyboard focus becomes invisible.
- `?? []` on a `useQuery` result — collapses the loading sentinel into a real
  empty result, so the designed empty state flashes mid-fetch.

### Robustness

The theme is user-controlled: 12 font families, 6 radii from `0rem` to
`9999px`, 26 accents, 3 appearances. Changed surfaces must survive the ends of
those ranges.

- Does any new radius arithmetic stay valid at `radius: none` and still step
  down at `radius: full`?
- Does the layout hold at the widest font (Nunito) and the narrowest (Roboto)?
- Does it read in `.dark` and `.dark.neutral`, not just light?

### Copy

- Read the visible strings in order, ignoring the layout. Do they tell one
  story in one voice, or are they three authors' labels stacked?
- Empty states say what to do next, not that there is nothing here.
- Icon-only controls carry an `aria-label`.

## Reporting

For each finding: what a user sees, where it comes from (`file:line`), and the
smallest change that fixes it. Skip anything you would not be willing to defend
in review — an advisory gate that cries wolf gets muted.
