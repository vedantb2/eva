import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const TASK_SCOPED_ENTITY_TYPES = new Set(["quickTask", "task-chat"]);

/**
 * Persists projectId on historical task logs that were written before project
 * tagging existed. Safe to re-run; only patches rows still missing projectId.
 * Delete this export once it has run in dev and prod.
 */
export const backfillLogProjectIds = internalMutation({
  args: {},
  returns: v.object({ patched: v.number() }),
  handler: async (ctx) => {
    let patched = 0;
    const logs = await ctx.db.query("logs").collect();

    for (const entry of logs) {
      if (entry.projectId !== undefined) continue;
      if (!TASK_SCOPED_ENTITY_TYPES.has(entry.entityType)) continue;

      const taskId = ctx.db.normalizeId("agentTasks", entry.entityId);
      if (!taskId) continue;

      const task = await ctx.db.get(taskId);
      if (task?.projectId === undefined) continue;

      await ctx.db.patch(entry._id, { projectId: task.projectId });
      patched++;
    }

    console.log(`[migration] backfillLogProjectIds: patched ${patched} logs`);
    return { patched };
  },
});
