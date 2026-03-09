import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createNotification } from "./notifications";
import { authQuery, authMutation, hasTaskAccess } from "./functions";

const taskCommentValidator = v.object({
  _id: v.id("taskComments"),
  _creationTime: v.number(),
  taskId: v.id("agentTasks"),
  content: v.string(),
  authorId: v.optional(v.id("users")),
  createdAt: v.number(),
});

function buildCommentNotificationMessage(
  content: string,
  projectId: Id<"projects"> | undefined,
): string {
  const scopeLabel = projectId ? "project task" : "issue";
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

export const create = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    content: v.string(),
  },
  returns: v.id("taskComments"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      content: args.content,
      authorId: ctx.userId,
      createdAt: Date.now(),
    });
    if (task.assignedTo && task.assignedTo !== ctx.userId) {
      await createNotification(ctx, {
        userId: task.assignedTo,
        type: "comment_added",
        title: `New comment on "${task.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
        taskId: args.taskId,
        message: buildCommentNotificationMessage(args.content, task.projectId),
      });
    }
    return commentId;
  },
});

export const remove = authMutation({
  args: { id: v.id("taskComments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const task = await ctx.db.get(comment.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Comment not found");
    await ctx.db.delete(args.id);
    return null;
  },
});

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
