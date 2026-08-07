import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { isSupersededTaskRun } from "../functions";
import {
  isPastRunTimeout,
  type LeaseVerdict,
  leaseDurationMs,
  leaseExpiryFor,
  type TurnState,
} from "../_chat/turnLease";
import { getTaskRunStreamingEntityId } from "./helpers";
import { turnPhaseFromActivity } from "./staleness";

/**
 * Task runs lease their liveness exactly like chat turns do (Phase 4 of the
 * turn-lease design), reusing the same policy module so the two can never
 * drift. Runs keep their own row rather than joining `turns` because a run
 * carries record semantics a turn does not — retries, exit reasons, PR state.
 *
 * What changes is where truth lives: the runner asserts "I am alive" by
 * renewing, and a lapsed lease is the whole death signal. Nothing infers
 * liveness from the age of a streaming row or the existence of a pid any more,
 * so a zombie process cannot reset the clock of the check sent to kill it.
 */

/** When the run's clock starts. Falls back to insert time for queued runs. */
function runStartedAt(run: Doc<"agentRuns">): number {
  return run.startedAt ?? run._creationTime;
}

/**
 * Resolves the run behind a heartbeat's streaming entity id. Audit heartbeats
 * carry a different prefix but belong to the same run, so both renew it —
 * audit work is the run being alive.
 */
export function runIdFromStreamingEntityId(
  ctx: QueryCtx,
  entityId: string,
): Id<"agentRuns"> | null {
  for (const prefix of ["task-audit-run-", "task-run-"]) {
    if (!entityId.startsWith(prefix)) continue;
    return ctx.db.normalizeId("agentRuns", entityId.slice(prefix.length));
  }
  return null;
}

/**
 * Grants the startup lease to a run that is about to launch. Startup grace
 * covers sandbox resume, clone and install — the phase with no callback yet to
 * renew on the run's behalf.
 */
export function startupLeaseExpiry(run: Doc<"agentRuns">, now: number): number {
  return leaseExpiryFor({
    state: "launching",
    turnStartedAt: runStartedAt(run),
    now,
  });
}

/**
 * The renewal handler for runs (I2 applied to `agentRuns`). A superseded run —
 * one whose task already started a newer run — is told `terminal`, and the
 * callback exits on that verdict, so the old process stops writing to a
 * sandbox the new run may be using.
 */
export async function renewRunLease(
  ctx: MutationCtx,
  runId: Id<"agentRuns">,
  opts: { currentActivity?: string } = {},
): Promise<LeaseVerdict> {
  const run = await ctx.db.get(runId);
  if (!run) return { status: "terminal", reason: "unknown_turn" };
  if (run.status !== "running") return { status: "terminal", reason: "closed" };

  const now = Date.now();
  // I4: the 2-hour ceiling is enforced by the cap inside `leaseExpiryFor`, so
  // the run's lease is already expired here and the reconciler will converge it
  // on its next tick. No scheduler entry has to survive for that to happen.
  if (isPastRunTimeout(runStartedAt(run), now)) {
    return { status: "terminal", reason: "timeout" };
  }
  if (await isSupersededTaskRun(ctx.db, run.taskId, run._id)) {
    return { status: "terminal", reason: "superseded" };
  }

  const activity =
    opts.currentActivity ??
    (
      await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) =>
          q.eq("entityId", getTaskRunStreamingEntityId(run._id)),
        )
        .first()
    )?.currentActivity;
  // `finalizingAt` marks the run past the agent and into push/PR/save work,
  // which is silent from the streaming side — so it gets the finishing grace
  // rather than the idle one that would kill it mid-push.
  const state: TurnState = run.finalizingAt ? "finalizing" : "running";
  const phase = turnPhaseFromActivity({
    currentActivity: activity,
    turnStartedAt: runStartedAt(run),
    hasSandbox: run.sandboxId !== undefined,
    now,
  });

  const durationMs = leaseDurationMs(state, phase);
  const leaseExpiresAt = leaseExpiryFor({
    state,
    phase,
    turnStartedAt: runStartedAt(run),
    now,
  });
  await ctx.db.patch(run._id, { leaseExpiresAt });

  // Same trade as the chat renewal: the VM's deadline is pushed out by the
  // live owner, never by the watchdog that was sent to check on it.
  if (run.sandboxId && run.repoId) {
    await ctx.scheduler.runAfter(0, internal.sandbox.extendSandboxDeadline, {
      sandboxId: run.sandboxId,
      repoId: run.repoId,
      durationMs: durationMs * 2,
    });
  }

  return { status: "renewed", leaseExpiresAt, durationMs };
}
