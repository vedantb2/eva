import { v } from "convex/values";
import { authMutation, authQuery, hasTaskAccess } from "./functions";

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
  },
  returns: v.id("taskProof"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    return await ctx.db.insert("taskProof", {
      taskId: args.taskId,
      storageId: args.storageId,
      fileName: args.fileName,
      createdAt: Date.now(),
    });
  },
});

export const saveMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
  },
  returns: v.id("taskProof"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    return await ctx.db.insert("taskProof", {
      taskId: args.taskId,
      message: args.message,
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
      storageId: v.optional(v.id("_storage")),
      fileName: v.optional(v.string()),
      message: v.optional(v.string()),
      createdAt: v.number(),
      url: v.union(v.string(), v.null()),
      contentType: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const proofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return Promise.all(
      proofs.map(async (p) => {
        if (!p.storageId) {
          return { ...p, url: null, contentType: null };
        }
        const meta = await ctx.db.system.get("_storage", p.storageId);
        return {
          ...p,
          url: await ctx.storage.getUrl(p.storageId),
          contentType: meta?.contentType ?? null,
        };
      }),
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
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Proof not found");
    if (proof.storageId) {
      await ctx.storage.delete(proof.storageId);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
