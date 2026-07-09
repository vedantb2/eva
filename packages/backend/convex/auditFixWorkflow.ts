import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_daytona/resumeSandboxSteps";
import { resolveExistingSandboxId } from "./_sandbox/resolveExistingSandboxId";
import { auditFailureValidator } from "./validators";

/**
 * Resumes the audit-fix sandbox as a durable workflow, then launches the fix
 * agent.
 *
 * Audit fixes often run a while after the task completed, so the task/project
 * sandbox may have been archived to cold storage. Thawing it can take well over
 * Convex's 10-minute per-action limit, so we poll the thaw across workflow steps
 * (ensureSandboxStartedSteps) instead of blocking inside one action — the same
 * pattern used by the interactive resume paths. If the thaw fails, we drop the
 * sandbox id so launchSelectedAuditFixes spins up a fresh sandbox (it re-checks
 * out the pushed branch, so the result is equivalent).
 */
export const auditFixWorkflow = workflow.define({
  args: {
    auditId: v.id("audits"),
    selectedFailures: v.array(auditFailureValidator),
    sandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    rootDirectory: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    let resumeSandboxId = args.sandboxId;
    let resumeVercelSandboxId = args.vercelSandboxId;
    if (resumeSandboxId || resumeVercelSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: resumeSandboxId,
          vercelSandboxId: resumeVercelSandboxId,
          repoId: args.repoId,
        });
        const provider = await step.runAction(
          internal.daytona.getSandboxProviderKind,
          { repoId: args.repoId },
        );
        resumeSandboxId = resolveExistingSandboxId({
          providerKind: provider,
          sandboxId: resumeSandboxId,
          vercelSandboxId: resumeVercelSandboxId,
        });
      } catch {
        // Thaw exhausted its ceiling or the sandbox is gone — fall back to a
        // fresh sandbox (launchSelectedAuditFixes creates one when sandboxId is
        // undefined, checking out the pushed branch).
        resumeSandboxId = undefined;
        resumeVercelSandboxId = undefined;
      }
    }
    await step.runAction(internal.daytona.launchSelectedAuditFixes, {
      auditId: args.auditId,
      selectedFailures: args.selectedFailures,
      sandboxId: resumeSandboxId,
      taskId: args.taskId,
      runId: args.runId,
      userId: args.userId,
      repoId: args.repoId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      rootDirectory: args.rootDirectory,
    });
  },
});
