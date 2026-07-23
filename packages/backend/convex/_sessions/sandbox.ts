import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  type MutationCtx,
} from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authMutation } from "../functions";
import { workflow } from "../workflowManager";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { resolveReusableVercelSandboxId } from "../_sandbox/resolveExistingSandboxId";
import {
  seedSandboxStartupActivity,
  clearSandboxStartupActivity,
} from "../_sandbox/startupActivity";
import { markAllRunningExited } from "../backgroundProcesses";
import { startNextQueuedSessionMessage } from "../_queues/helpers";

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
    await markAllRunningExited(ctx.db, args.id);
    await ctx.db.patch(args.id, {
      sandboxId: undefined,
      vercelSandboxId: undefined,
      status: "closed",
    });
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
    // Seed startup streaming immediately so the UI shows a real step instead of
    // the random "Eva is inferring…" spinner while the workflow schedules.
    await seedSandboxStartupActivity(
      ctx.db,
      `session-startup-${args.sessionId}`,
    );
    const vercelSandboxId = resolveReusableVercelSandboxId(session);
    console.log(
      `[sessions] startSandbox sessionId=${args.sessionId} existingSandboxId=${session.sandboxId ?? "none"} vercelSandboxId=${vercelSandboxId ?? "none"}`,
    );
    const startArgs = {
      sessionId: args.sessionId,
      existingSandboxId: session.sandboxId,
      vercelSandboxId: vercelSandboxId ?? session.vercelSandboxId,
      installationId: repo.installationId,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      baseBranch,
      repoId: session.repoId,
    };
    // Vercel: schedule the start action directly. Workflow step scheduling was
    // measured at ~6s before the first action ran — Daytona still needs the
    // multi-step thaw workflow for archived restores.
    if (vercelSandboxId) {
      await ctx.scheduler.runAfter(
        0,
        internal.daytona.startSessionSandbox,
        startArgs,
      );
    } else {
      await workflow.start(
        ctx,
        internal.sessionWorkflow.sessionSandboxStartupWorkflow,
        startArgs,
      );
    }
    return null;
  },
});

/**
 * Shared stop path for the user Stop button and PR-terminal webhook auto-stop.
 * Marks the session `"stopping"` then schedules provider teardown.
 */
export async function requestSessionSandboxStop(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session) return;

  // Allow stop from closed when a sandboxId remains — start can early-ready
  // then fail and leave a live Vercel VM while UI shows inactive.
  if (session.status === "stopping") {
    // Already stopping — but a previous finalize may have stalled (e.g. its
    // action was killed while a racing resume held the VM). Re-issue the
    // idempotent finalize so clicking Stop again recovers a stuck `stopping`
    // row instead of being a no-op that leaves it wedged forever.
    if (session.sandboxId) {
      await ctx.scheduler.runAfter(
        0,
        internal._sessions.sandbox.finalizeStopSandbox,
        {
          sessionId,
          sandboxId: session.sandboxId,
          repoId: session.repoId,
        },
      );
    } else {
      await ctx.db.patch(sessionId, {
        status: "closed",
        updatedAt: Date.now(),
      });
    }
    return;
  }

  if (session.sandboxId) {
    await ctx.scheduler.runAfter(
      0,
      internal._sessions.sandbox.finalizeStopSandbox,
      {
        sessionId,
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      },
    );
  } else {
    // No sandbox to stop — close immediately.
    await ctx.db.patch(sessionId, {
      ptySessionId: undefined,
      status: "closed",
      updatedAt: Date.now(),
    });
    return;
  }

  // Clear leftover start steps so the chat does not re-show "Starting
  // sandbox..." / cold-storage copy while status is stopping.
  await clearSandboxStartupActivity(ctx.db, `session-startup-${sessionId}`);

  // The "Sandbox stopped" / "Failed to stop sandbox" divider is inserted by
  // `markSandboxClosed` once Daytona's stop call settles, so the divider
  // matches the actual outcome rather than being optimistic.
  await ctx.db.patch(sessionId, {
    // Keep sandboxId so we can resume the stopped sandbox later.
    ptySessionId: undefined,
    status: "stopping",
    updatedAt: Date.now(),
  });
}

export const stopSandbox = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    await requestSessionSandboxStop(ctx, args.sessionId);
    return null;
  },
});

/** Internal stop used by PR merge/close webhooks (no user auth context). */
export const requestStopSandbox = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requestSessionSandboxStop(ctx, args.sessionId);
    return null;
  },
});

/**
 * Awaits provider stop and finalizes session status. Only marks `"closed"`
 * after a successful stop — on failure reverts to `"active"` so the UI matches
 * a still-running Vercel VM and the user can retry Stop.
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
 * Internal: after stop settles, either close the session (success) or revert
 * to active (failure) so Eva never shows "off" while Vercel is still running.
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
    if (args.error) {
      await ctx.db.insert("messages", {
        parentId: args.sessionId,
        role: "assistant",
        content: "Failed to stop sandbox",
        timestamp: Date.now(),
        isSystemAlert: true,
        errorDetail: args.error,
      });
      // VM is still running — keep UI active so Stop can be retried.
      await ctx.db.patch(args.sessionId, {
        status: "active",
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "Sandbox stopped",
      timestamp: Date.now(),
      isSystemAlert: true,
    });
    await markAllRunningExited(ctx.db, args.sessionId);
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
    vercelSandboxId: v.optional(v.string()),
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
    // User may have clicked Stop while start/resume was still running. Never
    // flip closed/stopping back to active — that left Vercel running with UI
    // showing stopped, or re-activated after stop confirmation.
    if (session.status === "stopping" || session.status === "closed") {
      console.log(
        `[sessions] sandboxReady ignored sessionId=${args.sessionId} status=${session.status} sandboxId=${args.sandboxId}`,
      );
      return null;
    }
    // Early-ready (right after Sandbox.create) + final-ready (after services)
    // both call this. Only emit the system alert once; still patch latest
    // sandbox/dev metadata on every call.
    const alreadyActive =
      session.status === "active" && session.sandboxId === args.sandboxId;
    if (!alreadyActive) {
      // Fresh boot / resume — prior VM processes are gone.
      await markAllRunningExited(ctx.db, args.sessionId);
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
      ...(args.vercelSandboxId !== undefined
        ? { vercelSandboxId: args.vercelSandboxId }
        : {}),
      ...(args.devPort !== undefined ? { devPort: args.devPort } : {}),
      ...(args.devCommand !== undefined ? { devCommand: args.devCommand } : {}),
    });
    // Drain first-message (and any other) queued turns now that chat can run.
    // Early + final ready both call this; second no-ops while activeWorkflowId is set.
    await startNextQueuedSessionMessage(ctx, args.sessionId);
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
    await markAllRunningExited(ctx.db, args.sessionId);
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

/**
 * Non-fatal: a late startup step failed after early-ready already unlocked the
 * session. Keep status active — do not stop/delete the sandbox the user is on.
 */
export const sandboxStartupWarning = internalMutation({
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
      content:
        "Sandbox startup unfinished — session left running. Some services may still be starting.",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    return null;
  },
});
