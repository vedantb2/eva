import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { authMutation } from "../functions";
import { workflow } from "../workflowManager";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

/** Updates sandbox-related fields (sandbox ID, branch, PR URL) on a session. */
export const updateSandbox = authMutation({
  args: {
    id: v.id("sessions"),
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    const updates: {
      sandboxId?: string;
      branchName?: string;
      prUrl?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.prUrl !== undefined) updates.prUrl = args.prUrl;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Clears the sandbox association and marks the session as closed. */
export const clearSandbox = authMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { sandboxId: undefined, status: "closed" });
    return null;
  },
});

/** Starts or restarts a sandbox for a session by launching the startup workflow. */
export const startSandbox = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const branchName = session.branchName || `eva/session-${args.sessionId}`;
    const baseBranch = repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
    await ctx.db.patch(args.sessionId, {
      status: "starting",
      updatedAt: Date.now(),
    });
    await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionSandboxStartupWorkflow,
      {
        sessionId: args.sessionId,
        existingSandboxId: session.sandboxId,
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
 * Stops the sandbox in Daytona and closes the session.
 *
 * Marks the session as `"stopping"` synchronously so the UI can show a spinner
 * and disable the Start button until the real Daytona stop (~10s) completes.
 * The wrapping `finalizeStopSandbox` action does the actual stop and then
 * flips the status to `"closed"`. Without the transient `"stopping"` state,
 * a quick Start click during the stop window would race with `getOrCreateSandbox`
 * and silently spawn an orphan sandbox.
 */
export const stopSandbox = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    if (session.sandboxId) {
      await ctx.scheduler.runAfter(
        0,
        internal._sessions.sandbox.finalizeStopSandbox,
        {
          sessionId: args.sessionId,
          sandboxId: session.sandboxId,
          repoId: session.repoId,
        },
      );
    } else {
      // No sandbox to stop — close immediately.
      await ctx.db.patch(args.sessionId, {
        ptySessionId: undefined,
        status: "closed",
        updatedAt: Date.now(),
      });
      return null;
    }

    // The "Sandbox stopped" / "Failed to stop sandbox" divider is inserted by
    // `markSandboxClosed` once Daytona's stop call settles, so the divider
    // matches the actual outcome rather than being optimistic.
    await ctx.db.patch(args.sessionId, {
      // Keep sandboxId so we can resume the stopped sandbox later.
      ptySessionId: undefined,
      status: "stopping",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Awaits the Daytona stop and finalizes the session status to `"closed"`.
 * Always flips status, even if Daytona errors — a stuck `"stopping"` state
 * would leave the user unable to Start. Captures any Daytona error so the
 * mutation can post a "Failed to stop sandbox" alert with full detail.
 */
export const finalizeStopSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let stopError: string | undefined;
    try {
      await ctx.runAction(internal.daytona.stopSandbox, {
        sandboxId: args.sandboxId,
        repoId: args.repoId,
      });
    } catch (err) {
      stopError = err instanceof Error ? err.message : String(err);
    }
    await ctx.runMutation(internal._sessions.sandbox.markSandboxClosed, {
      sessionId: args.sessionId,
      error: stopError,
    });
    return null;
  },
});

/**
 * Internal: flips session status from `"stopping"` to `"closed"` after Daytona
 * stop completes, and posts a "Sandbox stopped" (success) or "Failed to stop
 * sandbox" (with error detail) divider to the chat.
 */
export const markSandboxClosed = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    // Only flip if still stopping — don't overwrite a fresh start.
    if (session.status !== "stopping") return null;
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: args.error ? "Failed to stop sandbox" : "Sandbox stopped",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    await ctx.db.patch(args.sessionId, {
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks a session sandbox as ready, updating its status to active (internal use). */
export const sandboxReady = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    branchName: v.string(),
    isNew: v.boolean(),
    usedSnapshot: v.optional(v.boolean()),
    devPort: v.optional(v.number()),
    devCommand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    // Early-ready (right after Sandbox.create) + final-ready (after services)
    // both call this. Only emit the system alert once; still patch latest
    // sandbox/dev metadata on every call.
    const alreadyActive =
      session.status === "active" && session.sandboxId === args.sandboxId;
    if (!alreadyActive) {
      const content = args.isNew ? "Sandbox started" : "Sandbox reconnected";
      await ctx.db.insert("messages", {
        parentId: args.sessionId,
        role: "assistant",
        content,
        timestamp: Date.now(),
        isSystemAlert: true,
      });
    }
    await ctx.db.patch(args.sessionId, {
      updatedAt: Date.now(),
      sandboxId: args.sandboxId,
      branchName: args.branchName,
      status: "active",
      ...(args.devPort !== undefined ? { devPort: args.devPort } : {}),
      ...(args.devCommand !== undefined ? { devCommand: args.devCommand } : {}),
    });
    return null;
  },
});

/** Records a sandbox startup failure and marks the session as closed (internal use). */
export const sandboxError = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "Failed to start sandbox",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    await ctx.db.patch(args.sessionId, {
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});
