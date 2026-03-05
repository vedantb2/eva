import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createNotification } from "./notifications";
import type { Id } from "./_generated/dataModel";

export const handlePrClosed = internalMutation({
  args: {
    prUrl: v.string(),
    merged: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("githubWebhookEvents", {
      event: "pull_request",
      action: "closed",
      prUrl: args.prUrl,
      merged: args.merged,
      status: "pending",
      createdAt: Date.now(),
    });

    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_pr_url", (q) => q.eq("prUrl", args.prUrl))
      .first();

    if (!run) {
      await ctx.db.patch(eventId, { status: "skipped" });
      return null;
    }

    const task = await ctx.db.get(run.taskId);
    if (!task || task.status === "done" || task.status === "cancelled") {
      await ctx.db.patch(eventId, { status: "skipped" });
      return null;
    }

    const newStatus = args.merged ? "done" : "cancelled";
    const now = Date.now();

    await ctx.db.patch(task._id, {
      status: newStatus,
      updatedAt: now,
    });

    if (task.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(task.scheduledFunctionId);
      } catch {
        // may have already fired
      }
      await ctx.db.patch(task._id, {
        scheduledAt: undefined,
        scheduledFunctionId: undefined,
      });
    }

    const notifyUsers = new Set(
      [task.createdBy, task.assignedTo].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    );
    const statusLabel = args.merged ? "merged & done" : "closed & cancelled";
    for (const userId of notifyUsers) {
      await createNotification(ctx, {
        userId,
        type: args.merged ? "task_complete" : "system",
        title: `PR ${statusLabel} for "${task.title}"`,
        repoId: task.repoId,
      });
    }

    const commentText = args.merged
      ? "PR was merged on GitHub. Task moved to done."
      : "PR was closed without merging on GitHub. Task moved to cancelled.";
    await ctx.runMutation(internal.taskComments.createSystemComment, {
      taskId: task._id,
      content: commentText,
    });

    if (task.projectId && newStatus === "done") {
      const project = await ctx.db.get(task.projectId);
      if (project && project.phase !== "completed") {
        const projectTasks = await ctx.db
          .query("agentTasks")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect();
        const allDone = projectTasks.every((t) =>
          t._id === task._id ? true : t.status === "done",
        );
        if (allDone) {
          await ctx.db.patch(task.projectId, { phase: "completed" });
        }
      }
    }

    await ctx.db.patch(eventId, {
      status: "completed",
      taskId: task._id,
    });

    return null;
  },
});
