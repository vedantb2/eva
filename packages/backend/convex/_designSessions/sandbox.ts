import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { authMutation } from "../functions";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { preferPersistedSandboxId } from "../_sandbox/resolveExistingSandboxId";

/** Updates the sandbox ID and/or branch name for a design session (internal). */
export const updateSandbox = internalMutation({
  args: {
    id: v.id("designSessions"),
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const updates: Record<string, string | number> = {
      updatedAt: Date.now(),
    };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Starts a sandbox for a design session by kicking off the startup workflow. */
export const startSandbox = authMutation({
  args: {
    id: v.id("designSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const branchName = session.branchName || `eva/design-${args.id}`;
    const baseBranch = repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
    await ctx.db.patch(args.id, {
      status: "starting",
      updatedAt: Date.now(),
    });
    await workflow.start(
      ctx,
      internal.designSessions.designSandboxStartupWorkflow,
      {
        designSessionId: args.id,
        existingSandboxId: session.sandboxId,
        vercelSandboxId: session.vercelSandboxId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: session.repoId,
      },
    );
    return null;
  },
});

/**
 * Stops the sandbox in Daytona and closes the design session.
 *
 * Marks the session as `"stopping"` synchronously so the UI can show a spinner
 * and disable the Start button until the real Daytona stop (~10s) completes.
 * Without the transient `"stopping"` state, a quick Start click during the
 * stop window would race with `getOrCreateSandbox` and silently spawn an
 * orphan sandbox.
 */
export const stopSandbox = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    const stopId = preferPersistedSandboxId({
      sandboxId: session.sandboxId,
      vercelSandboxId: session.vercelSandboxId,
    });
    if (stopId) {
      await ctx.scheduler.runAfter(
        0,
        internal.designSessions.finalizeStopSandbox,
        {
          designSessionId: args.id,
          sandboxId: stopId,
          repoId: session.repoId,
        },
      );
    } else {
      await ctx.db.patch(args.id, {
        status: "closed",
        updatedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "assistant",
      content: "Sandbox stopped",
      timestamp: Date.now(),
      userId: ctx.userId,
      isSystemAlert: true,
    });
    await ctx.db.patch(args.id, {
      // Keep sandboxId so we can resume the stopped sandbox later.
      status: "stopping",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Awaits the Daytona stop and finalizes the design session status to `"closed"`.
 * Always flips status, even if Daytona errors — a stuck `"stopping"` state
 * would leave the user unable to Start.
 */
export const finalizeStopSandbox = internalAction({
  args: {
    designSessionId: v.id("designSessions"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.runAction(internal.daytona.stopSandbox, {
        sandboxId: args.sandboxId,
        repoId: args.repoId,
      });
    } finally {
      await ctx.runMutation(internal.designSessions.markSandboxClosed, {
        designSessionId: args.designSessionId,
      });
    }
    return null;
  },
});

/** Internal: flips design session status from `"stopping"` to `"closed"` after Daytona stop completes. */
export const markSandboxClosed = internalMutation({
  args: { designSessionId: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    if (session.status !== "stopping") return null;
    await ctx.db.patch(args.designSessionId, {
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks a design session's sandbox as active after successful startup. */
export const sandboxReady = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    sandboxId: v.string(),
    vercelSandboxId: v.optional(v.string()),
    branchName: v.string(),
    isNew: v.boolean(),
    devPort: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.insert("messages", {
      parentId: args.designSessionId,
      role: "assistant",
      content: args.isNew ? "Sandbox started" : "Sandbox reconnected",
      timestamp: Date.now(),
      isSystemAlert: true,
    });
    await ctx.db.patch(args.designSessionId, {
      sandboxId: args.sandboxId,
      ...(args.vercelSandboxId !== undefined
        ? { vercelSandboxId: args.vercelSandboxId }
        : {}),
      branchName: args.branchName,
      status: "active",
      updatedAt: Date.now(),
      devPort: args.devPort,
    });
    return null;
  },
});

/** Records a sandbox startup failure for a design session. */
export const sandboxError = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.insert("messages", {
      parentId: args.designSessionId,
      role: "assistant",
      content: "Failed to start sandbox",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    await ctx.db.patch(args.designSessionId, {
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});
