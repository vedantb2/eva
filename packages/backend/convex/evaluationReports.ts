import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import {
  evaluationStatusValidator,
  evalResultValidator,
  evalFixStatusValidator,
} from "./validators";

const reportValidator = v.object({
  _id: v.id("evaluationReports"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  docId: v.id("docs"),
  status: evaluationStatusValidator,
  results: v.array(evalResultValidator),
  summary: v.optional(v.string()),
  error: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  fixStatus: v.optional(evalFixStatusValidator),
  fixBranchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listByDoc = authQuery({
  args: { docId: v.id("docs") },
  returns: v.array(reportValidator),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      return [];
    const reports = await ctx.db
      .query("evaluationReports")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .collect();
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = authQuery({
  args: { id: v.id("evaluationReports") },
  returns: v.union(reportValidator, v.null()),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) return null;
    if (!(await hasRepoAccess(ctx.db, report.repoId, ctx.userId))) return null;
    return report;
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    docId: v.id("docs"),
  },
  returns: v.id("evaluationReports"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
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

export const updateEvalStatus = authMutation({
  args: {
    id: v.id("evaluationReports"),
    status: evaluationStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

export const completeEval = authMutation({
  args: {
    id: v.id("evaluationReports"),
    results: v.array(evalResultValidator),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

export const failEval = authMutation({
  args: {
    id: v.id("evaluationReports"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

export const updateEvalSummary = authMutation({
  args: {
    id: v.id("evaluationReports"),
    summary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
