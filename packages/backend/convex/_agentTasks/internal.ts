import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { agentTaskValidator } from "./helpers";

/** Retrieves a task by ID for internal use (no auth check). */
export const getInternal = internalQuery({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
