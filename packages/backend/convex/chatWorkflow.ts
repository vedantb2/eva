import { v } from "convex/values";
import { defineEvent } from "@convex-dev/workflow";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { authMutation, getChatWithAccess } from "./functions";
import {
  aiModelValidator,
  assertModelMatchesLockedProvider,
  getAIModelProvider,
  normalizeAIModel,
  reasoningLevelValidator,
  roleValidator,
  workflowCompleteValidator,
} from "./validators";
import { workflow, cancelTrackedWorkflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_sandbox_runtime/resumeSandboxSteps";
import { CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";
import { resolveChatParent } from "./_chats/parent";
import { buildTaskChatTurnPrompt } from "./agentTaskChatWorkflow";
import { buildProjectChatTurnPrompt } from "./projectChatWorkflow";
import { buildSessionPrompt } from "./_sessions/workflow";
import { resolveTaskBranchName } from "./_taskWorkflow/helpers";
import { buildProjectBranchName } from "./_projects/helpers";
import {
  clearStreamingActivity,
  recordCompletionLog,
  sendCompletionEvent,
} from "./_taskWorkflow/helpers";
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";
import { notifyChatMentions } from "./_mentions/notifyChatMentions";
import { startNextQueuedChatLaneMessage } from "./_queues/helpers";
import { finalizeCancelledAssistantMessage } from "./streaming";
import { titleFromFirstMessage } from "./chats";
import { trackIsolatedChatWorkflow } from "./_chat/surfaceAdapters";

const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";
const RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export const chatCompleteEvent = defineEvent({
  name: "isolatedChatComplete",
  validator: workflowCompleteValidator,
});

async function touchParent(
  ctx: MutationCtx,
  parentId: Id<"sessions"> | Id<"projects"> | Id<"agentTasks">,
  updatedAt: number,
): Promise<void> {
  await ctx.db.patch(parentId, { updatedAt });
}

async function notifyParentMentions(
  ctx: MutationCtx,
  chat: Doc<"chats">,
  content: string,
  authorUserId: Id<"users">,
): Promise<void> {
  const rawId = String(chat.parentId);
  const sessionId = ctx.db.normalizeId("sessions", rawId);
  if (sessionId) {
    const session = await ctx.db.get(sessionId);
    if (session) {
      await notifyChatMentions(ctx, {
        content,
        authorUserId,
        surface: { kind: "session", session },
      });
    }
    return;
  }
  const projectId = ctx.db.normalizeId("projects", rawId);
  if (projectId) {
    const project = await ctx.db.get(projectId);
    if (project) {
      await notifyChatMentions(ctx, {
        content,
        authorUserId,
        surface: { kind: "project", project },
      });
    }
    return;
  }
  const taskId = ctx.db.normalizeId("agentTasks", rawId);
  if (!taskId) return;
  const task = await ctx.db.get(taskId);
  if (task) {
    await notifyChatMentions(ctx, {
      content,
      authorUserId,
      surface: { kind: "task", task },
    });
  }
}

async function buildChatTurnPrompt(
  ctx: QueryCtx,
  chat: Doc<"chats">,
  message: string,
  userId: Id<"users">,
): Promise<{
  prompt: string;
  branchName: string | undefined;
  attachmentStorageIds: Id<"_storage">[] | undefined;
}> {
  const rawId = String(chat.parentId);
  const sessionId = ctx.db.normalizeId("sessions", rawId);
  if (sessionId) {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const user = await ctx.db.get(userId);
    const built = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message,
      mode: "edit",
    });
    const latestUser = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", chat._id))
      .order("desc")
      .filter((q) => q.eq(q.field("role"), "user"))
      .first();
    return {
      prompt: built.prompt,
      branchName: built.branchName,
      attachmentStorageIds: latestUser?.attachmentStorageIds,
    };
  }

  const projectId = ctx.db.normalizeId("projects", rawId);
  if (projectId) {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    const built = await buildProjectChatTurnPrompt(ctx, {
      projectId,
      message,
      userId,
      messageParentId: chat._id,
    });
    return {
      ...built,
      branchName:
        project.branchName ??
        buildProjectBranchName(project._id, project.branchVersion),
    };
  }

  const taskId = ctx.db.normalizeId("agentTasks", rawId);
  if (!taskId) throw new Error("Chat parent not found");
  const task = await ctx.db.get(taskId);
  if (!task) throw new Error("Task not found");
  const built = await buildTaskChatTurnPrompt(ctx, {
    taskId,
    message,
    userId,
    messageParentId: chat._id,
  });
  return {
    ...built,
    branchName: await resolveTaskBranchName(ctx.db, task),
  };
}

