import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import { evaluationStatusValidator, evalResultValidator } from "./validators";

const reportValidator = v.object({
  _id: v.id("evaluationReports"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  docId: v.id("docs"),
  status: evaluationStatusValidator,
  results: v.array(evalResultValidator),
  summary: v.optional(v.string()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listByDoc = query({
  args: { docId: v.id("docs") },
  returns: v.array(reportValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    const reports = await ctx.db
      .query("evaluationReports")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .collect();
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("evaluationReports") },
  returns: v.union(reportValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    docId: v.id("docs"),
  },
  returns: v.id("evaluationReports"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    return await ctx.db.insert("evaluationReports", {
      repoId: args.repoId,
      docId: args.docId,
      status: "pending",
      results: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEvalStatus = mutation({
  args: {
    id: v.id("evaluationReports"),
    status: evaluationStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Report not found");
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const completeEval = mutation({
  args: {
    id: v.id("evaluationReports"),
    results: v.array(evalResultValidator),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Report not found");
    }
    await ctx.db.patch(args.id, {
      status: "completed",
      results: args.results,
      summary: args.summary,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const failEval = mutation({
  args: {
    id: v.id("evaluationReports"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Report not found");
    }
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateEvalSummary = mutation({
  args: {
    id: v.id("evaluationReports"),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Report not found");
    }
    await ctx.db.patch(args.id, {
      summary: args.summary,
      updatedAt: Date.now(),
    });
    return null;
  },
});
