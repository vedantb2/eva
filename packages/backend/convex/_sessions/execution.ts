import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  getAIModelProvider,
  normalizeAIModel,
  reasoningLevelValidator,
  sessionModeValidator,
} from "../validators";
import { trackSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import {
  clearStreamingActivityForTurn,
  finalizeCancelledAssistantMessage,
} from "../streaming";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { buildSessionPrompt, MODE_TOOLS, resolveToolMode } from "./workflow";
import {
  assertProviderAccountOwnedBy,
  resolveDefaultProviderAccountId,
} from "../_userProviderAccounts/defaults";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { usesChatDaemon } from "../_chat/daemonTransport";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";
import {
  enqueueAcceptedTurn,
  findExistingTurn,
  insertAcceptedTurnMessages,
  turnRequestFingerprint,
  validateClientTurnId,
} from "../_chat/turnLifecycle";
import { optionalChatTurnIdentityFields } from "../_validators/tableFields";
import { clearPendingQuestionsForTurn } from "../pendingQuestions";
import {
  callbackMatchesActiveTurn,
  exactTurnIdentity,
  turnIdentityMatches,
} from "../_chat/turnIdentity";

const submitTurnResultValidator = v.object({
  kind: v.union(
    v.literal("active"),
    v.literal("queued"),
    v.literal("existing"),
  ),
  turnId: v.string(),
  userMessageId: v.optional(v.id("messages")),
  assistantMessageId: v.optional(v.id("messages")),
  queuedMessageId: v.optional(v.id("queuedMessages")),
});

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

/** Atomically accepts one session turn and lets the server choose active/queued. */
export const submitTurn = authMutation({
  args: {
    sessionId: v.id("sessions"),
    ...optionalChatTurnIdentityFields,
    turnId: v.string(),
    message: v.string(),
    displayContent: v.optional(v.string()),
    mode: sessionModeValidator,
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
  },
  returns: submitTurnResultValidator,
  handler: async (
    ctx,
    args,
  ): Promise<typeof submitTurnResultValidator.type> => {
    validateClientTurnId(args.turnId);
    const content = args.message.trim();
    if (content.length === 0) throw new Error("Message cannot be empty");
    const displayContent = args.displayContent?.trim() || undefined;
    const normalizedMode =
      args.mode === "ask" || args.mode === "execute" ? "edit" : args.mode;
    if (
      normalizedMode !== "edit" &&
      normalizedMode !== "plan" &&
      normalizedMode !== "design"
    ) {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const normalizedModel = normalizeAIModel(args.model);
    const credentialOwnerUserId = session.createdBy ?? session.userId;
    let providerAccountId = session.providerAccountId;
    if (ctx.userId === credentialOwnerUserId) {
      providerAccountId = await assertProviderAccountOwnedBy(
        ctx.db,
        args.providerAccountId,
        credentialOwnerUserId,
      );
      if (providerAccountId !== undefined) {
        const account = await ctx.db.get(providerAccountId);
        if (
          account === null ||
          account.provider !== getAIModelProvider(normalizedModel)
        ) {
          providerAccountId = await resolveDefaultProviderAccountId(
            ctx.db,
            credentialOwnerUserId,
            normalizedModel,
          );
        }
      }
    }

    const snapshot = {
      content,
      displayContent,
      mode: args.mode,
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
      personaId: args.personaId,
      numDesigns: args.numDesigns,
    };
    const fingerprint = turnRequestFingerprint(snapshot);
    const existing = await findExistingTurn(
      ctx,
      args.sessionId,
      args.turnId,
      fingerprint,
    );
    if (existing !== null) {
      return {
        kind: "existing",
        turnId: args.turnId,
        ...(existing.kind === "queued"
          ? { queuedMessageId: existing.queuedMessageId }
          : {
              userMessageId: existing.userMessageId,
              assistantMessageId: existing.assistantMessageId,
            }),
      };
    }

    const busy =
      session.activeTurn !== undefined ||
      session.activeWorkflowId !== undefined ||
      session.pendingTurn !== undefined;
    if (busy) {
      const queuedMessageId = await enqueueAcceptedTurn(ctx, {
        parentId: args.sessionId,
        turnId: args.turnId,
        fingerprint,
        userId: ctx.userId,
        snapshot,
      });
      await ctx.db.patch(args.sessionId, {
        providerAccountId,
        lastModel: normalizedModel,
        lastMode: args.mode,
        lastReasoningLevel: args.reasoningLevel,
        lastThinkingEnabled: args.thinkingEnabled,
        lastUse1mContext: args.use1mContext,
        updatedAt: Date.now(),
      });
      return { kind: "queued", turnId: args.turnId, queuedMessageId };
    }

    const ids = await insertAcceptedTurnMessages(ctx, {
      parentId: args.sessionId,
      turnId: args.turnId,
      fingerprint,
      userId: ctx.userId,
      content: displayContent ?? content,
      mode: args.mode,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        providerAccountId,
        credentialOwnerUserId,
      ),
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
      personaId: args.personaId,
    });
    const activeTurn = {
      turnId: args.turnId,
      assistantMessageId: ids.assistantMessageId,
      attempt: 1,
      acceptedAt: Date.now(),
    };
    await ctx.db.patch(args.sessionId, {
      activeTurn,
      providerAccountId,
      lastModel: normalizedModel,
      lastMode: args.mode,
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      updatedAt: Date.now(),
    });
    await clearStreamingActivity(ctx, String(args.sessionId));

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: content,
        mode: args.mode,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId,
        credentialOwnerUserId,
        personaId: args.personaId,
        numDesigns: args.numDesigns,
        userId: ctx.userId,
        installationId: repo.installationId,
        turnId: activeTurn.turnId,
        assistantMessageId: activeTurn.assistantMessageId,
        attempt: activeTurn.attempt,
      },
    );
    await trackSessionWorkflow(ctx, args.sessionId, workflowId);
    return {
      kind: "active",
      turnId: args.turnId,
      userMessageId: ids.userMessageId,
      assistantMessageId: ids.assistantMessageId,
    };
  },
});

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

    const credentialOwnerUserId = session.createdBy ?? session.userId;
    const isOwner = ctx.userId === credentialOwnerUserId;
    // Owner-sticky: only the session owner may change the personal account.
    // Collaborators always use the sticky account already on the session.
    let stickyProviderAccountId = session.providerAccountId;
    if (isOwner) {
      stickyProviderAccountId = await assertProviderAccountOwnedBy(
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

    // Claude and Cursor use daemon-pull (`pendingTurn` + claimPendingTurn).
    // Codex and Opencode launch one process with the prompt.
    const normalizedModel = normalizeAIModel(args.model);
    const usesDaemonPull = usesChatDaemon(
      normalizedModel,
      session.cursorTransport,
    );
    await ctx.db.patch(args.sessionId, {
      ...(usesDaemonPull
        ? {
            pendingTurn: {
              prompt,
              requestedAt: Date.now(),
              attachmentStorageIds: args.attachmentStorageIds,
              model: normalizedModel,
              mode: args.mode,
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
        cursorTransport: session.cursorTransport,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
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
    // leaves the chat stuck on Working).
    const credentialOwnerUserId = session.createdBy ?? session.userId;
    const lastMode = session.lastMode ?? "edit";
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmSessionDaemon, {
      sandboxId: session.sandboxId,
      sessionId: args.sessionId,
      repoId: session.repoId,
      userId: session.userId,
      model: normalizeAIModel(session.lastModel),
      cursorTransport: session.cursorTransport,
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const turnIdentity = exactTurnIdentity(args);
    if (session.activeTurn !== undefined) {
      if (
        turnIdentity === null ||
        !callbackMatchesActiveTurn(session, turnIdentity)
      ) {
        return null;
      }
      await clearPendingQuestionsForTurn(
        ctx.db,
        String(args.sessionId),
        turnIdentity,
      );
      await cancelTrackedWorkflow(ctx, session.activeWorkflowId);
      if (usesChatDaemon(session.lastModel, session.cursorTransport)) {
        await ctx.db.patch(args.sessionId, { cancelRequestedAt: Date.now() });
      } else if (session.sandboxId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: session.sandboxId,
          repoId: session.repoId,
        });
      }
      const streaming = await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
        .first();
      const assistant = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        assistant !== null &&
        assistant.parentId === args.sessionId &&
        assistant.turnId === turnIdentity.turnId &&
        assistant.finishedAt === undefined
      ) {
        await finalizeCancelledAssistantMessage(
          ctx,
          assistant,
          streaming !== null && turnIdentityMatches(streaming, turnIdentity)
            ? streaming
            : null,
        );
      }
      await clearStreamingActivityForTurn(
        ctx,
        String(args.sessionId),
        turnIdentity,
      );
      await ctx.db.patch(args.sessionId, {
        activeTurn: undefined,
        activeWorkflowId: undefined,
        pendingTurn: undefined,
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedSessionMessage(ctx, args.sessionId);
      return null;
    }

    // Snapshot what this cancel owns. A concurrent startExecute may stage a
    // newer pendingTurn / activeWorkflowId while we run — must not clear those
    // or mark the newer assistant placeholder as cancelled.
    const workflowIdToCancel = session.activeWorkflowId;
    const pendingRequestedAt = session.pendingTurn?.requestedAt;

    await cancelTrackedWorkflow(ctx, workflowIdToCancel);

    if (usesChatDaemon(session.lastModel, session.cursorTransport)) {
      await ctx.db.patch(args.sessionId, { cancelRequestedAt: Date.now() });
    } else if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
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
