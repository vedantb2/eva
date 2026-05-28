import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/** Clears a project interview that got stuck after sandbox startup failed. */
export const repairStuckProjectInterview = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    clearedWorkflow: v.boolean(),
    removedEmptyAssistant: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { clearedWorkflow: false, removedEmptyAssistant: false };
    }

    let removedEmptyAssistant = false;
    const details = await ctx.db
      .query("projectDetails")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (details) {
      const last = details.conversationHistory.at(-1);
      if (
        last?.role === "assistant" &&
        (last.content.trim() === "" ||
          last.content.trim() === JSON.stringify({ error: true }))
      ) {
        await ctx.db.patch(details._id, {
          conversationHistory: details.conversationHistory.slice(0, -1),
        });
        removedEmptyAssistant = true;
      }
    }

    const clearedWorkflow = project.activeWorkflowId !== undefined;
    if (clearedWorkflow) {
      await ctx.db.patch(args.projectId, {
        activeWorkflowId: undefined,
        reviewProjectSandboxStatus: "closed",
        lastSandboxActivity: Date.now(),
      });
    }

    return { clearedWorkflow, removedEmptyAssistant };
  },
});
