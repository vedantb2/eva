# Animation opportunities (find-animation-opportunities)

Date: 2026-07-23  
Skill: `find-animation-opportunities` (Emil Kowalski / emilkowalski/skills)  
Scope: `apps/web` + shared UI motion tokens  
Status: **implemented** (2026-07-23)

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

## Part 1 — Opportunities (done)

| #   | Location                             | Status                                                                 |
| --- | ------------------------------------ | ---------------------------------------------------------------------- |
| 1   | `NotificationToastStream.tsx`        | Done — slide in/out `y: -8`, 220ms, reduced-motion opacity-only        |
| 2   | `ResizablePanelLayout.tsx` mobile    | Done — slide `y: 8%` + opacity; mobile toggle now flips local state    |
| 3   | `SandboxPanelToggleButton.tsx`       | Done — `CrossfadeIcon` `variant="soft"`; sessions/designs reuse button |
| 4   | `QuickTaskSplitDetailPane.tsx`       | Done — opacity crossfade keyed on `taskId`, 150ms                      |
| 5   | `EmptyState.tsx`                     | Done — stagger 40ms; `animate={false}` for filter empties              |
| 6   | `LogEntryGroup.tsx` `RawEventViewer` | Done — height + opacity reveal                                         |

Highest leverage was **#1 notification toasts** (shipped first).

---

## Part 2 — Rejected (still stand)

- **Modal open/close** (`.t-modal` + `connectModalSurface`) — already correct CSS scale/fade; don’t wrap `DialogContent` in Motion.
- **Sidebar / SharedLayoutNav + repo tab switches** — tens+/day; already has `layoutId` spring.
- **List↔detail `layoutId` / `animateView` morph** — fights Convex live data.
- **Chat message enter** — already animated.
- **Stats / charts / streaming token paint** — functional read surface.
- **Keyboard shortcuts** — never animate.
- **ActiveFiltersBar** — tens/day while filtering.
- **View switcher list/kanban/table** — already `AnimatePresence mode="wait"`.
