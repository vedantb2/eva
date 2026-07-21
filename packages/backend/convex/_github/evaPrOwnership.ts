import type { MutationCtx, QueryCtx } from "../_generated/server";

const EVA_BRANCH_PREFIXES = [
  "eva/task-",
  "eva/project-",
  "eva/session-",
  "eva/automation-",
] as const;

/**
 * True when this PR belongs to Eva-managed work (session / project / quick task
 * run). Those recaps live on the sandbox Review tab, not the docs Reviews list.
 */
export async function isEvaOwnedPullRequest(
  ctx: MutationCtx | QueryCtx,
  prUrl: string,
  branchName?: string,
): Promise<boolean> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
    .first();
  if (session) return true;

  const project = await ctx.db
    .query("projects")
    .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
    .first();
  if (project) return true;

  const run = await ctx.db
    .query("agentRuns")
    .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
    .first();
  if (run) return true;

  if (
    branchName !== undefined &&
    EVA_BRANCH_PREFIXES.some((prefix) => branchName.startsWith(prefix))
  ) {
    return true;
  }

  return false;
}
