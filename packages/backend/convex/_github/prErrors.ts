/**
 * The two pull-request failures Eva has to treat as non-failures.
 *
 * Both are `_tag` checks over `classifyGitHubFailure`, which owns the matching
 * rules. They stay as predicates because the callers that ask these questions
 * sit in `catch` blocks on the far side of a Convex action boundary, where the
 * failure arrives as a rehydrated error rather than as a tagged one.
 */

import { classifyGitHubFailure } from "./githubErrors";

/**
 * True when a PR cannot be opened because the branch has no commits ahead of
 * base.
 *
 * Plan-only turns push no commits, so this is the ordinary outcome of a
 * conversation that did not touch code. It used to surface as a red "Failed to
 * create pull request" alert on every such turn. Callers skip the PR instead.
 *
 * Deliberately not the wait *timeout*: that fires when GitHub never confirmed
 * the branch at all, which is a real publish failure and has to reach the user.
 */
export function isBranchNotAheadError(error: unknown): boolean {
  return classifyGitHubFailure(error)._tag === "GitHubBranchNotAhead";
}

/**
 * True when `pulls.create` failed because a PR for this branch already exists.
 *
 * Callers re-look-up and adopt that PR rather than reporting a failure.
 */
export function isPullRequestAlreadyExistsError(error: unknown): boolean {
  return classifyGitHubFailure(error)._tag === "GitHubPullRequestAlreadyExists";
}
