# Fix: Quick task hanging at "Generating response"

## Context

When `convex dev` reloads while a sandbox completion callback is in-flight, the HTTP POST to Convex fails. The sandbox script exits (no retry), and the workflow's `awaitEvent` hangs forever since the completion event never arrives. The UI shows "Generating response..." indefinitely.

Three fixes: (1) retry the completion callback, (2) per-run watchdog timeout, (3) backfill for already-stuck runs.

---

## Fix 1 — Retry with backoff in `buildCallbackScript`

**File:** `packages/backend/convex/daytona.ts`

Add `callMutationWithRetry` function in the generated script, after `callAction` (line 459):

```js
async function callMutationWithRetry(path, args, maxRetries = 5) {
  let attempt = 0;
  while (true) {
    try {
      return await callMutation(path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      console.error(
        "callMutation attempt " +
          attempt +
          " failed, retrying in " +
          delayMs +
          "ms:",
        String(e),
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
```

Replace `callMutation` → `callMutationWithRetry` at **two** locations:

- **Line 783** (success completion): `await callMutationWithRetry("${completionMutation}", completionArgs);`
- **Line 798** (error completion in outer catch): `await callMutationWithRetry("${completionMutation}", errorArgs);`

Keep `process.exit(1)` after retries exhausted (line 786). Keep existing `catch {}` on error path (line 799).

**Not applied to:** `streaming:set`, `taskProof:*`, `screenshots:*` — all non-critical, already wrapped in `try/catch {}`.

**Scope:** Fixes all 11 workflows that use `buildCallbackScript`.

---

## Fix 2 — Per-run watchdog timeout

### 2a: Add `handleStaleRun` mutation

**File:** `packages/backend/convex/taskWorkflow.ts`

Place after `clearActiveWorkflow` (line 826), before `cancelExecution` (line 828).

Two hang scenarios with different recovery:

- **Main completion lost** — run still `queued`/`running` → mark run as `"error"`, task → `"todo"`
- **Audit completion lost** — run already `"success"`, workflow stuck at `awaitEvent(auditCompleteEvent)` line 247 → task → `"business_review"` (work done, audit skipped)

```ts
const RUN_TIMEOUT_MS = 45 * 60 * 1000;

export const handleStaleRun = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.status !== "in_progress" || !task.activeWorkflowId) return null;

    // Guard: don't kill a newer run if this is a stale timer from an old run
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const latestRun = runs.sort(
      (a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0),
    )[0];
    if (latestRun && latestRun._id !== args.runId) return null;

    try {
      await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
    } catch {}

    const run = await ctx.db.get(args.runId);
    const runStillActive =
      run && (run.status === "queued" || run.status === "running");

    if (runStillActive) {
      await ctx.db.patch(args.runId, {
        status: "error",
        error: "Run timed out after 45 minutes",
        finishedAt: Date.now(),
      });
      await ctx.db.patch(args.taskId, {
        status: "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    } else {
      const taskStatus =
        run && run.status === "success" ? "business_review" : "todo";
      await ctx.db.patch(args.taskId, {
        status: taskStatus,
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    }

    // Mark running audits as error
    const audits = await ctx.db
      .query("taskAudits")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const audit of audits) {
      if (audit.status === "running") {
        await ctx.db.patch(audit._id, {
          status: "error",
          error: "Run timed out",
        });
      }
    }

    // Clear streaming activity for both task and audit
    for (const entityId of [
      String(args.taskId),
      `audit-${String(args.taskId)}`,
    ]) {
      const streaming = await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", entityId))
        .first();
      if (streaming) await ctx.db.delete(streaming._id);
    }

    return null;
  },
});
```

**Note on `as WorkflowId`:** The schema stores `activeWorkflowId` as `v.string()` while the workflow API expects `WorkflowId`. This cast exists in 17 places across the codebase — it's a systemic pattern, not something we can avoid without a schema refactor. We follow the existing convention here.

### 2b: Centralize timeout scheduling in `updateRunToRunning` (line 307)

**File:** `packages/backend/convex/taskWorkflow.ts`

Instead of scheduling the watchdog in each entry point (`triggerExecution`, `executeScheduledTask`, `startTaskForBuild`), schedule it inside `updateRunToRunning` — called as Step 1 of every `taskExecutionWorkflow` run. This way any new entry point is automatically covered.

