import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { evaluationStatusValidator, reviewCommentValidator } from "./validators";

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    projectId: v.optional(v.id("projects")),
    prUrl: v.string(),
    prNumber: v.number(),
  },
  returns: v.id("codeReviews"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("codeReviews", {
      ...args,
      status: "pending",
      comments: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("codeReviews"),
    status: evaluationStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Code review not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const complete = mutation({
  args: {
    id: v.id("codeReviews"),
    summary: v.string(),
    comments: v.array(reviewCommentValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Code review not found");
    await ctx.db.patch(args.id, {
      status: "completed",
      summary: args.summary,
      comments: args.comments,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const fail = mutation({
  args: {
    id: v.id("codeReviews"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Code review not found");
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getByRun = query({
  args: { runId: v.id("agentRuns") },
  returns: v.union(
    v.object({
      _id: v.id("codeReviews"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      taskId: v.id("agentTasks"),
      runId: v.id("agentRuns"),
      projectId: v.optional(v.id("projects")),
      prUrl: v.string(),
      prNumber: v.number(),
      status: evaluationStatusValidator,
      summary: v.optional(v.string()),
      comments: v.array(reviewCommentValidator),
      error: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeReviews")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .first();
  },
});
