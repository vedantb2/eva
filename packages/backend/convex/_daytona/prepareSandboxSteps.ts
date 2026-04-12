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

const FETCH_STEP_RETRY = {
  retry: { maxAttempts: 1, initialBackoffMs: 1000, base: 2 },
};

/** Emits progress steps to the streaming entity for real-time UI updates. */
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

/** Orchestrates sandbox creation and local branch setup as a multi-step workflow. */
export async function prepareSandboxSteps(
  step: WorkflowCtx,
  args: PrepareSandboxArgs,
): Promise<string> {
  const completedSteps: Array<ProgressStep> = [];
  const baseBranch = args.baseBranch ?? "main";

  // Step 1: Create/resume the sandbox only.
  // Snapshot-backed quick tasks should start from local refs instead of
  // blocking sandbox acquisition on a network fetch.
  const setupResult = await step.runAction(
    internal.daytona.createOrResumeSandbox,
    {
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      ephemeral: args.ephemeral,
      repoId: args.repoId,
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

  // Step 2: Fetch latest refs needed for checkout/setup.
  await emitSteps(step, args.streamingEntityId, [
    ...completedSteps,
    { type: "tool", label: "Fetching base branch...", status: "active" },
  ]);
  try {
    await step.runAction(
      internal.daytona.fetchBaseBranch,
      {
        sandboxId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        baseBranch,
        repoId: args.repoId,
      },
      FETCH_STEP_RETRY,
    );
  } catch {
    // Non-fatal: snapshot already has the codebase.
    // resolveBaseTarget falls back to local refs when remote isn't fetched.
    console.warn(
      `[prepareSandbox] fetch base branch (${baseBranch}) failed — continuing with local snapshot refs`,
    );
  }
  completedSteps.push({
    type: "tool",
    label: "Fetching base branch...",
    status: "complete",
  });

  if (args.branchName) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      { type: "tool", label: "Fetching task branch...", status: "active" },
    ]);
    try {
      await step.runAction(
        internal.daytona.fetchBaseBranch,
        {
          sandboxId,
          installationId: args.installationId,
          repoOwner: args.repoOwner,
          repoName: args.repoName,
          baseBranch: args.branchName,
          repoId: args.repoId,
        },
        FETCH_STEP_RETRY,
      );
      completedSteps.push({
        type: "tool",
        label: "Fetching task branch...",
        status: "complete",
      });
    } catch {
      // Non-fatal: branch may not exist yet (new task) or network unreachable.
      // setupBranch falls back to local refs via resolveBranchStartTarget.
      console.warn(
        `[prepareSandbox] fetch task branch (${args.branchName}) failed — continuing with local refs`,
      );
    }
  }

  // Step 3: Checkout or create the working branch from latest fetched refs.
  if (args.branchName) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      { type: "tool", label: "Setting up branch...", status: "active" },
    ]);

    await step.runAction(internal.daytona.setupSandboxBranch, {
      sandboxId,
      branchName: args.branchName,
      baseBranch,
      repoId: args.repoId,
    });
  } else if (args.baseBranch) {
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
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });
  }

  return sandboxId;
}
