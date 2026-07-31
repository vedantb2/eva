import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authMutation, hasRepoAccess } from "../functions";
import { aiModelValidator, normalizeAIModel } from "../validators";
import {
  backgroundAgentEntryValidator,
  optionalChatTurnIdentityFields,
} from "../_validators/tableFields";
import { mergeBackgroundAgents } from "../_sessions/backgroundAgents";
import {
  clearStreamingActivityForTurn,
  finalizeCancelledAssistantMessage,
} from "../streaming";
import { clearPendingQuestionsForTurn } from "../pendingQuestions";
import { startNextQueuedTaskChatMessage } from "../_queues/helpers";
import { TASK_CHAT_STREAM_PREFIX } from "../workflowWatchdog";
import { CHAT_TURN_PROTOCOL_VERSION } from "../../shared/chatTurnProtocol";
import { usesChatDaemon } from "./daemonTransport";
import {
  callbackMatchesActiveTurn,
  exactTurnIdentity,
  turnIdentityMatches,
} from "./turnIdentity";

function taskChatStreamEntityId(taskId: Id<"agentTasks">): string {
  return `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`;
}

const emptyClaimReturn = {
  prompt: null,
  attachmentUrls: [],
  stopTaskToolUseIds: [],
  cancelRequested: false,
} satisfies {
  prompt: null;
  attachmentUrls: string[];
  stopTaskToolUseIds: string[];
  cancelRequested: boolean;
};

/** Daemon-pull turn claim for task sandbox chat (never the main run workflow). */
export const claimPendingTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    model: v.optional(aiModelValidator),
    ...optionalChatTurnIdentityFields,
    callbackProtocolVersion: v.optional(v.number()),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
    cancelRequested: v.boolean(),
    ...optionalChatTurnIdentityFields,
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return emptyClaimReturn;
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }
    // Stops must drain unconditionally: a backgrounded agent outlives the chat
    // turn, and saveResult clears activeChatWorkflowId the moment the visible
    // turn finishes — gating the drain there would strand stop requests.
    const stopTaskToolUseIds = task.pendingTaskStops ?? [];
    if (stopTaskToolUseIds.length > 0) {
      await ctx.db.patch(args.taskId, { pendingTaskStops: undefined });
    }

    // Cancel requests must drain the same way: the daemon polls this mutation
    // mid-turn specifically to notice an interrupt, so gating on
    // activeChatWorkflowId/pendingTurn below would strand the signal.
    const cancelRequested = task.cancelRequestedAt !== undefined;
    if (cancelRequested) {
      await ctx.db.patch(args.taskId, { cancelRequestedAt: undefined });
    }

    // Chat daemon only — never claim a turn while the main PR run workflow is
    // the only active consumer.
    if (!task.activeChatWorkflowId) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }

    if (!task.pendingTurn) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }

    if (
      task.pendingTurn.turnId !== undefined &&
      args.callbackProtocolVersion !== CHAT_TURN_PROTOCOL_VERSION
    ) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }

    const pendingModel = task.pendingTurn.model;
    if (pendingModel !== undefined) {
      const claimModel = normalizeAIModel(args.model);
      if (normalizeAIModel(pendingModel) !== claimModel) {
        return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
      }
    }

    const prompt = task.pendingTurn.prompt;
    const resolvedUrls = await Promise.all(
      (task.pendingTurn.attachmentStorageIds ?? []).map((id) =>
        ctx.storage.getUrl(id),
      ),
    );
    const attachmentUrls = resolvedUrls.filter(
      (url): url is string => url !== null,
    );
    await ctx.db.patch(args.taskId, {
      pendingTurn: undefined,
      activeTurn:
        task.pendingTurn.turnId !== undefined &&
        task.pendingTurn.assistantMessageId !== undefined &&
        task.pendingTurn.attempt !== undefined
          ? {
              turnId: task.pendingTurn.turnId,
              assistantMessageId: task.pendingTurn.assistantMessageId,
              attempt: task.pendingTurn.attempt,
              acceptedAt: Date.now(),
            }
          : undefined,
      daemonTurnProtocolVersion: args.callbackProtocolVersion,
    });
    return {
      prompt,
      attachmentUrls,
      stopTaskToolUseIds,
      cancelRequested,
      turnId: task.pendingTurn.turnId,
      assistantMessageId: task.pendingTurn.assistantMessageId,
      attempt: task.pendingTurn.attempt,
    };
  },
});

