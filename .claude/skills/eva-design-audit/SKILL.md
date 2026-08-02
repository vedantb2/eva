---
name: eva-design-audit
description: Audit eva's UI for design-system drift and know the standing rules before writing any UI. Use when auditing a screen, planning UI work, adding a token or primitive, or investigating why a surface looks inconsistent across apps/web/src and packages/ui/src.
---

# eva design audit

The finding that produced this system, and the one to keep in mind: **eva does
not lack a design system — it lacks enforcement.** The tokens were already
there. What was missing was everything below the token layer, so every author
improvised and the drift compounded silently.

Reference-grade UI is not exotic technique. It is **zero drift**: every row
identical, one icon weight, three or four genuine type tiers, flat and calm.

## Which tool for which job

| Question                                                              | Use                             |
| --------------------------------------------------------------------- | ------------------------------- |
| Does this diff read as one coherent surface?                          | the `design-review` skill       |
| Did this file break a mechanical rule?                                | `node scripts/design-check.mjs` |
| Do the tokens still hold their contracts?                             | `cd apps/web && npx vitest run` |
| What is drifting across the whole codebase, and what should we build? | **this skill**                  |

`design-review` judges a diff by eye. This one counts the codebase, decides
whether the gap is a missing token or a missing primitive, and produces the
plan. Do not run both for the same question.

## Standing rules

Follow these when writing any UI. They are not preferences — each one has
already cost a shipped bug, catalogued in [reference/traps.md](reference/traps.md).

1. **Never hand-roll a value a token covers.** Font size, muted alpha, hover
   fill, heading tracking, radius, shadow. If no token fits, the answer is a
   new token, not `text-[11.5px]`.
2. **Never re-type a recipe a primitive covers.** `Surface`, `ListRow`,
   `Skeleton`, `Card`, `Button` size `xs`. Thirty hand-rolled card surfaces is
   how two radii and five paddings ended up meaning the same thing.
3. **Colour carries hierarchy at these sizes, not size.** Four tiers:
   `text-foreground` → `text-muted-foreground` → `text-subtle-foreground` →
   the timestamp. A row where the title and the meta are both muted has one
   tier however its font sizes read.
4. **Hairlines separate regions; tone does not.** Elevated surfaces use
   `border border-border` with a `shadow-*` step. Layout dividers keep a real
   border; do not invent a darker canvas just to separate two regions.
5. **Every animated property is named.** `transition-all` is banned. Anything
   infinite lives under the `prefers-reduced-motion` cap.
6. **`undefined` is not `[]`.** A Convex query in flight renders a `Skeleton`.
   `?? []` flashes the designed empty state mid-fetch.
7. **The theme is user-controlled** — 12 fonts, 6 radii from `0rem` to
   `9999px`, 26 accents, 3 appearances. Anything you write survives both ends
   of every range or it is not done.
8. **A default class string never carries a responsive variant.**
   `tailwind-merge` resolves within a variant group, never across it, so a
   call-site override half-applies. Expose a prop instead.

## Audit procedure

Run this when asked what a screen or the codebase needs, not on every change.

1. **Count, do not eyeball.** Every finding in the original audit was a count:
   220+ `text-[Npx]`, 811 `text-muted-foreground`, nine ad-hoc alphas, ~30
   hand-rolled cards, 1,192 borders against 104 shadows. A count tells you
   whether something is one author's slip or a missing foundation.

   ```bash
   node scripts/design-check.mjs
   ```

   Start there — it counts the known drift classes. Then Grep for whatever the
   screen under audit does that the script does not know about yet.

2. **Classify each finding.** There are only four kinds, and the kind decides
   the fix:
   - _Actively broken_ — the rule is silently a no-op. Fix today; highest value
     per minute. Dark shadows identical to light, a commented-out
     reduced-motion block, a clipped focus ring.
   - _Missing token_ — authors improvise because nothing exists. Add the token,
     then sweep.
   - _Missing primitive_ — authors re-type a recipe. Extract, then migrate.
   - _Call-site drift_ — the token and the primitive both exist and were not
     used. This is the only kind `design-check.mjs` should grow a rule for.

3. **Check the trap ledger** ([reference/traps.md](reference/traps.md)) before
   diagnosing anything. Most "how did that ship" bugs found here were one of
   ten mechanisms, and several are invisible in review because the source reads
   correctly.

4. **Fix in the config, not at the call sites.** The radius bounds fixed 145
   call sites in one edit; the icon stroke fixed 268 files with two lines of
   CSS. If the fix is "touch N files", look one level up first.

5. **Leave a gate behind.** Anything fixed by hand comes back unless a
   mechanism stops it. See "Enforcement" below for which of the three to reach
   for.

6. **Verify.** All four must pass:

   ```bash
   cd apps/web && npx tsc --noEmit && npx vitest run
   ```

   ```bash
   node scripts/compiler-check.mjs && node scripts/design-check.mjs
   ```

   Then visually, via the `agent-browser` skill (navigate to `/?agent` to sign
   in): dark and light, `radius: none` and `radius: full`, the widest font and
   the narrowest, keyboard focus visible on every interactive element.

## Enforcement

Three mechanisms, deliberately separate, because they answer different
questions and mixing them makes a failure unreadable.

| Mechanism                                           | Catches                                                       | Fails the build                 |
| --------------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| `apps/web/src/{surfaceTokens,designTokens}.test.ts` | token _contracts_ — a rule that is valid CSS and does nothing | yes                             |
| `scripts/design-check.mjs`                          | call-site drift a regex can see                               | yes, against a ratchet baseline |
| `design-review` skill                               | hierarchy, rhythm, CSS lies                                   | no, advisory                    |

**The baseline is the point of `design-check.mjs`.** Several hundred existing
violations made a hard fail unshippable on day one. Baselining on
`"relpath :: rule"` (no line numbers, so unrelated edits do not churn it) makes
it a ratchet: new violations fail, existing ones burn down. `--update` rewrites
it; entries that stop reproducing are reported but never fail.

Source-text tests exist because the mistakes they catch are _valid_ — a dark
shadow block byte-identical to the light one is correct CSS that does nothing,
and no runtime test can see it. Assert the relationship, in text.

## Foundations that already exist

Read [reference/foundations.md](reference/foundations.md) before adding a token
or a primitive. Everything in it landed in this programme, and re-adding a near
duplicate is exactly the drift the system exists to stop.

## Out of scope, on purpose

- **No new design document.** Three sources of truth exist — `CLAUDE.md`,
  `apps/web/src/globals.css`, and the two token contract tests. A fourth
  invites drift. This skill points at them; it does not restate their values.
- **No narrowing of the theme options.** All 12 fonts, 6 radii and 26 accents
  stay. Robustness work replaces removal.
- **Not the 73 files over 250 lines.** Structural debt, tracked separately from
  design quality.