export const addMessage = authMutation({
  args: {
    chatId: v.id("chats"),
    role: v.optional(roleValidator),
    content: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
    reasoningLevel: v.optional(reasoningLevelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    if (chat.archived) throw new Error("This chat is archived");
    const role = args.role ?? "user";
    const now = Date.now();
    await ctx.db.insert("messages", {
      parentId: chat._id,
      role,
      content: args.content,
      timestamp: now,
      userId: ctx.userId,
      attachmentStorageIds: args.attachmentStorageIds,
      ...(role === "user"
        ? {
            credentialSourceLabel: await resolveCredentialSourceLabel(
              ctx.db,
              chat.providerAccountId,
              chat.createdBy,
            ),
            model: args.model,
            reasoningLevel: args.reasoningLevel,
          }
        : {}),
    });
    await ctx.db.patch(chat._id, {
      title:
        role === "user" && chat.title === undefined
          ? titleFromFirstMessage(args.content)
          : chat.title,
      updatedAt: now,
    });
    await touchParent(ctx, chat.parentId, now);
    return null;
  },
});

export const startExecute = authMutation({
  args: {
    chatId: v.id("chats"),
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
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    if (chat.archived) throw new Error("This chat is archived");
    if (chat.activeWorkflowId) throw new Error("This chat is already running");
    assertModelMatchesLockedProvider(chat.provider, args.model);
    void args.providerAccountId;
    await notifyParentMentions(ctx, chat, args.message, ctx.userId);

    const built = await buildChatTurnPrompt(
      ctx,
      chat,
      args.message,
      ctx.userId,
    );
    const model = normalizeAIModel(args.model);
    const usesDaemonPull = getAIModelProvider(model) === "claude";
    const now = Date.now();
    await ctx.db.insert("messages", {
      parentId: chat._id,
      role: "assistant",
      content: "",
      timestamp: now,
      activityLog: "",
    });
    await ctx.db.patch(chat._id, {
      provider: chat.provider ?? getAIModelProvider(model),
      lastModel: model,
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      lastFastMode: args.fastMode,
      pendingTurn: usesDaemonPull
        ? {
            prompt: built.prompt,
            requestedAt: now,
            attachmentStorageIds: built.attachmentStorageIds,
            model,
          }
        : undefined,
      updatedAt: now,
    });
    await touchParent(ctx, chat.parentId, now);

    const parent = await resolveChatParent(ctx.db, chat.parentId, ctx.userId);
    if (usesDaemonPull && parent.sandboxId && parent.sandboxActive) {
      await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
        sandboxId: parent.sandboxId,
        repoId: chat.repoId,
        userId: ctx.userId,
        entityId: String(chat._id),
        streamingEntityId: String(chat._id),
        entityIdField: "chatId",
        completionMutation: "chatWorkflow:handleCompletion",
        ...CHAT_DAEMON_MUTATIONS,
        model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: chat.providerAccountId,
        credentialOwnerUserId: chat.createdBy,
        sessionPersistenceId: chat._id,
        activeWorkflowField: "activeWorkflowId",
        laneKey: String(chat._id),
        mcpEntityId: String(chat.parentId),
        mcpEntityKind: parent.parentKind,
        entityTable: "chats",
      });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.chatWorkflow.chatExecuteWorkflow,
      {
        chatId: chat._id,
        message: args.message,
        model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: chat.providerAccountId,
        credentialOwnerUserId: chat.createdBy,
        userId: ctx.userId,
      },
    );
    await trackIsolatedChatWorkflow(ctx, chat._id, workflowId, RUN_TIMEOUT_MS);
    return null;
  },
});

