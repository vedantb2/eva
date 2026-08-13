import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { extractPrNumberFromUrl } from "../_projects/prSync";

export type LivePrState = "draft" | "open";

/** Open or draft — the only PR states Eva should close on archive. */
export function livePrState(
  prState: Doc<"sessions">["prState"],
): LivePrState | undefined {
  if (prState === "draft" || prState === "open") return prState;
  return undefined;
}

/** Close or reopen the session's GitHub PR. No-op if the URL or repo is missing. */
export async function scheduleSessionPrSync(
  ctx: MutationCtx,
  session: Doc<"sessions">,
  action: { kind: "close" } | { kind: "reopen"; asReady: boolean },
): Promise<void> {
  if (!session.prUrl) return;
  const repo = await ctx.db.get(session.repoId);
  const prNumber = extractPrNumberFromUrl(session.prUrl);
  if (!repo || prNumber === null) return;
  const base = {
    installationId: repo.installationId,
    repoOwner: repo.owner,
    repoName: repo.name,
    prNumber,
  };
  if (action.kind === "close") {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflowActions.closePullRequest,
      base,
    );
    return;
  }
  await ctx.scheduler.runAfter(
    0,
    internal.taskWorkflowActions.reopenPullRequest,
    { ...base, asReady: action.asReady },
  );
}
