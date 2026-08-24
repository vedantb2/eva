import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalQuery, type MutationCtx } from "../_generated/server";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import { authAction, authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  assertModelMatchesLockedProvider,
  normalizeAIModel,
  reasoningLevelValidator,
  usesChatDaemon,
} from "../validators";
import { trackSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { syncSessionDaemonState } from "./daemonState";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { buildSessionPrompt, SESSION_TOOLS } from "./workflow";
import { resolveTurnProviderAccountId } from "../_userProviderAccounts/defaults";
import type { Doc, Id } from "../_generated/dataModel";
import { notifyChatMentions } from "../_mentions/notifyChatMentions";
import {
  bindTurnWorkflow,
  closeOpenSessionTurn,
  closeTurnForWorkflow,
  openSessionTurn,
} from "../_chat/turnStore";

async function finalizeOpenSyntheticTurnOnCancel(
  ctx: MutationCtx,
  syntheticTurnMessageId: Id<"messages"> | undefined,
  streaming: Doc<"streamingActivity"> | null,
): Promise<void> {
  if (syntheticTurnMessageId === undefined) return;
  const syntheticMessage = await ctx.db.get(syntheticTurnMessageId);
  if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
    await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
  }
}

/** Frontend trigger to start a session execution workflow. */
export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    // Notify before the turn runs or queues so a mention fires either way.
    await notifyChatMentions(ctx, {
      content: args.message,
      authorUserId: ctx.userId,
      surface: { kind: "session", session },
    });

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    assertModelMatchesLockedProvider(session.provider, args.model);

    const credentialOwnerUserId = session.createdBy ?? session.userId;
    const stickyProviderAccountId = await resolveTurnProviderAccountId(ctx.db, {
      requestedAccountId: args.providerAccountId,
      ownerUserId: session.createdBy ?? session.userId,
      model: args.model,
      changePolicy: "owner-pool",
    });

    // Wipe any stale streaming row before staging the placeholder. The daemon
    // sends its final reconcile heartbeat BEFORE the completion mutation (see
    // finalizeTurn in callback-src/providers/claudeSdkDaemon.ts), so it no
    // longer resurrects the row post-clear; this clear stays as defence in
    // depth — old warm daemons, one-shot providers, and crashed turns can
    // still leave a row holding the finished turn's reply/activity, which the
    // new placeholder below would render as its own response.
    await clearStreamingActivity(ctx, String(args.sessionId));

    // Daemon-pull dispatch: stage the turn for a warm daemon to claim in one
    // poll instead of waiting on the workflow's durable step queue. We must
    // reproduce, in this mutation, the exact side effects the workflow's first
    // two steps used to do — insert the assistant placeholder and build the
    // prompt — so the daemon runs precisely what the workflow would have handed
    // it. The workflow still starts below (for cold-resume, completion,
    // post-turn push/save, and cancellation); it simply no longer pushes the
    // prompt (see sessionExecuteWorkflow), so the turn is never double-executed.
    const placeholderMessageId = await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });

    const user = await ctx.db.get(ctx.userId);
    const { prompt } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: args.message,
    });

    // One-shot providers receive the prompt in their launch payload; persistent
    // chat providers atomically stage it for their sandbox-local daemon.
    const normalizedModel = normalizeAIModel(args.model);
    const usesDaemonPull = usesChatDaemon(normalizedModel);
    const turnId = await openSessionTurn(ctx, {
      sessionId: args.sessionId,
      streamingEntityId: String(args.sessionId),
      placeholderMessageId,
      prompt,
      attachmentStorageIds: args.attachmentStorageIds,
      model: normalizedModel,
      sandboxId: session.sandboxId,
      repoId: session.repoId,
    });
    const pendingTurn = usesDaemonPull
      ? {
          prompt,
          requestedAt: Date.now(),
          turnId,
          attachmentStorageIds: args.attachmentStorageIds,
          model: normalizedModel,
        }
      : undefined;
    await ctx.db.patch(args.sessionId, {
      pendingTurn,
      // Deliberately no cancelRequestedAt clear here: staging must never wipe
      // an undrained cancel for a still-running turn (the daemon drains the
      // flag via claimPendingTurn, and ignores it when no turn is active, so a
      // stale flag is harmless — but a wiped one loses the interrupt).
      // Persist the session owner's sticky account for page-open prewarm.
      providerAccountId: stickyProviderAccountId,
      lastModel: normalizedModel,
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
      ...(args.fastMode !== undefined ? { lastFastMode: args.fastMode } : {}),
      updatedAt: Date.now(),
    });
    await syncSessionDaemonState(ctx, session, { pendingTurn });

    // Ensure the provider's chat daemon exists to claim the staged prompt.
    if (usesDaemonPull && session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.prewarmSessionDaemon, {
        sandboxId: session.sandboxId,
        sessionId: args.sessionId,
        repoId: session.repoId,
        userId: ctx.userId,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: SESSION_TOOLS,
        providerAccountId: stickyProviderAccountId,
        credentialOwnerUserId,
        sessionPersistenceId: args.sessionId,
      });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: stickyProviderAccountId,
        credentialOwnerUserId,
        userId: ctx.userId,
        installationId: repo.installationId,
        turnId,
      },
    );

    await bindTurnWorkflow(ctx, turnId, String(workflowId));
    await trackSessionWorkflow(ctx, args.sessionId, workflowId);

    return null;
  },
});

