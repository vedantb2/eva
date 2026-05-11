import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import {
  automationRunFields,
  automationFindingValidator,
  runStatusValidator,
} from "../validators";
import { authQuery, authMutation, hasRepoAccess } from "../functions";
import { cancelTrackedWorkflow } from "../workflowManager";
import type { Doc } from "../_generated/dataModel";
import { taskCompleteEvent } from "../_taskWorkflow/events";
import {
  recordCompletionLog,
  sendCompletionEvent,
} from "../_taskWorkflow/helpers";

/** Lists the most recent 50 runs for a given automation, newest first. */
export const listRuns = authQuery({
  args: { automationId: v.id("automations") },
  returns: v.array(
    v.object({
      _id: v.id("automationRuns"),
      _creationTime: v.number(),
      ...automationRunFields,
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) =>
        q.eq("automationId", args.automationId),
      )
      .order("desc")
      .take(50);
  },
});

/** Marks an automation run as acknowledged by the user. */
export const acknowledgeRun = authMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    const automation = await ctx.db.get(run.automationId);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.runId, { acknowledged: true });
    return null;
  },
});

/** Counts automations whose latest run is unacknowledged and completed. */
export const countUnreadByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return 0;
    }
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    let count = 0;
    for (const automation of automations) {
      const latestRun = await ctx.db
        .query("automationRuns")
        .withIndex("by_automation", (q) => q.eq("automationId", automation._id))
        .order("desc")
        .first();

      if (
        latestRun &&
        !latestRun.acknowledged &&
        (latestRun.status === "success" || latestRun.status === "error")
      ) {
        count++;
      }
    }
    return count;
  },
});

/** Fetches repository data needed for an automation run. */
export const getAutomationData = internalQuery({
  args: { automationId: v.id("automations"), repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      repoOwner: v.string(),
      repoName: v.string(),
      rootDirectory: v.string(),
      defaultBaseBranch: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      rootDirectory: repo.rootDirectory ?? "",
      defaultBaseBranch: repo.defaultBaseBranch,
    };
  },
});

/** Updates an automation run's status and optional metadata fields (sandbox, error, PR URL, etc). */
export const updateRunStatus = internalMutation({
  args: {
    runId: v.id("automationRuns"),
    status: runStatusValidator,
    sandboxId: v.optional(v.string()),
    error: v.optional(v.string()),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    findings: v.optional(v.array(automationFindingValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Partial<Doc<"automationRuns">> = { status: args.status };
    if (args.sandboxId !== undefined) patch.sandboxId = args.sandboxId;
    if (args.error !== undefined) patch.error = args.error;
    if (args.resultSummary !== undefined)
      patch.resultSummary = args.resultSummary;
    if (args.prUrl !== undefined) patch.prUrl = args.prUrl;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.findings !== undefined) patch.findings = args.findings;
    if (args.status === "success" || args.status === "error") {
      patch.finishedAt = Date.now();
    }
    await ctx.db.patch(args.runId, patch);
    return null;
  },
});

/** Clears the active workflow reference from a completed or failed automation run. */
export const clearRunWorkflow = internalMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, { activeWorkflowId: undefined });
    return null;
  },
});

/** Cancels an active automation run, stopping the workflow and cleaning up streaming state. */
export const cancelRun = authMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    const automation = await ctx.db.get(run.automationId);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await cancelTrackedWorkflow(ctx, run.activeWorkflowId);

    await ctx.db.patch(args.runId, {
      status: "error",
      error: "Cancelled by user",
      finishedAt: Date.now(),
      activeWorkflowId: undefined,
    });

    const streamingEntityId = `automation-run-${String(args.runId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    return null;
  },
});

/** Receives sandbox completion callback and forwards the event to the active automation workflow. */
export const handleCompletion = authMutation({
  args: {
    automationRunId: v.id("automationRuns"),
    runId: v.optional(v.string()),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.automationRunId);
    if (!run || !run.activeWorkflowId) return null;

    await sendCompletionEvent(ctx, taskCompleteEvent, run.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
    });

    const automation = await ctx.db.get(run.automationId);
    if (automation) {
      await recordCompletionLog(ctx, {
        entityType: "automation",
        entityId: String(args.automationRunId),
        entityTitle: automation.title,
        repoId: run.repoId,
        rawResultEvent: args.rawResultEvent,
      });
    }

    return null;
  },
});
