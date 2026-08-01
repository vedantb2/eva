import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow, cancelTrackedWorkflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_sandbox_runtime/resumeSandboxSteps";
import { authMutation, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  reasoningLevelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
  taskSandboxStatusValidator,
  cursorTransportValidator,
} from "./validators";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
  resolveTaskBranchName,
} from "./_taskWorkflow/helpers";
import {
  clearStreamingActivityForTurn,
  finalizeCancelledAssistantMessage,
} from "./streaming";
import { startNextQueuedTaskChatMessage } from "./_queues/helpers";
import {
  trackAgentTaskChatWorkflow,
  TASK_CHAT_STREAM_PREFIX,
} from "./workflowWatchdog";
import { buildAgentTaskChatPrompt } from "./_agentTasks/chatPrompt";
import { buildCustomInstructionsBlock } from "./prompts";
import { resolveMessageTokens } from "./_mentions/resolveMessageTokens";
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";
import type { Doc, Id } from "./_generated/dataModel";
import { TASK_CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";
import { clearPendingQuestionsForTurn } from "./pendingQuestions";
import { usesChatDaemon } from "./_chat/daemonTransport";
import { optionalChatTurnIdentityFields } from "./_validators/tableFields";
import {
  callbackMatchesActiveTurn,
  exactTurnIdentity,
  turnIdentityMatches,
} from "./_chat/turnIdentity";
import {
  enqueueAcceptedTurn,
  findExistingTurn,
  insertAcceptedTurnMessages,
  turnRequestFingerprint,
  validateClientTurnId,
} from "./_chat/turnLifecycle";

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

const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";

async function buildTaskChatTurnPrompt(
  ctx: QueryCtx,
  args: {
    taskId: Id<"agentTasks">;
    message: string;
    userId: Id<"users">;
  },
): Promise<{
  prompt: string;
  attachmentStorageIds: Id<"_storage">[] | undefined;
}> {
  const task = await ctx.db.get(args.taskId);
  if (!task) throw new Error("Task not found");
  if (!task.repoId) throw new Error("Task is not associated with a repo");

  const repo = await ctx.db.get(task.repoId);
  if (!repo) throw new Error("Repository not found");

  const triggeringUserMessage = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
    .order("desc")
    .filter((q) => q.eq(q.field("role"), "user"))
    .first();

  const user = await ctx.db.get(args.userId);
  const customInstructionsBlock = buildCustomInstructionsBlock(
    user?.role ?? undefined,
    user?.customInstructions ?? undefined,
  );

  const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
    ctx,
    args.message,
    task.repoId,
  );

  const branchName = await resolveTaskBranchName(ctx.db, task);

  let prompt = buildAgentTaskChatPrompt({
    repoOwner: repo.owner,
    repoName: repo.name,
    branchName,
    title: task.title,
    description: task.description,
    tags: task.tags,
    taskNumber: task.taskNumber,
    status: task.status,
    message: resolvedMessage,
    rootDirectory: repo.rootDirectory ?? "",
    customInstructionsBlock,
    systemPrompt: repo.systemPrompt,
    captureProof: task.chatCaptureProofEnabled === true,
    devPort: task.devPort ?? repo.devPort,
  });
  if (prefixBlock) {
    prompt = `${prefixBlock}\n\n${prompt}`;
  }

  return {
    prompt,
    attachmentStorageIds: triggeringUserMessage?.attachmentStorageIds,
  };
}

// --- Completion event ---

export const agentTaskChatCompleteEvent = defineEvent({
  name: "agentTaskChatComplete",
  validator: workflowCompleteValidator,
});

// --- Public mutations ---

