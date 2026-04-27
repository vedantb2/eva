import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";

/** Starts a task preview sandbox (checkout task branch + run startup commands) as a durable workflow step. */
export const taskPreviewSandboxStartupWorkflow = workflow.define({
  args: {
    taskId: v.id("agentTasks"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runAction(internal.daytona.startTaskPreviewSandbox, {
      taskId: args.taskId,
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });
  },
});
