# Design as a session mode (Edit | PRD | Design)

**Status:** ready to implement  
**Branch:** `staging`  
**Re-planned:** 29 Jul 2026  
**Supersedes:** `internal/plans/todo/unifying-design-sessions.md` (kind field + keep `/designs` routes) — cancelled.

## Product model (Cursor-style)

One session, one URL, modes you flip mid-thread — like Cursor’s Agent / Ask / Debug:

| Mode             | Role                                                             |
| ---------------- | ---------------------------------------------------------------- |
| **Edit**         | Coding agent (daemon-pull for Claude; one-shot for Cursor/Codex) |
| **PRD** (`plan`) | Planning turn → `planContent` → PRD sandbox tab                  |
| **Design**       | Design turn → variations JSON → Designs sandbox tab              |

- Per-turn: `messages.mode`
- Sticky composer: `session.lastMode`
- Same `eva/session-*` branch, same sandbox, same chat history
- No `kind` field, no `/designs/*`, no parallel entity

## Locked decisions

1. Full mode stack: validator, `normalizeMode`, dropdown, hotkey cycle, `startExecute` gate, `MODE_TOOLS`, sticky `lastMode`.
2. Queue forwards `mode` + `personaId` + `numDesigns` through enqueue and `startNextQueuedSessionMessage`.
3. Design-mode sessions **auto-start** like coding sessions (no closed-by-default / manual Start).
4. Sandbox path = **session** path only (`startSessionSandbox` / session readiness). Delete `startDesignSandbox` after confirming no meaningful delta worth preserving; fold any must-keep bits into the session path.
5. **Designs** sandbox tab (mirror PRD): show when mode is design and/or latest variations exist; port `DesignPreviewPanel` → session component; dynamic variant count (no hardcode of 3 / `a,b,c` only).
6. Full ops sweep: watchdog, auto-stop, completion logs, spotlight, drafts, badges, snapshot builds, screenshots unions, numId counters.
7. Mode is stored → analytics can filter by `lastMode` / message mode later if metrics skew; product surfaces treat design turns as ordinary sessions (no separate list).
8. `/designs` **gone entirely** — routes, sidebar, spotlight hit type, drafts `designChat`.
9. Execution = **one** `sessionExecuteWorkflow` with a **mode branch** (design prompt + tools + variations parse). Not a second subsystem. Design follows the **same provider rule as Edit**: Claude → daemon-pull (`pendingTurn` + `prewarmSessionDaemon`); Cursor/Codex/Opencode → one-shot `launchOnExistingSandbox`. Bake design instructions into the user prompt via `buildSessionPrompt` (like edit/plan); pass `MODE_TOOLS.design` as `allowedTools` — do **not** require a separate always-one-shot path.

Phase 2 (promote / “build this variant”) stays deferred — see bottom.

---

## Context

`designSessions` duplicates sessions (table, module, workflow, routes, sidebar). Real product deltas: design prompt + variations output, persona + numDesigns, variant preview/select. Shared `messages` / `queuedMessages` already have `variations`, `personaId`, `numDesigns`. Session mode system is the dispatch seam (PRD is the template).

Net new schema: `"design"` on `sessionModeValidator` + `selectedVariationIndex` on `sessionFields`. Wipe designSessions (devOnly nav → disposable).

---

## Backend

### Additive schema (Deploy 1)

- `_validators/enums.ts` — `sessionModeValidator` += `"design"` (flows into messages / queuedMessages / `lastMode`).
- `_validators/tableFields.ts` — `sessionFields` += `selectedVariationIndex: v.optional(v.number())`.

### Execution (`_sessions/execution.ts`)

- Accept `"design"` in mode gate (keep ask/execute → edit normalize).
- Optional args: `personaId?`, `numDesigns?`.
- Design turns: `turnKind: "agent"`. Provider routing unchanged from Edit — Claude stages `pendingTurn` + prewarm; other providers clear `pendingTurn` and one-shot.
- `addMessage` / `enqueueMessage` / `create` (initial message): accept and persist `personaId?` / `numDesigns?`.

### Workflow (`_sessions/workflow.ts`)

- `MODE_TOOLS` += `design: "Read,Glob,Grep,Skill,Write,Edit,Bash"` (today’s design toolset).
- `buildSessionPrompt`: mode `design` → `buildDesignPrompt` (port from `designWorkflow.getSessionDataAndPrompt`: persona, selected-variation refine base, numDesigns). Fold former `DESIGN_SYSTEM_PROMPT` content into that prompt string (same pattern as `buildEditPrompt` / `buildPlanPrompt`) so the daemon path needs no separate systemPrompt field.
- Design turns use the existing Claude-vs-one-shot branch; `allowedTools: MODE_TOOLS.design`.
- Post-turn (like `if (mode === "plan")`): parse variations JSON onto last assistant message (`extractJsonFromText` from `designWorkflow.saveResult`).
- Branch push: enabled for design (existing `mode !== "plan"`); post-turn audit gate stays edit-only (design output isn’t shippable product code).

### Mutations / prompts / queue