```ts
export const updateRunToRunning = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, { status: "running" });
    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.taskWorkflow.handleStaleRun,
      {
        taskId: args.taskId,
        runId: args.runId,
      },
    );

    return null;
  },
});
```

No changes needed in `triggerExecution`, `executeScheduledTask`, or `buildWorkflow.startTaskForBuild`.

---

## Fix 3 — Backfill cleanup for already-stuck runs

**File:** `packages/backend/convex/migrations.ts`

One-time migration following existing pattern. Key differences from `handleStaleRun`:

- **Age cutoff**: Only touches runs where `startedAt < Date.now() - RUN_TIMEOUT_MS` (don't cancel legitimately running tasks)
- **Success detection**: `runs.some(r => r.status === "success")` not just the latest run
- **Imports `RUN_TIMEOUT_MS` from `taskWorkflow`** to share the constant (or import from a shared constants file if preferred)

```ts
import { RUN_TIMEOUT_MS } from "./taskWorkflow";

export const cleanupStaleRuns = internalMutation({
  args: {},
  returns: v.object({ tasksFixed: v.number(), runsFixed: v.number() }),
  handler: async (ctx) => {
    let tasksFixed = 0;
    let runsFixed = 0;
    const cutoff = Date.now() - RUN_TIMEOUT_MS;

    const allTasks = await ctx.db.query("agentTasks").collect();
    const stuckTasks = allTasks.filter(
      (t) => t.status === "in_progress" && t.activeWorkflowId,
    );

    for (const task of stuckTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();

      // Partition active runs into stale vs fresh
      const activeRuns = runs.filter(
        (r) => r.status === "queued" || r.status === "running",
      );
      const hasFreshActiveRun = activeRuns.some(
        (r) => (r.startedAt ?? 0) >= cutoff,
      );
      const staleActiveRuns = activeRuns.filter(
        (r) => (r.startedAt ?? 0) < cutoff,
      );

      // Skip if any fresh active run exists (legitimately in progress)
      if (hasFreshActiveRun) continue;

      // Skip if no active runs and no completed runs (shouldn't happen but be safe)
      if (
        activeRuns.length === 0 &&
        !runs.some((r) => r.status === "success" || r.status === "error")
      )
        continue;

      try {
        await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
      } catch {}

      // Mark ALL stale active runs as error
      for (const staleRun of staleActiveRuns) {
        await ctx.db.patch(staleRun._id, {
          status: "error",
          error: "Cleaned up stale run",
          finishedAt: Date.now(),
        });
        runsFixed++;
      }

      const hasSuccessRun = runs.some((r) => r.status === "success");
      await ctx.db.patch(task._id, {
        status: hasSuccessRun ? "business_review" : "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
      tasksFixed++;

      // Mark running audits as error
      const audits = await ctx.db
        .query("taskAudits")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const audit of audits) {
        if (audit.status === "running") {
          await ctx.db.patch(audit._id, {
            status: "error",
            error: "Cleaned up stale audit",
          });
        }
      }

      // Clear streaming for both task and audit
      for (const entityId of [String(task._id), `audit-${String(task._id)}`]) {
        const streaming = await ctx.db
          .query("streamingActivity")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .first();
        if (streaming) await ctx.db.delete(streaming._id);
      }
    }

    return { tasksFixed, runsFixed };
  },
});
```

Run once via Convex dashboard after deploying.

---

## Files modified

| File                                      | Change                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `packages/backend/convex/daytona.ts`      | Add `callMutationWithRetry`, use at 2 completion call sites                   |
| `packages/backend/convex/taskWorkflow.ts` | Add `RUN_TIMEOUT_MS`, `handleStaleRun`; add scheduler to `updateRunToRunning` |
| `packages/backend/convex/migrations.ts`   | Add `cleanupStaleRuns` one-time migration                                     |
| `internal/changelog.md`                   | Add entry                                                                     |

## Verification

1. `npx tsc` in `packages/backend` — no type errors
2. `npx convex dev` — schema/function push succeeds
3. Manual test: run a quick task, verify it completes normally
4. Manual test: kill `convex dev` mid-task, restart — retry should recover the completion callback
5. Run `cleanupStaleRuns` migration via dashboard to fix existing stuck tasks
