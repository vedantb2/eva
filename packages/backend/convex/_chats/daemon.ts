import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { authMutation, getChatWithAccess } from "../functions";
import {
  aiModelValidator,
  getAIModelProvider,
  normalizeAIModel,
} from "../validators";
import { backgroundAgentEntryValidator } from "../_validators/tableFields";
import { mergeBackgroundAgents } from "../_sessions/backgroundAgents";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { startNextQueuedChatLaneMessage } from "../_queues/helpers";

const emptyClaimReturn: {
  prompt: null;
  attachmentUrls: string[];
  stopTaskToolUseIds: string[];
  cancelRequested: boolean;
} = {
  prompt: null,
  attachmentUrls: [],
  stopTaskToolUseIds: [],
  cancelRequested: false,
};

/** Atomically drains the next Claude turn for one isolated lane. */
export const claimPendingTurn = authMutation({
  args: {
    chatId: v.id("chats"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
    cancelRequested: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    const stopTaskToolUseIds = chat.pendingTaskStops ?? [];
    const cancelRequested = chat.cancelRequestedAt !== undefined;
    if (stopTaskToolUseIds.length > 0 || cancelRequested) {
      await ctx.db.patch(chat._id, {
        pendingTaskStops:
          stopTaskToolUseIds.length > 0 ? undefined : chat.pendingTaskStops,
        cancelRequestedAt: cancelRequested ? undefined : chat.cancelRequestedAt,
      });
    }
    if (!chat.activeWorkflowId || !chat.pendingTurn) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }
    if (
      chat.pendingTurn.model !== undefined &&
      normalizeAIModel(chat.pendingTurn.model) !== normalizeAIModel(args.model)
    ) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }
    const resolvedUrls = await Promise.all(
      (chat.pendingTurn.attachmentStorageIds ?? []).map((id) =>
        ctx.storage.getUrl(id),
      ),
    );
    const attachmentUrls = resolvedUrls.filter(
      (url): url is string => url !== null,
    );
    const prompt = chat.pendingTurn.prompt;
    await ctx.db.patch(chat._id, { pendingTurn: undefined });
    return { prompt, attachmentUrls, stopTaskToolUseIds, cancelRequested };
  },
});

export const updateBackgroundAgents = authMutation({
  args: {
    chatId: v.id("chats"),
    agents: v.array(backgroundAgentEntryValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    if (args.agents.length === 0) return null;
    await ctx.db.patch(chat._id, {
      backgroundAgents: mergeBackgroundAgents(
        chat.backgroundAgents,
        args.agents,
      ),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const requestStopBackgroundAgent = authMutation({
  args: { chatId: v.id("chats"), toolUseId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    const pending = chat.pendingTaskStops ?? [];
    if (pending.includes(args.toolUseId)) return null;
    await ctx.db.patch(chat._id, {
      pendingTaskStops: [...pending, args.toolUseId],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const openSyntheticTurn = authMutation({
  args: { chatId: v.id("chats") },
  returns: v.object({ messageId: v.id("messages") }),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    const messageId = await ctx.db.insert("messages", {
      parentId: chat._id,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
    });
    await ctx.db.patch(chat._id, {
      syntheticTurnMessageId: messageId,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.chatWorkflow.handleStaleSyntheticTurn,
      { chatId: chat._id, messageId },
    );
    return { messageId };
  },
});

export const completeSyntheticTurn = authMutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.id("messages"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getChatWithAccess(ctx.db, args.chatId, ctx.userId);
    await clearStreamingActivity(ctx, String(args.chatId));
    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.chatId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.chatId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedChatLaneMessage(ctx, args.chatId);
      return null;
    }
    await ctx.db.patch(message._id, {
      content: args.success
        ? args.result || "I couldn't process your message."
        : `Error: ${args.error || "Unknown error during execution."}`,
      activityLog: args.activityLog ?? undefined,
      pendingQuestion: args.pendingQuestion,
      finishedAt: Date.now(),
    });
    await ctx.db.patch(args.chatId, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedChatLaneMessage(ctx, args.chatId);
    return null;
  },
});

export const handleStaleSyntheticTurn = internalMutation({
  args: { chatId: v.id("chats"), messageId: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.syntheticTurnMessageId !== args.messageId) return null;
    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(chat._id, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      return null;
    }
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(chat._id)))
      .first();
    const streamingStale =
      streaming === null ||
      Date.now() - (streaming.lastUpdatedAt ?? 0) > 2 * 60 * 1000;
    if (!streamingStale) {
      await ctx.scheduler.runAfter(
        10 * 60 * 1000,
        internal.chatWorkflow.handleStaleSyntheticTurn,
        { chatId: chat._id, messageId: args.messageId },
      );
      return null;
    }
    await finalizeCancelledAssistantMessage(ctx, message, streaming);
    await clearStreamingActivity(ctx, String(chat._id));
    await ctx.db.patch(chat._id, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedChatLaneMessage(ctx, chat._id);
    return null;
  },
});

export const ensurePendingTurn = internalMutation({
  args: {
    chatId: v.id("chats"),
    prompt: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.pendingTurn) return null;
    if (
      args.model !== undefined &&
      getAIModelProvider(normalizeAIModel(args.model)) !== "claude"
    ) {
      return null;
    }
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.chatId))
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
    await ctx.db.patch(chat._id, {
      pendingTurn: {
        prompt: args.prompt,
        requestedAt: Date.now(),
        attachmentStorageIds: args.attachmentStorageIds,
        model:
          args.model !== undefined ? normalizeAIModel(args.model) : undefined,
      },
      updatedAt: Date.now(),
    });
    return null;
  },
});
