import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { sessionValidator } from "./helpers";
import { internal } from "../_generated/api";
import { deploymentStatusValidator } from "../validators";

const prStateValidator = v.union(
  v.literal("draft"),
  v.literal("open"),
  v.literal("merged"),
  v.literal("closed"),
);

/** Retrieves a session by ID for internal use (no auth check). */
export const getInternal = internalQuery({
  args: { id: v.string() },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("sessions", args.id);
    if (!id) return null;
    return await ctx.db.get(id);
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
    prState: v.optional(prStateValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      prUrl: args.prUrl,
      ...(args.prState !== undefined && { prState: args.prState }),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Sets only the PR state on a session (internal use). */
export const setPrState = internalMutation({
  args: {
    id: v.id("sessions"),
    prState: prStateValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      prState: args.prState,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks a session's PR ready for review and archives the sandbox (internal use). */
export const markReadyAndArchive = internalMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;

    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.archiveSandbox, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    await ctx.db.patch(args.id, {
      prState: "open",
      archived: true,
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Soft UX lock for agent-driven browsing. MCP browser_lock / browser_unlock
 * call this; the session UI reacts to `agentBrowsingAt` for auto-switch + overlay.
 */
export const setAgentBrowsingAt = internalMutation({
  args: {
    sessionId: v.string(),
    locked: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sessionId = ctx.db.normalizeId("sessions", args.sessionId);
    if (!sessionId) return null;
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    await ctx.db.patch(sessionId, {
      agentBrowsingAt: args.locked ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});
