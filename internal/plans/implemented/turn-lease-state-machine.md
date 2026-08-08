# Turn lease + state machine: one source of truth for "is a turn running?"

## Problem

A chat turn's truth is currently smeared across four actors that can disagree:

1. **Convex entity fields** — `activeWorkflowId` / `activeChatWorkflowId`, `pendingTurn`, `syntheticTurnMessageId`, the empty placeholder message.
2. **The workflow component** — can die silently (step retries exhausted, no `onComplete`), leaving (1) pointing at a corpse.
3. **Sandbox filesystem markers** — `/tmp/run-design.pid` (clobbered by every losing launch), the per-entity flock, ready/done/fp files.
4. **The runner process** — can outlive its turn (zombie holding the flock, session 53) or die without firing its completion mutation (OOM).

Cleanup is **edge-triggered**: it happens only if a specific mutation fires. Miss an edge and nothing converges — the UI lies ("Working…") until a watchdog guesses right. The watchdogs themselves infer liveness from proxies (`streamingActivity.lastUpdatedAt`, pid-exists), so a zombie process *resets the staleness clock of the watchdog sent to kill it* (probe → pid alive → `internalTouch` → not stale → extend sandbox deadline → repeat). Incident history — zombie runner (session 53), OOM'd callback, pidfile clobbering, VM stopped mid-turn, silent workflow deaths, "prewarm killed daemon mid-turn" — is one bug class in five costumes, and each fix so far added another ad-hoc reconciler (per-surface watchdog chains, cron status sweep, `pendingTurnRecovery`, daemon leases).

## Design

Replace inference with **ownership**: one `turns` table holds the state machine, and the only thing that means "a turn is running" is **an unexpired lease on an open turn row**. Everything can crash; lease expiry is the level-triggered truth a single reconciler converges on.

### Invariants (the contract tests pin these)

- I1: UI "Working…" ⟺ an open turn row exists for the entity. No other signal.
- I2: A lease is renewed **only** by an actor presenting the current `turnId`. Stale actors (zombie runner, orphaned workflow) cannot renew — renewal responds `terminal`, and the callback hard-exits on it.
- I3: Every open turn reaches a terminal state within `lease grace + reconciler tick` of its owner dying. No path depends on a process exiting cleanly.
- I4: A lease can never be renewed past `turnStartedAt + RUN_TIMEOUT_MS` (2 h). This subsumes the `handleStaleX` backstops.
- I5: Filesystem markers are written only by the process that owns the fact, scoped by entity (and turn where relevant); a marker from a previous turn can never be mistaken for the current one.

### Schema

```ts
turns: defineTable({
  surface: v.union(v.literal("session"), v.literal("taskChat"), v.literal("projectChat")),
  entityId: v.string(),            // String(entity._id) — matches adapter.streamingEntityId basis
  state: v.union(
    v.literal("staged"),           // startExecute wrote it; workflow not confirmed yet
    v.literal("launching"),        // sandbox resume/thaw/launch steps in progress
    v.literal("running"),          // callback claimed the turn (first heartbeat with turnId)
    v.literal("finalizing"),       // completion received; post-turn steps (push, save)
    v.literal("done"), v.literal("error"), v.literal("cancelled"),
  ),
  open: v.boolean(),               // denormalized: state not in {done,error,cancelled}
  leaseExpiresAt: v.number(),
  turnStartedAt: v.number(),
  finishedAt: v.optional(v.number()),
  error: v.optional(v.string()),
  workflowId: v.optional(v.string()),
  placeholderMessageId: v.optional(v.id("messages")),
  model: v.string(),
  sandboxId: v.optional(v.string()),
  cancelRequestedAt: v.optional(v.number()),
})
  .index("by_entity_open", ["surface", "entityId", "open"])
  .index("by_open_lease", ["open", "leaseExpiresAt"]),
```

One open turn per entity, enforced in the staging mutation (mutation atomicity makes the check race-free — same guarantee `activeWorkflowId` relies on today).

### Lease protocol

| Actor | When it renews | Grant |
|---|---|---|
| `startExecute` (staging) | creates row `staged` | startup grace (15 min = `STALE_NO_SANDBOX_THRESHOLD_MS`) |
| Workflow durable steps (thaw poll, prepare, launch) | each step completion → `launching` | startup grace, re-granted per step |
| Callback heartbeat (existing ~10–15 s streaming POST, now carrying `TURN_ID`) | every flush → `running` | phase-aware: reuse `staleTurnDecision` thresholds (idle 5 min, tool 25 min, finishing 10 min) as the lease duration for the reported phase |
| Completion mutation (`handleCompletion`) | → `finalizing` | 10 min (`STALE_FINISHING_THRESHOLD_MS`) for push/save steps |
| `saveResult` / cancel / reconciler | → terminal, `open: false` | — |

Renewal handler additionally:
- **rejects** if the presented `turnId` is not the entity's open turn → responds `{ status: "terminal" }`; the callback exits immediately (kills the zombie class even if a future exit-path bug reappears);
- **extends the sandbox deadline** (`extendSandboxDeadline`, lease duration × 2) — replacing the watchdog-chain extension, so a dead turn stops keeping its VM alive as a side effect;
- caps at `turnStartedAt + RUN_TIMEOUT_MS` (I4).

