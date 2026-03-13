import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";

export const cleanupStaleRuns = internalMutation({
  args: {},
  returns: v.object({ tasksFixed: v.number(), runsFixed: v.number() }),
  handler: async (ctx) => {
    let tasksFixed = 0;
    let runsFixed = 0;
    const cutoff = Date.now() - RUN_TIMEOUT_MS;

    const allTasks = await ctx.db.query("agentTasks").collect();
    const stuckTasks = allTasks.filter((t) => t.status === "in_progress");

    for (const task of stuckTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();

      const activeRuns = runs.filter(
        (r) => r.status === "queued" || r.status === "running",
      );
      const hasFreshActiveRun = activeRuns.some(
        (r) => (r.startedAt ?? 0) >= cutoff,
      );
      const staleActiveRuns = activeRuns.filter(
        (r) => (r.startedAt ?? 0) < cutoff,
      );

      if (hasFreshActiveRun) continue;

      if (
        activeRuns.length === 0 &&
        !runs.some((r) => r.status === "success" || r.status === "error")
      )
        continue;

      if (task.activeWorkflowId) {
        try {
          await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
        } catch {}
      }

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
        status: hasSuccessRun ? "code_review" : "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
      tasksFixed++;

      const audits = await ctx.db
        .query("audits")
        .withIndex("by_entity", (q) => q.eq("entityId", task._id))
        .collect();
      for (const audit of audits) {
        if (audit.status === "running") {
          await ctx.db.patch(audit._id, {
            status: "error",
            error: "Cleaned up stale audit",
          });
        }
      }

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

export const clearFlagSessionMode = internalMutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({ isDone: v.boolean(), continueCursor: v.string() }),
  handler: async (ctx, args) => {
    const result = await ctx.db.query("messages").paginate(args.paginationOpts);
    for (const message of result.page) {
      if (message.mode === "flag") {
        await ctx.db.patch(message._id, { mode: undefined });
      }
    }
    return { isDone: result.isDone, continueCursor: result.continueCursor };
  },
});
