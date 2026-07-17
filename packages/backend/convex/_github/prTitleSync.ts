import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Best-effort: when a session/project/task is renamed, push `Eva: <title>` to
 * the linked GitHub PR. No-ops on empty titles or missing repos.
 */
export async function schedulePrTitleSync(
  ctx: MutationCtx,
  args: {
    repoId: Id<"githubRepos">;
    prUrl: string;
    title: string;
  },
): Promise<void> {
  const trimmed = args.title.trim();
  if (!trimmed) return;

  const repo = await ctx.db.get(args.repoId);
  if (!repo) return;

  await ctx.scheduler.runAfter(0, internal.taskWorkflowActions.updatePrTitle, {
    installationId: repo.installationId,
    repoOwner: repo.owner,
    repoName: repo.name,
    prUrl: args.prUrl,
    title: trimmed,
  });
}
