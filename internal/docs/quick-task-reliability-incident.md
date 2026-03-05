# Quick Task Reliability Incident and Hardening

Date: 2026-03-05
Owner: Platform backend + quick tasks frontend

## Incident Summary

Observed behavior from quick tasks:

- 6 scheduled tasks launched overnight all failed with `Run timed out after 2 hours`.
- Manual reruns did not start all selected tasks; only a subset (about 2 to 3) started.
- Some manually started tasks stayed at `Generating response...` and never completed.

Impact:

- Tasks looked stuck for a long period.
- Throughput dropped because leaked/stuck runs held capacity.
- Manual batch launches gave inconsistent results.

## Root Causes Identified

1. Workflow error paths were not fully fail-fast.

- If execution failed before completion callback was received, runs could remain active until watchdog timeout.
- This created 2-hour delayed failures instead of immediate terminal states.

2. Ephemeral sandbox cleanup was incomplete on stale/timeout paths.

- Quick tasks are isolated, but stale ephemeral sandboxes still consume shared platform capacity.
- Capacity pressure can reduce how many tasks actually start at once.

3. Callback process launch was not validated after nohup start.

- If `/tmp/run-design.mjs` exited immediately, the run appeared to be in progress with no real worker running.
- This surfaced as long `Generating response...` stalls.

4. Callback execution had no max wall-clock limit.

- There was no explicit total runtime cap in the callback script.
- A run could stay alive longer than intended if it still emitted occasional output.

5. Batch start behavior was brittle in frontend flows.

- Batch starts could effectively stop progress when one task failed to start.
- This made manual launch behavior feel like partial or sequential starts.

## Fixes Implemented

### 1) Fail-fast workflow finalization

File: `packages/backend/convex/taskWorkflow.ts`

- Wrapped `taskExecutionWorkflow` with stronger `try/catch/finally` handling.
- On workflow exceptions, runs are finalized/completed immediately (no waiting for 2-hour timeout).
- `activeWorkflowId` is always cleared in `finally`.
- Ephemeral sandbox delete is attempted in failure paths.

Result:

- Failed runs become visible quickly.
- Fewer zombie `in_progress` tasks.

### 2) Stale and timeout watchdog cleanup of quick-task sandboxes

File: `packages/backend/convex/taskWorkflow.ts`

- `checkStaleRuns`: when watchdog kills stale runs (no heartbeat), it now also schedules sandbox process kill and ephemeral sandbox delete for quick tasks.
- `handleStaleRun`: on 2-hour timeout, it now also kills process and deletes quick-task sandbox.

Result:

- Better capacity recovery.
- Lower risk of hidden sandbox leaks causing reduced parallelism.

### 3) Callback launch verification

File: `packages/backend/convex/daytona/launch.ts`

- Launch now checks the background PID from `/tmp/run-design.pid`.
- Uses `kill -0` to verify process is still alive after startup.
- If process dies immediately, returns early and tails logs.

Result:

- Early detection of broken starts instead of silent hangs.

### 4) Max runtime guard in callback script

File: `packages/backend/convex/daytona/callbackScript.ts`

- Added `CLAUDE_MAX_TOTAL_RUNTIME_MS` (default 5,400,000 ms = 90 min).
- Callback kills Claude process when max runtime is exceeded.
- Completion error now reports max-runtime timeout explicitly.

Result:

- Prevents indefinite execution windows.
- Produces clearer failure reason.

### 5) Manual batch starts now continue per task and run in parallel

Files:

- `apps/web/lib/components/quick-tasks/RunTasksModal.tsx`
- `apps/web/lib/components/quick-tasks/QuickTasksKanbanBoard.tsx`
- `apps/web/lib/components/quick-tasks/QuickTasksListView.tsx`

- Switched batch launch to `Promise.all`.
- Each task start has its own `try/catch`; one failure does not stop others.
- UI now reports partial success (`X of Y started`) instead of all-or-nothing behavior.

Result:

- Manual launch behavior matches isolated quick-task semantics better.
- Higher effective launch throughput when a subset fails.

### 6) Auto-retry for quick tasks (except Daytona-network-classified failures)

File: `packages/backend/convex/taskWorkflow.ts`

- Added quick-task auto-retry scheduling for non-success runs in workflow catch path.
- Added Daytona-network classification helper and skips auto-retry for those errors.
- New mutation: `scheduleQuickTaskAutoRetry`.
  - Only quick tasks.
  - Only latest errored run.
  - No retry if another active run exists.
  - Prevents immediate retry chains (`auto_retry_scheduled` window guard).
  - Schedules re-execution via `executeScheduledTask` after delay.

Current settings:

- Retry delay: 20 seconds.
- Retry chain guard window: 30 minutes.

Result:

- Most transient non-network failures get a self-heal attempt automatically.
- Avoids runaway retry loops.

## Why "2-3 at a time" Can Still Happen

Even with isolated per-task sandboxes, global limits still apply:

- Daytona org/workspace capacity limits.
- Snapshot/volume attach bottlenecks.
- Upstream provider/API throttling.
- Remaining leaked resources from older runs before cleanup improvements.

Isolation prevents cross-task state corruption, but does not remove shared infrastructure limits.

## Robustness Gaps Remaining

These fixes reduce failure rate and improve recovery, but cannot guarantee literal zero failures.
Remaining unavoidable classes:

- Daytona control plane/network outages.
- GitHub token/API outages.
- Claude/API provider outages.
- Workspace-level quota exhaustion.

Target should be: fast failure detection, bounded retries, deterministic recovery, and clear operator visibility.

## Recommended Next Pass (for near "never fail" behavior)

1. Add backend batch-start mutation for parity.

- Create a single backend mutation that starts many quick tasks in one transaction-like flow.
- Use for both scheduled and manual paths so behavior is identical.
- Return per-task status list (`started`, `skipped`, `error`).

2. Add explicit concurrency tokens and admission control.

- Track global and per-repo quick-task slots.
- Reserve slot before sandbox setup, release on completion/failure.
- Queue overflow tasks with short jittered re-attempt.

3. Strengthen retry policy matrix.

- Keep no-retry for Daytona network failures (as requested).
- Add bounded retries for setup failures, callback send failures, and transient git errors.
- Store structured retry metadata on run records.

4. Add callback start heartbeat SLA.

- Require first heartbeat from callback within N seconds after launch.
- If missing, fail-fast and reschedule (non-network case).

5. Add reconciler job.

- Periodically scan for mismatches (`task in_progress` but no live workflow/process).
- Auto-heal by completing run with a clear reason and optional retry.

6. Improve observability and alerting.

- Dashboard for watchdog kills, launch verification failures, auto-retry outcomes, and sandbox cleanup failures.
- Alerts for abnormal spikes by repo/time window.

## Operational Tuning Knobs

- `RUN_TIMEOUT_MS` (workflow watchdog total timeout)
- `STALE_THRESHOLD_MS` / `STALE_RECHECK_MS` (heartbeat watchdog)
- `CLAUDE_NO_OUTPUT_TIMEOUT_MS` (stdout silence timeout)
- `CLAUDE_MAX_TOTAL_RUNTIME_MS` (total callback runtime cap)
- `QUICK_TASK_AUTO_RETRY_DELAY_MS`
- `AUTO_RETRY_CHAIN_WINDOW_MS`

## Definition of Done for This Incident

- Failures no longer sit for 2 hours when callback/startup fails early.
- Stale/timeout quick tasks clean up ephemeral sandboxes.
- Manual batch launches continue despite individual task startup failures.
- Quick tasks auto-retry on non-Daytona-network errors with loop protection.
