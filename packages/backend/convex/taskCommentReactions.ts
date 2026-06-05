import { v } from "convex/values";
import { authQuery, authMutation, hasTaskAccess } from "./functions";

// The thread renderer only needs to know which emoji exist on each comment and
// who reacted, so the query projects away `_id`/`_creationTime`/`createdAt`.
// Keeping the shape this lean also lets the client build optimistic rows from
// real values (commentId/userId/emoji) without fabricating an Id.
const reactionViewValidator = v.object({
  commentId: v.id("taskComments"),
  userId: v.id("users"),
  emoji: v.string(),
});

/** Lists every comment reaction for a task in one query (grouped client-side). */
export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(reactionViewValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const reactions = await ctx.db
      .query("taskCommentReactions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return reactions.map((reaction) => ({
      commentId: reaction.commentId,
      userId: reaction.userId,
      emoji: reaction.emoji,
    }));
  },
});

/**
 * Adds or removes the current user's reaction for a (comment, emoji) pair.
 *
 * Idempotent toggle: reacting again with the same emoji removes it, while a
 * user may hold several different emoji on one comment. `taskId` is derived
 * from the comment so it always matches the access check and the denormalised
 * column.
 */
export const toggle = authMutation({
  args: {
    commentId: v.id("taskComments"),
    emoji: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const task = await ctx.db.get(comment.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Comment not found");
    }

    const existing = await ctx.db
      .query("taskCommentReactions")
      .withIndex("by_comment_user_emoji", (q) =>
        q
          .eq("commentId", args.commentId)
          .eq("userId", ctx.userId)
          .eq("emoji", args.emoji),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("taskCommentReactions", {
        taskId: comment.taskId,
        commentId: args.commentId,
        emoji: args.emoji,
        userId: ctx.userId,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});
