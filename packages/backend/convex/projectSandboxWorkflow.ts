import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_sandbox_runtime/resumeSandboxSteps";

/** Starts a project preview sandbox (checkout project branch + run startup commands) as a durable workflow step. */
export const projectPreviewSandboxStartupWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
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
    // Legacy archived-sandbox pre-thaw (see sessionSandboxStartupWorkflow). Vercel resume
    // runs inside startProjectPreviewSandbox — skip kickoff to avoid ~6–8s of
    // empty workflow step latency before sandbox.start().
    if (args.existingSandboxId && !args.vercelSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: args.existingSandboxId,
          vercelSandboxId: args.vercelSandboxId,
          repoId: args.repoId,
          streamingEntityId: `project-sandbox-startup-${args.projectId}`,
        });
      } catch (error) {
        await step.runMutation(internal.projects.projectSandboxError, {
          projectId: args.projectId,
          error:
            error instanceof Error
              ? error.message
              : "Project sandbox could not be restored from cold storage. Please retry.",
        });
        return;
      }
    }
    await step.runAction(internal.sandbox.startProjectPreviewSandbox, {
      projectId: args.projectId,
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
