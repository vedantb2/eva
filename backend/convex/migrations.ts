import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateBacklogToTodo = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
  }),
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("agentTasks").collect();
    let migratedCount = 0;
    for (const task of allTasks) {
      if ((task.status as string) === "backlog") {
        await ctx.db.patch(task._id, {
          status: "todo",
          updatedAt: Date.now(),
        });
        migratedCount++;
      }
    }
    return { migratedCount };
  },
});
