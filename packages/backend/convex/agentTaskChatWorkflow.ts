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
  roleValidator,
  taskSandboxStatusValidator,
  getAIModelProvider,
} from "./validators";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
  resolveTaskBranchName,
} from "./_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "./streaming";
import { startNextQueuedTaskChatMessage } from "./_queues/helpers";
import {
  trackAgentTaskChatWorkflow,
  TASK_CHAT_STREAM_PREFIX,
} from "./workflowWatchdog";
import { buildAgentTaskChatPrompt } from "./_agentTasks/chatPrompt";
import { buildCustomInstructionsBlock } from "./prompts";
import { resolveMessageTokens } from "./_mentions/resolveMessageTokens";
import { notifyChatMentions } from "./_mentions/notifyChatMentions";
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";
import type { Doc, Id } from "./_generated/dataModel";
import { TASK_CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";
import {
  detectModelHandoff,
  prependModelHandoffContext,
} from "./_shared/modelHandoff";
import { resolveTurnProviderAccount } from "./_userProviderAccounts/defaults";

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

/** Streaming-activity entity id for a task chat. */
function chatStreamEntityId(taskId: Id<"agentTasks">): string {
  return `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`;
}

async function buildTaskChatTurnPrompt(
  ctx: QueryCtx,
  args: {
    taskId: Id<"agentTasks">;
    message: string;
    model: string;
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
    devPort: task.devPort ?? repo.devPort,
  });
  if (prefixBlock) {
    prompt = `${prefixBlock}\n\n${prompt}`;
  }
  prompt = await prependModelHandoffContext(
    ctx,
    args.taskId,
    args.model,
    prompt,
  );

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

/** Inserts a user chat message into the task conversation. */
export const addMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    // Defaults to "user". "assistant" lets the client surface a failed send
    // as a visible error message (same contract as sessions.addMessage).
    role: v.optional(roleValidator),
    content: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    model: v.optional(aiModelValidator),
    reasoningLevel: v.optional(reasoningLevelValidator),
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
    const role = args.role ?? "user";
    const turnAccountId =
      role === "user"
        ? await resolveTurnProviderAccount(
            ctx.db,
            task.createdBy,
            args.model ?? task.lastChatModel ?? task.model,
            args.model !== undefined
              ? args.providerAccountId
              : task.providerAccountId,
          )
        : undefined;
    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role,
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
      attachmentStorageIds: args.attachmentStorageIds,
      ...(role === "user"
        ? {
            credentialSourceLabel: await resolveCredentialSourceLabel(
              ctx.db,
              turnAccountId,
              task.createdBy,
            ),
            model: args.model,
            reasoningLevel: args.reasoningLevel,
          }
        : {}),
    });
    await ctx.db.patch(args.taskId, { updatedAt: Date.now() });
    return null;
  },
});

/** Starts a task chat workflow on the task's existing sandbox. */
export const startExecute = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
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

    const turnAccountId = await resolveTurnProviderAccount(
      ctx.db,
      task.createdBy,
      args.model,
      args.providerAccountId,
    );

    await notifyChatMentions(ctx, {
      content: args.message,
      authorUserId: ctx.userId,
      surface: { kind: "task", task },
    });

    const handoff = await detectModelHandoff(ctx, args.taskId, args.model);
    if (handoff.kind === "handoff") {
      await ctx.db.insert("messages", {
        parentId: args.taskId,
        role: "assistant",
        content: handoff.alertContent,
        timestamp: Date.now(),
        isSystemAlert: true,
      });
    }

    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });

    const { prompt, attachmentStorageIds } = await buildTaskChatTurnPrompt(
      ctx,
      {
        taskId: args.taskId,
        message: args.message,
        model: args.model,
        userId: ctx.userId,
      },
    );

    const normalizedModel = normalizeAIModel(args.model);
    const usesDaemonPull = getAIModelProvider(normalizedModel) === "claude";
    await ctx.db.patch(args.taskId, {
      ...(usesDaemonPull
        ? {
            pendingTurn: {
              prompt,
              requestedAt: Date.now(),
              attachmentStorageIds,
              model: normalizedModel,
            },
          }
        : { pendingTurn: undefined }),
      lastChatModel: normalizedModel,
      providerAccountId: turnAccountId,
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

    if (usesDaemonPull && task.sandboxId && task.repoId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
        sandboxId: task.sandboxId,
        repoId: task.repoId,
        userId: ctx.userId,
        entityId: String(args.taskId),
        streamingEntityId: chatStreamEntityId(args.taskId),
        entityIdField: "taskId",
        completionMutation: "agentTaskChatWorkflow:handleCompletion",
        ...TASK_CHAT_DAEMON_MUTATIONS,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: turnAccountId,
        credentialOwnerUserId: task.createdBy,
        sessionPersistenceId: args.taskId,
        activeWorkflowField: "activeChatWorkflowId",
        skipPrewarm: false,
        entityTable: "agentTasks",
      });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId: args.taskId,
        message: args.message,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: turnAccountId,
        credentialOwnerUserId: task.createdBy,
        userId: ctx.userId,
      },
    );

    await trackAgentTaskChatWorkflow(ctx, args.taskId, workflowId);
    return null;
  },
});

