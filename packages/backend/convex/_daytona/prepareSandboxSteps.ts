import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

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
  sessionPersistenceId?: Id<"sessions"> | Id<"projects">;
  sessionPersistenceKind?: "sessions" | "projects";
  createRetry?: { maxAttempts: number; initialBackoffMs: number; base: number };
  /** Skip repo startup commands (e.g. later tasks in a project build on the same sandbox). */
  skipStartupCommands?: boolean;
};

const FETCH_STEP_RETRY = {
  retry: { maxAttempts: 1, initialBackoffMs: 1000, base: 2 },
};

const BRANCH_STEP_RETRY = {
  retry: { maxAttempts: 3, initialBackoffMs: 2500, base: 2 },
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
  const baseBranch = args.baseBranch ?? FALLBACK_GIT_BASE_BRANCH;

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
      sessionPersistenceKind: args.sessionPersistenceKind,
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

    await step.runAction(
      internal.daytona.setupSandboxBranch,
      {
        sandboxId,
        branchName: args.branchName,
        baseBranch,
        repoId: args.repoId,
      },
      BRANCH_STEP_RETRY,
    );
  } else if (args.baseBranch) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      {
        type: "tool",
        label: "Checking out base branch...",
        status: "active",
      },
    ]);

    await step.runAction(
      internal.daytona.checkoutBaseBranch,
      {
        sandboxId,
        baseBranch: args.baseBranch,
        repoId: args.repoId,
      },
      BRANCH_STEP_RETRY,
    );
  }

  // Step 4: Run startup commands once per sandbox (marker file). Project builds
  // reuse project.sandboxId across tasks — only the first task should pay this
  // cost; interview sandboxes skip startup entirely so the first build task must
  // run it, then later tasks skip via isFirstTaskOnBranch + marker check.
  let shouldRunStartupCommands = !args.skipStartupCommands;
  if (shouldRunStartupCommands) {
    const markerExists = await step.runAction(
      internal.daytona.startupCommandsMarkerExists,
      { sandboxId, repoId: args.repoId },
    );
    if (markerExists) {
      shouldRunStartupCommands = false;
    }
  }

  if (shouldRunStartupCommands) {
    await emitSteps(step, args.streamingEntityId, [
      ...completedSteps,
      { type: "tool", label: "Running startup commands...", status: "active" },
    ]);
    try {
      const result = await step.runAction(
        internal.daytona.runStartupCommands,
        { sandboxId, repoId: args.repoId },
        { retry: { maxAttempts: 1, initialBackoffMs: 1000, base: 2 } },
      );
      if (result.ran) {
        completedSteps.push({
          type: "tool",
          label: "Running startup commands...",
          status: "complete",
        });
        if (result.commandCount > 0) {
          console.log(
            `[prepareSandbox] Ran ${result.commandCount} startup command(s)`,
          );
          if (result.errors.length > 0) {
            console.warn(
              `[prepareSandbox] Startup command errors: ${result.errors.join("; ")}`,
            );
          }
        }
      }
    } catch (e) {
      // Non-fatal: log warning and continue
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        `[prepareSandbox] Startup commands failed — continuing: ${msg}`,
      );
    }
  }

  // Step 5: Launch background commands (long-running daemons). Non-fatal.
  await emitSteps(step, args.streamingEntityId, [
    ...completedSteps,
    {
      type: "tool",
      label: "Launching background commands...",
      status: "active",
    },
  ]);
  try {
    const result = await step.runAction(
      internal.daytona.runBackgroundCommands,
      { sandboxId, repoId: args.repoId },
      { retry: { maxAttempts: 1, initialBackoffMs: 1000, base: 2 } },
    );
    if (result.ran) {
      completedSteps.push({
        type: "tool",
        label: "Launching background commands...",
        status: "complete",
      });
      if (result.commandCount > 0) {
        console.log(
          `[prepareSandbox] Launched ${result.commandCount} background command(s)`,
        );
        if (result.errors.length > 0) {
          console.warn(
            `[prepareSandbox] Background command errors: ${result.errors.join("; ")}`,
          );
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[prepareSandbox] Background commands failed — continuing: ${msg}`,
    );
  }

  return sandboxId;
}
