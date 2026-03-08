import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "../functions";
import {
  projectWithDetailsValidator,
  projectSummaryValidator,
  getProjectConversation,
  getProjectGeneratedSpec,
} from "./helpers";

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(projectSummaryValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return projects;
  },
});

export const get = authQuery({
  args: { id: v.id("projects") },
  returns: v.union(projectWithDetailsValidator, v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      return null;
    }
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) return null;
    const conversationHistory = await getProjectConversation(ctx.db, args.id);
    const generatedSpec = await getProjectGeneratedSpec(ctx.db, args.id);
    return {
      ...project,
      conversationHistory,
      ...(generatedSpec !== undefined ? { generatedSpec } : {}),
    };
  },
});

export const getTaskCount = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      return 0;
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return tasks.length;
  },
});

export const getTaskProgress = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    total: v.number(),
    todo: v.number(),
    in_progress: v.number(),
    business_review: v.number(),
    code_review: v.number(),
    done: v.number(),
    cancelled: v.number(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (
      !project ||
      !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))
    ) {
      return {
        total: 0,
        todo: 0,
        in_progress: 0,
        business_review: 0,
        code_review: 0,
        done: 0,
        cancelled: 0,
      };
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      business_review: tasks.filter((t) => t.status === "business_review")
        .length,
      code_review: tasks.filter((t) => t.status === "code_review").length,
      done: tasks.filter((t) => t.status === "done").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };
  },
});
