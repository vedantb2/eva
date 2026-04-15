import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { sessionValidator } from "./helpers";
import { deploymentStatusValidator } from "../validators";

/** Retrieves a session by ID for internal use (no auth check). */
export const getInternal = internalQuery({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Updates the deployment status and optional URL for a session (internal use). */
export const updateDeploymentStatus = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    deploymentStatus: deploymentStatusValidator,
    deploymentUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    await ctx.db.patch(args.sessionId, {
      deploymentStatus: args.deploymentStatus,
      ...(args.deploymentUrl !== undefined && {
        deploymentUrl: args.deploymentUrl,
      }),
    });
    return null;
  },
});

/** Sets the pull request URL on a session (internal use). */
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
