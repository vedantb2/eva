import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Seeds taskSubscribers for tasks that predate the subscribers feature: each
 * task's creator and current assignee become active subscribers so historical
 * tasks keep notifying the right people. Safe to re-run; skips any (task, user)
 * pair that already has a row. Delete this export once it has run in dev/prod.
 */
export const backfillTaskSubscribers = internalMutation({
  args: {},
  returns: v.object({
    tasksScanned: v.number(),
    subscribersCreated: v.number(),
  }),
  handler: async (ctx) => {
    let subscribersCreated = 0;
    const tasks = await ctx.db.query("agentTasks").collect();
    const now = Date.now();

    for (const task of tasks) {
      const candidates: Id<"users">[] = [task.createdBy];
      if (task.assignedTo && task.assignedTo !== task.createdBy) {
        candidates.push(task.assignedTo);
      }

      for (const userId of candidates) {
        const existing = await ctx.db
          .query("taskSubscribers")
          .withIndex("by_task_and_user", (q) =>
            q.eq("taskId", task._id).eq("userId", userId),
          )
          .first();
        if (existing) continue;
        await ctx.db.insert("taskSubscribers", {
          taskId: task._id,
          userId,
          subscribed: true,
          createdAt: now,
          updatedAt: now,
        });
        subscribersCreated++;
      }
    }

    console.log(
      `[migration] backfillTaskSubscribers: ${tasks.length} tasks, ${subscribersCreated} subscribers created`,
    );
    return { tasksScanned: tasks.length, subscribersCreated };
  },
});
