import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

type ProgressStep = {
  type: string;
  label: string;
  status: string;
};

type PrepareSandboxArgs = {
  installationId: number;
  repoOwner: string;
  repoName: string;
  repoId: Id<"githubRepos">;
  streamingEntityId: string;
  ephemeral: boolean;
  existingSandboxId?: string;
  attachRunId?: Id<"agentRuns">;
  baseBranch?: string;
  branchName?: string;
  sessionPersistenceId?: Id<"sessions">;
  createRetry?: { maxAttempts: number; initialBackoffMs: number; base: number };
};

async function emitSteps(
  step: WorkflowCtx,
  streamingEntityId: string,
  steps: Array<ProgressStep>,
): Promise<void> {
  await step.runMutation(internal.streaming.internalSet, {
    entityId: streamingEntityId,
    currentActivity: JSON.stringify(steps),
  });
}

export async function prepareSandboxSteps(
  step: WorkflowCtx,
  args: PrepareSandboxArgs,
): Promise<string> {
  const completedSteps: Array<ProgressStep> = [];

  const setupResult = await step.runAction(
    internal.daytona.createOrResumeSandbox,
    {
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      ephemeral: args.ephemeral,
      repoId: args.repoId,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      attachRunId: args.attachRunId,
      sessionPersistenceId: args.sessionPersistenceId,
      streamingEntityId: args.streamingEntityId,
    },
    args.createRetry ? { retry: args.createRetry } : undefined,
  );
  const { sandboxId } = setupResult;

  completedSteps.push({
    type: "tool",
    label: "Creating sandbox...",
    status: "complete",
  });

  if (args.baseBranch) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      { type: "tool", label: "Fetching base branch...", status: "active" },
    ]);

    await step.runAction(internal.daytona.fetchBaseBranch, {
      sandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });

    completedSteps.push({
      type: "tool",
      label: "Fetching base branch...",
      status: "complete",
    });

    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      {
        type: "tool",
        label: "Checking out base branch...",
        status: "active",
      },
    ]);

    await step.runAction(internal.daytona.checkoutBaseBranch, {
      sandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });

    completedSteps.push({
      type: "tool",
      label: "Checking out base branch...",
      status: "complete",
    });
  }

  if (args.branchName) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      { type: "tool", label: "Setting up branch...", status: "active" },
    ]);

    await step.runAction(internal.daytona.setupSandboxBranch, {
      sandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch ?? "main",
      repoId: args.repoId,
    });
  }

  return sandboxId;
}
