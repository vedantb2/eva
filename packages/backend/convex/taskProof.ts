import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const save = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  returns: v.id("taskProof"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Task not found");
    }
    return await ctx.db.insert("taskProof", {
      taskId: args.taskId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      createdAt: Date.now(),
    });
  },
});

export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(
    v.object({
      _id: v.id("taskProof"),
      _creationTime: v.number(),
      taskId: v.id("agentTasks"),
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      createdAt: v.number(),
      url: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return [];
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      return [];
    }
    const proofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return Promise.all(
      proofs.map(async (p) => ({
        ...p,
        url: await ctx.storage.getUrl(p.storageId),
      })),
    );
  },
});

export const remove = authMutation({
  args: { id: v.id("taskProof") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) {
      throw new Error("Proof not found");
    }
    const task = await ctx.db.get(proof.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Proof not found");
    }
    await ctx.storage.delete(proof.storageId);
    await ctx.db.delete(args.id);
    return null;
  },
});
