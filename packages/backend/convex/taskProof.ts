import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { authMutation, authQuery, hasTaskAccess } from "./functions";

/** Generates a temporary upload URL for storing proof files. */
export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Saves a file-based proof attachment to a task. */
export const save = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    runId: v.optional(v.id("agentRuns")),
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
      runId: args.runId,
      createdAt: Date.now(),
    });
  },
});

/** Saves a text message as proof for a task. */
export const saveMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    runId: v.optional(v.id("agentRuns")),
  },
  returns: v.id("taskProof"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    return await ctx.db.insert("taskProof", {
      taskId: args.taskId,
      message: args.message,
      runId: args.runId,
      createdAt: Date.now(),
    });
  },
});

/** Lists all proof attachments for a task, including resolved file URLs. */
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
      runId: v.optional(v.id("agentRuns")),
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

/** True when this run already has at least one file-based proof (not a text stub). */
export const hasMediaForRun = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return proofs.some(
      (p) => p.runId === args.runId && p.storageId !== undefined,
    );
  },
});

/** Clears text-only proof stubs for a run before a capture retry. */
export const clearMessageProofsForRun = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    let removed = 0;
    for (const proof of proofs) {
      if (proof.runId !== args.runId) continue;
      if (proof.storageId !== undefined) continue;
      await ctx.db.delete(proof._id);
      removed += 1;
    }
    return removed;
  },
});

/** Deletes a proof attachment and its associated storage file. */
export const remove = authMutation({
  args: { id: v.id("taskProof") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) {
      throw new Error("Proof not found");
    }
    const task = await ctx.db.get(proof.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (proof.storageId) {
      await ctx.storage.delete(proof.storageId);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
