import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { preferPersistedSandboxId } from "../_sandbox/resolveExistingSandboxId";
import type { SandboxProviderKind } from "../_sandbox/provider";

type EnsureSandboxStartedArgs = {
  /** Legacy sandbox id. Used only as a fallback when `vercelSandboxId` is unset. */
  sandboxId?: string;
  /** Vercel sandbox name — the preferred id. */
  vercelSandboxId?: string;
  repoId: Id<"githubRepos">;
  /** When set, a "restoring…" activity is surfaced to this streaming entity. */
  streamingEntityId?: string;
  /**
   * True when the caller already knows the sandbox is running (e.g. the
   * session/project/task status is "active"). Suppresses the cosmetic
   * "Resuming sandbox…" activity so it does not flash on every message for an
   * already-running sandbox.
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
 * Resolves which sandbox a workflow should resume, and surfaces a "resuming"
 * activity while it happens.
 *
 * This used to be a kick-off-then-poll loop of short workflow steps, because
 * Daytona rehydrated archived sandboxes from object storage and could take well
 * over the Convex per-action 10-minute limit. Vercel resumes from its own
 * snapshot in roughly 0.3s, so there is nothing to wait on: the actual resume is
 * lazy, via `ensureSandboxRunning` in the start action. Adding durable workflow
 * steps here measured ~6-8s of pure scheduling latency for no benefit.
 *
 * Returns the resolved `provider` and `thawId` — the id to reuse, or undefined
 * when there is nothing to resume and the caller should create a fresh sandbox.
 * `provider` is returned so callers do not re-run `getSandboxProviderKind`,
 * itself a durable step worth ~6-8s.
 *
 * A leftover Daytona UUID in `sandboxId` is not reusable and must never reach
 * Vercel `get` (it would 404). Callers that start from persisted entity fields
 * filter it out with `resolveReusableVercelSandboxId` before calling here.
 */
export async function ensureSandboxStartedSteps(
  step: WorkflowCtx,
  args: EnsureSandboxStartedArgs,
): Promise<{ provider: SandboxProviderKind; thawId: string | undefined }> {
  const thawStartedAt = Date.now();
  console.log(
    `[sandbox] ensureSandboxStartedSteps begin repoId=${args.repoId} sandboxId=${args.sandboxId ?? "none"} vercelSandboxId=${args.vercelSandboxId ?? "none"} streamingEntityId=${args.streamingEntityId ?? "none"}`,
  );
  const provider = await step.runAction(
    internal.sandbox.getSandboxProviderKind,
    {
      repoId: args.repoId,
    },
  );
  const thawId = preferPersistedSandboxId({
    sandboxId: args.sandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  if (!thawId) {
    console.log(
      `[sandbox] ensureSandboxStartedSteps no thaw id (provider=${provider}, elapsed=${Date.now() - thawStartedAt}ms)`,
    );
    return { provider, thawId };
  }

  // No kickoff/poll step here. Resume happens in the start action via
  // ensureSandboxRunning; adding workflow steps for it measured ~6-8s of pure
  // latency. There is no cold-storage restore to wait on either — that was
  // Daytona's archived-restore path, and Vercel resumes from its own snapshot.
  if (args.streamingEntityId && !args.sandboxRunning) {
    await setResumeActivity(
      step,
      args.streamingEntityId,
      "Resuming sandbox...",
    );
  }
  console.log(
    `[sandbox] ensureSandboxStartedSteps skip-kickoff thawId=${thawId} elapsed=${Date.now() - thawStartedAt}ms`,
  );
  return { provider, thawId };
}
