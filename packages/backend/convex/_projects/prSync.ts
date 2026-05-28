import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Extracts the PR number from a GitHub pull request URL. */
export function extractPrNumberFromUrl(prUrl: string): number | null {
  const match = prUrl.match(/\/pull\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

type ProjectPhase = Doc<"projects">["phase"];

const REVIEW_PHASES: ReadonlySet<ProjectPhase> = new Set([
  "business_review",
  "code_review",
]);

/**
 * Mirrors quick-task PR sync for the single project PR: business_review ↔ draft,
 * code_review ↔ ready for review.
 */
export async function scheduleProjectPrSync(
  ctx: MutationCtx,
  project: Doc<"projects">,
  previousPhase: ProjectPhase,
  newPhase: ProjectPhase,
): Promise<void> {
  if (!project.prUrl) return;

  const enteringCodeReview =
    newPhase === "code_review" && previousPhase !== "code_review";
  const enteringCancelled =
    newPhase === "cancelled" && previousPhase !== "cancelled";
  const leavingCancelled =
    previousPhase === "cancelled" &&
    newPhase !== "cancelled" &&
    newPhase !== "completed";
  const leavingCodeReview =
    previousPhase === "code_review" &&
    newPhase !== "code_review" &&
    newPhase !== "completed" &&
    newPhase !== "cancelled";

  if (
    !enteringCodeReview &&
    !leavingCodeReview &&
    !enteringCancelled &&
    !leavingCancelled
  ) {
    return;
  }

  const prNumber = extractPrNumberFromUrl(project.prUrl);
  if (!prNumber) return;

  const repo = await ctx.db.get(project.repoId);
  if (!repo) return;

  const baseArgs = {
    installationId: repo.installationId,
    repoOwner: repo.owner,
    repoName: repo.name,
    prNumber,
  };

  if (enteringCancelled) {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflowActions.closePullRequest,
      baseArgs,
    );
  } else if (leavingCancelled) {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflowActions.reopenPullRequest,
      { ...baseArgs, asReady: newPhase === "code_review" },
    );
  } else if (enteringCodeReview) {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflowActions.markPrReadyForReview,
      baseArgs,
    );
  } else if (leavingCodeReview) {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflowActions.convertPrToDraft,
      baseArgs,
    );
  }
}

/** Maps GitHub PR webhook actions to project review phases (inbound sync). */
export function deriveProjectPhaseFromPrEvent(
  action: string,
  draft: boolean | undefined,
): ProjectPhase | null {
  if (action === "converted_to_draft") return "business_review";
  if (action === "ready_for_review") return "code_review";
  if (action === "opened" || action === "reopened") {
    return draft ? "business_review" : "code_review";
  }
  return null;
}

export function isProjectReviewPhase(phase: ProjectPhase): boolean {
  return REVIEW_PHASES.has(phase);
}
