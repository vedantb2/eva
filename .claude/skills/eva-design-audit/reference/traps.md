# Trap ledger

Ten mechanisms, every one found in eva and every one shipped. What they share:
**the source reads as if it works.** None would be caught by review, types, or
a runtime test. Check this list before diagnosing anything that "should be
fine".

---

## 1. A responsive variant in a primitive's default class string

`tailwind-merge` resolves conflicting utilities _within_ a variant group, never
across them.

`CardContent` defaulted to `p-5 pt-0 md:p-6 md:pt-0`. A call site passing `p-3`
replaced `p-5` and `pt-0` — and left `md:p-6` and `md:pt-0` standing. Above
768px, thirteen call sites across eleven files rendered
`padding: 0 24px 24px`: content flush to the card's top edge over a band of
dead space. The overrides looked correct in the source the whole time, and the
bug was invisible below the breakpoint.

**Rule.** A primitive's default inset is unprefixed. A primitive that wants a
responsive inset exposes it as a prop. A call site that wants one writes
`p-3 md:p-6` and gets exactly that.

**Guard.** `designTokens.test.ts` → "primitive insets".

---

## 2. Responsive classes on an element that is `display: none` at those widths

`PageWrapper`'s `<h1>` was `hidden … lg:block` while carrying
`sm:text-lg md:text-xl`. Those two sizes could never apply — they described
exactly the widths where the element did not render. Worse, every page lost its
only top-level heading on tablet and mobile, and it left the accessibility
tree.

**Rule.** Before adding a breakpoint size, check the element is visible at that
breakpoint. Prefer `truncate` over `hidden` for headings.

---

## 3. A theme block copied verbatim into another appearance

`.dark` redeclared the shadow ramp byte-identical to `:root`: pure black at low
alpha, on a `rgb(5 6 6)` canvas. All 50 shadow utilities were no-ops in the
default theme. The elevation model silently did not exist. `.dark.neutral`
inherited the same nothing.

The ramp also had duplicate steps — `--shadow-2xs` ≡ `--shadow-xs`, and
`--shadow-sm` ≡ `--shadow` — so the scale offered fewer choices than it
advertised.

**Rule.** Each appearance gets its own values. Dark needs higher alpha (~0.4–0.6)
because there is less contrast headroom.

**Guard.** `designTokens.test.ts` → "shadow ramp".

---

## 4. Unbounded arithmetic on a user-controlled variable

`--radius` is user-set from `0rem` to `9999px`.

- `md: calc(var(--radius) - 2px)` → **-4px** at `radius: none`. Invalid, so the
  browser drops the declaration.
- At `radius: full` the same expression computes 9997px — still a pill, not a
  step below `lg`, collapsing the whole scale to one shape.

145 call sites went through those two entries.

**Rule.** Bound both ends in the config: `min()`/`clamp()` above,
`max(0px, …)` below. Fix the arithmetic, never the call sites.

**Guard.** `designTokens.test.ts` → "radius scale".

---

## 5. `overflow-hidden` on an ancestor of a focus ring

A ring is a box-shadow. `ProjectCard` clipped its own — keyboard focus on a
project card was simply invisible.

Two related failures shipped alongside it: `focus-visible:outline-none` with no
replacement ring (removes the only focus affordance), and substituting a
`shadow-*` for a ring (invisible in dark mode, and wrong even after the shadow
ramp was fixed).

**Rule.** Move the ring to the clipping element, or drop the clip. Never
`outline-none` without a `ring-*` in the same class string.

**Guard.** `design-check.mjs` → `outline-none-without-ring`.

---

## 6. `?? []` on a `useQuery` result

Collapses Convex's loading sentinel (`undefined`) into a genuine empty result.
The designed empty state — "nothing here yet, do X" — renders mid-fetch, then
swaps to content. It shipped at ~15 sites.

**Rule.** Keep `undefined` distinct from `[]`. Render a `Skeleton` while
loading.

**Guard.** `design-check.mjs` → `query-empty-fallback`.

---

## 7. A commented-out media block

`prefers-reduced-motion` sat commented out for months while an infinite
`nav-icon-gear-spin` (1.4s linear infinite) and a `scale(0.6)→scale(2.2)` pulse
shipped to everyone. Valid CSS. Does nothing. Nothing in the suite could see
it.

The JS half is the same trap by a different route: 39 Motion entrance
animations across 23 files, with only 8 calling `useReducedMotion()`. One
`<MotionConfig reducedMotion="user">` around the provider covers all of them —
per-file opt-in never reaches 100%.

**Rule.** Reduced motion is a global cap, not a per-file courtesy.

**Guard.** `designTokens.test.ts` → "motion", which strips comments before
asserting so a commented-out rule cannot look live.

---

## 8. Two stacked edge mechanisms

`smooth-shadow-ring-*` bakes its hairline into the shadow. A `border` on top
draws a second edge. And because `tailwind-merge` cannot dedupe `shadow-*`
against `smooth-shadow-*`, putting both on one element leaves both rendering.

`ring-*` _does_ compose, so focus and selection rings still work over a smooth
ring.

**Rule.** One edge mechanism per element. Recolour a hairline per state with
`[--smooth-ring-color:rgb(var(--primary)/0.4)]`, never by re-adding a border.

**Guard.** `design-check.mjs` → `double-edge-surface`, `mixed-shadow-utilities`.

---

## 9. A prop silently overridden by a parent

`button.tsx` forces `[&_svg]:size-4` on all children, so `size={14}` on an icon
inside a `Button` does nothing. The prop is right there in the source, and it
has no effect.

Sizing icons by class makes the override consistent rather than surprising —
and it is why `size={14}` and `size-3.5` were used interchangeably for the same
intent across ~380 sites.

**Rule.** Size icons with a class (`size-3.5`, `size-4`, `size-5`), never a
`size` prop.

**Guard.** `design-check.mjs` → `icon-size-prop`.

---

## 10. The invalid pattern that "worked"

`role="button" tabIndex={0}` on a `<div>`, with an
`if (e.detail === 0) return` workaround to swallow the synthetic click that
keyboard activation produced. The workaround existed because the hand-roll was
wrong; a native `<button>` needs neither.

Where a row must contain its own controls, nesting a `<button>` inside a
`<button>` is invalid HTML. `ListRow` solves it with a stretched overlay: a
shell `<div>`, an absolutely-positioned `<button>` at `z-[1]`, and nested
controls lifted to `z-[2]` via `LIST_ROW_CONTROL_CLASS`. The parent draws its
ring from a descendant's focus with
`has-[[data-slot=row-control]:focus-visible]`.

**Rule.** Reach for the native element. If it fights you, the structure is
wrong, not the element.
