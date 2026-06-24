import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_daytona/resumeSandboxSteps";

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
    forceStartupCommands: v.optional(v.boolean()),
  },
  handler: async (step, args): Promise<void> => {
    // Thaw an archived/stopped sandbox across polling steps before the start
    // action, so a multi-minute cold-storage restore doesn't blow the
    // per-action 10-minute limit inside startTaskPreviewSandbox →
    // ensureSandboxRunning.
    if (args.existingSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: args.existingSandboxId,
          repoId: args.repoId,
        });
      } catch (error) {
        await step.runMutation(internal.agentTasks.taskSandboxError, {
          taskId: args.taskId,
          error:
            error instanceof Error
              ? error.message
              : "Task sandbox could not be restored from cold storage. Please retry.",
        });
        return;
      }
    }
    await step.runAction(internal.daytona.startTaskPreviewSandbox, {
      taskId: args.taskId,
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
      forceStartupCommands: args.forceStartupCommands,
    });
  },
});
