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

/**
 * Same as `getInternal` but takes an unbranded string id (normalized against
 * the table). Used where the caller only has a plain string, e.g. the
 * entityId claim on an MCP token (browser_start).
 */
export const getInternalByStringId = internalQuery({
  args: { id: v.string() },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("agentTasks", args.id);
    if (!id) return null;
    return await ctx.db.get(id);
  },
});
