import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createNotification } from "./notifications";
import { authQuery, authMutation, hasTaskAccess } from "./functions";
import { extractMentionedUserIds } from "./_mentions/extractMentionedUserIds";
import { taskCommentFields } from "./validators";

export const DELETED_COMMENT_PLACEHOLDER =
  "This comment has been deleted by the author";

const taskCommentValidator = v.object({
  _id: v.id("taskComments"),
  _creationTime: v.number(),
  ...taskCommentFields,
});

/** Builds a truncated notification message for a new task comment. */
function buildCommentNotificationMessage(
  content: string,
  projectId: Id<"projects"> | undefined,
): string {
  const scopeLabel = projectId ? "project task" : "quick task";
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return `New comment added on this ${scopeLabel}.`;
  }
  const summary =
    trimmedContent.length > 180
      ? `${trimmedContent.slice(0, 177)}...`
      : trimmedContent;
  return `New comment on this ${scopeLabel}: "${summary}"`;
}

/** Lists all comments for a task, sorted oldest first. */
export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(taskCommentValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/** Creates a comment on a task and notifies the assignee + mentioned users. */
export const create = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    content: v.string(),
    parentId: v.optional(v.id("taskComments")),
  },
  returns: v.id("taskComments"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Task not found");
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.taskId !== args.taskId) {
        throw new Error("Parent comment not found");
      }
    }

    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      content: args.content,
      authorId: ctx.userId,
      parentId: args.parentId,
      createdAt: Date.now(),
    });

    const notifiedUserIds = new Set<string>([ctx.userId]);
    const author = await ctx.db.get(ctx.userId);
    const authorName = author?.fullName?.trim() || "Someone";

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (
        parent?.authorId &&
        parent.authorId !== ctx.userId &&
        !notifiedUserIds.has(parent.authorId)
      ) {
        await createNotification(ctx, {
          userId: parent.authorId,
          type: "comment_reply",
          title: `${authorName} replied to your comment`,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.taskId,
          message: buildCommentNotificationMessage(
            args.content,
            task.projectId,
          ),
        });
        notifiedUserIds.add(parent.authorId);
      }
    }

    if (
      task.assignedTo &&
      task.assignedTo !== ctx.userId &&
      !notifiedUserIds.has(task.assignedTo)
    ) {
      await createNotification(ctx, {
        userId: task.assignedTo,
        type: "comment_added",
        title: `New comment on "${task.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
        taskId: args.taskId,
        message: buildCommentNotificationMessage(args.content, task.projectId),
      });
      notifiedUserIds.add(task.assignedTo);
    }

    const mentionedUserIds = extractMentionedUserIds(ctx, args.content);
    if (mentionedUserIds.length > 0) {
      const repo = task.repoId ? await ctx.db.get(task.repoId) : null;
      const teamId = repo?.teamId;
      const mentionTitle = `${authorName} mentioned you in a comment`;
      const mentionMessage = buildCommentNotificationMessage(
        args.content,
        task.projectId,
      );
      for (const mentionedUserId of mentionedUserIds) {
        if (notifiedUserIds.has(mentionedUserId)) continue;
        if (teamId) {
          const membership = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_and_user", (q) =>
              q.eq("teamId", teamId).eq("userId", mentionedUserId),
            )
            .first();
          if (!membership) continue;
        }
        await createNotification(ctx, {
          userId: mentionedUserId,
          type: "mention",
          title: mentionTitle,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.taskId,
          message: mentionMessage,
        });
        notifiedUserIds.add(mentionedUserId);
      }
    }

    return commentId;
  },
});

/** Updates a task comment. Only the original author may edit. */
export const update = authMutation({
  args: {
    id: v.id("taskComments"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.deletedAt !== undefined) {
      throw new Error("Cannot edit a deleted comment");
    }
    if (comment.authorId !== ctx.userId) {
      throw new Error("Only the comment author can edit");
    }
    const task = await ctx.db.get(comment.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Comment not found");
    }
    await ctx.db.patch(args.id, { content: args.content });
    return null;
  },
});

/** Soft-deletes a task comment; replies are kept. */
export const remove = authMutation({
  args: { id: v.id("taskComments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.authorId !== ctx.userId) {
      throw new Error("Only the comment author can delete");
    }
    const task = await ctx.db.get(comment.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Comment not found");
    }
    if (comment.deletedAt !== undefined) {
      throw new Error("Comment already deleted");
    }
    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      content: DELETED_COMMENT_PLACEHOLDER,
    });
    return null;
  },
});

/** Creates a system-generated comment on a task (no author). */
export const createSystemComment = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    content: v.string(),
  },
  returns: v.id("taskComments"),
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      content: args.content,
      authorId: undefined,
      createdAt: Date.now(),
    });
    return commentId;
  },
});
