# Design Audit Plan — Feb 2026

## PHASE 1 — Critical

### 1.1 Loading Spinner Inconsistency

Replace all manual spinner `<div>` elements with `<Spinner>` from `@conductor/ui`.

- SessionDetailClient.tsx:53 — manual div spinner → `<Spinner size="lg" />`
- QuickTasksClient.tsx — manual div spinner → `<Spinner size="lg" />`
- Any other manual spinners found

### 1.2 Sidebar Group Labels Fail Accessibility

- Sidebar.tsx:298 — `text-[10px] ... text-muted-foreground/60` → `text-[11px] ... text-muted-foreground`

### 1.3 Icon Sizing Inconsistency

Standardize all icon sizing to use Tabler `size` prop:

- `w-4 h-4` or `className="w-4 h-4"` → `size={16}`
- `w-5 h-5` → `size={20}`
- `w-3 h-3` → `size={12}`
- Affects: Sidebar.tsx, BranchSelector.tsx, ActiveTasksAccordion.tsx, all layout files, QuickTasksClient

### 1.4 Secondary/Muted Tokens Are Identical

- globals.css `:root` — `--muted: rgb(236, 245, 243)` → `--muted: rgb(240, 244, 243)`

### 1.5 Non-Standard Opacity Values

- BranchSelector.tsx — `text-foreground/70` → `text-muted-foreground`
- Sidebar.tsx — remove `/60` from `text-muted-foreground/60` on group labels (covered by 1.2)
- Standardize hover states: `hover:bg-muted/60` → `hover:bg-muted/50` everywhere (pick one)

### 1.6 Mobile Responsiveness Gap on Secondary Sidebars

- SidebarLayoutWrapper.tsx — add mobile responsive behavior (hidden sidebar + sheet/drawer on mobile)

---

## PHASE 2 — Refinement

### 2.1 Typography Scale Formalization

- Display: `text-2xl font-semibold tracking-tight` — hero stats only
- H1: `text-xl font-semibold` — page titles
- H2: `text-base font-medium` — section headings, card titles
- Body: `text-sm` — regular text
- Caption: `text-xs text-muted-foreground` — timestamps, metadata

### 2.2 Spacing Rhythm Inconsistency

- Container padding: `px-4 py-3` for all headers/footers
- List item padding: `px-3 py-2.5` for all clickable list items
- List item margin: `mx-2` for sidebar list items
- SidebarLayoutWrapper header: `p-3 pt-4 pb-3` → `px-4 py-3`

### 2.3 Navigation Group Complexity

- Remove collapsible groups, use flat list with non-interactive section headers
- Remove chevrons and toggle logic
- Keep group labels as visual separators only

### 2.4 Badge Hardcoded Colors

- Add `--success`, `--warning` tokens to globals.css
- Update badge success/warning variants to use semantic tokens

### 2.5 Collapsed Sidebar Width Inconsistency

- Standardize all collapsed widths to `w-12` (48px)

### 2.6 Button Icon Pattern Inconsistency

- Remove all `mr-2` from icons inside buttons (rely on button's built-in `gap-2`)

---

## PHASE 3 — Polish

### 3.1 Replace Spinners with Skeleton Loaders

- Add skeleton screens for stat cards, session lists, document lists

### 3.2 Empty State Elevation

- Larger icons, primary-colored action buttons, more spacing

### 3.3 Sparkline Hardcoded Colors

- Replace `#14b8a6` hex with CSS variable references

### 3.4 PageWrapper Header Separation

- Add `border-b border-border` to PageWrapper header

### 3.5 Redundant Shadow Override on StatCard

- Remove `shadow-none` from StatCard Card usage

### 3.6 Absolute Header Center Overlap Risk

- Replace absolute positioning with flexbox spacers
