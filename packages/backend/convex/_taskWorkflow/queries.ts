import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { buildImplementationPrompt } from "./prompts";

export const getTaskData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
  },
  returns: v.object({
    prompt: v.string(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
    projectSandboxId: v.optional(v.string()),
    hasSubtasks: v.boolean(),
    appLabel: v.optional(v.string()),
    rootDirectory: v.string(),
    auditCategories: v.array(
      v.object({ name: v.string(), description: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    let projectSandboxId: string | undefined;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        projectSandboxId = project.sandboxId;
      }
    }

    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();
    const sortedSubtasks = subtasks.sort((a, b) => a.order - b.order);

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const changeRequests = comments
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.content);

    const branchName = args.branchName || `eva/task-${args.taskId}`;

    const rootDirectory = repo.rootDirectory ?? "";

    const prompt = buildImplementationPrompt(
      task,
      sortedSubtasks,
      branchName,
      !args.projectId,
      rootDirectory,
      changeRequests.length > 0 ? changeRequests : undefined,
    );

    const appLabel = repo.rootDirectory
      ? repo.rootDirectory.split("/").pop() || undefined
      : undefined;

    const canonicalRepoId = repo.parentRepoId ?? args.repoId;
    const appId = repo.parentRepoId ? args.repoId : undefined;

    const categories = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalRepoId))
      .collect();

    const enabledCategories = categories
      .filter((c) => {
        if (!c.enabled) return false;
        const isRepoLevel = c.appId === undefined;
        const isForThisApp = c.appId !== undefined && c.appId === appId;

        if (isRepoLevel) {
          if (
            appId &&
            c.disabledForAppIds &&
            c.disabledForAppIds.includes(appId)
          ) {
            return false;
          }
          return true;
        }

        return isForThisApp;
      })
      .map((c) => ({ name: c.name, description: c.description }));

    return {
      prompt,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      taskTitle: task.title,
      taskDescription: task.description,
      projectSandboxId,
      hasSubtasks: sortedSubtasks.length > 0,
      appLabel,
      rootDirectory,
      auditCategories: enabledCategories,
    };
  },
});
