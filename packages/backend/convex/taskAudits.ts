import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { evaluationStatusValidator, evalResultValidator } from "./validators";

export const getByTask = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.union(
    v.object({
      _id: v.id("taskAudits"),
      _creationTime: v.number(),
      taskId: v.id("agentTasks"),
      runId: v.id("agentRuns"),
      status: evaluationStatusValidator,
      accessibility: v.array(evalResultValidator),
      testing: v.array(evalResultValidator),
      codeReview: v.array(evalResultValidator),
      summary: v.optional(v.string()),
      error: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const audits = await ctx.db
      .query("taskAudits")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    if (audits.length === 0) return null;
    return audits.sort((a, b) => b.createdAt - a.createdAt)[0];
  },
});

export const create = mutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.id("taskAudits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("taskAudits", {
      taskId: args.taskId,
      runId: args.runId,
      status: "running",
      accessibility: [],
      testing: [],
      codeReview: [],
      createdAt: Date.now(),
    });
  },
});

export const createInternal = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.id("taskAudits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("taskAudits", {
      taskId: args.taskId,
      runId: args.runId,
      status: "running",
      accessibility: [],
      testing: [],
      codeReview: [],
      createdAt: Date.now(),
    });
  },
});

export const complete = mutation({
  args: {
    id: v.id("taskAudits"),
    accessibility: v.array(evalResultValidator),
    testing: v.array(evalResultValidator),
    codeReview: v.array(evalResultValidator),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) throw new Error("Audit not found");
    await ctx.db.patch(args.id, {
      status: "completed",
      accessibility: args.accessibility,
      testing: args.testing,
      codeReview: args.codeReview,
      summary: args.summary,
    });
    return null;
  },
});

export const completeInternal = internalMutation({
  args: {
    id: v.id("taskAudits"),
    accessibility: v.array(evalResultValidator),
    testing: v.array(evalResultValidator),
    codeReview: v.array(evalResultValidator),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) throw new Error("Audit not found");
    await ctx.db.patch(args.id, {
      status: "completed",
      accessibility: args.accessibility,
      testing: args.testing,
      codeReview: args.codeReview,
      summary: args.summary,
    });
    return null;
  },
});

export const fail = mutation({
  args: {
    id: v.id("taskAudits"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) throw new Error("Audit not found");
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
    });
    return null;
  },
});

export const failInternal = internalMutation({
  args: {
    id: v.id("taskAudits"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) throw new Error("Audit not found");
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
    });
    return null;
  },
});
