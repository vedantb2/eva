import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { DEFAULT_SESSION_TITLE, sessionValidator } from "./helpers";
import { deploymentStatusValidator } from "../validators";
import {
  cancelSessionSandboxGraceDelete,
  scheduleSessionSandboxGraceDelete,
} from "../sandboxCleanup";

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

/** Session owning a sandbox — preview recovery relaunches services through it. */
export const getBySandboxInternal = internalQuery({
  args: { sandboxId: v.string() },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_sandbox", (q) => q.eq("sandboxId", args.sandboxId))
      .first();
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
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    const isTerminal = args.prState === "merged" || args.prState === "closed";
    await ctx.db.patch(args.id, {
      prState: args.prState,
      ...(isTerminal
        ? { archived: true }
        : { archived: false, prStateOnArchive: undefined }),
      updatedAt: Date.now(),
    });
    if (isTerminal) {
      await scheduleSessionSandboxGraceDelete(ctx, {
        ...session,
        archived: true,
        prState: args.prState,
      });
    } else {
      await cancelSessionSandboxGraceDelete(ctx, args.id);
    }
    return null;
  },
});

/** Detaches a foreign-auto-merged PR from its session so the session stays writable. No-op if the session's PR has since changed. */
export const clearPrUrlIfMatches = internalMutation({
  args: { id: v.id("sessions"), expectedPrUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session || session.prUrl !== args.expectedPrUrl) return null;
    await ctx.db.patch(args.id, {
      prUrl: undefined,
      prState: undefined,
      prStateOnArchive: undefined,
      archived: false,
      updatedAt: Date.now(),
    });
    await cancelSessionSandboxGraceDelete(ctx, args.id);
    return null;
  },
});

// Soft UX lock for agent-driven browsing moved to
// `internal.mcp.browserLock.setAgentBrowsingAt` (generalized to
// sessions/tasks/projects); MCP browser_lock / browser_unlock call that now.

/**
 * Applies an LLM-generated session title only while the placeholder remains.
 * Manual renames (anything other than DEFAULT_SESSION_TITLE) are never overwritten.
 */
export const applyGeneratedTitle = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.title !== DEFAULT_SESSION_TITLE) return null;
    await ctx.db.patch(args.sessionId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return null;
  },
});
