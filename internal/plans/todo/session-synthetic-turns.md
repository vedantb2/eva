# Session synthetic turns — consume the whole SDK stream, background subagents report back

## Context / incident

Session 43 (carepulse-ts): Claude spawned an async background subagent ("Find Care Package Finder data model"), replied "will report back shortly", and the SDK emitted `result`. Eva's daemon finalised the turn (`saveResult`: `finishedAt` stamped, `activeWorkflowId` cleared) and went back to blocking in `waitForNextTurn()`. Nothing consumes the SDK stream between turns, and a background subagent's completion has no path to start a new turn — the "report back" can never happen. The UI correctly showed a finished reply; the work was silently orphaned.

[synara](https://github.com/Emanuele-web04/synara) and [t3code](https://github.com/pingdotgg/t3code) (same adapter lineage; synara is the more advanced superset) solve this identically. We adopt the synara model; where synara and t3code differ, synara wins.

1. **Session-lifetime stream pump** — the SDK message consumer never stops on `result`; `result` only closes the _turn object_.
2. **Synthetic turns** — any assistant/subagent output arriving with no live turn auto-mints a new turn (`ensureSyntheticTurn`), rendered exactly like a normal turn (no badge, no special styling).
3. **Everything consumed** — every SDK message type/subtype maps to state + UI: task lifecycle → background-task chip (not timeline rows), hooks/compaction/files/reroutes → activity notices, tool progress/summary → step updates.
4. Background Task/Agent spawns stay **allowed** (no `run_in_background` strip); their completion settles the child turn and the parent continuation arrives as a synthetic turn.

Eva map (agent-researched, line refs current as of 22 Jul 2026):

- Daemon: `packages/backend/callback-src/providers/claudeSdkDaemon.ts` (turn loop 890–1016, promptStream 178–214, finalizeTurn 280–345, watchdog 140–162, `IDLE_EXIT_MS` 45 min, poll 50 ms)
- Convex: `packages/backend/convex/_sessions/workflow.ts` (`sessionExecuteWorkflow` 187–495, `saveResult` 741–834, `claimPendingTurn` 845–898, `handleCompletion` 1046–1101), `_sessions/execution.ts` (`startExecute` 23–170), `_queues/helpers.ts` (`startNextQueuedSessionMessage`), `workflowWatchdog.ts`
- Parse: `callback-src/parse/canonical.ts`, `parse/toolSteps.ts`, `providers/claude.ts` (parentToolUseId plumb-through 224–275), `runtime/pendingQuestion.ts` (`buildCanUseTool` 86–124 — **currently coerces Agent/Task `run_in_background:false`**)
- UI: `apps/web/src/lib/components/chat/ChatBody.tsx` (`isStreamingPlaceholder = assistant && !content && finishedAt===undefined`), `ChatMessage.tsx`, `StreamingActivityDisplay.tsx`, `packages/ui/src/ai-elements/activity-tasks-utils.ts` (`buildActivityRows` — parentToolUseId nesting + orphan fallback already exists)

## Synara mechanics we are replicating (reference)

- Pump: `Stream.fromAsyncIterable(query).takeWhile(!stopped).runForEach(handleSdkMessage)` — stop condition is session death, never `result` (ClaudeAdapter.ts:3888).
- `ensureSyntheticTurn` (2917–2961): if no `turnState`, mint turnId, session→running, emit `turn.started` with empty payload. Called at top of `handleAssistantMessage` and on every subagent-routed message.
- `completeTurn` on `result` (3129): flush in-flight tools as completed, close text blocks, emit `turn.completed`, `turnState = undefined`, session→ready.
- `sendTurn` auto-closes a stale live turn ("completed") before minting a real one — a leftover synthetic turn dies on the user's next message.
- Subagent routing: only `parent_tool_use_id`s **recognised as Task/Agent tool calls** route to child contexts (async Bash progress also carries the field and must stay on the main timeline). Zombie messages for settled subagents (`settledSubagentToolUseIds`) are dropped.
- `task_notification` → settles the subagent run + completes the child turn; parent sees a `task.completed` event only. Task events are **not** timeline rows — they drive an active-count chip.
- `background_tasks_changed` → diff vs known ids; only _newly backgrounded_ tasks get a one-line notice.
- Synthetic turns are indistinguishable in the UI — no synthetic flag exists in wire events at all.

## Deliberate deviations from synara (architectural, agreed)

Full 1:1 parity is not possible — synara is a local Effect server with a thread-list UI; eva is Convex docs + a message transcript. These are the knowing divergences; everything else follows synara:

1. **Subagent child threads**: synara's ingestion spawns a separate `OrchestrationThread` per subagent (`ensureSubagentThread`) shown in a thread list. Eva has no thread-list surface; subagent steps stay **nested inside the parent activity log** (`buildActivityRows` via `parentToolUseId`), which eva already renders. Same information, different surface.
2. **Task list panel**: synara renders TodoWrite state in a dedicated panel (`deriveActiveTaskListState`). Eva keeps its inline `todos` step (`TodoChecklist`) in the activity log.
3. **Subagent steering** (`steerSubagent` / `turn.steered` via PreToolUse-hook injection): out of scope — eva has no steer-subagent UI. Revisit if parallel-agents UX lands (see synara-adoption plan).
4. **`turn.diff.updated` placeholder checkpoint flow, realtime audio events, approval `request.*` events**: N/A to eva (eva has its own diffs/PR flow; no voice; `canUseTool` handles permissions in-process).
5. **Wire protocol**: synara's 49-type `ProviderRuntimeEvent` bus does not get ported; eva's equivalents are Convex doc writes (messages/steps/streamingActivity/session fields). The mapping table below is the equivalence contract.

## Scope across entity kinds

The daemon is currently sessions-only (`CLAUDE_ATTEMPT_MODE==="sdk-daemon" && PROVIDER==="claude" && ENTITY_ID_FIELD==="sessionId"`, callbackScript.generated.ts:4951). Task sandbox chat (`agentTaskChatWorkflow.ts:329`, `entityIdField:"taskId"`) and project chat (`projectChatWorkflow.ts:314`, `entityIdField:"projectId"`) launch a **one-shot process per turn** that exits after `result` — a background subagent there is killed at process exit, not merely unconsumed. Applying this plan to those views therefore requires migrating them onto the daemon first (tranche C). That migration also gives them the warm-turn latency win sessions already have.

| Surface                                                                                                                 | Turn runtime today | This plan                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessions chat                                                                                                           | warm daemon        | Tranches A + B                                                                                                                                                                                                                                       |
| Task sandbox chat (quick tasks)                                                                                         | one-shot per turn  | Tranche C (daemon migration + synthetic turns + chip)                                                                                                                                                                                                |
| Project chat                                                                                                            | one-shot per turn  | Tranche C                                                                                                                                                                                                                                            |
| Task **main run** (PR-producing), automations, audits, docs/interviews, evaluations, recaps, summarize, design sessions | one-shot           | **Deliberately excluded** — these need deterministic completion (result → summary/PR push/exit); a background agent outliving `result` breaks their contract. `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` + the foreground coercion stay in force there |

Shared UI makes tranche C cheap on the frontend: `messages.parentId` already unions sessions/projects/agentTasks/designSessions, and `ChatMessage`/`ChatBody`/`StreamingActivityDisplay`/`ActivityTasks` are shared across all three chat surfaces — synthetic bubbles and nested subagent steps render with zero per-surface work.

## Non-goals (explicit)

- **No billing/metering changes**: synthetic turns create no `agentRuns` rows, no new metering path. Sessions never created `agentRuns`; unchanged.
- **No `turnKind` classification for synthetic turns**: they are model-initiated continuations, always full-agent context; the Haiku conversational runner is untouched (no tools → cannot spawn agents).
- **No UI reads of `isSyntheticTurn`**: the flag is plumbing for Convex-side placeholder guards only. Bubbles render identically to normal turns (synara behaviour).
- **One-shot providers (Cursor/Codex/Opencode) unchanged**: they exit on completion; there is no stream to pump.
- **One-shot Claude workflows unchanged** (task main runs, automations, audits, doc flows, design sessions): backgrounding stays disabled; see scope table.
- **Blocking questions stay sessions-only for now**: `BLOCKING_QUESTIONS_ENABLED` is gated on `ENTITY_ID_FIELD==="sessionId"`; tasks/projects keep fire-and-forget `pendingQuestion`. Extending blocking questions is orthogonal — not part of tranche C.
- **Bash background-shell panel stays sessions-only**: `canFlushBackgroundShells` / `backgroundProcesses` are keyed to sessions; unrelated to Agent/Task backgrounding.
- **`MODE_TOOLS` vs `canUseTool` reconciliation**: known ambiguity (Agent/Task/TodoWrite/WebSearch run despite not being in `allowedTools`); separate spike, not gated on this plan.

## Design

### Turn model (daemon)

Two turn kinds in daemon state (`S.turn`):

- `real` — claimed via `claimPendingTurn`; workflow-backed (activeWorkflowId + awaitEvent + `handleCompletion`). Unchanged externally.
- `synthetic` — daemon-minted when a main-context SDK message arrives with no live turn (background subagent continuation, post-result stragglers). No workflow. Backed by its own placeholder message row.

Message pump replaces the `for await` turn loop: one consumer task per daemon lifetime (same shape as `createWarmConversationalRunner`'s pump: pending queue + `waitMessage()`), every message routed through a single `handleDaemonMessage(message)`. Turn transitions are state changes, not loop structure. This inherently fixes the "post-result messages get misattributed to the next turn" bug.

### Synthetic turn lifecycle

1. Main-context message arrives, `S.turn === null`, message is not claim-driven → `ensureSyntheticTurn()`:
   - call new mutation `sessionWorkflow:openSyntheticTurn` → inserts assistant placeholder `{content:"", activityLog:"", finishedAt: undefined, isSyntheticTurn: true}`, patches `session.syntheticTurnMessageId` + `updatedAt`, returns `messageId`. Daemon buffers pump messages while the mutation is in flight (pending queue does this naturally).
   - reset per-turn accumulators (same as `resetTurnState`), `S.turn = {kind:"synthetic", messageId}`, arm turn watchdog.
2. Stream events flow exactly as today: rawOutput → `flushStreaming` → `parseStreamEvent` → `accumulatedSteps` → streamingActivity heartbeat. `ChatBody`'s `isStreamingPlaceholder` picks it up with **zero UI changes** (placeholder is the latest message).
3. On `result` → `finalizeSyntheticTurn`: synchronous `flushStreaming()` (preserve the finalizeTurn drain-race fix, claudeSdkDaemon.ts:285–292), mark steps complete, call new mutation `sessionWorkflow:completeSyntheticTurn { messageId, success, result, error, activityLog, pendingQuestion? }` → patches **by messageId** (never recency), clears `session.syntheticTurnMessageId`, clears streamingActivity, then `startNextQueuedSessionMessage` (a queued user message may have been waiting). Daemon: `resetTurnState()`, `S.turn = null`.
4. **Claim during a live synthetic turn** (explicit rule; see risk R3): the claim watcher is its own 50 ms loop, always live — never "when the pump idles". On claim while `S.turn.kind === "synthetic"`: park the claimed prompt (`S.pendingRealTurn`), do **not** force-close the synthetic turn mid-stream (splits attribution; the SDK will finish the current model turn with its own `result` regardless). When that `result` lands → finalize synthetic → immediately push the parked prompt. Starvation is bounded: the synthetic-turn watchdog (5 min no-message / 90 min cap) force-finalises a stalled synthetic turn and releases the parked prompt. Meanwhile the user's real placeholder (inserted by `startExecute`) shows its normal startup step; typical wait is seconds.
5. User sends a message with **no** turn live: unchanged (`startExecute` → claim → real turn). Queue path unchanged.

Why patch-by-messageId: `saveResult`'s `recent.find(latest non-alert assistant)` recency lookup is a known fragility. Synthetic completions never use recency. Real-turn `saveResult` + `addAssistantPlaceholder` idempotency checks get one extra exclusion: skip open synthetic placeholders (`isSyntheticTurn === true`).

### Mid-synthetic `AskUserQuestion` (risk R6)

The blocking-question flow is entity-scoped, not workflow-scoped (`pendingQuestions` keyed by entityId+toolUseId; daemon polls `pollForAnswer` every 300 ms, no timeout; UI reads `blockingQuestions` off the open placeholder). It must work identically when `S.turn.kind === "synthetic"` with no `activeWorkflowId`:

- Turn watchdog already skips while `S.awaitingQuestionAnswer` — synthetic turns reuse the same watchdog, so no false stall-kill.
- The synthetic placeholder is the latest message → `ChatBody` surfaces the question card unchanged.
- `completeSyntheticTurn` accepts `pendingQuestion` for the fire-and-forget variant (parity with `saveResult`).
- Explicit verification step in tranche A.

### Full SDK-message consumption table (daemon `handleDaemonMessage`)

Synara-equivalent mapping. "Step" = `ProgressStep` appended via canonical events → activityLog/streamingActivity.

| SDK message                                                                         | Eva action                                                                                                                                                                                                               | Tranche                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `assistant` (main)                                                                  | ensure turn (synthetic if none) → existing parse (text/tool_use steps). Unchanged inside real turns                                                                                                                      | A                                                  |
| `assistant`/`user`/`stream_event` with **recognised** subagent `parent_tool_use_id` | ensure turn; steps carry `parentToolUseId` (existing nesting via `buildActivityRows`). Add recognised-id gate: only ids from `Agent`/`Task` tool_use blocks (track set in state); async-Bash progress ids stay top-level | A (gate), steps already work                       |
| messages for **settled** subagents                                                  | drop (zombie tail), mirror `settledSubagentToolUseIds` set                                                                                                                                                               | A                                                  |
| `user` (tool_result)                                                                | existing step completion; plus: detect Task/Agent async-launch results → register background agent (chip)                                                                                                                | A (detect) / B (chip)                              |
| `result`                                                                            | real turn → `finalizeTurn` (unchanged); synthetic → `finalizeSyntheticTurn`; no turn → ignore + log                                                                                                                      | A                                                  |
| `system:task_started`                                                               | register/patch `backgroundAgents` entry `{toolUseId, taskId, description, status:"running", backgrounded}` — **write on start only**                                                                                     | A (minimal: track in daemon state) / B (doc write) |
| `system:task_updated`                                                               | terminal (`completed/failed/killed`) → settle: mark settled set, complete the `subtask` step, patch entry `settledAt`. Non-terminal → daemon state only, **no doc write**                                                | A (settle) / B (doc write)                         |
| `system:task_notification`                                                          | settle entry + complete `subtask` step with outcome; the continuation then arrives as assistant messages → synthetic turn                                                                                                | A                                                  |
| `system:task_progress`                                                              | **no doc write** (OCC risk R2): update daemon-local state only; optional detail patch onto the live `subtask` step via the existing 150 ms streaming flush (piggybacks streamingActivity, never the session doc)         | B                                                  |
| `system:background_tasks_changed`                                                   | diff vs known ids; newly backgrounded → step `{type:"notice", label:"Agent moved to background", detail:description}` + entry `backgrounded:true`                                                                        | B                                                  |
| `system:status` (`compacting`)                                                      | step `{type:"status", label:"Compacting context..."}`, auto-complete on next message                                                                                                                                     | B                                                  |
| `system:compact_boundary`                                                           | step `{type:"notice", label:"Context compacted"}`                                                                                                                                                                        | B                                                  |
| `system:hook_started/progress/response`                                             | step `{type:"hook", label:hookName}` → complete on response; progress appends detail                                                                                                                                     | B                                                  |
| `system:files_persisted`                                                            | step `{type:"notice", label:"Files persisted", detail:names}`                                                                                                                                                            | B                                                  |
| `system:init`                                                                       | existing (`claudeInitAt`); no step                                                                                                                                                                                       | —                                                  |
| `system:thinking_tokens`                                                            | drop                                                                                                                                                                                                                     | A                                                  |
| model reroute / refusal fallback (system)                                           | step `{type:"notice", label:"Model rerouted", detail:reason}`                                                                                                                                                            | B                                                  |
| `tool_progress`                                                                     | patch active step's `detail` (elapsed/progress text)                                                                                                                                                                     | B                                                  |
| `tool_use_summary`                                                                  | patch matching step's `label/detail` with summary                                                                                                                                                                        | B                                                  |
| `auth_status`, `rate_limit_event`                                                   | log only (synara: no timeline row)                                                                                                                                                                                       | B                                                  |
| unknown type/subtype                                                                | log `unhandled sdk kind` once per kind                                                                                                                                                                                   | A                                                  |

New step type strings (`notice`, `hook`, `status`) need icon/label handling in `packages/ui/src/ai-elements/activity-tasks.tsx` (default fallback already renders unknown types generically — verify, else add).

### Background agents chip + stop (tranche B; synara UI equivalence)

- `sessions.backgroundAgents: v.optional(v.array(v.object({toolUseId, taskId: v.optional(...), description: v.optional(...), status, backgrounded: v.optional(v.boolean()), startedAt, settledAt: v.optional(...)})))` in `tableFields.ts`. **Write policy (R2): register on start, settle on terminal — never on progress ticks.** Daemon patches via new authMutation `sessionWorkflow:updateBackgroundAgents` (sandbox-token identity, like `claimPendingTurn`).
- UI: count chip in session composer/header area: "N background agents" while any entry unsettled; popover lists description + status + stop button. Rendered from the live session doc — no new query. Chip reads `backgroundAgents`, never `isSyntheticTurn`.
- Stop path: `sessions:requestStopBackgroundAgent { sessionId, toolUseId }` pushes onto `sessions.pendingTaskStops: v.optional(v.array(v.string()))`; `claimPendingTurn` (already polled every 50 ms) returns + clears them alongside the empty/real claim; daemon calls `query.stopTask(taskId)` (queue until taskId known, mirroring synara's `pendingSubagentStops`).

### Lifetime / watchdogs / hygiene

- **Allow backgrounding** (tranche A — this is the incident trigger): make the Agent/Task `run_in_background:false` coercion in `buildCanUseTool` (`pendingQuestion.ts:86–124`) **conditional on daemon mode** (`CLAUDE_ATTEMPT_MODE==="sdk-daemon"`), not on entity kind — one-shot paths keep the coercion, and tranche C inherits the un-strip for free when tasks/projects move onto the daemon. `launch.ts` keeps `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` as the base default; `claudeSdk.ts` deletes it only where the daemon runs.
- **Idle exit**: daemon must not exit after `IDLE_EXIT_MS` while background agents are unsettled or a synthetic turn is open — extend the idle check. Hard cap stays (`MAX_TOTAL_RUNTIME_MS` guards a runaway).
- **Turn watchdog**: reuse `startTurnWatchdog` for synthetic turns; on stall (5 min no message / 90 min cap) call `completeSyntheticTurn` with error text instead of `failTurnAndExit`'s workflow completion, then exit. Skips while awaiting a blocking question (existing behaviour).
- **Crash hygiene** (daemon dies with synthetic turn open): `openSyntheticTurn` schedules `internal.sessionWorkflow.handleStaleSyntheticTurn` via `runAfter(10 min, {messageId})` — if the message is still unfinished and `streamingActivity.lastUpdatedAt` stale >2 min, finalize via `finalizeCancelledAssistantMessage` and clear `session.syntheticTurnMessageId`. Also clear in `cancelExecution`, session stop/close, and prewarm optsmismatch-kill paths (same pattern as `agentBrowsingAt` soft-lock hygiene).
- **Prewarm optsmismatch** (`_daytona/execution.ts:1235–1419`): treat an open synthetic turn like mid-turn — defer respawn.

## Delivery: three tranches

**Tranche A = the incident fix (sessions).** Ships alone, reviewable alone: pump decoupling + synthetic turns + minimal task settlement (enough that a background agent's completion actually produces the report-back bubble) + un-strip `run_in_background` (daemon-gated) + hygiene. Success = session-43 scenario replays correctly.

**Tranche B = full taxonomy + chip + stop (sessions).** Separate PR(s) on top: remaining system subtypes → notice/hook/status steps, `tool_progress`/`tool_use_summary` patches, `backgroundAgents` doc surface, chip UI, stop path.

**Tranche C = generalize to task sandbox chat + project chat.** Migrate both surfaces from one-shot-per-turn onto the warm daemon, then synthetic turns + chip apply mechanically. Depends on A (and B for the chip).

### Tranche A phases

1. **Pump decoupling (no behaviour change)** — `claudeSdkDaemon.ts`: extract agent-query pump (pending queue + `waitMessage`), rewrite turn loop as `S.turn` state + `handleDaemonMessage`. Claim watcher becomes its own always-live 50 ms loop. Real-turn flow byte-identical. Post-result main-context messages: buffered + logged (consumed in phase 3).
2. **Convex plumbing** — schema: `messageFields.isSyntheticTurn`, `sessionFields.syntheticTurnMessageId`. Mutations: `openSyntheticTurn` / `completeSyntheticTurn` (patch by id; clear streaming; `startNextQueuedSessionMessage`) / `handleStaleSyntheticTurn`. Recency-guard exclusions in `saveResult` / `addAssistantPlaceholder` / `restageOpenTurn` / `ensurePendingTurn`. Hygiene wiring in `cancelExecution`, stop/close, `handleStaleSession`. `npx convex codegen --typecheck enable`.
3. **Synthetic turns live** — `ensureSyntheticTurn` on main-context messages when `S.turn === null`; `finalizeSyntheticTurn` on result; parked-claim rule (design §4); settled-set zombie drop + recognised-subagent gate; minimal task settlement (`task_updated` terminal + `task_notification` → settle + complete subtask step); un-strip `run_in_background`; idle-exit + watchdog + optsmismatch guards.
4. **Verify** — `npx tsc` backend/web; convex codegen; dev-session replay: background-agent prompt → main reply lands → agent completes → **synthetic bubble streams in** → send user message mid-continuation and confirm parked-claim ordering → AskUserQuestion inside a synthetic turn round-trips → kill daemon mid-synthetic-turn → stale handler finalises within ~12 min. Fix stale `claimPendingTurn` doc comment (~200ms → 50ms) while there.

### Tranche B phases

5. **Taxonomy completion** — remaining table rows (B column): canonical events for status/compact/hook/files/reroute; `tool_progress`/`tool_use_summary` step patches; `background_tasks_changed` notice; step icon/label map additions in `activity-tasks.tsx`.
6. **Background agents surface** — `backgroundAgents` + `pendingTaskStops` schema; `updateBackgroundAgents` (start/settle writes only) + `requestStopBackgroundAgent`; `claimPendingTurn` stop-id piggyback; daemon `stopTask` dispatch; chip + popover (route-local `_components/BackgroundAgentsChip.tsx`, ≤250 lines).
7. **Verify + docs** — tsc/codegen; chip lifecycle + stop round-trip; `/changelog`; run `/ship` as the final step of each tranche.

### Tranche C phases — task sandbox chat + project chat

8. **Generalize the daemon contract** — `CLAIM_PENDING_TURN_MUTATION` moves from a hardcoded const (`claudeSdkDaemon.ts:70`) to env (`CLAIM_MUTATION`, passed by `launchScript` like `COMPLETION_MUTATION`); drop the `ENTITY_ID_FIELD==="sessionId"` gate on the daemon entrypoint (gate on `CLAIM_MUTATION` presence instead); daemon files (`/tmp/eva-daemon.*`) get an entity-scoped suffix so a task chat daemon and the session daemon can coexist on one sandbox if ever needed (task/project sandboxes are per-entity today, so this is belt-and-braces).
9. **Convex per-entity plumbing** — mirror the sessions fields onto `agentTaskFields` + `projectFields`: `pendingTurn`, `syntheticTurnMessageId`, `backgroundAgents`, `pendingTaskStops` (follows the existing per-entity duplication convention, cf. the four `sandbox.ts` files). Add to `agentTaskChatWorkflow.ts` + `projectChatWorkflow.ts`: `claimPendingTurn`, `openSyntheticTurn`, `completeSyntheticTurn` (patch-by-messageId), `updateBackgroundAgents`, `requestStopBackgroundAgent`, `handleStaleSyntheticTurn`, plus a `prewarmChatDaemon` mutation fired on task-sandbox-view / project-page open (mirror of `prewarmDaemon`, `_sessions/execution.ts:178–211`). Their `handleCompletion`s already exist; their `saveResult` equivalents (`agentTaskChatWorkflow.ts:532`, `projectChatWorkflow.ts:514`) get the same synthetic-placeholder recency exclusions. Note: a task's chat daemon must respect `activeChatWorkflowId` (tasks host chat concurrently with the main run workflow — the chat daemon claims chat turns only, never the main run).
10. **Switch the two surfaces to daemon-pull** — their send paths stage `pendingTurn` + prewarm instead of `signAndLaunchScript`-per-turn (keep the one-shot path as fallback when `CLAUDE_ATTEMPT_MODE !== "sdk-daemon"`, same env-flag rollback story sessions have). Chip UI mounts on both surfaces (shared component from tranche B).
11. **Verify** — tsc/codegen; replay the session-43 scenario in a task sandbox chat and a project chat; confirm the task main run still runs one-shot with backgrounding disabled; confirm chat daemon + main run coexist on a task without claim cross-talk; `/changelog`; `/ship`.

## Resolved questions

1. `backgroundAgents` on the session doc — **yes**, with start/settle-only writes (progress never touches the doc; OCC risk R2).
2. Notice step on the settled main turn when an agent completes — **no**. Synthetic bubble only (synara behaviour; don't rewrite settled history).
3. `MODE_TOOLS` reconciliation — **leave as-is**; separate spike (non-goal).
4. Conversational Haiku runner — **out** (no tools → no spawns).
5. Cursor/Codex/Opencode — **out** (one-shot, no stream).

## Risk register (from review)

- **R1 scope**: tranche split above; A is the incident fix, B is the product surface. Don't bundle.
- **R2 OCC contention**: no session-doc writes on `task_progress`; start/settle only; progress detail rides the existing streamingActivity flush.
- **R3 claim starvation**: claim watcher always live; parked-prompt rule with watchdog-bounded worst case (design §4) — never "wait for pump idle".
- **R4 flag creep**: `isSyntheticTurn` is Convex-guard plumbing; no UI reads it.
- **R5 billing/turnKind**: explicit non-goals; synthetic turns create no `agentRuns`, no metering, no turnKind.
- **R6 blocking questions mid-synthetic**: entity-scoped flow works without a workflow; watchdog skip verified; explicit test in phase 4.

## Tranche A implementation status (2026-07-22)

### Phase 1 — Pump decoupling

- [x] `createWarmAgentRunner` (queue + `waitMessage` + `drainPending`)
- [x] Agent loop consumes via `waitMessage` until `result` (not `for await` on turn boundary)
- [x] Post-result `drainAndLogBufferedMessages` before next claim
- [x] `processDaemonMessage` → `handleDaemonMessage`

### Phase 2 — Convex plumbing

- [x] `messageFields.isSyntheticTurn`, `sessionFields.syntheticTurnMessageId`
- [x] `openSyntheticTurn` / `completeSyntheticTurn` / `handleStaleSyntheticTurn`
- [x] Recency guards in `saveResult`, `addAssistantPlaceholder`, `ensurePendingTurn`, `restageOpenTurn`
- [x] Hygiene: `cancelExecution`, `stopSandbox`, `handleStaleSession`, `clearStuckWorkingState`
- [x] `claimPendingTurn` doc comment 200ms → 50ms

### Phase 3 — Synthetic turns live

- [x] `DaemonTurn` state (`real` | `synthetic`) + always-live 50ms claim watcher
- [x] `ensureSyntheticTurn` / `finalizeSyntheticTurn` on main-context messages with no live turn
- [x] Parked-claim rule (synthetic mid-stream → park user claim → push after synthetic `result`)
- [x] Recognised-subagent gate + settled-set zombie drop
- [x] Minimal task settlement (`task_started` / terminal `task_updated` / `task_notification`) — daemon-local `unsettledBackgroundAgents`
- [x] `run_in_background` un-strip gated to `sdk-daemon` (`pendingQuestion.test.ts`)
- [x] Idle exit blocked while `unsettledBackgroundAgents.size > 0` or synthetic turn open
- [x] Watchdog: synthetic stall → `completeSyntheticTurn` with error (not `failTurnAndExit`)
- [x] Prewarm optsmismatch defers respawn when `syntheticTurnMessageId` set

### Phase 4 — Verify

- [x] `npx convex codegen --typecheck enable`
- [x] `npx tsc -p callback-src` (callback daemon)
- [x] Changelog entry
- [x] Regenerated `callbackScript.generated.ts` (required for sandbox daemons)
- [x] Fix: do not drain agent pump after finalize / before real turn (would orphan continuations)
- [x] Manual replay: session-43 background-agent scenario (session 41 on `vvedantb/eva` / good-mule-506 — interim “I'll follow up” then synthetic bubble with `isSyntheticTurn: true`)
- [ ] Manual: AskUserQuestion inside synthetic turn round-trip
- [ ] Manual: kill daemon mid-synthetic → stale handler (~12 min)

### Tranche B implementation status (2026-07-22)

#### Phase 5 — Taxonomy completion

- [x] `parse/sdkTaxonomy.ts` — notice/hook/status steps, compaction, hooks, files persisted, background_tasks_changed notice, tool_progress/summary patches, model reroute, unknown-kind logging
- [x] `activity-shared.tsx` — notice/hook/status step icons
- [x] `callback-src/tests/sdkTaxonomy.test.ts`
- [x] `build:callback` + `typecheck:callback`

#### Phase 6 — Background agents surface

- [x] `sessionFields.backgroundAgents` + `pendingTaskStops`
- [x] `updateBackgroundAgents` + `requestStopBackgroundAgent`; `claimPendingTurn.stopTaskToolUseIds` drain
- [x] Daemon: start/settle doc writes, `backgrounded` patch, `query.stopTask` dispatch, pending stop queue
- [x] `BackgroundAgentsChip.tsx` mounted in session chat composer region
- [x] `tests/sessionBackgroundAgents.test.ts`
- [x] `npx convex codegen --typecheck enable`

#### Phase 7 — Verify + docs

- [x] Changelog entry
- [ ] Manual: chip lifecycle + stop round-trip
- [ ] `/ship`

### Explicitly deferred (Tranche C)

- [ ] Task sandbox chat + project chat daemon migration
