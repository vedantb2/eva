# eva design rulebook

This is the authority on how UI in `apps/web` (shared primitives in `packages/ui`)
should look and behave. If a screen you are building or changing disagrees with
this document, the document wins — fix the screen, or fix this document with the
author's sign-off. It exists because "match the vibe of nearby code" drifts:
every screen makes one small unlicensed choice, and after a dozen screens there
is no vibe left to match.

Read this before building or changing a screen. It is written for an engineer
or an AI agent who is about to write JSX, not for a design audience.

## References and philosophy

Primary reference: **Linear** — density, calm, small-radius controls,
keyboard-first. The Grok/xAI flavour (bigger type, looser space, more visual
flourish) is reserved for the marketing landing page only; it does not leak
into the product. Supporting references: Vercel, Cursor.

The product is a tool for managing other codebases and running agents against
them. It is used for hours at a time by people who know what they are doing.
Optimise for scanability and low visual noise over first-glance polish.
Hierarchy comes from structure (hairline borders, tone steps, whitespace) —
not from colour, weight, or size doing the same job three times over.

## Foundations

### Appearances

Three appearances, applied as a class on `<html>`:

- `light`
- `neutral` — soft dark graphite, applied as `<html class="dark neutral">`
- `dark` — near-black, the Grok look

Plus a local-only `system` option that resolves to one of the above from the OS
preference. Do not write appearance-specific code paths in components — the
token values change per appearance, the classes calling them do not.

### Tokens

Every colour token is a CSS custom property holding an **rgb triplet** (e.g.
`--border: 221 222 223;`), consumed through a helper that produces
`rgb(var(--x) / <alpha-value>)` so Tailwind's opacity modifiers
(`bg-card/60`) work. Consequences:

- Never write a hex or `rgb()` literal in a `className`. If a colour is not a
  token, it should not be on screen.
- Accent (`--primary` / `--accent` / `--ring` / `--chart-1` / sidebar
  accent), `--radius`, and `--font-*` are **user-theme-driven** — set from the
  in-app theme picker, not by you. Never hardcode a value for any of these,
  even to "match" a screenshot. The token maps keep every legacy key so a
  stored user preference keeps resolving after the palette changes shape.

Token definitions live in `apps/web/src/globals.css` (`:root`, `.dark`,
`.dark.neutral`) and are wired into Tailwind class names in
`apps/web/tailwind.config.js`.

### Surface ladder

```
--background (canvas)
  → --card / --popover (surface, elevated)
    → --muted (secondary surface)
      → --secondary (default control fill)
```

Hierarchy comes from, in order: hairline borders + surface tone steps →
whitespace → typography weight/size. Reaching for a heavier font-weight or a
bigger size before you've used a border or a tone step is doing the job out of
order.

The sidebar shares the canvas tone (`--sidebar` tracks `--background`); it is
separated from content by the region-divider hairline (`border-sidebar-border`),
never by being a darker shade.

## Type scale

Tailwind's default scale is extended, not replaced, with the sizes below —
they exist so nobody reaches for `text-[11px]` again.

| Class | Size / line-height | Use |
|---|---|---|
| `text-3xs` | 10px / 14px | Rare — dense inline meta, timestamps in tight chips |
| `text-2xs` | 11px / 16px | Menu shortcuts, badge text, micro-labels |
| `text-xs` | 12px / 16px | Default Tailwind scale |
| `text-2sm` | 13px / 18px | **Linear's UI body size — default for dense UI**: list rows, table cells, compact controls |
| `text-sm` | 14px / 20px | Default Tailwind scale — titles/labels in dense contexts |
| `text-base`+ | 16px+ | Default Tailwind scale — prose only, never dense UI |

Arbitrary `text-[Npx]` is banned outside the landing page. If none of the
above fits, that is a sign the layout needs a token added to
`apps/web/tailwind.config.js`, not an arbitrary escape.

## Radius

Defined in `apps/web/tailwind.config.js` (`borderRadius`) and
`packages/ui/src/utils/surface-radius.ts`. All three are clamped against the
user's `--radius` theme setting:

| Class | Resolves to | Use |
|---|---|---|
| `rounded-control` | `min(var(--radius), 0.625rem)` — ≤10px | Buttons, inputs, selects, tabs, textareas |
| `rounded-surface` | `clamp(0.75rem, var(--radius), 1rem)` — 12–16px | Cards, dialogs, popover/dropdown panels, kanban columns |
| `rounded-menu-item` | `min(var(--radius), 0.5rem)` — ≤8px | Rows inside menus, selects, command palettes |
| `rounded-full` | circle | Avatars, dots, genuine pills (badges) |

