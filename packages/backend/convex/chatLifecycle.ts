import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { chatParentIdValidator } from "./validators";
import { cancelTrackedWorkflow } from "./workflowManager";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "./streaming";
import { clearPendingQuestionsForEntity } from "./pendingQuestions";

const CLEANUP_BATCH_SIZE = 50;

/**
 * Cancels side-chat state in bounded pages when a parent sandbox stops or a
 * session is archived. The messages and queue remain available for later
 * resume, but no lane can stay marked as running after its VM is stopped.
 */
export const cleanupParentChats = internalMutation({
  args: {
    parentId: chatParentIdValidator,
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("chats")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .paginate({ cursor: args.cursor ?? null, numItems: CLEANUP_BATCH_SIZE });

    for (const chat of page.page) {
      await cancelTrackedWorkflow(ctx, chat.activeWorkflowId);
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
      await clearPendingQuestionsForEntity(ctx.db, String(chat._id));
      await ctx.db.patch(chat._id, {
        activeWorkflowId: undefined,
        pendingTurn: undefined,
        syntheticTurnMessageId: undefined,
        backgroundAgents: undefined,
        pendingTaskStops: undefined,
        cancelRequestedAt: undefined,
        updatedAt: Date.now(),
      });
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.chatLifecycle.cleanupParentChats,
        {
          parentId: args.parentId,
          cursor: page.continueCursor,
        },
      );
    }
    return null;
  },
});
