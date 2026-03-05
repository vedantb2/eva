import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { sessionValidator } from "./helpers";

export const getInternal = internalQuery({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const setPrUrl = internalMutation({
  args: {
    id: v.id("sessions"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { prUrl: args.prUrl, updatedAt: Date.now() });
    return null;
  },
});