/**
 * Fired when a session page opens: boot its chat daemon ahead of the user's
 * first message so that message is warm instead of paying a ~20s cold respawn.
 * No-op unless the session already has a sandbox and uses a daemon provider.
 * Best-effort and cheap to call repeatedly (the action skips if already warm).
 */
export const prewarmDaemon = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.sandboxId) return null;
    // Never prewarm a stopped/stopping session. prewarmSessionDaemon execs on
    // the sandbox, and on Vercel any exec lazily resumes a stopped VM (SDK
    // withResume) — resurrecting a sandbox the user stopped, invisibly (the
    // session status stays "closed"). A closed session keeps its sandboxId, so
    // without this guard merely opening its page (SessionDetailClient fires this
    // on mount) wakes the VM behind the user's back.
    if (session.status === "closed" || session.status === "stopping")
      return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    // Match the turn path's launch options so the first real message does not
    // immediately optsmismatch-kill this daemon (which races with
    // claimPendingTurn and leaves the chat stuck on Working). Traits must be
    // forwarded for the same reason: the turn-path prewarm includes them in the
    // opts sig, so omitting them here made every page-open prewarm mismatch a
    // trait-launched daemon and kill+respawn it (each respawn window can
    // duplicate daemons).
    const credentialOwnerUserId = session.createdBy ?? session.userId;
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmSessionDaemon, {
      sandboxId: session.sandboxId,
      sessionId: args.sessionId,
      repoId: session.repoId,
      userId: session.userId,
      model: normalizeAIModel(session.lastModel),
      reasoningLevel: session.lastReasoningLevel,
      thinkingEnabled: session.lastThinkingEnabled,
      use1mContext: session.lastUse1mContext,
      fastMode: session.lastFastMode,
      allowedTools: SESSION_TOOLS,
      providerAccountId: session.providerAccountId,
      credentialOwnerUserId,
      sessionPersistenceId: args.sessionId,
    });
    return null;
  },
});

/**
 * Waits for account-switch prewarming to finish before the composer is
 * re-enabled, preventing the previous credential daemon from claiming the next
 * turn during its replacement window.
 */
export const prewarmDaemonNow = authAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.sessionWorkflow.getDaemonPrewarmData,
      { sessionId: args.sessionId, userId: ctx.userId },
    );
    if (!data) return null;
    await ctx.runAction(internal.sandbox.prewarmSessionDaemon, {
      sandboxId: data.sandboxId,
      sessionId: args.sessionId,
      repoId: data.repoId,
      userId: data.ownerUserId,
      model: data.model,
      reasoningLevel: data.reasoningLevel,
      thinkingEnabled: data.thinkingEnabled,
      use1mContext: data.use1mContext,
      fastMode: data.fastMode,
      allowedTools: SESSION_TOOLS,
      providerAccountId: data.providerAccountId,
      credentialOwnerUserId: data.credentialOwnerUserId,
      sessionPersistenceId: args.sessionId,
    });
    return null;
  },
});

export const getDaemonPrewarmData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      sandboxId: v.string(),
      repoId: v.id("githubRepos"),
      ownerUserId: v.id("users"),
      credentialOwnerUserId: v.id("users"),
      model: aiModelValidator,
      reasoningLevel: v.optional(reasoningLevelValidator),
      thinkingEnabled: v.optional(v.boolean()),
      use1mContext: v.optional(v.boolean()),
      fastMode: v.optional(v.boolean()),
      providerAccountId: v.optional(v.id("userProviderAccounts")),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, args.userId))) {
      throw new Error("Not authorized");
    }
    if (
      !session.sandboxId ||
      session.status === "closed" ||
      session.status === "stopping"
    ) {
      return null;
    }
    return {
      sandboxId: session.sandboxId,
      repoId: session.repoId,
      ownerUserId: session.userId,
      credentialOwnerUserId: session.createdBy ?? session.userId,
      model: normalizeAIModel(session.lastModel),
      reasoningLevel: session.lastReasoningLevel,
      thinkingEnabled: session.lastThinkingEnabled,
      use1mContext: session.lastUse1mContext,
      fastMode: session.lastFastMode,
      providerAccountId: session.providerAccountId,
    };
  },
});

