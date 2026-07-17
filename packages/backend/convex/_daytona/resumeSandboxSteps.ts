import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveExistingSandboxId } from "../_sandbox/resolveExistingSandboxId";
import type { SandboxProviderKind } from "../_sandbox/provider";

// First poll fires sooner (a stopped→started resume that just missed the
// kick-off window settles quickly); later polls are spaced wider. MAX_POLLS at
// POLL_DELAY_MS gives a ~20-minute ceiling for the cold-storage thaw, on top of
// the short kick-off window.
const FIRST_POLL_DELAY_MS = 10_000;
const POLL_DELAY_MS = 20_000;
const MAX_POLLS = 60; // ~20 minutes at 20s intervals

type EnsureSandboxStartedArgs = {
  /** Daytona-era sandbox id (ignored for thaw when provider is vercel). */
  sandboxId?: string;
  /** Vercel sandbox name — preferred when SANDBOX_PROVIDER=vercel. */
  vercelSandboxId?: string;
  repoId: Id<"githubRepos">;
  /** When set, a "restoring…" activity is surfaced to this streaming entity. */
  streamingEntityId?: string;
  /**
   * True when the caller already knows the sandbox is running (e.g. the
   * session/project/task status is "active"). Suppresses the cosmetic Vercel
   * "Resuming sandbox…" activity so it does not flash on every message for an
   * already-running sandbox. Ignored on Daytona, which gates on the real
   * `kickoff.state` instead.
   */
  sandboxRunning?: boolean;
};

/** Surfaces a single-tool "active" activity to a streaming entity. */
async function setResumeActivity(
  step: WorkflowCtx,
  entityId: string,
  label: string,
): Promise<void> {
  await step.runMutation(internal.streaming.internalSet, {
    entityId,
    currentActivity: JSON.stringify([
      { type: "tool", label, status: "active" },
    ]),
  });
}

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
 * On Vercel, only `vercelSandboxId` is thawed — a leftover Daytona UUID in
 * `sandboxId` must not be passed to Vercel `get` (404). If neither id applies,
 * this is a no-op and the caller creates a fresh sandbox.
 *
 * Throws if the sandbox hits a terminal failure state or does not reach
 * "running" within the ceiling; callers wrap this to surface a retryable message.
 *
 * Returns the resolved `provider` and `thawId` (the id to reuse, or undefined
 * when there is nothing to resume) so callers do not re-run `getSandboxProviderKind`
 * — that is a durable step measured at ~6–8s of scheduling latency.
 */
export async function ensureSandboxStartedSteps(
  step: WorkflowCtx,
  args: EnsureSandboxStartedArgs,
): Promise<{ provider: SandboxProviderKind; thawId: string | undefined }> {
  const thawStartedAt = Date.now();
  console.log(
    `[daytona] ensureSandboxStartedSteps begin repoId=${args.repoId} sandboxId=${args.sandboxId ?? "none"} vercelSandboxId=${args.vercelSandboxId ?? "none"} streamingEntityId=${args.streamingEntityId ?? "none"}`,
  );
  const provider = await step.runAction(
    internal.daytona.getSandboxProviderKind,
    {
      repoId: args.repoId,
    },
  );
  const thawId = resolveExistingSandboxId({
    providerKind: provider,
    sandboxId: args.sandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  if (!thawId) {
    console.log(
      `[daytona] ensureSandboxStartedSteps no thaw id (provider=${provider}, elapsed=${Date.now() - thawStartedAt}ms)`,
    );
    return { provider, thawId };
  }

  // Vercel: do not kickoff/poll here. Resume is ensureSandboxRunning in the
  // start action; extra workflow steps were measured at ~6–8s of pure latency.
  // Also skip cold-storage copy — that is Daytona archived restore only.
  if (provider === "vercel") {
    if (args.streamingEntityId && !args.sandboxRunning) {
      await setResumeActivity(
        step,
        args.streamingEntityId,
        "Resuming sandbox...",
      );
    }
    console.log(
      `[daytona] ensureSandboxStartedSteps vercel skip-kickoff thawId=${thawId} elapsed=${Date.now() - thawStartedAt}ms`,
    );
    return { provider, thawId };
  }

  const kickoff = await step.runAction(
    internal.daytona.startSandboxAsyncKickoff,
    { sandboxId: thawId, repoId: args.repoId },
  );
  console.log(
    `[daytona] ensureSandboxStartedSteps kickoff done provider=${kickoff.provider} state=${kickoff.state} thawId=${thawId} elapsed=${Date.now() - thawStartedAt}ms`,
  );
  if (kickoff.state === "running") return { provider, thawId };

  if (args.streamingEntityId) {
    await setResumeActivity(
      step,
      args.streamingEntityId,
      "Restoring sandbox from cold storage (can take several minutes)...",
    );
  }

  let state = kickoff.state;
  let attempt = 0;
  while (attempt < MAX_POLLS && state !== "running") {
    attempt++;
    const poll = await step.runAction(
      internal.daytona.pollSandboxStarted,
      { sandboxId: thawId, repoId: args.repoId },
      { runAfter: attempt === 1 ? FIRST_POLL_DELAY_MS : POLL_DELAY_MS },
    );
    state = poll.state;
  }

  if (state !== "running") {
    throw new Error(
      `Sandbox ${thawId} restore from cold storage did not complete within ~20 minutes (last state: ${state}). The restore continues in the background — retry to resume.`,
    );
  }
  return { provider, thawId };
}
