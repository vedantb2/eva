import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_daytona/resumeSandboxSteps";

/** Starts a task preview sandbox (checkout task branch + run startup commands) as a durable workflow step. */
export const taskPreviewSandboxStartupWorkflow = workflow.define({
  args: {
    taskId: v.id("agentTasks"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    forceStartupCommands: v.optional(v.boolean()),
  },
  handler: async (step, args): Promise<void> => {
    // Daytona-only pre-thaw (see sessionSandboxStartupWorkflow). Vercel resume
    // runs inside startTaskPreviewSandbox — skip kickoff to avoid ~6–8s of
    // empty workflow step latency before sandbox.start().
    if (args.existingSandboxId && !args.vercelSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: args.existingSandboxId,
          vercelSandboxId: args.vercelSandboxId,
          repoId: args.repoId,
          streamingEntityId: `task-sandbox-startup-${args.taskId}`,
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
      vercelSandboxId: args.vercelSandboxId,
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
