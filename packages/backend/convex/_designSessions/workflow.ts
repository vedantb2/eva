import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";

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
    await step.runAction(internal.daytona.startDesignSandbox, {
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
