import { v } from "convex/values";
import { aiModelValidator } from "../validators";
import {
  authQuery,
  authMutation,
  hasRepoAccess,
  recomputeProjectPhase,
} from "../functions";
import { createNotification } from "../notifications";
import { ensureSubscribed } from "../taskSubscribers";
import {
  agentTaskValidator,
  normalizeTaskTags,
  buildTaskNotificationMessage,
} from "./helpers";
import { resolveNewTaskBaseBranch } from "../_taskWorkflow/resolveBaseBranch";

/** Lists all draft tasks for the current user in a given repo, sorted by most recently updated. */
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

/** Creates or updates a draft task. Returns the task ID. */
export const saveDraft = authMutation({
  args: {
    id: v.optional(v.id("agentTasks")),
    repoId: v.id("githubRepos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repo not found");
    const project = args.projectId ? await ctx.db.get(args.projectId) : null;

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

    const draftId = await ctx.db.insert("agentTasks", {
      title: args.title ?? "",
      description: args.description,
      repoId: args.repoId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
      baseBranch: resolveNewTaskBaseBranch(args.baseBranch, repo, project),
      projectId: args.projectId,
    });
    await ensureSubscribed(ctx, draftId, ctx.userId);
    return draftId;
  },
});

/** Promotes a draft task to "todo" status so it can be executed. */
export const activateDraft = authMutation({
  args: {
    id: v.id("agentTasks"),
    title: v.string(),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    model: v.optional(aiModelValidator),
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
    screenshotsVideosEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || task.createdBy !== ctx.userId || task.status !== "draft")
      throw new Error("Draft not found");

    const repo = task.repoId ? await ctx.db.get(task.repoId) : null;
    const project = task.projectId ? await ctx.db.get(task.projectId) : null;

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      baseBranch: resolveNewTaskBaseBranch(args.baseBranch, repo, project),
      model: args.model,
      status: "todo",
      updatedAt: Date.now(),
      tags: normalizeTaskTags(args.tags),
      assignedTo: args.assignedTo,
      screenshotsVideosEnabled: args.screenshotsVideosEnabled,
    });
    if (args.assignedTo) {
      await ensureSubscribed(ctx, args.id, args.assignedTo);
    }
    if (args.assignedTo && args.assignedTo !== ctx.userId) {
      await createNotification(ctx, {
        userId: args.assignedTo,
        type: "task_assigned",
        title: `Assigned: "${args.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
        taskId: args.id,
        message: buildTaskNotificationMessage(
          { ...task, status: "todo" },
          "assigned",
        ),
      });
    }
    if (task.projectId) {
      await recomputeProjectPhase(ctx, task.projectId);
    }
    return null;
  },
});