- `selectVariation({ id, variationIndex })` on sessions (guard: a variations message exists).
- `prompts/design.ts` — remove agent commit+push; parametrize variant count by `numDesigns`; `?v=` keys by index; content is consumed via `buildDesignPrompt` into the turn prompt (not only as a one-shot `SYSTEM_PROMPT` env).
- `_queues/helpers.ts` `startNextQueuedSessionMessage` — forward `mode`, `personaId`, `numDesigns` into execute.
- Create lifecycle: design mode uses normal session create → **starting** + sandbox startup workflow (auto-start).

### Delete (Deploy 1 cutover)

- `_designSessions/*`, `designSessions.ts`, `designWorkflow.ts`
- `startDesignSandbox`, `designStopRequested`, design readiness mutations
- `trackDesignSessionWorkflow`, `handleStaleDesignSession`
- `startNextQueuedDesignMessage`
- design arms in `sandboxAutoStop`, spotlight design hits, design completion-log entity type if dedicated

### Untouched

- `designPersonas` table + API
- MCP / analytics product filters not required for v1 (mode available if needed later)

### Wipe migration

`_migrations/wipeDesignSessions.ts`: per design row delete messages / queuedMessages / streamingActivity → row; delete `kind === "designChat"` drafts; delete `repoEntityCounters` for `entityType === "designSessions"`. Pre-check: no mid-workflow design rows.

### Deploy 2 — schema cleanup

Drop `designSessions` table; shrink parentId unions (messages, queuedMessages, drafts, screenshots, sandbox runtime); drop `designSessionId` / `designChat` / `designSessions` entity type; clean migrations that referenced designSessions; delete wipe migration after run. Grep gate: `designSessions|designSessionId|DesignSession|designChat` = zero outside `internal/` markdown + `_generated/`.

---

## Frontend (`apps/web`)

### Mode UI

- `useSessionSettings` / `SessionMode` — += `"design"`; fix `normalizeMode`.
- `SessionModeDropdown` — Edit / PRD / Design (+ icon).
- `ChatPanel` `AVAILABLE_MODES` + mode-cycle hotkey include design.

### Composers

- `NewSessionComposer` + session send path: when mode = design, show `PersonaSelector` (move under `sessions/_components/`) + numDesigns control; thread `personaId` / `numDesigns` into create / addMessage / startExecute / enqueue.

### Designs sandbox tab

- `SandboxPanel`: `showDesignsTab` when `lastMode === "design"` and/or `getLatestVariations(messages)` non-null (mirror PRD tab).
- Port `DesignPreviewPanel` → `sessions/_components/DesignVariationsPanel.tsx`: iframes `${previewUrl}/design-preview?v={key}`, viewport toggle, “Use this design” → `sessions.selectVariation`.
- Derive keys/count from `variations.length` (drop hardcoded 3 / `VARIATION_KEYS` / `0|1|2`-only parsers).
- Add `"designs"` to session sandbox tab allow-list.

### Chat / drafts

- No variations chrome in `ChatBody` (variants live in Designs tab).
- Drop `designChat` draft target / `DesignChatTarget` / DraftCard design branch.

### Delete surfaces

- All `routes/.../designs/*`
- `DesignSessionsSidebar`, `SessionListSidebar` (if only consumer)
- Designs nav item + `contextSidebarModes` `"designs"` + Sidebar switch arm
- Spotlight design hit type; design branch of `ActiveCountBadge`
- Regenerate routeTree

---

## Deploys

| Step         | Action                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Deploy 1** | Additive schema + full cutover (backend + frontend). `designSessions` table remains until wipe. |
| **Migrate**  | `wipeDesignSessions` on dev (`dev:good-mule-506`).                                              |
| **Deploy 2** | Drop table + shrink types/unions + delete wipe migration.                                       |

Git: `staging`. Ship via `/ship` when done.

---

## Risks / verify

- Design uses Edit’s provider routing (Claude daemon vs one-shot) — do not double-launch; tools fingerprint may restart daemon when flipping Design ↔ Edit/PRD (expected).
- Diff `startDesignSandbox` vs `startSessionSandbox` before delete; fold anything session path lacks.
- Design prompt + Designs tab agree on `numDesigns` and `?v=` keys.
- Queued design turn carries personaId/numDesigns.
- Flip Design → Edit mid-session: edit turn on same branch works; Designs tab still shows prior variations.
- PRD + edit regression: plan → PRD tab; Claude daemon-pull unchanged.
- Surfaces gone: no Designs nav, `/designs/...` unroutable, no design drafts/spotlight type.

Typecheck: `cd packages/backend && npx convex codegen --typecheck enable`; `npx tsc --noEmit` in apps/web.

---

## Phase 2 (later — do not build now)

Promote a chosen design:

- **(A) Spawn linked session** — `promoteDesignVariant` → new session + seed prompt; optional `sourceSessionId` / `sourceVariationIndex`.
- **(B) Same-session mode flip** — “Use this design” seeds an edit turn to implement variant N and strip design-preview scaffolding (zero new schema; preferred default until proven otherwise).

Open until Phase 2: A vs B (or A with B as light default); seed-prompt wording; whether promote sets `selectedVariationIndex`.

---

## Unresolved

None for Phase 1 — Cursor-style mode model, auto-start, session sandbox path, no `/designs`, Designs tab, and wipe all confirmed 29 Jul 2026.