/** Atomically accepts one task chat turn and chooses active or queued. */
export const submitTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    turnId: v.string(),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: submitTurnResultValidator,
  handler: async (
    ctx,
    args,
  ): Promise<typeof submitTurnResultValidator.type> => {
    validateClientTurnId(args.turnId);
    const content = args.message.trim();
    if (content.length === 0) throw new Error("Message cannot be empty");
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    void args.providerAccountId;
    const normalizedModel = normalizeAIModel(args.model);
    const snapshot = {
      content,
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      providerAccountId: task.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    };
    const fingerprint = turnRequestFingerprint(snapshot);
    const existing = await findExistingTurn(
      ctx,
      args.taskId,
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
      task.activeTurn !== undefined ||
      task.activeChatWorkflowId !== undefined ||
      task.pendingTurn !== undefined;
    if (busy) {
      const queuedMessageId = await enqueueAcceptedTurn(ctx, {
        parentId: args.taskId,
        turnId: args.turnId,
        fingerprint,
        userId: ctx.userId,
        snapshot,
      });
      await ctx.db.patch(args.taskId, {
        lastChatModel: normalizedModel,
        lastReasoningLevel: args.reasoningLevel,
        lastThinkingEnabled: args.thinkingEnabled,
        lastUse1mContext: args.use1mContext,
        updatedAt: Date.now(),
      });
      return { kind: "queued", turnId: args.turnId, queuedMessageId };
    }

    const ids = await insertAcceptedTurnMessages(ctx, {
      parentId: args.taskId,
      turnId: args.turnId,
      fingerprint,
      userId: ctx.userId,
      content,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        task.providerAccountId,
        task.createdBy,
      ),
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
    });
    const activeTurn = {
      turnId: args.turnId,
      assistantMessageId: ids.assistantMessageId,
      attempt: 1,
      acceptedAt: Date.now(),
    };
    await ctx.db.patch(args.taskId, {
      activeTurn,
      lastChatModel: normalizedModel,
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      updatedAt: Date.now(),
    });
    await clearStreamingActivity(
      ctx,
      `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`,
    );
    const workflowId = await workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId: args.taskId,
        message: content,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId: task.providerAccountId,
        credentialOwnerUserId: task.createdBy,
        userId: ctx.userId,
        turnId: activeTurn.turnId,
        assistantMessageId: activeTurn.assistantMessageId,
        attempt: activeTurn.attempt,
      },
    );
    await trackAgentTaskChatWorkflow(ctx, args.taskId, workflowId);
    return {
      kind: "active",
      turnId: args.turnId,
      userMessageId: ids.userMessageId,
      assistantMessageId: ids.assistantMessageId,
    };
  },
});

/**
 * Cancels the active task chat workflow and starts any queued message. For a
 * Claude daemon turn, sets `cancelRequestedAt` so the warm daemon interrupts
 * its own in-flight SDK query on its next `claimPendingTurn` poll, instead of
 * killing the sandbox process — Cursor/Codex/Opencode have no daemon to
 * observe the flag, so they keep the pkill-style kill.
 */
