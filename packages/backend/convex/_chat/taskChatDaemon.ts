import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  getAIModelProvider,
  normalizeAIModel,
} from "../validators";
import { backgroundAgentEntryValidator } from "../_validators/tableFields";
import { mergeBackgroundAgents } from "../_sessions/backgroundAgents";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { startNextQueuedTaskChatMessage } from "../_queues/helpers";
import { TASK_CHAT_STREAM_PREFIX } from "../workflowWatchdog";

type TaskTurnKind = "conversational" | "agent";

function taskChatStreamEntityId(taskId: Id<"agentTasks">): string {
  return `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`;
}

const emptyClaimReturn = {
  prompt: null,
  turnKind: "agent",
  attachmentUrls: [],
  stopTaskToolUseIds: [],
} satisfies {
  prompt: null;
  turnKind: "agent";
  attachmentUrls: string[];
  stopTaskToolUseIds: string[];
};

/** Daemon-pull turn claim for task sandbox chat (never the main run workflow). */
export const claimPendingTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    turnKind: v.union(v.literal("conversational"), v.literal("agent")),
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
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

    // Chat daemon only — never claim a turn while the main PR run workflow is
    // the only active consumer.
    if (!task.activeChatWorkflowId) {
      return { ...emptyClaimReturn, stopTaskToolUseIds };
    }

    if (!task.pendingTurn) {
      return { ...emptyClaimReturn, stopTaskToolUseIds };
    }

    const pendingModel = task.pendingTurn.model;
    if (pendingModel !== undefined) {
      const claimModel = normalizeAIModel(args.model);
      if (normalizeAIModel(pendingModel) !== claimModel) {
        return { ...emptyClaimReturn, stopTaskToolUseIds };
      }
    }

    const prompt = task.pendingTurn.prompt;
    const turnKind: TaskTurnKind = task.pendingTurn.turnKind ?? "agent";
    const resolvedUrls = await Promise.all(
      (task.pendingTurn.attachmentStorageIds ?? []).map((id) =>
        ctx.storage.getUrl(id),
      ),
    );
    const attachmentUrls = resolvedUrls.filter(
      (url): url is string => url !== null,
    );
    await ctx.db.patch(args.taskId, { pendingTurn: undefined });
    return { prompt, turnKind, attachmentUrls, stopTaskToolUseIds };
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
  args: { taskId: v.id("agentTasks") },
  returns: v.object({ messageId: v.id("messages") }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }
    const messageId = await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
    });
    await ctx.db.patch(args.taskId, {
      syntheticTurnMessageId: messageId,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.agentTaskChatWorkflow.handleStaleSyntheticTurn,
      { taskId: args.taskId, messageId },
    );
    return { messageId };
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, taskChatStreamEntityId(args.taskId));

    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.taskId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.taskId, {
        syntheticTurnMessageId: undefined,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.syntheticTurnMessageId !== args.messageId) {
      return null;
    }
    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(args.taskId, {
        syntheticTurnMessageId: undefined,
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
        { taskId: args.taskId, messageId: args.messageId },
      );
      return null;
    }
    await finalizeCancelledAssistantMessage(ctx, message, streaming);
    await clearStreamingActivity(ctx, streamingEntityId);
    await ctx.db.patch(args.taskId, {
      syntheticTurnMessageId: undefined,
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
    turnKind: v.union(v.literal("conversational"), v.literal("agent")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.pendingTurn) return null;
    if (
      args.model !== undefined &&
      getAIModelProvider(normalizeAIModel(args.model)) !== "claude"
    ) {
      return null;
    }
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
      .order("desc")
      .first();
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
        turnKind: args.turnKind,
        attachmentStorageIds: args.attachmentStorageIds,
        ...(args.model !== undefined
          ? { model: normalizeAIModel(args.model) }
          : {}),
      },
      updatedAt: Date.now(),
    });
    return null;
  },
});
