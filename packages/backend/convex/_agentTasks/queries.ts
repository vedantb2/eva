import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { taskStatusValidator } from "../validators";
import { authQuery, hasRepoAccess, hasTaskAccess } from "../functions";
import { agentTaskValidator } from "./helpers";

export const listByProject = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      return [];
    return await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const get = authQuery({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;
    return task;
  },
});

export const getActiveTasks = authQuery({
  args: { repoId: v.optional(v.id("githubRepos")) },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const accessibleRepoIds = new Set(
      (
        await Promise.all(
          allRepos.map(async (r) =>
            (await hasRepoAccess(ctx.db, r._id, ctx.userId)) ? r._id : null,
          ),
        )
      ).filter((id): id is Id<"githubRepos"> => id !== null),
    );
    const tasks = await ctx.db.query("agentTasks").collect();
    const active = tasks.filter(
      (t) =>
        t.repoId &&
        accessibleRepoIds.has(t.repoId) &&
        (!args.repoId || t.repoId === args.repoId) &&
        (t.status === "todo" ||
          t.status === "in_progress" ||
          t.status === "business_review" ||
          t.status === "code_review"),
    );
    return active.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getAllTasks = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return tasks
      .filter((t) => t.status !== "draft")
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getDependentTasks = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(
    v.object({
      _id: v.id("agentTasks"),
      title: v.string(),
      taskNumber: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const dependents = await ctx.db
      .query("taskDependencies")
      .withIndex("by_dependency", (q) => q.eq("dependsOnId", args.taskId))
      .collect();
    const depTasks = await Promise.all(
      dependents.map((dep) => ctx.db.get(dep.taskId)),
    );
    return depTasks
      .filter((t): t is Exclude<typeof t, null> => t !== null)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        taskNumber: t.taskNumber,
      }));
  },
});

export const getStatusesByIds = authQuery({
  args: { ids: v.array(v.id("agentTasks")) },
  returns: v.array(
    v.object({
      id: v.id("agentTasks"),
      status: taskStatusValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const tasks = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return tasks
      .filter((t): t is Exclude<typeof t, null> => t !== null)
      .map((t) => ({ id: t._id, status: t.status }));
  },
});
