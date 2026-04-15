import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "../functions";
import {
  projectWithDetailsValidator,
  projectSummaryValidator,
  getProjectConversation,
  getProjectGeneratedSpec,
} from "./helpers";

/** Lists all projects for a repo. */
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

/** Retrieves a project by ID with its conversation history and generated spec. */
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

/** Returns the number of tasks in a project. */
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

/** Counts projects that currently have an active build workflow running. */
export const countBuilding = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return 0;
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return projects.filter((p) => p.activeBuildWorkflowId !== undefined).length;
  },
});

/** Returns a breakdown of task counts by status for a project. */
export const getTaskProgress = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    total: v.number(),
    todo: v.number(),
    in_progress: v.number(),
    code_review: v.number(),
    business_review: v.number(),
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
        code_review: 0,
        business_review: 0,
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
      code_review: tasks.filter((t) => t.status === "code_review").length,
      business_review: tasks.filter((t) => t.status === "business_review")
        .length,
      done: tasks.filter((t) => t.status === "done").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };
  },
});
