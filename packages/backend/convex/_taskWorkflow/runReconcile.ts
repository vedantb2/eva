import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { isPastRunTimeout } from "../_chat/turnLease";
import { buildTaskDoneEvent } from "./events";
import {
  clearStreamingActivity,
  getTaskAuditStreamingEntityId,
  sendCompletionEvent,
} from "./helpers";
import { cleanUpStaleRun } from "./recovery";
import { renewRunLease, runIdFromStreamingEntityId } from "./runLease";

/**
 * The task-run half of the lease reconciler. Runs converge the same way chat
 * turns do — one 60s cron sweeping lapsed leases — which is what replaces the
 * per-run `checkStaleRuns` chain and its 2-hour `handleStaleRun` backstop. A
 * chain only survives if every link is scheduled; a cron that reads current
 * state does not care what was lost.
 */

const leaseVerdictValidator = v.union(
  v.object({
    status: v.literal("renewed"),
    leaseExpiresAt: v.number(),
    durationMs: v.number(),
  }),
  v.object({
    status: v.literal("terminal"),
    reason: v.union(
      v.literal("unknown_turn"),
      v.literal("closed"),
      v.literal("superseded"),
      v.literal("timeout"),
      v.literal("cancelled"),
    ),
  }),
);

/**
 * Renewal for runs, reached from the same heartbeat route chat turns use. Task
 * callbacks carry no turn id, so the streaming entity they already sign is the
 * identifier — no new wire field, one heartbeat, one meaning. Returns null when
 * the entity is not a run (automations, doc workflows), which the route reads
 * as "nothing to lease" rather than an error.
 */
export const renewRunLeaseForEntity = internalMutation({
  args: {
    streamingEntityId: v.string(),
    currentActivity: v.optional(v.string()),
  },
  returns: v.union(leaseVerdictValidator, v.null()),
  handler: async (ctx, args) => {
    const runId = runIdFromStreamingEntityId(ctx, args.streamingEntityId);
    if (!runId) return null;
    return await renewRunLease(ctx, runId, {
      currentActivity: args.currentActivity,
    });
  },
});

/**
 * Running runs whose lease has lapsed — the reconciler's work list. `now` is an
 * argument because Convex caches a query on its data, not on time.
 *
 * The `gt(0)` bound is load-bearing: an unset optional field sorts before every
 * number, so runs that started before leases existed would otherwise all look
 * expired and be killed on the first tick after deploy.
 */
export const listExpiredRuns = internalQuery({
  args: { limit: v.number(), now: v.number() },
  returns: v.array(
    v.object({
      runId: v.id("agentRuns"),
      sandboxId: v.optional(v.string()),
      repoId: v.optional(v.id("githubRepos")),
    }),
  ),
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("agentRuns")
      .withIndex("by_status_lease", (q) =>
        q
          .eq("status", "running")
          .gt("leaseExpiresAt", 0)
          .lt("leaseExpiresAt", args.now),
      )
      .take(args.limit);
    return expired.map((run) => ({
      runId: run._id,
      sandboxId: run.sandboxId,
      repoId: run.repoId,
    }));
  },
});

/**
 * Converges one expired run. Re-reads the row inside the mutation so a lease
 * renewed between the query and this write is respected — the live owner always
 * beats the reconciler.
 */
export const finalizeExpiredRun = internalMutation({
  args: { runId: v.id("agentRuns"), sandboxStopped: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.status !== "running") return null;
    const now = Date.now();
    if (run.leaseExpiresAt === undefined || run.leaseExpiresAt >= now) {
      return null;
    }

    const task = await ctx.db.get(run.taskId);
    if (!task) return null;

    const timedOut = isPastRunTimeout(run.startedAt ?? run._creationTime, now);
    const lateSeconds = Math.round((now - run.leaseExpiresAt) / 1000);
    const errorMessage = timedOut
      ? "Run timed out after 2 hours"
      : args.sandboxStopped
        ? "Run ended: its sandbox was stopped"
        : `Run killed: lease expired ${lateSeconds}s ago`;
    const exitReason = timedOut
      ? "run_timeout"
      : args.sandboxStopped
        ? "lease_expired_sandbox_stopped"
        : "lease_expired";

    console.log(
      `[runs][reconcile] runId=${run._id} taskId=${run.taskId} lateMs=${now - run.leaseExpiresAt} timedOut=${timedOut} sandboxStopped=${args.sandboxStopped}`,
    );

    await cleanUpStaleRun(ctx, {
      taskId: run.taskId,
      runId: run._id,
      sandboxId: run.sandboxId,
      repoId: run.repoId,
      isProjectTask: !!task.projectId,
      errorMessage,
      exitReason,
      activeWorkflowId: task.activeWorkflowId,
      taskStatus: task.status,
    });

    // An audit belongs to the run that started it, so a dead run's audit is
    // dead too. `cleanUpStaleRun` only knows the run's own streams.
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", run.taskId))
      .collect();
    for (const audit of audits) {
      if (audit.status !== "running") continue;
      await ctx.db.patch(audit._id, { status: "error", error: errorMessage });
    }
    await clearStreamingActivity(ctx, getTaskAuditStreamingEntityId(run._id));
    await clearStreamingActivity(ctx, `audit-${String(run.taskId)}`);

    // A project build waits on this task's completion event; without it the
    // build sits on a task that will never report.
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project?.activeBuildWorkflowId) {
        try {
          await sendCompletionEvent(
            ctx,
            buildTaskDoneEvent,
            project.activeBuildWorkflowId,
            { taskId: run.taskId, success: false },
          );
        } catch {}
      }
    }

    return null;
  },
});

/** How many expired runs one reconciler tick will converge. */
const RECONCILE_RUN_BATCH = 25;

/**
 * The level-triggered sweep. Like the turn reconciler, the liveness probe only
 * picks the wording: it can never renew a lease, so a zombie process cannot
 * reset the clock of the check sent to kill it.
 */
export const reconcileRuns = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.runQuery(internal.taskWorkflow.listExpiredRuns, {
      limit: RECONCILE_RUN_BATCH,
      now: Date.now(),
    });
    for (const run of expired) {
      let sandboxStopped = false;
      if (run.sandboxId && run.repoId) {
        const liveness = await ctx.runAction(
          internal.sandbox.verifySandboxLiveness,
          { sandboxId: run.sandboxId, repoId: run.repoId },
        );
        sandboxStopped = liveness.reason === "sandbox_not_started";
      }
      await ctx.runMutation(internal.taskWorkflow.finalizeExpiredRun, {
        runId: run.runId,
        sandboxStopped,
      });
    }
    return null;
  },
});
