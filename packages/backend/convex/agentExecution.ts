import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { workflow } from "./workflowManagers";

export const getRunInternal = internalQuery({
  args: { id: v.id("agentRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTaskInternal = internalQuery({
  args: { id: v.id("agentTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRepoInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const claimRunForWorkflowInternal = internalMutation({
  args: { runId: v.id("agentRuns") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    if (run.status !== "queued") {
      return false;
    }

    const task = await ctx.db.get(run.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(run._id, { status: "running" });
    await ctx.db.patch(task._id, {
      status: "in_progress",
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const trigger = internalAction({
  args: {
    runId: v.id("agentRuns"),
    notifyWorkflowId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.agentExecution.claimRunForWorkflowInternal,
      { runId: args.runId },
    );
    if (!claimed) {
      return null;
    }

    const run = await ctx.runQuery(internal.agentExecution.getRunInternal, {
      id: args.runId,
    });

    try {
      await workflow.start(ctx, internal.taskWorkflows.executeTaskWorkflow, {
        runId: args.runId,
        notifyWorkflowId: args.notifyWorkflowId,
      });
      return null;
    } catch (error) {
      await ctx.runMutation(internal.agentRuns.completeInternal, {
        id: args.runId,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start task workflow",
      });
      if (run) {
        await ctx.runMutation(api.streaming.clear, {
          entityId: String(run.taskId),
        });
      }
      throw error;
    }
  },
});

export const triggerLegacy = mutation({
  args: { runId: v.id("agentRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Run not found");
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Run not found");
    }

    await ctx.scheduler.runAfter(0, internal.agentExecution.trigger, {
      runId: args.runId,
    });
    return null;
  },
});