**Why clamped:** the theme's radius setting has a "Full" option
(`--radius: 9999px`) for users who like pill-shaped everything. Tailwind's raw
`rounded-sm|md|lg|xl|2xl` and any `rounded-[...]` arbitrary value resolve
straight off the unclamped `--radius`, so under "Full" a data table row or a
form input becomes a literal oval. That already happened — it was the single
biggest source of drift in the app — which is why raw radius utilities are
banned outside `packages/ui` (where the primitives that need the raw scale,
e.g. `Card`'s internal composition, are hand-verified once and reused
everywhere).

## Colour discipline — quiet monochrome

- Text and chrome are neutral. Budget roughly **one accent moment per view** —
  a primary button, a selected nav item, not both plus a coloured banner.
- **Status** is a small coloured glyph plus neutral text, not a loud filled
  pill. Use `StatusDot` (`packages/ui/src/ui/status-dot.tsx`) next to plain
  text, or `Badge` with `variant="quiet"` (`packages/ui/src/ui/badge.tsx`) if
  you need a bounded chip — both are built for this pairing. `--status-*-bar`
  is the glyph colour. `--status-*-bg` / `--status-*-subtle` are the loud
  fills and are reserved for kanban column washes — do not reach for them on
  an inline status label.
- **Identity/categorical colour** — hash-assigned colour for session tab
  groups, repo tiles, avatars — uses the muted ramp `--cat-1` … `--cat-8` via
  the `cat-*` Tailwind family (`bg-cat-3`, `text-cat-6`, …). Never a raw
  Tailwind palette class (`bg-blue-500`, `text-purple-600`, …) for this. Do
  not hash ids yourself: `catColorForId(id)` from `@eva/ui` owns that, and
  returns `{ text, bg, bgTint, border }`. `catColorForSlot(slot)` is the
  escape hatch for a consumer that must keep its own legacy hash so existing
  colour assignments don't reshuffle.
- `--chart-1` … `--chart-5` are for data visualisation only.

## Borders and shadows

- Cards, surfaces, and content containers get a hairline `border
  border-border` plus a tone step. **No `shadow-*` on flat surfaces.**
- Shadows exist only on floating/overlay layers — popovers, dropdowns,
  tooltips, dialogs, sheets — and those already live in `packages/ui`
  (e.g. dialog content uses `shadow-xl`, menu content uses `shadow-lg`). You
  should not need to add a shadow anywhere in `apps/web`.