/** Queues a message to be processed after the current active workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    /** Compact chat-display text when `message` is a rich agent prompt. */
    displayContent: v.optional(v.string()),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;
    const displayContent = args.displayContent?.trim();

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    assertModelMatchesLockedProvider(session.provider, args.model);

    const providerAccountId = await resolveTurnProviderAccountId(ctx.db, {
      requestedAccountId: args.providerAccountId,
      ownerUserId: session.createdBy ?? session.userId,
      model: args.model,
      changePolicy: "owner-pool",
    });

    await notifyChatMentions(ctx, {
      content: displayContent || content,
      authorUserId: ctx.userId,
      surface: { kind: "session", session },
    });

    await ctx.db.insert("queuedMessages", {
      parentId: args.sessionId,
      content,
      displayContent: displayContent || undefined,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      fastMode: args.fastMode,
      providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.sessionId, {
      lastModel: args.model,
      providerAccountId,
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
      ...(args.fastMode !== undefined ? { lastFastMode: args.fastMode } : {}),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Cancels the active session workflow and starts queued messages. For a
 * daemon-backed turn, sets `cancelRequestedAt` so the warm provider process
 * interrupts its own in-flight turn on its next `claimPendingTurn` poll.
 * One-shot providers retain the process-kill path.
 */
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

    // Snapshot what this cancel owns. A concurrent startExecute may stage a
    // newer pendingTurn / activeWorkflowId while we run — must not clear those
    // or mark the newer assistant placeholder as cancelled.
    const workflowIdToCancel = session.activeWorkflowId;
    const pendingRequestedAt = session.pendingTurn?.requestedAt;

    await cancelTrackedWorkflow(ctx, workflowIdToCancel);

    if (usesChatDaemon(normalizeAIModel(session.lastModel))) {
      const cancelRequestedAt = Date.now();
      await ctx.db.patch(args.sessionId, { cancelRequestedAt });
      await syncSessionDaemonState(ctx, session, { cancelRequestedAt });
    } else if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    if (workflowIdToCancel !== undefined) {
      await closeTurnForWorkflow(
        ctx,
        args.sessionId,
        workflowIdToCancel,
        "cancelled",
        { error: "Cancelled by the user" },
      );
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();

    const latest = await ctx.db.get(args.sessionId);
    if (!latest) return null;

    const newerTurnStaged =
      latest.pendingTurn !== undefined &&
      latest.pendingTurn.requestedAt !== pendingRequestedAt;
    const newerWorkflowTracked =
      latest.activeWorkflowId !== undefined &&
      latest.activeWorkflowId !== workflowIdToCancel;

    if (!newerTurnStaged && !newerWorkflowTracked) {
      const syntheticTurnMessageId = latest.syntheticTurnMessageId;
      const last = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
        .order("desc")
        .first();
      if (
        last &&
        last.role === "assistant" &&
        last.finishedAt === undefined &&
        last._id !== syntheticTurnMessageId
      ) {
        await finalizeCancelledAssistantMessage(ctx, last, streaming);
      }
      await finalizeOpenSyntheticTurnOnCancel(
        ctx,
        syntheticTurnMessageId,
        streaming,
      );
      await closeOpenSessionTurn(ctx, args.sessionId, "cancelled", {
        error: "Cancelled by the user",
      });
    }

    await clearStreamingActivity(ctx, String(args.sessionId));

    const sessionPatch: {
      activeWorkflowId?: undefined;
      pendingTurn?: undefined;
      syntheticTurnMessageId?: undefined;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (
      workflowIdToCancel !== undefined &&
      latest.activeWorkflowId === workflowIdToCancel
    ) {
      sessionPatch.activeWorkflowId = undefined;
    }
    const clearsPendingTurn =
      pendingRequestedAt !== undefined &&
      latest.pendingTurn?.requestedAt === pendingRequestedAt;
    if (clearsPendingTurn) {
      sessionPatch.pendingTurn = undefined;
    }
    if (!newerTurnStaged && !newerWorkflowTracked) {
      sessionPatch.syntheticTurnMessageId = undefined;
    }

    await ctx.db.patch(args.sessionId, sessionPatch);
    if (clearsPendingTurn) {
      await syncSessionDaemonState(ctx, latest, { pendingTurn: undefined });
    }

    await startNextQueuedSessionMessage(ctx, args.sessionId);

    return null;
  },
});
