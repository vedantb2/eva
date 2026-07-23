import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveExistingSandboxId } from "../_sandbox/resolveExistingSandboxId";
import type { SandboxProviderKind } from "../_sandbox/provider";

type EnsureSandboxStartedArgs = {
  /** Legacy sandbox id field, kept for callers that still persist it. */
  sandboxId?: string;
  /** Vercel sandbox name — the id actually thawed. */
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
 * Surfaces a "Resuming sandbox..." activity for a sandbox thaw. Vercel resumes
 * lazily on the first exec inside `ensureSandboxRunning` (in the start
 * action), so this only picks the id to reuse and posts progress UI — it does
 * not kick off or poll the resume itself.
 *
 * Returns the resolved `provider` (always "vercel") and `thawId` (the id to
 * reuse, or undefined when there is nothing to resume).
 */
export async function ensureSandboxStartedSteps(
  step: WorkflowCtx,
  args: EnsureSandboxStartedArgs,
): Promise<{ provider: SandboxProviderKind; thawId: string | undefined }> {
  const thawStartedAt = Date.now();
  console.log(
    `[sandbox] ensureSandboxStartedSteps begin repoId=${args.repoId} sandboxId=${args.sandboxId ?? "none"} vercelSandboxId=${args.vercelSandboxId ?? "none"} streamingEntityId=${args.streamingEntityId ?? "none"}`,
  );
  const provider: SandboxProviderKind = "vercel";
  const thawId = resolveExistingSandboxId({
    sandboxId: args.sandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  if (!thawId) {
    console.log(
      `[sandbox] ensureSandboxStartedSteps no thaw id (provider=${provider}, elapsed=${Date.now() - thawStartedAt}ms)`,
    );
    return { provider, thawId };
  }

  if (args.streamingEntityId && !args.sandboxRunning) {
    await setResumeActivity(step, args.streamingEntityId, "Resuming sandbox...");
  }
  console.log(
    `[sandbox] ensureSandboxStartedSteps skip-kickoff thawId=${thawId} elapsed=${Date.now() - thawStartedAt}ms`,
  );
  return { provider, thawId };
}
