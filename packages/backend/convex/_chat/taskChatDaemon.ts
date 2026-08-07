import { v } from "convex/values";
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
import { startNextQueuedTaskChatMessage } from "../_queues/helpers";
import { TASK_CHAT_STREAM_PREFIX } from "../workflowWatchdog";
import { closeOpenTurn, findOpenTurn } from "./turnStore";
import { openChatTurn, taskChatAdapter } from "./surfaceAdapters";

function taskChatStreamEntityId(taskId: Id<"agentTasks">): string {
  return `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`;
}

const emptyClaimReturn = {
  prompt: null,
  attachmentUrls: [],
  stopTaskToolUseIds: [],
  cancelRequested: false,
  turnId: null,
} satisfies {
  prompt: null;
  attachmentUrls: string[];
  stopTaskToolUseIds: string[];
  cancelRequested: boolean;
  turnId: null;
};

/** Daemon-pull turn claim for task sandbox chat (never the main run workflow). */
export const claimPendingTurn = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
    cancelRequested: v.boolean(),
    // See the session claim: a warm daemon spans turns, so the turn it must
    // renew is handed over with the prompt rather than baked into its env.
    turnId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return emptyClaimReturn;
    if (!task.repoId) throw new Error("Not authorized");
    // Daemon polls ~20×/s — skip team-membership join for the task creator.
    if (task.createdBy !== ctx.userId) {
      if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
        throw new Error("Not authorized");
      }
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
    await ctx.db.patch(args.taskId, { pendingTurn: undefined });
    const openTurn = await findOpenTurn(ctx, "taskChat", String(args.taskId));
    return {
      prompt,
      attachmentUrls,
      stopTaskToolUseIds,
      cancelRequested,
      turnId: openTurn ? String(openTurn._id) : null,
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

/** See the session equivalent: a continuation is a turn, so it gets a turn row. */
export const openSyntheticTurn = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.object({ messageId: v.id("messages"), turnId: v.id("turns") }),
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
    const turnId = await openChatTurn(ctx, taskChatAdapter, args.taskId, {
      placeholderMessageId: messageId,
    });
    return { messageId, turnId };
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
    await closeOpenTurn(
      ctx,
      "taskChat",
      String(args.taskId),
      args.success ? "done" : "error",
      { ...(args.error ? { error: args.error } : {}) },
    );

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

/** Re-stages pendingTurn when cancel raced with startExecute. */
export const ensurePendingTurn = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    prompt: v.string(),
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
