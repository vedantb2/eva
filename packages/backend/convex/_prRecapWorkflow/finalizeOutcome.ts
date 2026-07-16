import type { WorkflowCtx } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export type PrRecapOutcome =
  | { kind: "ready"; content: string; html?: string }
  | { kind: "error"; message: string }
  | { kind: "skipped"; message: string };

type FinalizePrRecapOutcomeParams = {
  docId: Id<"docs">;
  repoId: Id<"githubRepos">;
  installationId: number;
  repoOwner: string;
  repoName: string;
  linkRootDirectory?: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  headSha: string;
  outcome: PrRecapOutcome;
};

/** Persists recap doc state and upserts the sticky GitHub PR comment for a terminal outcome. */
export async function finalizePrRecapOutcome(
  step: WorkflowCtx,
  params: FinalizePrRecapOutcomeParams,
): Promise<void> {
  if (params.outcome.kind === "ready") {
    await step.runMutation(internal.docs.upsertPrRecapDoc, {
      repoId: params.repoId,
      prUrl: params.prUrl,
      prNumber: params.prNumber,
      title: `PR #${params.prNumber} — ${params.prTitle}`,
      headSha: params.headSha,
      content: params.outcome.content,
      html: params.outcome.html,
      prRecapStatus: "ready",
      clearActiveWorkflowId: true,
    });
  } else {
    await step.runMutation(internal.docs.patchPrRecapStatus, {
      docId: params.docId,
      prRecapStatus: "error",
      prRecapError: params.outcome.message,
      activeWorkflowId: null,
    });
  }

  const commentStatus = params.outcome.kind;

  const commentMessage =
    params.outcome.kind === "ready" ? undefined : params.outcome.message;

  await step.runAction(internal._github.prRecapService.upsertPrRecapComment, {
    installationId: params.installationId,
    owner: params.repoOwner,
    repo: params.repoName,
    prNumber: params.prNumber,
    docId: String(params.docId),
    headSha: params.headSha,
    status: commentStatus,
    message: commentMessage,
    rootDirectory: params.linkRootDirectory,
  });
}
