import { v } from "convex/values";
import { evaluationStatusValidator, evalResultValidator } from "./validators";
import { authQuery } from "./functions";

export const getByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.union(
    v.object({
      _id: v.id("taskAudits"),
      _creationTime: v.number(),
      taskId: v.id("agentTasks"),
      runId: v.id("agentRuns"),
      status: evaluationStatusValidator,
      accessibility: v.array(evalResultValidator),
      testing: v.array(evalResultValidator),
      codeReview: v.array(evalResultValidator),
      summary: v.optional(v.string()),
      error: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("taskAudits")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    if (audits.length === 0) return null;
    return audits.sort((a, b) => b.createdAt - a.createdAt)[0];
  },
});
