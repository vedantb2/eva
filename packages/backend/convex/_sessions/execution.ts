import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import { authMutation, hasRepoAccess } from "../functions";
import { aiModelValidator, sessionModeValidator } from "../validators";
import { trackSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { buildSessionPrompt, MODE_TOOLS } from "./workflow";
import { normalizeAIModel } from "../validators";

/** Frontend trigger to start a session execution workflow in the specified mode. */
export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: aiModelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const normalizedMode =
      args.mode === "ask" || args.mode === "execute" ? "edit" : args.mode;
    if (normalizedMode !== "edit" && normalizedMode !== "plan") {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    // Daemon-pull dispatch: stage the turn for a warm daemon to claim in one
    // poll instead of waiting on the workflow's durable step queue. We must
    // reproduce, in this mutation, the exact side effects the workflow's first
    // two steps used to do — insert the assistant placeholder and build the
    // prompt — so the daemon runs precisely what the workflow would have handed
    // it. The workflow still starts below (for cold-resume, completion,
    // post-turn push/save, and cancellation); it simply no longer pushes the
    // prompt (see sessionExecuteWorkflow), so the turn is never double-executed.
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      mode: args.mode,
      activityLog: "",
    });

    const user = await ctx.db.get(ctx.userId);
    const { prompt } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: args.message,
      mode: args.mode,
    });

    await ctx.db.patch(args.sessionId, {
      pendingTurn: { prompt, requestedAt: Date.now() },
      updatedAt: Date.now(),
    });

    // Ensure a daemon exists to claim the staged prompt. Idempotent: a no-op if
    // one is already warm, and it never pkills a live daemon — it only respawns
    // (in pull mode, WITHOUT a prompt) when none is alive. On a cold/archived
    // sandbox this thaws it; if there is no sandbox yet the action skips and the
    // workflow's cold path below creates one.
    if (session.sandboxId) {
      const normalizedModel = normalizeAIModel(args.model);
      const effectiveMode: "edit" | "plan" =
        args.mode === "plan" ? "plan" : "edit";
      await ctx.scheduler.runAfter(0, internal.daytona.prewarmSessionDaemon, {
        sandboxId: session.sandboxId,
        sessionId: args.sessionId,
        repoId: session.repoId,
        userId: ctx.userId,
        model: normalizedModel,
        allowedTools: MODE_TOOLS[effectiveMode],
        sessionPersistenceId: args.sessionId,
      });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        mode: args.mode,
        model: args.model,
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await trackSessionWorkflow(ctx, args.sessionId, workflowId);

    return null;
  },
});

/** DEV-ONLY latency harness — drive a turn from `npx convex run`. Remove before merge. */
export const devStartExecute = internalMutation({
  args: { sessionId: v.id("sessions"), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    // Mirror startExecute's daemon-pull staging so the warm daemon can claim it.
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      mode: "ask",
      activityLog: "",
    });
    const user = await ctx.db.get(session.userId);
    const { prompt } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: args.message,
      mode: "ask",
    });
    await ctx.db.patch(args.sessionId, {
      pendingTurn: { prompt, requestedAt: Date.now() },
      updatedAt: Date.now(),
    });
    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.prewarmSessionDaemon, {
        sandboxId: session.sandboxId,
        sessionId: args.sessionId,
        repoId: session.repoId,
        userId: session.userId,
        model: normalizeAIModel("sonnet"),
        allowedTools: MODE_TOOLS.edit,
        sessionPersistenceId: args.sessionId,
      });
    }
    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        mode: "ask",
        model: "sonnet",
        userId: session.userId,
        installationId: repo.installationId,
      },
    );
    await trackSessionWorkflow(ctx, args.sessionId, workflowId);
    return null;
  },
});

/**
 * Fired when a session page opens: boot the Claude daemon ahead of the user's
 * first message so that message is warm instead of paying a ~20s cold respawn.
 * No-op unless the session already has a sandbox and is in sdk-daemon mode.
 * Best-effort and cheap to call repeatedly (the action skips if already warm).
 */
export const prewarmDaemon = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.sandboxId) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.scheduler.runAfter(0, internal.daytona.prewarmSessionDaemon, {
      sandboxId: session.sandboxId,
      sessionId: args.sessionId,
      repoId: session.repoId,
      userId: session.userId,
      sessionPersistenceId: args.sessionId,
    });
    return null;
  },
});

/** Queues a message to be processed after the current active workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: aiModelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    await ctx.db.insert("queuedMessages", {
      parentId: args.sessionId,
      content,
      createdAt: Date.now(),
      userId: ctx.userId,
      mode: args.mode,
      model: args.model,
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return null;
  },
});

/** Cancels the active session workflow, kills the sandbox process, and starts queued messages. */
export const cancelExecution = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    await cancelTrackedWorkflow(ctx, session.activeWorkflowId);

    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (last && last.role === "assistant") {
      const patch: {
        content?: string;
        activityLog?: string;
        finishedAt: number;
      } = {
        finishedAt: Date.now(),
      };
      if (!last.content) {
        patch.content = "Execution cancelled by user.";
      }
      if (streaming?.currentActivity) {
        patch.activityLog = streaming.currentActivity;
      }
      await ctx.db.patch(last._id, patch);
    }

    await clearStreamingActivity(ctx, String(args.sessionId));

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      // Clear any staged-but-unclaimed turn so a cancelled prompt is never
      // later picked up by the daemon's claim poll and executed after the fact.
      pendingTurn: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedSessionMessage(ctx, args.sessionId);

    return null;
  },
});