- Active/selected rows and items: surface fill + `border-border` (see
  `ListRow`'s `selected` state: `border-primary/30 bg-primary/5
  ring-1 ring-primary/30`). Give inactive siblings `border border-transparent`
  so selection never shifts layout.
- Hover is a background shift (`hover:bg-muted/60` or similar), not a border
  or shadow change.

## Motion

Fast and subtle: 150–200ms, ease-out (`--motion-ease-out:
cubic-bezier(0.22, 1, 0.36, 1)` in `globals.css`). No bounce, no spring on
chrome. `--motion-fast` (150ms) / `--motion-base` (220ms) / `--motion-slow`
(320ms) are available as tokens; prefer them over a hand-typed duration.

## Layout recipes

These are the shapes every screen is built from. If what you are building
matches one of these, use the recipe; do not invent a new shape for a
familiar problem.

### 1. Page header

A compact functional toolbar, ~48px tall: breadcrumb/title on the left,
actions on the right, a hairline border on the bottom edge only.

```tsx
<header className="flex h-12 items-center justify-between gap-4 border-b border-border px-4">
  <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
    {/* breadcrumb or title */}
  </div>
  <div className="flex items-center gap-2">
    {/* actions: Button size="sm" / icon-sm */}
  </div>
</header>
```

No oversized page titles — `text-2xl font-bold` sitting on top of a route is
drift; it belongs on the marketing site, not in the product.

Use `PageHeader` / `PageHeaderTitle` / `PageHeaderActions` from `@eva/ui`
rather than the markup above — it is the same shape, extracted. Some older
headers (`TaskHeader`, `PrOverviewHeader`) are still hand-rolled; migrate one
when you next touch it rather than adding a new copy.

### 2. List

Dense rows, built on `ListRow` (`packages/ui/src/ui/list-row.tsx`), which
already owns the surface, hairline, accent stripe, hover, selected state,
press feedback, and focus ring:

```tsx
<ListRow
  density="compact" // ~36–40px rows, text-2sm body
  accentClassName="bg-status-progress-bar" // optional leading status stripe
  link={<Link to="/repo/$owner/$repo/tasks/$id" params={...} />}
  selected={isSelected}
>
  <div className="flex items-center gap-3">
    <StatusDot tone="progress" />
    <span className="truncate text-2sm font-medium">{title}</span>
    <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
      {relativeTime}
    </span>
  </div>
</ListRow>
```

Wrap any nested interactive control (checkbox, menu trigger, dismiss button)
in `LIST_ROW_CONTROL_CLASS` so it receives its own clicks instead of the row's
stretched overlay.

### 3. List/detail

A split pane divided by a hairline (`border-l border-border` on the detail
pane, or a `Separator`). The detail pane is a content column plus a right
properties rail of label/value rows with quiet buttons. Use wherever the
entity has metadata: tasks, reviews, inbox, sessions.

```tsx
<div className="flex h-full">
  <div className="w-80 shrink-0 overflow-y-auto border-r border-border">
    {/* list of ListRow */}
  </div>
  <div className="flex flex-1 overflow-hidden">
    <div className="flex-1 overflow-y-auto p-6">{/* content */}</div>
    <aside className="w-64 shrink-0 border-l border-border p-4">
      {/* label / value rows */}
    </aside>
  </div>
</div>
```

### 4. Settings

A section title as plain text above a bordered card, with hairline-divided
rows inside. The real primitives, both in `apps/web/src/lib/components/settings/`:

```tsx
<SettingsSection
  title="Auto-stop"
  description="Stop idle sandboxes after a period of inactivity."
  bodyVariant="list" // "form" | "list" | "compact"
>
  <div className="divide-y divide-border">
    <SettingsToggleRow
      title="Enabled"
      description="Idle sandboxes stop automatically."
      action={<Switch checked={enabled} onCheckedChange={setEnabled} />}
    />
  </div>
</SettingsSection>
```

For a labelled form field inside a `bodyVariant="form"` section, use
`SettingsField` (same folder) rather than hand-spacing a label + control +
help-text stack.

### 5. Menus/popovers

Hairline + shadow, keyboard hints right-aligned and muted. Already built —
compose from the shared classes in `packages/ui/src/ui/_menu-classes.ts`
(`menuContentClass`, `menuItemClass`, `menuShortcutClass`, …), which every
`DropdownMenu*`/`ContextMenu*`/`Select*` primitive already uses:

```tsx
<DropdownMenuContent>
  <DropdownMenuItem onSelect={rename}>
    Rename
    <span className={menuShortcutClass}>⌘R</span>
  </DropdownMenuItem>
</DropdownMenuContent>
```

Content shell: `rounded-surface border border-border bg-popover p-1.5
shadow-lg`. Items: `rounded-menu-item ... focus:bg-muted`.

### 6. Dialogs

Compact, strict header/body/footer (`Dialog`, `DialogHeader`, `DialogBody`,
`DialogFooter` in `packages/ui/src/ui/dialog.tsx`; content shell is
`rounded-surface border border-border bg-card p-6 shadow-xl`). Prefer a
popover or an inline pane over a dialog when the interaction is trivial (a
single confirm, a short menu) — a dialog is for something that needs its own
focus trap and can't share space with what triggered it.

### 7. Empty states

Quiet and centred: small muted icon, one line, at most one action. Real
component: `EmptyState`, exported from `@eva/ui`
(`packages/ui/src/ui/empty-state.tsx`). For a settings-specific empty body, use `SettingsEmptyState` in
the same settings folder instead of hand-rolling one.

```tsx
<EmptyState
  icon={<IconInbox />}
  title="No open reviews"
  description="Reviews you're assigned to will show up here."
/>
```

## Component inventory

Reach for a `packages/ui/src/ui/` primitive before writing raw markup. The
package exports card, surface, list-row, button, button-group, badge, input,
input-group, search-input, select, textarea, checkbox, switch, tabs, dialog,
sheet, popover, hover-card, tooltip, dropdown-menu, context-menu, command,
accordion, collapsible, calendar, carousel, table, avatar, separator,
skeleton, spinner, sonner, progress, label — see `packages/ui/src/index.ts`
for the current export barrel rather than trusting this list to stay exact.
`ai-elements/` and `kibo/` are additional composed families for chat and
richer widgets.

`StatusDot` is the only "coloured dot" component — paired with `Badge`'s
`quiet` variant, as `TaskStatusBadge` and `ProjectPhaseBadge` do. Don't let a
second hand-rolled one appear. Note those two badges render a dot and a label
only: `statusConfig.icon` / `phaseConfig.icon` still exist for the kanban and
the status dropdowns, but a dot *and* an icon *and* a label is one glyph too
many for a chip that size.

## Do / Don't

Each of these mirrors a rule enforced by `scripts/design-check.mjs`
(see below). If you catch yourself writing the left-hand side, stop.

| Don't | Why | Do instead |
|---|---|---|
| `text-[13px]`, any `text-[Npx]` | Bypasses the shared type scale; the next screen won't match it | The type tokens above (landing page is exempt) |
| `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-[...]` | Unclamped — resolves to an oval under the "Full" radius theme | `rounded-control` / `rounded-surface` / `rounded-menu-item` |
| A hex or `rgb()` literal in a `className` | Breaks on appearance switch; not a token | The relevant colour token |
| `shadow-*` outside a `packages/ui` overlay | Flat surfaces read as floating; breaks the border-based hierarchy | Hairline `border border-border` + tone step |
| A raw `<button>` outside `packages/ui` | Misses the focus ring, disabled state, hit-target floor, and radius token | `Button` from `@eva/ui` |
| Raw Tailwind palette classes (`bg-red-500`, `text-purple-600`, …) | Not theme-aware; clashes with the quiet-monochrome rule | A semantic token, or `cat-*` for identity colour |
| A loud filled status chip/pill | Status should not compete visually with content | `StatusDot` + neutral text, or `Badge variant="quiet"` |
| An oversized route title (`text-2xl font-bold` on a page) | Grok-marketing scale leaking into dense product UI | The page-header recipe above |

### Escape hatch

A genuinely justified violation is allowed, but it must say why, on the line
above:

```tsx
// design-check-ignore-next-line — colour swatch must render the exact hex the user picked, not a token
<div style={{ background: swatchHex }} />
```

No reason, no exemption — the comment without an explanation is treated the
same as no comment at all. Fair use is narrow: a colour-picker swatch, a
radius preview control in the theme settings screen, a syntax-highlighting
theme — anything whose entire job is to render a value that is not, and can
never be, one of our tokens. "It was faster this way" is not a reason.

## The gate

Pushes are checked by `node scripts/design-check.mjs` against a baseline of
already-known violations, on the same model as the existing
`scripts/compiler-check.mjs` gate:

```
node scripts/design-check.mjs           check against the baseline
node scripts/design-check.mjs --update  rewrite the baseline from HEAD
```

The baseline only ever ratchets down. You may run `--update` only after your
change has *reduced* the violation count — never to launder a new one in. If
the check flags a line you believe is genuine drift someone else introduced,
fix it rather than baselining it.

Run it with `pnpm design:check`. It mirrors `scripts/compiler-check.mjs`
(bailout baseline, same `--update` flag, same ratchet-only rule). Like
`compiler:check`, it sits in `.husky/pre-push` in commented-out form — this
repo runs its gates through `/preflight` rather than on every push.

One known limitation: the scan is per-line, so a violation split across a
multi-line `cn(...)` call can slip past it. The Do/Don't table above is still
the authority; the script only catches the single-line majority.

## Adding a new surface — checklist

1. Which layout recipe is this? (header / list / list-detail / settings /
   menu / dialog / empty state). If none fit, that's a signal to slow down,
   not to freelance.
2. Reach for the `packages/ui` primitive first. Only write raw markup for the
   parts that primitive genuinely doesn't cover.
3. Pick surface tone from the ladder (`background` → `card`/`popover` →
   `muted` → `secondary`) — don't invent a new tone step.
4. Radius: `rounded-control` for controls, `rounded-surface` for containers,
   `rounded-menu-item` for menu rows. Never a raw `rounded-*` scale value.
5. Type: pick from the type scale table. No `text-[Npx]`.
6. Colour: text and chrome stay neutral; at most one accent moment on the
   view. Status uses `StatusDot`/`Badge variant="quiet"`, not a filled pill.
7. Borders, not shadows, on anything that isn't a floating overlay.
8. Hover = background shift. Selected = fill + `border-border`. Inactive
   siblings get `border border-transparent` so nothing shifts on selection.
9. Motion, if any, is 150–200ms ease-out — reuse `--motion-fast`/`-base`.
10. If you had to break a rule above, add a `design-check-ignore-next-line`
    comment with a real reason, on the line above the violation.
11. Run `/ship` once the change is complete (per the repo's standard process),
    unless told otherwise.
