# Eva UI conventions

Read this when doing frontend / design work in `apps/web`.

## HeroUI (border-based)

Surface tokens map 1:1 to the HeroUI palette: `--background` (page canvas) → `--card`/`--popover` (surface, elevated) → `--muted` (surface-secondary) → `--secondary` (default). Accent (`--primary`/`--accent`/`--ring`/`--chart-1`/sidebar accent), `--radius`, and `--font-*` are user-defined via theme settings — never hardcode them.

**Borders**

- Cards, surfaces, and content containers get a hairline `border border-border`. This is the primary way surfaces are defined (HeroUI look).
- Layout regions (sidebar edge, list/detail dividers) are separated by a hairline `border-border`/`border-sidebar-border`, not tonal contrast.
- Active/selected items use a surface fill + `border-border` chip; give inactive items `border border-transparent` to avoid layout shift.
- Inputs/selects keep their form-affordance border.

**Shadows**

- Cards and surfaces are border + tone only (no `shadow-sm`). Floating/overlay elements (popovers, tooltips, dropdowns, dialogs, sheets) keep larger shadows for layering.

**Layout & surface colors**

- Sidebar shares the canvas tone (`--sidebar` = `--background`); it is distinguished by the region-divider border, not by being darker.
- Hierarchy comes from: hairline borders + surface tone steps > whitespace > typography weight/size.

**Hover & interaction**

- Hover: `hover:bg-*` (background shift). Active/selected: surface fill + `border-border` (and `ring-*` if extra emphasis is needed).

**Spacing**

- Use whitespace/padding (Gestalt Law of Proximity) to group related elements; reach for borders/dividers for structural separation (HeroUI style).

## Component structure

- Max ~250 lines per client component
- Route-level `*Client.tsx` = thin orchestrator (queries, top-level state, layout composition)
- Route-local child components go in `_components/` folder
- Pure helper functions go in `_utils.ts` at route level
- Presentational components (no hooks, no `"use client"`) stay as plain function components
- Only add `"use client"` to child components that use hooks/interactivity
- Inline sub-components defined in the same file should be extracted to `_components/`

## TanStack Router

- Never use `window.location.href` for navigation. Always use `useNavigate` from `@tanstack/react-router` or the `<Link>` component.
- `window.location.href` causes a full page reload, losing client-side state. TanStack Router navigation preserves SPA behavior.
- Primary tabs = path segments + index redirect to default; avoid local-only Tabs when the view must be linkable.

## Vite (`apps/web`)

- Any package using React Context must be in `resolve.dedupe` in `vite.config.ts`. pnpm can install multiple copies (different peer deps), causing "Context not found" runtime errors.
- When adding a new dependency that provides React hooks/context (e.g. `@tanstack/*`, `@clerk/*`, state managers), add it to the dedupe array.

## Nuqs

- Filters / sort state: use nuqs (`searchParams.ts` + `useQueryState` / `useQueryStates`), not local state — keeps shareable URL state.

## React Compiler (`apps/web`)

- Do not add `useMemo`/`useCallback` by default; only for proven identity/perf needs the compiler cannot cover.
- Compiler bails on a whole file for `finally`, a catch-less `try`, or `throw`/`?:`/`&&`/`??`/`?.`/loops inside `try` (`eva/no-value-block-in-try`).
