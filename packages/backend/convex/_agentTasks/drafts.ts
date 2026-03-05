import { v } from "convex/values";
import { claudeModelValidator } from "../validators";
import {
  authQuery,
  authMutation,
  hasRepoAccess,
  recomputeProjectPhase,
} from "../functions";
import { agentTaskValidator } from "./helpers";

export const listDrafts = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return tasks
      .filter((t) => t.status === "draft" && t.createdBy === ctx.userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const saveDraft = authMutation({
  args: {
    id: v.optional(v.id("agentTasks")),
    repoId: v.id("githubRepos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (
        !existing ||
        existing.createdBy !== ctx.userId ||
        existing.status !== "draft"
      )
        throw new Error("Draft not found");
      await ctx.db.patch(args.id, {
        title: args.title ?? "",
        description: args.description,
        baseBranch: args.baseBranch,
        updatedAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("agentTasks", {
      title: args.title ?? "",
      description: args.description,
      repoId: args.repoId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
      baseBranch: args.baseBranch,
    });
  },
});

export const activateDraft = authMutation({
  args: {
    id: v.id("agentTasks"),
    title: v.string(),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    model: v.optional(claudeModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || task.createdBy !== ctx.userId || task.status !== "draft")
      throw new Error("Draft not found");

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      baseBranch: args.baseBranch ?? "staging",
      model: args.model,
      status: "todo",
      updatedAt: Date.now(),
    });
    if (task.projectId) {
      await recomputeProjectPhase(ctx.db, task.projectId);
    }
    return null;
  },
});
