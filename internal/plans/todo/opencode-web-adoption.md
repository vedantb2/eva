# OpenCode web → Eva adoption ideas

## Context

[OpenCode](https://github.com/anomalyco/opencode) product UI is a **SolidJS + Vite** SPA (`packages/app`) with shared session primitives in `packages/session-ui` (tools, Pierre diffs, prompt-input, line comments). Served via `opencode web` (CLI/server) or Electron (`packages/desktop`).

Eva already has: session chat + stick-to-bottom / debounced scroll-to-end, activity “Worked for” fold + Show N more, PR Diffs + review→composer, Files viewer, Editor (code-server), terminals, PRD/plan card + Plan Ready banner.

Related plan: [`t3code-diffs-files-adoption.md`](./t3code-diffs-files-adoption.md) (overlap called out below).

---

## Architecture (brief)

| Package                                 | Role                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `packages/app`                          | Session page, timeline, review/files/terminal side panel, composer docks |
| `packages/session-ui`                   | Tool cards, review v2, prompt-input machine, Pierre workers              |
| `packages/ui`                           | Design system, `createAutoScroll`, dock surfaces                         |
| `packages/opencode` + `packages/server` | Bun CLI + HTTP/WS API                                                    |

Patterns are Solid-specific; **interaction models** port to Eva’s React/TanStack stack.

---

## Already covered / low priority

- Basic scroll-to-end pill (Eva just shipped debounce)
- Settled activity fold (“Worked for …”) + tool overflow
- Diff review comments → composer chips
- PRD/plan artifact + Plan Ready banner (Eva); OpenCode’s todo dock is a different shape
- Full IDE via code-server (no need to port Pierre in-panel editor first)

---

## Priority ideas

### P1 — Distinctive OpenCode wins

1. **Nested-scroll-aware auto-follow**
   - Ignore wheel-up inside tool output / diff blocks (`data-scrollable`); don’t break follow mode when scrolling nested panes.
   - Path: `packages/ui/src/hooks/create-auto-scroll.tsx`, `message-gesture.ts`
   - Effort: **M**

2. **Context tool group (collapse read/search/list bursts)**
   - Many low-signal tools → one row (“Gathering context · 3 reads, 2 searches”).
   - Path: `session-ui/.../message-part.tsx` (`ContextToolGroup`)
   - Effort: **M** — biggest timeline declutter Eva doesn’t have

3. **Inline turn diff summary accordion (sticky file headers)**
   - End of turn: expandable rollup of changed files in chat (sticky accordion, cap + “show all”).
   - Paths: `timeline/rows.ts`, `TimelineDiffSummaryRow` in `message-timeline.tsx`
   - Effort: **M** — complements `ChangedFilesCard`; overlaps t3code sticky diffs / turn-scoped diffs

4. **Composer dock stack**
   - Layered trays above prompt: question → permission → todo → revert → followup; animated merge with composer.
   - Path: `session-composer-region.tsx`
   - Effort: **M–L** — Eva has MCQ + Plan Ready; stack unifies interrupt UX

### P2 — Overlap with t3code plan (pick one source)

5. **Multi-scope review: working tree / branch / turn**
   - Same review UI, different scope (`git` | `branch` | `turn`).
   - Path: `session.tsx` reviewMode
   - Effort: **L** — same as t3code P1 working-tree diffs

6. **Review sidebar: tree when idle, flat list when searching**
   - Path: `review-panel-v2.tsx`, `session-file-list-v2.tsx`, `session-file-browser-tab.tsx`
   - Effort: **M** — same as t3code Files searchable tree

7. **Pierre diff worker pool**
   - Off-main-thread Shiki for large diffs.
   - Path: `session-ui/src/pierre/worker.ts`
   - Effort: **M** — t3code P3

8. **Diff file cycling (`</>` keys) + expand/collapse all hunks**
   - Path: `session-review-v2.tsx`
   - Effort: **S**

### P3 — Nice / later

9. **URL hash deep-link to user turns** (`#message-id`) — shareable jump; pause auto-scroll. Effort: **M**
10. **Todo dock with live progress** (odometer done/total) — if Eva surfaces agent todos. Effort: **M**
11. **Tool card polish** — pending shimmer, inline +/- in header, subtitle click opens file without toggling. Effort: **S–M**
12. **Line-comment focus → scroll hunk in review** — polish on existing pipeline. Effort: **M**
13. **Terminal tab drag-sort / auto-close panel** — Effort: **M**
14. **Session handoff** (prompt + file selections survive nav) — Effort: **S**
15. **Revert dock** (restore checkpoint from composer) — Effort: **M–L** (needs checkpoints)

---

## Suggested first slices (when picked up)

1. Context tool grouping in activity timeline (noise reduction, no backend).
2. Nested-scroll-aware stick-to-bottom (fix false unfollow).
3. Inline turn diff accordion / sticky headers (pairs with Diffs polish in t3code plan).
4. Defer multi-scope git diffs to the shared t3code Diffs plan.

---

## Out of scope for now

- Porting Solid/Kobalte stack
- Replacing code-server with Pierre editor
- Full prompt-input state machine rewrite (`/` `@` `!`) unless Eva composer gaps appear
