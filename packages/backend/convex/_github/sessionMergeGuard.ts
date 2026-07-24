"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getInstallationOctokit } from "../githubAuth";

/**
 * Guards against a "tip-copy" false-positive merge of a session's PR.
 *
 * GitHub marks a PR "merged" whenever its exact commit SHAs land on the base
 * branch, regardless of which PR actually merged them. Eva's "duplicate PR"
 * flow (see `buildEditPrompt`) intentionally squashes a session branch onto a
 * fresh branch so the resulting PR has NEW commit SHAs and cannot trigger
 * this — but if the agent (or a user) instead pushes the session branch's own
 * commits to another ref and merges that, GitHub will auto-mark the session's
 * PR merged too, even though it was never actually merged through GitHub's UI.
 *
 * The webhook handler (`handleSessionPrEvent`) already reacted synchronously
 * (patched prState + stopped the sandbox) to avoid leaking a running VM. This
 * action runs a few seconds later, once GitHub's commit->PR association index
 * has settled, and checks the SPECIFIC thing that distinguishes a real merge
 * from a tip-copy: whether the merge commit is actually associated with this
 * PR number. This is structural (GitHub's own association data), not a guess
 * based on commit messages or timing.
 *
 * If the merge commit is associated with a different PR only, the session's
 * merge was foreign — detach the stale prUrl/prState so the session becomes
 * writable again (a future push will open a fresh PR) and alert the user.
 */
export const verifySessionPrMerged = internalAction({
  args: {
    sessionId: v.id("sessions"),
    prUrl: v.string(),
    prNumber: v.number(),
    mergeCommitSha: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) return null;
    if (session.prUrl !== args.prUrl) return null;
    if (session.prState !== "merged") return null;

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: session.repoId,
    });
    if (!repo) return null;

    let associatedPrNumbers: number[];
    try {
      const octokit = await getInstallationOctokit(repo.installationId);
      const { data } =
        await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
          owner: repo.owner,
          repo: repo.name,
          commit_sha: args.mergeCommitSha,
        });
      associatedPrNumbers = data.map((pr) => pr.number);
    } catch (error) {
      // Fail safe: if we can't verify, leave the session merged (today's
      // behavior) rather than risk incorrectly reopening a genuinely merged
      // session.
      console.error(
        `[verifySessionPrMerged] failed to check association for sessionId=${args.sessionId} sha=${args.mergeCommitSha}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }

    // No PRs associated at all is unusual but not evidence of a foreign
    // merge — treat it as an intentional merge and leave the session as-is.
    if (associatedPrNumbers.length === 0) return null;

    const isForeign = !associatedPrNumbers.includes(args.prNumber);
    if (!isForeign) return null;

    await ctx.runMutation(internal.sessions.clearPrUrlIfMatches, {
      id: args.sessionId,
      expectedPrUrl: args.prUrl,
    });

    await ctx.runMutation(internal.sessionWorkflow.postSystemAlert, {
      sessionId: args.sessionId,
      content:
        "GitHub auto-marked this session's PR as merged because identical commits landed via another PR. The session stays open — Eva has detached the old PR, and a new PR will be created on your next push. Tip: to ship work separately without this, ask the agent for a duplicate PR (it squashes onto a fresh branch with new commit SHAs).",
    });

    return null;
  },
});
