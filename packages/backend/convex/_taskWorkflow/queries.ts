import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { runModeValidator } from "../validators";
import {
  buildImplementationPrompt,
  buildConflictResolutionPrompt,
} from "./prompts";

/** Fetches task, repo, and audit config to build the prompt and sandbox parameters for a run. */
export const getTaskData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    mode: v.optional(runModeValidator),
  },
  returns: v.object({
    prompt: v.string(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
    projectSandboxId: v.optional(v.string()),
    deploymentProjectName: v.optional(v.string()),
    rootDirectory: v.string(),
    screenshotsVideosEnabled: v.boolean(),
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

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const changeRequests = comments
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.content);

    const branchName = args.branchName || `eva/task-${args.taskId}`;

    const rootDirectory = repo.rootDirectory ?? "";

    const screenshotsVideosEnabled =
      args.projectId === undefined
        ? (repo.screenshotsVideosEnabled ?? true)
        : true;

    const prompt =
      args.mode === "resolve_conflicts"
        ? buildConflictResolutionPrompt(
            branchName,
            task.baseBranch ?? "main",
            rootDirectory,
          )
        : buildImplementationPrompt(
            task,
            branchName,
            !args.projectId,
            rootDirectory,
            screenshotsVideosEnabled,
            changeRequests.length > 0 ? changeRequests : undefined,
          );

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
        return isRepoLevel || isForThisApp;
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
      deploymentProjectName: repo.deploymentProjectName,
      rootDirectory,
      screenshotsVideosEnabled,
      auditCategories: enabledCategories,
    };
  },
});