export const updateBackgroundAgents = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    agents: v.array(backgroundAgentEntryValidator),
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
    if (args.agents.length === 0) return null;
    await ctx.db.patch(args.taskId, {
      backgroundAgents: mergeBackgroundAgents(
        task.backgroundAgents,
        args.agents,
      ),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const requestStopBackgroundAgent = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    toolUseId: v.string(),
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
    const pending = task.pendingTaskStops ?? [];
    if (pending.includes(args.toolUseId)) return null;
    await ctx.db.patch(args.taskId, {
      pendingTaskStops: [...pending, args.toolUseId],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const openSyntheticTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    callbackProtocolVersion: v.number(),
  },
  returns: v.union(
    v.object({
      messageId: v.id("messages"),
      turnId: v.string(),
      attempt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }
    if (
      args.callbackProtocolVersion !== CHAT_TURN_PROTOCOL_VERSION ||
      task.activeTurn !== undefined ||
      task.syntheticTurnMessageId !== undefined
    ) {
      return null;
    }
    const turnId = crypto.randomUUID();
    const attempt = 1;
    const messageId = await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
      turnId,
    });
    await ctx.db.patch(args.taskId, {
      syntheticTurnMessageId: messageId,
      activeTurn: {
        turnId,
        assistantMessageId: messageId,
        attempt,
        acceptedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.agentTaskChatWorkflow.handleStaleSyntheticTurn,
      { taskId: args.taskId, messageId, turnId, attempt },
    );
    return { messageId, turnId, attempt };
  },
});

export const completeSyntheticTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    messageId: v.id("messages"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    const turnIdentity = exactTurnIdentity(args);
    if (
      !task ||
      turnIdentity === null ||
      !callbackMatchesActiveTurn(task, turnIdentity) ||
      task.syntheticTurnMessageId !== args.messageId
    ) {
      console.log(
        `[chat-turn] stale synthetic completion ignored surface=task parentId=${args.taskId}`,
      );
      return null;
    }
    await clearStreamingActivityForTurn(
      ctx,
      taskChatStreamEntityId(args.taskId),
      turnIdentity,
    );
    await clearPendingQuestionsForTurn(
      ctx.db,
      String(args.taskId),
      turnIdentity,
    );
    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.taskId ||
      message.turnId !== turnIdentity.turnId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.taskId, {
        syntheticTurnMessageId: undefined,
        activeTurn: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedTaskChatMessage(ctx, args.taskId);
      return null;
    }

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
    await ctx.db.patch(args.messageId, patch);

    await ctx.db.patch(args.taskId, {
      syntheticTurnMessageId: undefined,
      activeTurn: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

export const handleStaleSyntheticTurn = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    messageId: v.id("messages"),
    turnId: v.string(),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    const turnIdentity = {
      turnId: args.turnId,
      assistantMessageId: args.messageId,
      attempt: args.attempt,
    };
    if (
      !task ||
      task.syntheticTurnMessageId !== args.messageId ||
      !callbackMatchesActiveTurn(task, turnIdentity)
    ) {
      return null;
    }
    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(args.taskId, {
        syntheticTurnMessageId: undefined,
        activeTurn: undefined,
        updatedAt: Date.now(),
      });
      return null;
    }
    const streamingEntityId = taskChatStreamEntityId(args.taskId);
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();
    const streamingStale =
      streaming === null ||
      Date.now() - (streaming.lastUpdatedAt ?? 0) > 2 * 60 * 1000;
    if (!streamingStale) {
      await ctx.scheduler.runAfter(
        10 * 60 * 1000,
        internal.agentTaskChatWorkflow.handleStaleSyntheticTurn,
        {
          taskId: args.taskId,
          messageId: args.messageId,
          turnId: args.turnId,
          attempt: args.attempt,
        },
      );
      return null;
    }
    await finalizeCancelledAssistantMessage(
      ctx,
      message,
      streaming !== null && turnIdentityMatches(streaming, turnIdentity)
        ? streaming
        : null,
    );
    await clearStreamingActivityForTurn(ctx, streamingEntityId, turnIdentity);
    await clearPendingQuestionsForTurn(
      ctx.db,
      String(args.taskId),
      turnIdentity,
    );
    await ctx.db.patch(args.taskId, {
      syntheticTurnMessageId: undefined,
      activeTurn: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

/** Re-stages pendingTurn when cancel raced with startExecute. */
export const ensurePendingTurn = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    prompt: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.pendingTurn) return null;
    const turnIdentity = exactTurnIdentity(args);
    if (
      turnIdentity !== null &&
      !callbackMatchesActiveTurn(task, turnIdentity)
    ) {
      return null;
    }
    if (
      args.model !== undefined &&
      !usesChatDaemon(args.model, task.cursorTransport)
    ) {
      return null;
    }
    const last =
      turnIdentity === null
        ? await ctx.db
            .query("messages")
            .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
            .order("desc")
            .first()
        : await ctx.db.get(turnIdentity.assistantMessageId);
    if (
      !last ||
      last.role !== "assistant" ||
      last.finishedAt !== undefined ||
      last.isSyntheticTurn === true
    ) {
      return null;
    }
    await ctx.db.patch(args.taskId, {
      pendingTurn: {
        prompt: args.prompt,
        requestedAt: Date.now(),
        attachmentStorageIds: args.attachmentStorageIds,
        ...turnIdentity,
        ...(args.model !== undefined
          ? { model: normalizeAIModel(args.model) }
          : {}),
      },
      updatedAt: Date.now(),
    });
    return null;
  },
});
