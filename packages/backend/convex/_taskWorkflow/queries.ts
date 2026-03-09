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
    postAuditEnabled: v.boolean(),
    accessibilityAuditEnabled: v.boolean(),
    codeTestingAuditEnabled: v.boolean(),
    codeReviewAuditEnabled: v.boolean(),
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
      postAuditEnabled: repo.postAuditEnabled !== false,
      accessibilityAuditEnabled: repo.accessibilityAuditEnabled !== false,
      codeTestingAuditEnabled: repo.codeTestingAuditEnabled !== false,
      codeReviewAuditEnabled: repo.codeReviewAuditEnabled !== false,
    };
  },
});
