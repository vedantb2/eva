import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  normalizeAIModel,
  usesChatDaemon,
} from "../validators";
import { backgroundAgentEntryValidator } from "../_validators/tableFields";
import { mergeBackgroundAgents } from "../_sessions/backgroundAgents";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { startNextQueuedProjectChatMessage } from "../_queues/helpers";
import { PROJECT_CHAT_STREAM_PREFIX } from "../workflowWatchdog";

function projectChatStreamEntityId(projectId: Id<"projects">): string {
  return `${PROJECT_CHAT_STREAM_PREFIX}${String(projectId)}`;
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

/** Daemon-pull turn claim for project sandbox chat. */
export const claimPendingTurn = authMutation({
  args: {
    projectId: v.id("projects"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
    cancelRequested: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return emptyClaimReturn;
    // Daemon polls ~20×/s — skip team-membership join for the project owner.
    if (project.userId !== ctx.userId) {
      if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
        throw new Error("Not authorized");
      }
    }
    // Stops must drain unconditionally: a backgrounded agent outlives the chat
    // turn, and saveResult clears activeChatWorkflowId the moment the visible
    // turn finishes — gating the drain there would strand stop requests.
    const stopTaskToolUseIds = project.pendingTaskStops ?? [];
    if (stopTaskToolUseIds.length > 0) {
      await ctx.db.patch(args.projectId, { pendingTaskStops: undefined });
    }

    // Cancel requests must drain the same way: the daemon polls this mutation
    // mid-turn specifically to notice an interrupt, so gating on
    // activeChatWorkflowId/pendingTurn below would strand the signal.
    const cancelRequested = project.cancelRequestedAt !== undefined;
    if (cancelRequested) {
      await ctx.db.patch(args.projectId, { cancelRequestedAt: undefined });
    }

    // Chat daemon only — never claim a turn while another workflow is the only
    // active consumer.
    if (!project.activeChatWorkflowId) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }

    if (!project.pendingTurn) {
      return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
    }

    const pendingModel = project.pendingTurn.model;
    if (pendingModel !== undefined) {
      const claimModel = normalizeAIModel(args.model);
      if (normalizeAIModel(pendingModel) !== claimModel) {
        return { ...emptyClaimReturn, stopTaskToolUseIds, cancelRequested };
      }
    }

    const prompt = project.pendingTurn.prompt;
    const resolvedUrls = await Promise.all(
      (project.pendingTurn.attachmentStorageIds ?? []).map((id) =>
        ctx.storage.getUrl(id),
      ),
    );
    const attachmentUrls = resolvedUrls.filter(
      (url): url is string => url !== null,
    );
    await ctx.db.patch(args.projectId, { pendingTurn: undefined });
    return { prompt, attachmentUrls, stopTaskToolUseIds, cancelRequested };
  },
});

export const updateBackgroundAgents = authMutation({
  args: {
    projectId: v.id("projects"),
    agents: v.array(backgroundAgentEntryValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (args.agents.length === 0) return null;
    await ctx.db.patch(args.projectId, {
      backgroundAgents: mergeBackgroundAgents(
        project.backgroundAgents,
        args.agents,
      ),
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

export const requestStopBackgroundAgent = authMutation({
  args: {
    projectId: v.id("projects"),
    toolUseId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const pending = project.pendingTaskStops ?? [];
    if (pending.includes(args.toolUseId)) return null;
    await ctx.db.patch(args.projectId, {
      pendingTaskStops: [...pending, args.toolUseId],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const openSyntheticTurn = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.object({ messageId: v.id("messages") }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const messageId = await ctx.db.insert("messages", {
      parentId: args.projectId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
    });
    await ctx.db.patch(args.projectId, {
      syntheticTurnMessageId: messageId,
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.projectChatWorkflow.handleStaleSyntheticTurn,
      { projectId: args.projectId, messageId },
    );
    return { messageId };
  },
});

export const completeSyntheticTurn = authMutation({
  args: {
    projectId: v.id("projects"),
    messageId: v.id("messages"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(
      ctx,
      projectChatStreamEntityId(args.projectId),
    );

    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.projectId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.projectId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedProjectChatMessage(ctx, args.projectId);
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

    await ctx.db.patch(args.projectId, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });
    await startNextQueuedProjectChatMessage(ctx, args.projectId);
    return null;
  },
});

export const handleStaleSyntheticTurn = internalMutation({
  args: {
    projectId: v.id("projects"),
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.syntheticTurnMessageId !== args.messageId) {
      return null;
    }
    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(args.projectId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      return null;
    }
    const streamingEntityId = projectChatStreamEntityId(args.projectId);
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
        internal.projectChatWorkflow.handleStaleSyntheticTurn,
        { projectId: args.projectId, messageId: args.messageId },
      );
      return null;
    }
    await finalizeCancelledAssistantMessage(ctx, message, streaming);
    await clearStreamingActivity(ctx, streamingEntityId);
    await ctx.db.patch(args.projectId, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedProjectChatMessage(ctx, args.projectId);
    return null;
  },
});

export const ensurePendingTurn = internalMutation({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.pendingTurn) return null;
    if (
      args.model !== undefined &&
      !usesChatDaemon(normalizeAIModel(args.model))
    ) {
      return null;
    }
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
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
    await ctx.db.patch(args.projectId, {
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