### Reconciler

One cron, every 60 s: `turns` where `open && leaseExpiresAt < now` → finalize via the existing `ChatSurfaceAdapter` (`_chat/surfaceAdapters.ts`), reusing `finalizeStaleChatTurn` semantics: cancel workflow, salvage the bubble (streamed text survives, empty bubble deleted), post the surface's alert, interrupt any live process, release entity fields, drain the queue. One optional pre-kill probe distinguishes the alert text (`sandboxStopped` vs `stalled`) — **it never renews the lease** (the session-53 hole).

### Derived UI state

`isWorking` = `useQuery(api.turns.getOpen, { surface, entityId }) !== null`. `streamingActivity` stays for **display only** (activity JSON, streamed content); its `lastUpdatedAt` stops meaning anything. `touch` / probe-touch are deleted.

### Crash-only filesystem markers (folds in chip "Fix interrupt using clobbered run-design.pid")

- The **callback itself** writes `/tmp/eva-runner.<entityIdField>-<entityId>.pid` on boot (it knows `ENTITY_ID_FIELD`/`ENTITY_ID`); the launcher stops writing the shared `/tmp/run-design.pid` guess. Interrupt (`helpers.ts` kill snippet), `lifecycle.ts`, and `waitForRunnerReady` read the entity-scoped file, keeping the "only kill `node … /tmp/run-design.mjs`" safety check.
- Ready/done files carry `turnId` in their payload; `waitForRunnerReady` accepts a ready file only for its own turn.

## What gets deleted

- Per-surface heartbeat chains: `checkStale{Session,AgentTaskChat,ProjectChat}Heartbeat`, `probeStale*Liveness`, `runStaleChatHeartbeatCheck` scheduling loop.
- `handleStale{Session,AgentTaskChat,ProjectChat}` 2-hour backstops (I4 subsumes).
- `streaming.touch` / `internalTouch` liveness semantics; probe-touch.
- Watchdog-chain sandbox-deadline extension (moves to renewal).
- Eventually: `activeWorkflowId`-as-turn-gate on chat surfaces (`workflowId` lives on the turn row; entity field kept temporarily as a mirror for untouched call sites).

`pendingTurn` (Claude daemon-pull) and the flock stay — they solve dispatch, not liveness.

## Migration order (each step ships independently)

- **Phase 0 — done** (`70fbc3ec`): runner hard-exits after completion; session workflow catches launch failures into `saveResult`.
- **Phase 1 — shadow**: add `turns` table; dual-write from the three surfaces' staging/completion/cancel paths; callback sends `TURN_ID`; renewal handler live (including terminal-response exit); reconciler runs **log-only** alongside the existing watchdogs. Compare verdicts in logs for ~1 week of prod traffic.
- **Phase 2 — flip**: UI derives "Working…" from turn rows; reconciler enforces; delete the watchdog chains, probes, backstops, and touch semantics. Contract tests replace `sessionStallWatchdogContract` equivalents.
- **Phase 3 — markers**: callback-owned entity pidfile; turn-scoped ready/done; interrupt/lifecycle/waitForRunnerReady rewritten. Dismiss chip task_b15e0028 (superseded).
- **Phase 4 — later**: extend `surface` to one-shot job workflows (task runs, automations, doc/eval workflows — the other 12 `launchOnExistingSandbox` call sites) so they stop needing bespoke watchdogs.
- Final step of each phase: `/ship`.

## Testing

- Pure unit tests: lease-duration policy (reuses `staleTurnDecision`), renewal rejection, RUN_TIMEOUT cap.
- Contract tests (pattern of `tests/sessionStallWatchdogContract.test.ts`): I1–I5; a fourth surface cannot exist without a turns integration (extends `chatSurfaceUnificationContract`).
- Chaos check (dev sandbox script): kill the runner at random phases (staged/launching/running/finalizing), assert the turn is terminal with a visible alert within 3 min. This is the "never fails again" guarantee: bounded time-to-truth, not zero bugs.

## Unresolved questions (grill these)

1. **Renewal transport**: piggyback on the existing streaming HTTP action (adds `turnId` + a response body the callback must read) vs a separate lightweight endpoint. Recommend piggyback — one round-trip, one HMAC.
2. **Shadow-mode length**: one week of prod comparison before Phase 2, or gate on N agreeing verdicts?
3. **Merge `streamingActivity` display fields into `turns`** (removes a table and the clear-race class) — now or after Phase 2? Recommend after; keeps Phase 1 reviewable.
4. **Scope of Phase 4**: task *runs* (`agentRuns` + `_taskWorkflow/watchdog.ts`) share the disease but have run-record semantics (retries, exitReason). Fold into `turns` or give runs their own lease on `agentRuns`? Recommend own lease, shared renewal handler.
5. **Cancel unification**: today Claude cancels via `cancelRequestedAt` drain and one-shots via process kill. Move cancel to a turn-row transition the daemon/callback observes, or keep per-provider interrupt in the adapter? Recommend keep adapter interrupt for Phase 1–3, revisit in Phase 4.
