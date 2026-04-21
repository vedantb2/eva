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
    let projectContext: { title: string; description?: string } | undefined;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        projectSandboxId = project.sandboxId;
        projectContext = {
          title: project.title,
          description: project.description ?? undefined,
        };
      }
    }

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Only surface comments the last successful run hasn't already addressed,
    // so subsequent "Make changes" runs focus on NEW feedback. Cutoff is the
    // latest successful run's startedAt (not finishedAt), so comments added
    // while that run was in-flight still carry over. Failed/errored runs are
    // NOT cutoffs — their comments stay unaddressed for the next retry.
    const successfulRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task_and_status", (q) =>
        q.eq("taskId", args.taskId).eq("status", "success"),
      )
      .collect();
    const latestSuccessStartedAt = successfulRuns.reduce<number | undefined>(
      (latest, run) => {
        if (run.startedAt === undefined) return latest;
        if (latest === undefined || run.startedAt > latest)
          return run.startedAt;
        return latest;
      },
      undefined,
    );
    const relevantComments =
      latestSuccessStartedAt !== undefined
        ? comments.filter((c) => c.createdAt > latestSuccessStartedAt)
        : comments;

    const changeRequests = relevantComments
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.content);

    const branchName = args.branchName || `eva/task-${args.taskId}`;

    const rootDirectory = repo.rootDirectory ?? "";

    const screenshotsVideosEnabled = repo.screenshotsVideosEnabled ?? false;

    const prompt =
      args.mode === "resolve_conflicts"
        ? buildConflictResolutionPrompt(
            branchName,
            task.baseBranch ?? "main",
            rootDirectory,
            repo.owner,
            repo.name,
          )
        : buildImplementationPrompt(
            task,
            branchName,
            !args.projectId,
            rootDirectory,
            screenshotsVideosEnabled,
            repo.owner,
            repo.name,
            changeRequests.length > 0 ? changeRequests : undefined,
            projectContext,
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