export const enqueueMessage = authMutation({
  args: {
    chatId: v.id("chats"),
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
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    if (chat.archived) throw new Error("This chat is archived");
    assertModelMatchesLockedProvider(chat.provider, args.model);
    void args.providerAccountId;
    await notifyParentMentions(ctx, chat, content, ctx.userId);
    const now = Date.now();
    await ctx.db.insert("queuedMessages", {
      parentId: chat._id,
      content,
      createdAt: now,
      order: now,
      userId: ctx.userId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      fastMode: args.fastMode,
      providerAccountId: chat.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(chat._id, {
      lastModel: normalizeAIModel(args.model),
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      lastFastMode: args.fastMode,
      updatedAt: now,
    });
    await touchParent(ctx, chat.parentId, now);
    return null;
  },
});

export const cancelExecution = authMutation({
  args: { chatId: v.id("chats") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    const workflowId = chat.activeWorkflowId;
    await cancelTrackedWorkflow(ctx, workflowId);
    if (getAIModelProvider(normalizeAIModel(chat.lastModel)) === "claude") {
      await ctx.db.patch(chat._id, { cancelRequestedAt: Date.now() });
    } else {
      const parent = await resolveChatParent(ctx.db, chat.parentId, ctx.userId);
      if (parent.sandboxId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: parent.sandboxId,
          repoId: chat.repoId,
          laneKey: String(chat._id),
        });
      }
    }
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(chat._id)))
      .first();
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", chat._id))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && last.finishedAt === undefined) {
      await finalizeCancelledAssistantMessage(ctx, last, streaming);
    }
    await clearStreamingActivity(ctx, String(chat._id));
    const latest = await ctx.db.get(chat._id);
    if (latest?.activeWorkflowId === workflowId) {
      await ctx.db.patch(chat._id, {
        activeWorkflowId: undefined,
        pendingTurn: undefined,
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
    }
    await startNextQueuedChatLaneMessage(ctx, chat._id);
    return null;
  },
});

export const chatExecuteWorkflow = workflow.define({
  args: {
    chatId: v.id("chats"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    credentialOwnerUserId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    const data = await step.runQuery(internal.chatWorkflow.getChatData, {
      chatId: args.chatId,
      message: args.message,
      model: args.model,
      userId: args.userId,
    });
    if (!data.sandboxId) {
      await step.runMutation(internal.chatWorkflow.saveResult, {
        chatId: args.chatId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the parent sandbox before sending messages.",
        activityLog: null,
      });
      return;
    }

    let started: Awaited<ReturnType<typeof ensureSandboxStartedSteps>>;
    try {
      started = await ensureSandboxStartedSteps(step, {
        sandboxId: data.sandboxId,
        repoId: data.repoId,
        streamingEntityId: String(args.chatId),
        sandboxRunning: data.sandboxRunning,
      });
    } catch (error) {
      await step.runMutation(internal.chatWorkflow.saveResult, {
        chatId: args.chatId,
        success: false,
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "The parent sandbox could not be restored. Please retry.",
        activityLog: null,
      });
      return;
    }
    const activeSandboxId = started.thawId;
    if (!activeSandboxId) {
      await step.runMutation(internal.chatWorkflow.saveResult, {
        chatId: args.chatId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the parent sandbox before sending messages.",
        activityLog: null,
      });
      return;
    }
    await step.runMutation(internal.chatWorkflow.updateParentSandboxId, {
      chatId: args.chatId,
      sandboxId: activeSandboxId,
    });
    const validation = await step.runAction(internal.sandbox.validateSandbox, {
      sandboxId: activeSandboxId,
      repoId: data.repoId,
    });
    if (!validation.healthy) {
      await step.runMutation(internal.chatWorkflow.saveResult, {
        chatId: args.chatId,
        success: false,
        result: null,
        error:
          "The parent sandbox is no longer reachable. Restart it and retry.",
        activityLog: null,
      });
      return;
    }

    if (getAIModelProvider(data.model) === "claude") {
      await step.runMutation(internal.chatWorkflow.ensurePendingTurn, {
        chatId: args.chatId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: data.model,
      });
      await step.runAction(internal.sandbox.prewarmEntityDaemon, {
        sandboxId: activeSandboxId,
        repoId: data.repoId,
        userId: args.userId,
        entityId: String(args.chatId),
        streamingEntityId: String(args.chatId),
        entityIdField: "chatId",
        completionMutation: "chatWorkflow:handleCompletion",
        ...CHAT_DAEMON_MUTATIONS,
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        sessionPersistenceId: args.chatId,
        activeWorkflowField: "activeWorkflowId",
        laneKey: String(args.chatId),
        mcpEntityId: String(data.parentId),
        mcpEntityKind: data.parentKind,
        entityTable: "chats",
      });
    } else {
      await step.runAction(internal.sandbox.launchOnExistingSandbox, {
        sandboxId: activeSandboxId,
        entityId: args.chatId,
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "chatWorkflow:handleCompletion",
        entityIdField: "chatId",
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        allowedTools: CHAT_ALLOWED_TOOLS,
        repoId: data.repoId,
        sessionPersistenceId: args.chatId,
        streamingEntityId: String(args.chatId),
        attachmentStorageIds: data.attachmentStorageIds,
        laneKey: String(args.chatId),
        mcpEntityId: String(data.parentId),
        mcpEntityKind: data.parentKind,
      });
    }

    const result = await step.awaitEvent(chatCompleteEvent);
    let success = result.success;
    let error = result.error;
    if (result.success && data.branchName) {
      try {
        await step.runAction(internal.sandbox.pushSandboxBranch, {
          sandboxId: activeSandboxId,
          installationId: data.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
        });
      } catch (pushError) {
        success = false;
        error = `Chat completed locally, but Eva could not publish the branch. ${pushError instanceof Error ? pushError.message : String(pushError)}`;
      }
    }
    await step.runMutation(internal.chatWorkflow.saveResult, {
      chatId: args.chatId,
      success,
      result: result.result,
      error,
      activityLog: result.activityLog,
      pendingQuestion: result.pendingQuestion,
    });
  },
});

export const getChatData = internalQuery({
  args: {
    chatId: v.id("chats"),
    message: v.string(),
    model: aiModelValidator,
    userId: v.id("users"),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    sandboxRunning: v.boolean(),
    parentId: v.union(v.id("sessions"), v.id("projects"), v.id("agentTasks")),
    parentKind: v.union(
      v.literal("session"),
      v.literal("project"),
      v.literal("task"),
    ),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.optional(v.string()),
    prompt: v.string(),
    model: aiModelValidator,
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  }),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    const parent = await resolveChatParent(ctx.db, chat.parentId, args.userId);
    const repo = await ctx.db.get(chat.repoId);
    if (!repo) throw new Error("Repository not found");
    const built = await buildChatTurnPrompt(
      ctx,
      chat,
      args.message,
      args.userId,
    );
    return {
      sandboxId: parent.sandboxId,
      sandboxRunning: parent.sandboxActive,
      parentId: chat.parentId,
      parentKind: parent.parentKind,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: chat.repoId,
      installationId: repo.installationId,
      branchName: built.branchName,
      prompt: built.prompt,
      model: normalizeAIModel(args.model),
      attachmentStorageIds: built.attachmentStorageIds,
    };
  },
});

