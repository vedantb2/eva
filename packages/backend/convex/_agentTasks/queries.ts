import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { taskStatusValidator } from "../validators";
import { authQuery, hasRepoAccess, hasTaskAccess } from "../functions";
import { agentTaskValidator } from "./helpers";

/** Lists all tasks for a project, sorted by task number. */
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

/** Retrieves a single task by ID, returning null if not found or unauthorized. */
export const get = authQuery({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;
    return task;
  },
});

/** Returns all non-draft, non-done tasks across accessible repos, sorted by most recently updated. */
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
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .collect();
      const teamRepos = await Promise.all(
        memberships.map((m) =>
          ctx.db
            .query("githubRepos")
            .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
            .collect(),
        ),
      );
      const connectedRepos = await ctx.db
        .query("githubRepos")
        .withIndex("by_connected_by", (q) => q.eq("connectedBy", ctx.userId))
        .collect();
      const seen = new Set<string>();
      repoIds = [];
      for (const repo of [...connectedRepos, ...teamRepos.flat()]) {
        if (seen.has(String(repo._id))) continue;
        seen.add(String(repo._id));
        repoIds.push(repo._id);
      }
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

/** Returns all non-draft tasks for a repo, sorted by creation date. */
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

/** Returns the tasks that depend on a given task (its downstream dependents). */
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

/** Returns the status of multiple tasks by their IDs. */
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
