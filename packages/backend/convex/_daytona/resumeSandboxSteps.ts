import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

// First poll fires sooner (a stopped→started resume that just missed the
// kick-off window settles quickly); later polls are spaced wider. MAX_POLLS at
// POLL_DELAY_MS gives a ~20-minute ceiling for the cold-storage thaw, on top of
// the short kick-off window.
const FIRST_POLL_DELAY_MS = 10_000;
const POLL_DELAY_MS = 20_000;
const MAX_POLLS = 60; // ~20 minutes at 20s intervals

type EnsureSandboxStartedArgs = {
  sandboxId: string;
  repoId: Id<"githubRepos">;
  /** When set, a "restoring…" activity is surfaced to this streaming entity. */
  streamingEntityId?: string;
};

/**
 * Brings a (possibly archived) sandbox to the "running" state as a sequence of
 * short workflow steps, so a multi-minute cold-storage thaw can outlast the
 * Convex per-action 10-minute limit.
 *
 * Daytona rehydrates an archived sandbox's filesystem from object storage, which
 * can take well over 10 minutes. Waiting inline in one action would hit the
 * action timeout (the same constraint snapshotBuildWorkflow works around).
 * Instead we fire the start (kick-off), then poll the sandbox state in separate
 * steps spaced by `runAfter` delays until it reports "running". The thaw runs
 * server-side on Daytona regardless of whether we are watching, so polling only
 * observes it.
 *
 * Fast paths are unaffected: an already-started sandbox returns immediately from
 * the kick-off, and a merely-stopped sandbox fast-resumes inside the kick-off
 * window with no polling.
 *
 * Throws if the sandbox hits a terminal failure state or does not reach
 * "running" within the ceiling; callers wrap this to surface a retryable message.
 */
export async function ensureSandboxStartedSteps(
  step: WorkflowCtx,
  args: EnsureSandboxStartedArgs,
): Promise<void> {
  const kickoff = await step.runAction(
    internal.daytona.startSandboxAsyncKickoff,
    { sandboxId: args.sandboxId, repoId: args.repoId },
  );
  if (kickoff.state === "running") return;
  if (kickoff.provider === "vercel") return;

  if (args.streamingEntityId) {
    await step.runMutation(internal.streaming.internalSet, {
      entityId: args.streamingEntityId,
      currentActivity: JSON.stringify([
        {
          type: "tool",
          label:
            "Restoring sandbox from cold storage (can take several minutes)...",
          status: "active",
        },
      ]),
    });
  }

  let state = kickoff.state;
  let attempt = 0;
  while (attempt < MAX_POLLS && state !== "running") {
    attempt++;
    const poll = await step.runAction(
      internal.daytona.pollSandboxStarted,
      { sandboxId: args.sandboxId, repoId: args.repoId },
      { runAfter: attempt === 1 ? FIRST_POLL_DELAY_MS : POLL_DELAY_MS },
    );
    state = poll.state;
  }

  if (state !== "running") {
    throw new Error(
      `Sandbox ${args.sandboxId} restore from cold storage did not complete within ~20 minutes (last state: ${state}). The restore continues in the background — retry to resume.`,
    );
  }
}
