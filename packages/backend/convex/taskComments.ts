import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import { createNotification } from "./notifications";

const taskCommentValidator = v.object({
  _id: v.id("taskComments"),
  _creationTime: v.number(),
  taskId: v.id("agentTasks"),
  content: v.string(),
  authorId: v.string(),
  createdAt: v.number(),
});

export const listByTask = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(taskCommentValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return [];
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      return [];
    }
    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const create = mutation({
  args: {
    taskId: v.id("agentTasks"),
    content: v.string(),
  },
  returns: v.id("taskComments"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      content: args.content,
      authorId: identity.subject,
      createdAt: Date.now(),
    });
    const currentUserId = await getCurrentUserId(ctx);
    if (task.assignedTo && task.assignedTo !== currentUserId) {
      await createNotification(ctx, {
        userId: task.assignedTo,
        type: "comment_added",
        title: `New comment on "${task.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
      });
    }
    return commentId;
  },
});

export const remove = mutation({
  args: { id: v.id("taskComments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const task = await ctx.db.get(comment.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Comment not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
