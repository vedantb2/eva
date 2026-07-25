# Merge designSessions into sessions (single table + `kind` field)

## Context

`designSessions` duplicates `sessions`: `designSessionFields` (tableFields.ts:538-552) = strict subset of `sessionFields` (tableFields.ts:158-201) + one field (`selectedVariationIndex`). `_designSessions/` module mirrors `_sessions/` function-for-function (CRUD, sandbox lifecycle, watchdog, auto-stop). Every polymorphic union carries both tables (`messages.parentId`, `queuedMessages.parentId`, drafts, screenshots, Daytona volume/execution kinds, numId counters). Merging deletes the duplicate lifecycle code and shrinks every union. Personas unaffected — `designPersonas` is repo-scoped, linked per-message via `messages.personaId`. Execution stacks stay separate (coding = pendingTurn daemon + `sessionExecuteWorkflow`; design = `designSessionWorkflow` + variations parsing) — they just both operate on `sessions` rows. Designs nav is `devOnly: true` → no production users; existing design data disposable.

## Decisions (user-confirmed)

1. FULL consolidation — delete `_designSessions/` + `designSessions.ts`; one kind-aware `api.sessions.*` namespace
2. WIPE existing design data (rows + their messages/queuedMessages/designChat drafts + counters); no repointing
3. `kind: v.union(v.literal("coding"), v.literal("design"))` — required after backfill (chicken-egg: optional → backfill → required)
4. URLs/UX unchanged: `/designs/{numId}` + `/sessions/{numId}/{tab}` routes stay; separate sidebars; Spotlight + audits stay coding-only
5. Resolved by convention: required `kind` arg on list/listArchived/countActive; fold `designChat` drafts into `sessionChat`; `mcp/queries.ts` unfiltered (rows self-describe via kind); `analytics.ts` filters to coding
6. Product intent (context): design sessions = codebase-aware design exploration; persona-driven variants in tabs; designer picks one and iterates on it (`selectVariation` + refine turns — preserved as-is). The "proceed" flow is designed as **Phase 2** (see bottom) — attached for later, NOT built in this piece of work

## Target shape

- `sessionFields` += `kind` (optional during transition) + `selectedVariationIndex: v.optional(v.number())`. Transitional helper `sessionKind(s) = s.kind ?? "coding"`, removed at cleanup.
- **No new indexes** — kind filtered in code on existing `by_repo`/`by_repo_and_status`/`by_repo_and_archived` (per-repo lists small; `list` already code-filters archived). `by_repo_and_numId` stays kind-free; single shared "sessions" numId counter keeps numIds unique per repo across kinds.
- `api.sessions.*`: `list/listArchived/countActive({repoId, kind})`; `getByNumId({repoId, numId, kind?})` returns null on kind mismatch (server-side 404 for `/designs/{codingNumId}`); `create({repoId, title, kind?})` — coding: current flow (status starting, auto-start workflow); design: insert `{status:"closed", kind:"design"}`, no workflow (explicit Start button, as today); `addMessage`/`updateLastMessage` gain optional `personaId?`/`variations?`; `selectVariation({id, variationIndex})` guards kind design; `startSandbox` branches on kind (branch prefix `eva/design-` vs `eva/session-`, dispatch `startDesignSandbox` vs `startSessionSandbox`, startup-activity seeding coding-only); `stopSandbox` = coding version + design's `preferPersistedSandboxId` (bug-fix: handles Vercel-only ids); single `sandboxReady`/`sandboxError`/`markSandboxClosed`/`finalizeStopSandbox`/`getInternal` serve both kinds (design gains coding's stopping/closed guards + already-active dedup — bug-fix).
- Startup workflows merge: `sessionSandboxStartupWorkflow` gains `kind`, final step dispatches the right daytona action; design's separate pre-thaw workflow deleted (its `prepareReusedDesignSandbox` already calls `ensureSandboxRunning`).
- `designWorkflow.ts` absorbs `_designSessions/execution.ts`: `executeMessage/enqueueMessage({sessionId, message, model, personaId?, numDesigns?})`, `cancelExecution({sessionId})` (kind-design guard); `designSessionWorkflow`/`getSessionDataAndPrompt`/`saveResult`/`handleCompletion` — all `designSessionId` → `sessionId: v.id("sessions")`; `launchOnExistingSandbox` gets `entityIdField: "sessionId"` (env-var pair backend-controlled, ships atomically).
- `internal.daytona.startDesignSandbox({sessionId, ...})` — readiness/error → `internal.sessions.*`; persistence volumes keyed `("sessions", id)` (old design subpaths orphan harmlessly — rows wiped anyway).
- Watchdog: delete `trackDesignSessionWorkflow`/`handleStaleDesignSession`; design uses `trackSessionWorkflow`; `handleStaleSession` branches on kind (design → "Error: Design generation timed out." + `startNextQueuedDesignMessage`).
- `sandboxAutoStop.ts`: sessions scan covers both kinds; delete `stopDesign` + design loop. `_queues/helpers.ts`: `startNextQueuedDesignMessage(ctx, sessionId: Id<"sessions">)`.
- Drafts: fold `designChat` → `sessionChat` (one chat surface per session, keyed sessionId). Drop `designSessionId` column, `by_user_and_designSession` index, `designChat` literal + draftTarget arm. `drafts.listForRepo` returns `sessionKind` for DraftCard label/route.
- Accepted behavior changes: design archive now archives sandbox; design gains stuck-`stopping` recovery + sandboxReady race guards.

