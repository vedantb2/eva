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
import { startNextQueuedProjectChatMessage } from "../_queues/helpers";
import { PROJECT_CHAT_STREAM_PREFIX } from "../workflowWatchdog";
import { CHAT_TURN_PROTOCOL_VERSION } from "../../shared/chatTurnProtocol";
import { usesChatDaemon } from "./daemonTransport";
import {
  callbackMatchesActiveTurn,
  exactTurnIdentity,
  turnIdentityMatches,
} from "./turnIdentity";

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
    const project = await ctx.db.get(args.projectId);
    if (!project) return emptyClaimReturn;
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
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

    if (
      project.pendingTurn.turnId !== undefined &&
      args.callbackProtocolVersion !== CHAT_TURN_PROTOCOL_VERSION
    ) {
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
    await ctx.db.patch(args.projectId, {
      pendingTurn: undefined,
      activeTurn:
        project.pendingTurn.turnId !== undefined &&
        project.pendingTurn.assistantMessageId !== undefined &&
        project.pendingTurn.attempt !== undefined
          ? {
              turnId: project.pendingTurn.turnId,
              assistantMessageId: project.pendingTurn.assistantMessageId,
              attempt: project.pendingTurn.attempt,
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
      turnId: project.pendingTurn.turnId,
      assistantMessageId: project.pendingTurn.assistantMessageId,
      attempt: project.pendingTurn.attempt,
    };
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
  args: {
    projectId: v.id("projects"),
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
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (
      args.callbackProtocolVersion !== CHAT_TURN_PROTOCOL_VERSION ||
      project.activeTurn !== undefined ||
      project.syntheticTurnMessageId !== undefined
    ) {
      return null;
    }
    const turnId = crypto.randomUUID();
    const attempt = 1;
    const messageId = await ctx.db.insert("messages", {
      parentId: args.projectId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
      turnId,
    });
    await ctx.db.patch(args.projectId, {
      syntheticTurnMessageId: messageId,
      activeTurn: {
        turnId,
        assistantMessageId: messageId,
        attempt,
        acceptedAt: Date.now(),
      },
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.projectChatWorkflow.handleStaleSyntheticTurn,
      { projectId: args.projectId, messageId, turnId, attempt },
    );
    return { messageId, turnId, attempt };
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    const turnIdentity = exactTurnIdentity(args);
    if (
      !project ||
      turnIdentity === null ||
      !callbackMatchesActiveTurn(project, turnIdentity) ||
      project.syntheticTurnMessageId !== args.messageId
    ) {
      console.log(
        `[chat-turn] stale synthetic completion ignored surface=project parentId=${args.projectId}`,
      );
      return null;
    }
    await clearStreamingActivityForTurn(
      ctx,
      projectChatStreamEntityId(args.projectId),
      turnIdentity,
    );
    await clearPendingQuestionsForTurn(
      ctx.db,
      String(args.projectId),
      turnIdentity,
    );
    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.projectId ||
      message.turnId !== turnIdentity.turnId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.projectId, {
        syntheticTurnMessageId: undefined,
        activeTurn: undefined,
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
      activeTurn: undefined,
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
    turnId: v.string(),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    const turnIdentity = {
      turnId: args.turnId,
      assistantMessageId: args.messageId,
      attempt: args.attempt,
    };
    if (
      !project ||
      project.syntheticTurnMessageId !== args.messageId ||
      !callbackMatchesActiveTurn(project, turnIdentity)
    ) {
      return null;
    }
    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(args.projectId, {
        syntheticTurnMessageId: undefined,
        activeTurn: undefined,
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
        {
          projectId: args.projectId,
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
      String(args.projectId),
      turnIdentity,
    );
    await ctx.db.patch(args.projectId, {
      syntheticTurnMessageId: undefined,
      activeTurn: undefined,
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.pendingTurn) return null;
    const turnIdentity = exactTurnIdentity(args);
    if (
      turnIdentity !== null &&
      !callbackMatchesActiveTurn(project, turnIdentity)
    ) {
      return null;
    }
    if (
      args.model !== undefined &&
      !usesChatDaemon(args.model, project.cursorTransport)
    ) {
      return null;
    }
    const last =
      turnIdentity === null
        ? await ctx.db
            .query("messages")
            .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
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
    await ctx.db.patch(args.projectId, {
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
