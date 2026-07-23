# Animation opportunities (find-animation-opportunities)

Date: 2026-07-23  
Skill: `find-animation-opportunities` (Emil Kowalski / emilkowalski/skills)  
Scope: `apps/web` + shared UI motion tokens

Restraint filter — not a wishlist. Cap 5–7 high-conviction items.

Repo motion vocabulary to extend (do not invent parallel tokens):

- `--motion-fast: 150ms`
- `--motion-base: 220ms`
- `--motion-slow: 320ms`
- `--motion-ease-out: cubic-bezier(0.22, 1, 0.36, 1)`
- `--motion-ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1)`
- Modal: `--modal-open-dur: 250ms`, `--modal-close-dur: 150ms`, `--modal-ease` (same curve as `--motion-ease-out`), `--modal-scale: 0.96`

Animate `transform` and `opacity` only unless height reveal is required for accordions.

---

## Part 1 — Opportunities

| #   | Location                                                | Today                                                      | Purpose                                      | Frequency         | Suggested motion                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `NotificationToastStream.tsx` (~L128–184)               | Toasts mount/unmount with no enter/exit                    | Spatial consistency + prevent jarring change | Occasional        | **Slide in / Slide out** from the same top-right edge: enter `opacity: 0; translateY(-8px)` → settled; exit reverse. `transition: transform, opacity` over `var(--motion-base)` (`220ms`) `var(--motion-ease-out)`. Wrap list in `AnimatePresence`. Reduced-motion: opacity-only, `150ms`. |
| 2   | `ResizablePanelLayout.tsx` mobile branch (~L98–110)     | Right sandbox panel hard-mounts (`{!rightCollapsed && …}`) | Spatial consistency                          | Occasional        | **Slide in** from bottom of the split: `translateY(8%)` + `opacity: 0` → settled, `220ms` `--motion-ease-out`; exit same path. Desktop `Panel.collapse()` already resizes — leave it. Reduced-motion: opacity only.                                                                        |
| 3   | `SandboxPanelToggleButton.tsx` (~L25–29)                | Expand/collapse icons snap                                 | State indication                             | Tens/day          | Near-imperceptible **icon swap**: reuse `CrossfadeIcon` but softer than theme toggle — `opacity` + `scale(0.96→1)`, `var(--motion-fast)` (`150ms`) `--motion-ease-out`, no blur. Gate hover with `@media (hover: hover) and (pointer: fine)`.                                              |
| 4   | `QuickTaskSplitDetailPane.tsx` / task body on prev·next | Task content teleports when `taskId` changes               | Prevent jarring change                       | Occasional→tens   | Soft **crossfade** only (not shared-element morph): key content on `taskId`, `opacity 0→1` over `150ms` `--motion-ease-out`. No `y` travel (reading UI). Reduced-motion: instant.                                                                                                          |
| 5   | `EmptyState.tsx`                                        | Flat first paint                                           | Delight (rare tier only)                     | Rare / first-time | Quiet **stagger** (40ms): icon → title → description → CTA; each `opacity: 0; translateY(8px)` → settled, `220ms` `--motion-ease-out`. Never block clicks. Skip when it’s a filter “no results” flash.                                                                                     |
| 6   | `LogEntryGroup.tsx` `RawEventViewer` (~L51–54)          | `{open && <pre>}` snaps                                    | State indication                             | Occasional        | **Reveal**: height + opacity via `Collapsible`/`AnimatePresence`, `220ms` `--motion-ease-out`; chevron already rotates — keep it.                                                                                                                                                          |

Highest leverage: **#1 notification toasts**.

---

## Part 2 — Rejected

- **Modal open/close** (`.t-modal` + `connectModalSurface`) — already correct CSS scale/fade; don’t wrap `DialogContent` in Motion (fights centering `translate(-50%)` + scale).
- **Sidebar / SharedLayoutNav + repo tab switches** — tens+/day core nav; already has `layoutId` spring; more motion would slow the product.
- **List↔detail `layoutId` / `animateView` morph** — fights Convex live data; selecting tasks is too frequent for a showy morph.
- **Chat message enter** (`ChatMessage.tsx`) — already `opacity` + `y: 10` at `180ms`; leave it.
- **Stats / charts / streaming token paint** — functional read surface; decoration hinders.
- **Keyboard shortcuts / command-ish hotkeys** — never animate (100+/day disqualifier).
- **ActiveFiltersBar appear/disappear** — tens/day while filtering; reject or opacity-only ≤150ms if revisited.
- **View switcher list/kanban/table** — already `AnimatePresence mode="wait"` in `QuickTasksClient` / `ProjectsClient`.

---

## Part 3 — Verdict

Eva is already close: modals, nav pill, chat enter, view switches, and press feedback (`motion-press` / `active:scale-[0.96]`) are covered. It needs a few **spatial bridges**, not more sparkle.

**#1 (notification toasts)** is the highest-leverage single change — occasional, currently teleports, and teaches exit/enter from one edge.

Handoff: `improve-animations plan notification toast enter/exit` for a self-contained implementation plan.

---

## Stack notes (context)

- Motion `^12.33` via `MotionProvider` (`LazyMotion` + `domMax` + `m`, strict).
- Dialogs: CSS `.t-modal` in `packages/ui` + `apps/web/src/globals.css`.
- Popovers/tooltips/sheets: Tailwind `animate-in` / zoom+slide.
- Prefer CSS for simple hover/color; Motion for enter/exit, layout, orchestration.