## Deploy 1 — additive schema + full code cutover

Safe pre-backfill because all reads go through `sessionKind()` helper; `designSessions` table stays in schema (rows still exist); unions/literals untouched until Deploy 2.

Backend (packages/backend/convex):

- `_validators/tableFields.ts` — optional `kind` + `selectedVariationIndex` on sessionFields
- `_sessions/queries.ts`, `_sessions/mutations.ts`, `_sessions/sandbox.ts`, `_sessions/workflow.ts`, `sessions.ts` — unified kind-aware functions per Target shape
- `designWorkflow.ts` — absorb execution entry points, retarget to sessions table
- `_daytona/sessions.ts` — `startDesignSandbox` on sessions ids; `designStopRequested` reads `internal.sessions.getInternal`
- `workflowWatchdog.ts`, `_queues/helpers.ts`, `sandboxAutoStop.ts` — consolidation per Target shape
- `analytics.ts` — `kind === "coding"` filters (4 scans: getSessionStats ~:33, getActiveUsers :142, getActivityTimeline :247, leaderboard :404)
- `_drafts/queries.ts` — `sessionKind` on listForRepo items
- New `_migrations/mergeDesignSessions.ts` (+ exports in `migrations.ts`): `backfillSessionKind`, `wipeDesignSessions`
- DELETE: `_designSessions/*`, `designSessions.ts` (incl. dead `updateSandbox` — no callers)

Frontend (apps/web/src):

- `lib/useResolveByNumId.ts` — kind param on `useSessionByNumId`; delete unused `useDesignSessionByNumId`
- `routes/.../sessions/$numId/$sandboxTab.tsx` — pass kind "coding"
- `routes/.../designs/$numId.tsx` — rewrite onto resolver hook + `EntityNumIdGate` (fixes inline-resolve inconsistency)
- `routes/.../designs/DesignDetailClient.tsx` — `Id<"sessions">`, `api.sessions.*`, start/stop arg `{sessionId}`
- `routes/.../designs/_components/DesignChatPanel.tsx` — `api.designWorkflow.*`, `sessionChat` draft target
- `lib/components/chat/useChatDraftSeed.ts` — drop `DesignChatTarget`
- `lib/components/sidebar/DesignSessionsSidebar.tsx`, `SessionsSidebar.tsx` — kind args; **optimistic updates must re-key on kind-scoped query args or cache patches silently miss**
- `lib/components/sidebar/ActiveCountBadge.tsx` — single query with kind
- `lib/components/SpotlightSearch.tsx` — `kind: "coding"`
- `routes/.../drafts/_components/DraftCard.tsx` — sessionChat branch routes `/designs/{numId}` when sessionKind design

Pre-deploy check: no design session mid-workflow/`starting`/`stopping` (in-flight scheduler refs to deleted functions only log errors, but check). Stale browser tabs error on deleted `api.designSessions.*` until refresh — devOnly, acceptable.

## Migrations (run on dev deployment after Deploy 1)