export const cancelExecution = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    const turnIdentity = exactTurnIdentity(args);
    if (task.activeTurn !== undefined) {
      if (
        turnIdentity === null ||
        !callbackMatchesActiveTurn(task, turnIdentity)
      ) {
        return null;
      }
      await clearPendingQuestionsForTurn(
        ctx.db,
        String(args.taskId),
        turnIdentity,
      );
      await cancelTrackedWorkflow(ctx, task.activeChatWorkflowId);
      if (
        usesChatDaemon(task.lastChatModel ?? task.model, task.cursorTransport)
      ) {
        await ctx.db.patch(args.taskId, { cancelRequestedAt: Date.now() });
      } else if (task.sandboxId && task.repoId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
        });
      }
      const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
      const streaming = await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
        .first();
      const assistant = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        assistant !== null &&
        assistant.parentId === args.taskId &&
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
      await clearStreamingActivityForTurn(ctx, streamingEntityId, turnIdentity);
      await ctx.db.patch(args.taskId, {
        activeTurn: undefined,
        activeChatWorkflowId: undefined,
        pendingTurn: undefined,
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedTaskChatMessage(ctx, args.taskId);
      return null;
    }

    await cancelTrackedWorkflow(ctx, task.activeChatWorkflowId);

    const workflowIdToCancel = task.activeChatWorkflowId;
    const pendingRequestedAt = task.pendingTurn?.requestedAt;

    if (
      usesChatDaemon(task.lastChatModel ?? task.model, task.cursorTransport)
    ) {
      await ctx.db.patch(args.taskId, { cancelRequestedAt: Date.now() });
    } else if (task.sandboxId && task.repoId) {
      if (task.activeWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
          entityIdField: "taskId",
          entityId: String(args.taskId),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
        });
      }
    }

    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();

    const latest = await ctx.db.get(args.taskId);
    if (!latest) return null;

    const newerTurnStaged =
      latest.pendingTurn !== undefined &&
      latest.pendingTurn.requestedAt !== pendingRequestedAt;
    const newerWorkflowTracked =
      latest.activeChatWorkflowId !== undefined &&
      latest.activeChatWorkflowId !== workflowIdToCancel;

    if (!newerTurnStaged && !newerWorkflowTracked) {
      const syntheticTurnMessageId = latest.syntheticTurnMessageId;
      const last = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
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

    await clearStreamingActivity(ctx, streamingEntityId);

    const taskPatch: {
      activeChatWorkflowId?: undefined;
      pendingTurn?: undefined;
      syntheticTurnMessageId?: undefined;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (
      workflowIdToCancel !== undefined &&
      latest.activeChatWorkflowId === workflowIdToCancel
    ) {
      taskPatch.activeChatWorkflowId = undefined;
    }
    if (
      pendingRequestedAt !== undefined &&
      latest.pendingTurn?.requestedAt === pendingRequestedAt
    ) {
      taskPatch.pendingTurn = undefined;
    }
    if (!newerTurnStaged && !newerWorkflowTracked) {
      taskPatch.syntheticTurnMessageId = undefined;
    }

    await ctx.db.patch(args.taskId, taskPatch);

    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

// --- Workflow definition ---

/** Runs a single chat message through the task's existing sandbox agent. */
export const agentTaskChatExecuteWorkflow = workflow.define({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    credentialOwnerUserId: v.optional(v.id("users")),
    userId: v.id("users"),
    ...optionalChatTurnIdentityFields,
  },
  handler: async (step, args): Promise<void> => {
    const turnIdentity = exactTurnIdentity(args);
    await step.runMutation(
      internal.agentTaskChatWorkflow.addAssistantPlaceholder,
      { taskId: args.taskId, ...turnIdentity },
    );

    const data = await step.runQuery(
      internal.agentTaskChatWorkflow.getChatData,
      {
        taskId: args.taskId,
        message: args.message,
        model: args.model,
        userId: args.userId,
      },
    );

    if (!data.sandboxId) {
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the task sandbox before sending chat messages.",
        activityLog: null,
        ...turnIdentity,
      });
      return;
    }

    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;

    // Bring an archived/stopped sandbox back to "started" via durable polling
    // steps before validating, so a multi-minute cold-storage thaw doesn't blow
    // the per-action 10-minute limit. Once started, validate hits its fast path.
    let started: Awaited<ReturnType<typeof ensureSandboxStartedSteps>>;
    try {
      started = await ensureSandboxStartedSteps(step, {
        sandboxId: data.sandboxId,
        repoId: data.repoId,
        streamingEntityId,
        sandboxRunning: data.sandboxStatus === "active",
      });
    } catch (error) {
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "Task sandbox could not be restored from cold storage. Please retry.",
        activityLog: null,
        ...turnIdentity,
      });
      return;
    }

    const activeSandboxId = started.thawId;
    if (!activeSandboxId) {
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the task sandbox before sending chat messages.",
        activityLog: null,
        ...turnIdentity,
      });
      return;
    }

    const validation = await step.runAction(
      internal.sandbox.validateSandbox,
      { sandboxId: activeSandboxId, repoId: data.repoId },
      { retry: false },
    );

    if (!validation.healthy) {
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          "Task sandbox is no longer reachable. Restart it from the sandbox panel.",
        activityLog: null,
        ...turnIdentity,
      });
      return;
    }

    if (usesChatDaemon(data.model, data.cursorTransport)) {
      await step.runMutation(internal.agentTaskChatWorkflow.ensurePendingTurn, {
        taskId: args.taskId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: args.model,
        ...turnIdentity,
      });

      await step.runAction(internal.sandbox.prewarmEntityDaemon, {
        sandboxId: activeSandboxId,
        repoId: data.repoId,
        userId: args.userId,
        entityId: String(args.taskId),
        entityIdField: "taskId",
        completionMutation: "agentTaskChatWorkflow:handleCompletion",
        ...TASK_CHAT_DAEMON_MUTATIONS,
        model: data.model,
        cursorTransport: data.cursorTransport,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        sessionPersistenceId: args.taskId,
        activeWorkflowField: "activeChatWorkflowId",
        skipPrewarm: false,
        entityTable: "agentTasks",
      });
    } else {
      await step.runAction(internal.sandbox.launchOnExistingSandbox, {
        sandboxId: activeSandboxId,
        entityId: args.taskId,
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "agentTaskChatWorkflow:handleCompletion",
        entityIdField: "taskId",
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        allowedTools: CHAT_ALLOWED_TOOLS,
        repoId: data.repoId,
        sessionPersistenceId: args.taskId,
        streamingEntityId,
        attachmentStorageIds: data.attachmentStorageIds,
        turnIdentity: turnIdentity ?? undefined,
      });
    }

    const result = await step.awaitEvent(agentTaskChatCompleteEvent);

    let savedSuccess = result.success;
    let savedError = result.error;

    if (result.success && activeSandboxId && data.branchName) {
      try {
        await step.runAction(internal.sandbox.pushSandboxBranch, {
          sandboxId: activeSandboxId,
          installationId: data.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
        });
      } catch (error) {
        savedSuccess = false;
        savedError = `Chat completed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
        console.error(
          `[agentTaskChatWorkflow] pushSandboxBranch failed taskId=${String(args.taskId)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
      taskId: args.taskId,
      success: savedSuccess,
      result: result.result,
      error: savedError,
      activityLog: result.activityLog,
      pendingQuestion: result.pendingQuestion,
      ...turnIdentity,
    });

    // Fire a detached audit when the task has chat audit enabled. No-ops when
    // off / no sandbox / no categories / an audit is already running. Wrapped
    // so an audit failure never fails the chat turn.
    if (savedSuccess) {
      try {
        await step.runMutation(internal.audits.maybeStartTaskChatAudit, {
          taskId: args.taskId,
          userId: args.userId,
        });
      } catch (error) {
        console.error(
          `[agentTaskChatWorkflow] maybeStartTaskChatAudit failed taskId=${String(args.taskId)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the task chat for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    const turnIdentity = exactTurnIdentity(args);
    if (turnIdentity !== null) {
      const assistant = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        assistant === null ||
        assistant.parentId !== args.taskId ||
        assistant.turnId !== turnIdentity.turnId ||
        assistant.role !== "assistant"
      ) {
        throw new Error("Accepted task turn is missing its assistant row");
      }
      return null;
    }

    const recent = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
      .order("desc")
      .take(5);
    const lastTurnMessage = recent[0];
    if (
      lastTurnMessage &&
      lastTurnMessage.role === "assistant" &&
      lastTurnMessage.content === "" &&
      lastTurnMessage.finishedAt === undefined &&
      lastTurnMessage.isSyntheticTurn !== true
    ) {
      return null;
    }

    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });
    await ctx.db.patch(args.taskId, { updatedAt: Date.now() });
    return null;
  },
});

/** Fetches task + repo data and builds the chat prompt. */
export const getChatData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
    userId: v.id("users"),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    sandboxStatus: v.optional(taskSandboxStatusValidator),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.string(),
    prompt: v.string(),
    model: aiModelValidator,
    cursorTransport: v.optional(cursorTransportValidator),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.repoId) throw new Error("Task is not associated with a repo");

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const { prompt, attachmentStorageIds } = await buildTaskChatTurnPrompt(
      ctx,
      {
        taskId: args.taskId,
        message: args.message,
        userId: args.userId,
      },
    );

    const branchName = await resolveTaskBranchName(ctx.db, task);

    return {
      sandboxId: task.sandboxId,
      sandboxStatus: task.reviewTaskSandboxStatus,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: task.repoId,
      installationId: repo.installationId,
      branchName,
      prompt,
      model: normalizeAIModel(args.model),
      cursorTransport: task.cursorTransport,
      attachmentStorageIds,
    };
  },
});

/** Saves the chat result, finalising the last assistant message and starting the next queued message. */
export const saveResult = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    const turnIdentity = exactTurnIdentity(args);
    let last: Doc<"messages"> | null;
    if (turnIdentity !== null) {
      if (!callbackMatchesActiveTurn(task, turnIdentity)) return null;
      await clearStreamingActivityForTurn(ctx, streamingEntityId, turnIdentity);
      last = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        last === null ||
        last.parentId !== args.taskId ||
        last.turnId !== turnIdentity.turnId
      ) {
        return null;
      }
    } else {
      await clearStreamingActivity(ctx, streamingEntityId);
      last = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
        .order("desc")
        .first();
    }
    if (last && last.role === "assistant" && last.isSyntheticTurn !== true) {
      const patch: {
        content: string;
        activityLog?: string;
        finishedAt: number;
        pendingQuestion?: string;
      } = {
        content: args.success
          ? args.result || "I couldn't process your message."
          : `Error: ${args.error || "Unknown error during execution."}`,
        finishedAt: Date.now(),
      };
      if (args.activityLog) patch.activityLog = args.activityLog;
      if (args.pendingQuestion) patch.pendingQuestion = args.pendingQuestion;
      await ctx.db.patch(last._id, patch);
    }

    await ctx.db.patch(args.taskId, {
      activeChatWorkflowId: undefined,
      ...(turnIdentity !== null ? { activeTurn: undefined } : {}),
      updatedAt: Date.now(),
    });

    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

/** Receives sandbox completion callback and forwards the event to the active chat workflow. */
export const handleCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.activeChatWorkflowId) return null;
    if (!task.repoId) return null;
    if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (!callbackMatchesActiveTurn(task, args)) return null;
    const completionTurnIdentity = exactTurnIdentity(args);
    if (completionTurnIdentity !== null) {
      await clearPendingQuestionsForTurn(
        ctx.db,
        String(args.taskId),
        completionTurnIdentity,
      );
    }

    if (task.pendingTurn !== undefined) {
      await ctx.db.patch(args.taskId, { pendingTurn: undefined });
    }

    await sendCompletionEvent(
      ctx,
      agentTaskChatCompleteEvent,
      task.activeChatWorkflowId,
      {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    );

    await recordCompletionLog(ctx, {
      entityType: "task-chat",
      entityId: String(args.taskId),
      entityTitle: task.title,
      repoId: task.repoId,
      rawResultEvent: args.rawResultEvent,
      projectId: task.projectId,
    });

    return null;
  },
});

/** Fired when the task sandbox chat view opens to warm the chat daemon. */
export const prewarmChatDaemon = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task?.sandboxId || !task.repoId) return null;
    if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
      sandboxId: task.sandboxId,
      repoId: task.repoId,
      userId: ctx.userId,
      entityId: String(args.taskId),
      entityIdField: "taskId",
      completionMutation: "agentTaskChatWorkflow:handleCompletion",
      ...TASK_CHAT_DAEMON_MUTATIONS,
      model: normalizeAIModel(task.lastChatModel ?? task.model),
      cursorTransport: task.cursorTransport,
      allowedTools: CHAT_ALLOWED_TOOLS,
      providerAccountId: task.providerAccountId,
      credentialOwnerUserId: task.createdBy,
      sessionPersistenceId: args.taskId,
      activeWorkflowField: "activeChatWorkflowId",
      skipPrewarm: false,
      entityTable: "agentTasks",
    });
    return null;
  },
});

export {
  claimPendingTurn,
  completeSyntheticTurn,
  ensurePendingTurn,
  handleStaleSyntheticTurn,
  openSyntheticTurn,
  requestStopBackgroundAgent,
  updateBackgroundAgents,
} from "./_chat/taskChatDaemon";
