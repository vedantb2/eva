import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  assertModelMatchesLockedProvider,
  getAIModelProvider,
  normalizeAIModel,
  reasoningLevelValidator,
  sessionModeValidator,
} from "../validators";
import { trackSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { buildSessionPrompt, MODE_TOOLS, resolveToolMode } from "./workflow";
import {
  assertProviderAccountUsableBy,
  resolveDefaultProviderAccountId,
} from "../_userProviderAccounts/defaults";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { notifyChatMentions } from "../_mentions/notifyChatMentions";

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

/** Frontend trigger to start a session execution workflow in the specified mode. */
export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
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

    const normalizedMode =
      args.mode === "ask" || args.mode === "execute" ? "edit" : args.mode;
    if (
      normalizedMode !== "edit" &&
      normalizedMode !== "plan" &&
      normalizedMode !== "design"
    ) {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    assertModelMatchesLockedProvider(session.provider, args.model);

    const credentialOwnerUserId = session.createdBy ?? session.userId;
    // A session runs on its owner's credentials whoever sends the turn, so the
    // account must belong to the owner — collaborators pick from that same pool
    // and can never attach their own.
    let stickyProviderAccountId = await assertProviderAccountUsableBy(
      ctx.db,
      args.providerAccountId,
      credentialOwnerUserId,
    );
    // If the chosen account no longer matches the model provider, fall back
    // to the owner's default for that provider (or Team). Explicit Team
    // (undefined) stays Team.
    if (stickyProviderAccountId) {
      const account = await ctx.db.get(stickyProviderAccountId);
      if (!account || account.provider !== getAIModelProvider(args.model)) {
        stickyProviderAccountId = await resolveDefaultProviderAccountId(
          ctx.db,
          credentialOwnerUserId,
          args.model,
        );
      }
    }

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
      personaId: args.personaId,
      numDesigns: args.numDesigns,
    });

    // Claude uses daemon-pull (`pendingTurn` + claimPendingTurn). Cursor/Codex/
    // Opencode are one-shot launch — staging pendingTurn for them only feeds a
    // leftover Claude daemon mismatch-spam while launchOnExistingSandbox runs.
    const normalizedModel = normalizeAIModel(args.model);
    const usesDaemonPull = getAIModelProvider(normalizedModel) === "claude";
    await ctx.db.patch(args.sessionId, {
      ...(usesDaemonPull
        ? {
            pendingTurn: {
              prompt,
              requestedAt: Date.now(),
              attachmentStorageIds: args.attachmentStorageIds,
              model: normalizedModel,
            },
          }
        : { pendingTurn: undefined }),
      // Deliberately no cancelRequestedAt clear here: staging must never wipe
      // an undrained cancel for a still-running turn (the daemon drains the
      // flag via claimPendingTurn, and ignores it when no turn is active, so a
      // stale flag is harmless — but a wiped one loses the interrupt).
      // Persist the session owner's sticky account for page-open prewarm.
      providerAccountId: stickyProviderAccountId,
      lastModel: normalizedModel,
      lastMode: args.mode,
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

    // Ensure a Claude daemon exists to claim the staged prompt. Skip for
    // one-shot providers (prewarmSessionDaemon already no-ops, but scheduling
    // still races a warm Sonnet daemon against Cursor launches).
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
        allowedTools: MODE_TOOLS[resolveToolMode(args.mode)],
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
        mode: args.mode,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: stickyProviderAccountId,
        credentialOwnerUserId,
        personaId: args.personaId,
        numDesigns: args.numDesigns,
        userId: ctx.userId,
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
 * No-op unless the session already has a sandbox (Claude warm-daemon path).
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
    // Match edit-mode defaults so the first real message does not immediately
    // optsmismatch-kill this daemon (which races with claimPendingTurn and
    // leaves the chat stuck on Working). Traits must be forwarded for the same
    // reason: the turn-path prewarm includes them in the opts sig, so omitting
    // them here made every page-open prewarm mismatch a trait-launched daemon
    // and kill+respawn it (each respawn window can duplicate daemons).
    const credentialOwnerUserId = session.createdBy ?? session.userId;
    const lastMode = session.lastMode ?? "edit";
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
      allowedTools: MODE_TOOLS[resolveToolMode(lastMode)],
      providerAccountId: session.providerAccountId,
      credentialOwnerUserId,
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
    /** Compact chat-display text when `message` is a rich agent prompt. */
    displayContent: v.optional(v.string()),
    mode: sessionModeValidator,
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
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
      mode: args.mode,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      fastMode: args.fastMode,
      providerAccountId: args.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
      personaId: args.personaId,
      numDesigns: args.numDesigns,
    });
    await ctx.db.patch(args.sessionId, {
      lastModel: args.model,
      lastMode: args.mode,
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
 * Claude daemon turn, sets `cancelRequestedAt` so the warm daemon interrupts
 * its own in-flight SDK query on its next `claimPendingTurn` poll, instead of
 * killing the sandbox process — Cursor/Codex/Opencode have no daemon to
 * observe the flag, so they keep the pkill-style kill.
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

    if (getAIModelProvider(normalizeAIModel(session.lastModel)) === "claude") {
      await ctx.db.patch(args.sessionId, { cancelRequestedAt: Date.now() });
    } else if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
        laneKey: null,
      });
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
    if (
      pendingRequestedAt !== undefined &&
      latest.pendingTurn?.requestedAt === pendingRequestedAt
    ) {
      sessionPatch.pendingTurn = undefined;
    }
    if (!newerTurnStaged && !newerWorkflowTracked) {
      sessionPatch.syntheticTurnMessageId = undefined;
    }

    await ctx.db.patch(args.sessionId, sessionPatch);

    await startNextQueuedSessionMessage(ctx, args.sessionId);

    return null;
  },
});
