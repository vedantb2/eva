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
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return tasks.sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0));
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
    const activeStatuses = [
      "todo",
      "in_progress",
      "code_review",
      "business_review",
    ] as const;

    let repoIds: Array<Id<"githubRepos">>;
    if (args.repoId) {
      if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
      repoIds = [args.repoId];
    } else {
      const allRepos = await ctx.db.query("githubRepos").collect();
      repoIds = (
        await Promise.all(
          allRepos.map(async (r) =>
            (await hasRepoAccess(ctx.db, r._id, ctx.userId)) ? r._id : null,
          ),
        )
      ).filter((id): id is Id<"githubRepos"> => id !== null);
    }

    const taskArrays = await Promise.all(
      repoIds.flatMap((repoId) =>
        activeStatuses.map((status) =>
          ctx.db
            .query("agentTasks")
            .withIndex("by_repo_and_status", (q) =>
              q.eq("repoId", repoId).eq("status", status),
            )
            .collect(),
        ),
      ),
    );

    return taskArrays.flat().sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getAllTasks = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const nonDraftStatuses = [
      "todo",
      "in_progress",
      "code_review",
      "business_review",
      "done",
      "cancelled",
    ] as const;
    const taskArrays = await Promise.all(
      nonDraftStatuses.map((status) =>
        ctx.db
          .query("agentTasks")
          .withIndex("by_repo_and_status", (q) =>
            q.eq("repoId", args.repoId).eq("status", status),
          )
          .collect(),
      ),
    );
    return taskArrays.flat().sort((a, b) => a.createdAt - b.createdAt);
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
