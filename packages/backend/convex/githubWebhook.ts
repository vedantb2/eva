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

    const tasksToUpdate = task.projectId
      ? await ctx.db
          .query("agentTasks")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect()
      : [task];

    for (const t of tasksToUpdate) {
      if (t.status === "done" || t.status === "cancelled") continue;

      await ctx.db.patch(t._id, {
        status: newStatus,
        updatedAt: now,
      });

      if (t.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(t.scheduledFunctionId);
        } catch {
          // may have already fired
        }
        await ctx.db.patch(t._id, {
          scheduledAt: undefined,
          scheduledFunctionId: undefined,
        });
      }

      const notifyUsers = new Set(
        [t.createdBy, t.assignedTo].filter(
          (id): id is Id<"users"> => id !== undefined,
        ),
      );
      const notificationTitle = args.merged
        ? `PR merged — "${t.title}" moved to done`
        : `PR closed — "${t.title}" moved to cancelled`;
      const notificationMessage = args.merged
        ? `GitHub merged ${args.prUrl}. Task moved to done.`
        : `GitHub closed ${args.prUrl} without merge. Task moved to cancelled.`;
      for (const userId of notifyUsers) {
        await createNotification(ctx, {
          userId,
          type: args.merged ? "task_complete" : "system",
          title: notificationTitle,
          message: notificationMessage,
          repoId: t.repoId,
          projectId: t.projectId,
          taskId: t._id,
        });
      }

      const commentText = args.merged
        ? "PR was merged on GitHub. Task moved to done."
        : "PR was closed without merging on GitHub. Task moved to cancelled.";
      await ctx.runMutation(internal.taskComments.createSystemComment, {
        taskId: t._id,
        content: commentText,
      });
    }

    if (task.projectId) {
      const newPhase = args.merged ? "completed" : "cancelled";
      await ctx.db.patch(task.projectId, { phase: newPhase });
    }

    await ctx.db.patch(eventId, {
      status: "completed",
      taskId: task._id,
    });

    return null;
  },
});