export const updateParentSandboxId = internalMutation({
  args: { chatId: v.id("chats"), sandboxId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    const rawId = String(chat.parentId);
    const sessionId = ctx.db.normalizeId("sessions", rawId);
    if (sessionId) {
      await ctx.db.patch(sessionId, {
        sandboxId: args.sandboxId,
        status: "active",
      });
      return null;
    }
    const projectId = ctx.db.normalizeId("projects", rawId);
    if (projectId) {
      await ctx.db.patch(projectId, {
        sandboxId: args.sandboxId,
        reviewProjectSandboxStatus: "active",
      });
      return null;
    }
    const taskId = ctx.db.normalizeId("agentTasks", rawId);
    if (taskId) {
      const task = await ctx.db.get(taskId);
      if (task?.projectId) {
        await ctx.db.patch(task.projectId, {
          sandboxId: args.sandboxId,
          reviewProjectSandboxStatus: "active",
        });
      } else {
        await ctx.db.patch(taskId, {
          sandboxId: args.sandboxId,
          reviewTaskSandboxStatus: "active",
        });
      }
    }
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    chatId: v.id("chats"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.chatId));
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.chatId))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && last.isSyntheticTurn !== true) {
      await ctx.db.patch(last._id, {
        content: args.success
          ? args.result || "I couldn't process your message."
          : `Error: ${args.error || "Unknown error during execution."}`,
        activityLog: args.activityLog ?? undefined,
        pendingQuestion: args.pendingQuestion,
        finishedAt: Date.now(),
      });
    }
    const now = Date.now();
    await ctx.db.patch(chat._id, {
      activeWorkflowId: undefined,
      pendingTurn: undefined,
      updatedAt: now,
    });
    await touchParent(ctx, chat.parentId, now);
    await startNextQueuedChatLaneMessage(ctx, chat._id);
    return null;
  },
});

export const handleCompletion = authMutation({
  args: {
    chatId: v.id("chats"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    if (!chat.activeWorkflowId) return null;
    if (chat.pendingTurn !== undefined) {
      await ctx.db.patch(chat._id, { pendingTurn: undefined });
    }
    await sendCompletionEvent(ctx, chatCompleteEvent, chat.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
      pendingQuestion: args.pendingQuestion,
    });
    await recordCompletionLog(ctx, {
      entityType: "chat",
      entityId: String(chat._id),
      entityTitle: chat.title ?? "New chat",
      repoId: chat.repoId,
      rawResultEvent: args.rawResultEvent,
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
} from "./_chats/daemon";