/** Queues a chat message to run after the current workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
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
    const content = args.message.trim();
    if (!content) return null;

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    await notifyChatMentions(ctx, {
      content,
      authorUserId: ctx.userId,
      surface: { kind: "task", task },
    });

    await ctx.db.insert("queuedMessages", {
      parentId: args.taskId,
      content,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      fastMode: args.fastMode,
      providerAccountId: args.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.taskId, {
      lastChatModel: normalizeAIModel(args.model),
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
 * Cancels the active task chat workflow and starts any queued message. For a
 * Claude daemon turn, sets `cancelRequestedAt` so the warm daemon interrupts
 * its own in-flight SDK query on its next `claimPendingTurn` poll, instead of
 * killing the sandbox process — Cursor/Codex/Opencode have no daemon to
 * observe the flag, so they keep the pkill-style kill.
 */
export const cancelExecution = authMutation({
  args: {
    taskId: v.id("agentTasks"),
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

    await cancelTrackedWorkflow(ctx, task.activeChatWorkflowId);

    const workflowIdToCancel = task.activeChatWorkflowId;
    const pendingRequestedAt = task.pendingTurn?.requestedAt;

    if (
      getAIModelProvider(normalizeAIModel(task.lastChatModel ?? task.model)) ===
      "claude"
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

    const streamingEntityId = chatStreamEntityId(args.taskId);
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
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    credentialOwnerUserId: v.optional(v.id("users")),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(
      internal.agentTaskChatWorkflow.addAssistantPlaceholder,
      { taskId: args.taskId },
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
      });
      return;
    }

    const streamingEntityId = chatStreamEntityId(args.taskId);

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
      });
      return;
    }

    if (getAIModelProvider(data.model) === "claude") {
      await step.runMutation(internal.agentTaskChatWorkflow.ensurePendingTurn, {
        taskId: args.taskId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: args.model,
      });

      await step.runAction(internal.sandbox.prewarmEntityDaemon, {
        sandboxId: activeSandboxId,
        repoId: data.repoId,
        userId: args.userId,
        entityId: String(args.taskId),
        streamingEntityId,
        entityIdField: "taskId",
        completionMutation: "agentTaskChatWorkflow:handleCompletion",
        ...TASK_CHAT_DAEMON_MUTATIONS,
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
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
        fastMode: args.fastMode,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        allowedTools: CHAT_ALLOWED_TOOLS,
        repoId: data.repoId,
        sessionPersistenceId: args.taskId,
        streamingEntityId,
        attachmentStorageIds: data.attachmentStorageIds,
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
      model: args.model,
      pendingQuestion: result.pendingQuestion,
    });
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the task chat for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

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
        model: args.model,
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
    model: v.optional(aiModelValidator),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streamingEntityId = chatStreamEntityId(args.taskId);
    await clearStreamingActivity(ctx, streamingEntityId);

    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && last.isSyntheticTurn !== true) {
      const patch: {
        content: string;
        activityLog?: string;
        finishedAt: number;
        pendingQuestion?: string;
        model?: Doc<"messages">["model"];
      } = {
        content: args.success
          ? args.result || "I couldn't process your message."
          : `Error: ${args.error || "Unknown error during execution."}`,
        finishedAt: Date.now(),
      };
      if (args.activityLog) patch.activityLog = args.activityLog;
      if (args.pendingQuestion) patch.pendingQuestion = args.pendingQuestion;
      if (args.success && args.model !== undefined) {
        patch.model = normalizeAIModel(args.model);
      }
      await ctx.db.patch(last._id, patch);
    }

    await ctx.db.patch(args.taskId, {
      activeChatWorkflowId: undefined,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.activeChatWorkflowId) return null;
    if (!task.repoId) return null;
    if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
      throw new Error("Not authorized");
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
    // Never prewarm a stopped/stopping sandbox. prewarmEntityDaemon execs on
    // the sandbox, and on Vercel any exec lazily resumes a stopped VM —
    // resurrecting a sandbox the user stopped, invisibly (same guard as
    // sessions' prewarmDaemon).
    if (
      task.reviewTaskSandboxStatus === "closed" ||
      task.reviewTaskSandboxStatus === "stopping"
    ) {
      return null;
    }
    if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
      sandboxId: task.sandboxId,
      repoId: task.repoId,
      userId: ctx.userId,
      entityId: String(args.taskId),
      streamingEntityId: chatStreamEntityId(args.taskId),
      entityIdField: "taskId",
      completionMutation: "agentTaskChatWorkflow:handleCompletion",
      ...TASK_CHAT_DAEMON_MUTATIONS,
      model: normalizeAIModel(task.lastChatModel ?? task.model),
      // Forward the sticky traits so the prewarm's opts sig matches the turn
      // path — omitting them makes every page-open prewarm mismatch a
      // trait-launched daemon and kill+respawn it (see sessions' prewarmDaemon).
      reasoningLevel: task.lastReasoningLevel,
      thinkingEnabled: task.lastThinkingEnabled,
      use1mContext: task.lastUse1mContext,
      fastMode: task.lastFastMode,
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