1. `backfillSessionKind` — patch sessions missing kind → `"coding"`
2. `wipeDesignSessions` — per design row: delete `messages` (by_parent), `queuedMessages` (by_parent_and_created), `streamingActivity` rows, then the row; delete all `kind === "designChat"` drafts (full scan, small table); delete `repoEntityCounters` rows with `entityType === "designSessions"` (required before validator literal shrinks). Data tiny (devOnly) — single mutation fine.

## Deploy 2 — schema/type cleanup

- `schema.ts` — drop `designSessions` table + `drafts.by_user_and_designSession` index
- `_validators/tableFields.ts` — `kind` required; delete `designSessionFields`; shrink `messages.parentId` + `queuedMessages.parentId` unions; drafts drop `designSessionId` + `designChat` literal; `draftTarget` drop designChat arm; `repoEntityTypeValidator` drop `"designSessions"`
- `numId.ts` (RepoEntityType), `_daytona/volumes.ts` (PersistableSessionId/Kind), `_daytona/execution.ts` (persistence validators), `screenshots.ts` (attachMedia parentId → `v.id("sessions")`), `repoUtils.ts`, `_repoSnapshots/builds.ts`, `_migrations/backfillNumIds.ts` (ENTITY_TYPES + switch), `_migrations/deleteRepos.ts` (drop step), `_drafts/{helpers,mutations,queries}.ts` (designChat arms), `workflowWatchdog.ts` timeoutLastMessage parentId type
- Remove `sessionKind` helper; delete `_migrations/mergeDesignSessions.ts` + exports (CLAUDE.md migration-cleanup rule)
- Gate: repo-wide grep `designSessions|designSessionId|DesignSession` = zero outside `internal/` markdown

## Verification

- Each deploy: `cd packages/backend && npx convex codegen --typecheck enable`; `npx tsc --noEmit` in apps/web. Deploys target dev (`dev:good-mule-506`), never prod from WIP branch.
- Coding flows: create (auto-start), edit turn (daemon claim), plan turn, queued message, cancel, stop, restart-reuse, archive/unarchive, draft PR + deployment tracking
- Design flows: create (status closed, numId continues shared counter), start sandbox (Daytona workflow path + Vercel direct path), generation with persona + numDesigns=2, variations render, selectVariation + refine turn, queue mid-run then cancel (queued starts), stop, archive (sandbox archived — new)
- Drafts: design chat draft survives reload; DraftCard labels "Design" + routes `/designs/{numId}`
- Cross-kind: sidebars/badge/Spotlight separation with one active session of each kind; `/designs/{codingNumId}` → Not found
- Watchdog/auto-stop: dashboard-trigger `internal.sandboxAutoStop.run` with both kinds active; invoke `handleStaleSession` against a design session
- Analytics totals exclude design rows

## Final step

Run `/ship` skill.

## Unresolved questions

None — items 1-4 from design review resolved in Decisions §5. Veto there if any convention call is wrong.

---

# Phase 2 (follow-up — attached for later, DO NOT build now): promote variant to coding session

User-confirmed design (2026-07-11). Prereq: merge above landed. The self-referencing link is only possible because both kinds share one table.

- **Schema**: `sessionFields` += `sourceSessionId: v.optional(v.id("sessions"))` + `sourceVariationIndex: v.optional(v.number())` — child (coding) points at parent (design), so one design session can spawn multiple promotions. Purely additive, no migration.
- **Backend**: `api.sessions.promoteDesignVariant({ sessionId, variationIndex, instructions? })` — guard `kind === "design"` + variant exists; create coding session via normal create flow (auto-start), title `"{design title} — {variant label}"`, stamp source link; **auto-run first turn** (user-confirmed): seed prompt = design branch name (eva/design-\* is pushed — new sandbox `git fetch`es and reads it) + chosen variant `route`/`filePath` + persona name/prompt from the generating message + design-chat summary + optional `instructions`. **Handoff = reference, fresh impl** (user-confirmed): coding session branches from main as normal; agent reads the variant as reference and reimplements cleanly — design branch stays throwaway, no multi-variant scaffolding leaks into the PR.
- **UI**: "Build this variant" action on the active tab in `DesignPreviewPanel` → navigate to new session. Design session stays open; show "Promoted → session #{numId}" (query children via `sourceSessionId`); coding session header shows "From design #{numId}". `selectedVariationIndex` remains the decision record.
- **Open until built**: exact seed-prompt wording; whether promote also sets `selectedVariationIndex`; where the children list renders in the design UI.
