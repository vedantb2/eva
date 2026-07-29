import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { ensureSandboxStartedSteps } from "../_sandbox_runtime/resumeSandboxSteps";

/** Workflow that provisions or reconnects a sandbox for a design session. */
export const designSandboxStartupWorkflow = workflow.define({
  args: {
    designSessionId: v.id("designSessions"),
    existingSandboxId: v.optional(v.string()),

    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    // Thaw an archived/stopped sandbox across polling steps before the start
    // action, so a multi-minute cold-storage restore doesn't blow the per-action
    // 10-minute limit inside startDesignSandbox → ensureSandboxRunning.
    if (args.existingSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: args.existingSandboxId,

          repoId: args.repoId,
        });
      } catch (error) {
        await step.runMutation(internal.designSessions.sandboxError, {
          designSessionId: args.designSessionId,
          error:
            error instanceof Error
              ? error.message
              : "Sandbox could not be restored from cold storage. Please retry.",
        });
        return;
      }
    }
    await step.runAction(internal.sandbox.startDesignSandbox, {
      designSessionId: args.designSessionId,
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
