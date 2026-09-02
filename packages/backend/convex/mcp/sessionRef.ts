/**
 * Pure parsing for the ways an MCP caller can name an existing session: its
 * Convex id, its per-repo `numId`, or the GitHub PR url Eva stored on it.
 *
 * No Convex imports, so the tool layer, the lookup query, and the tests all
 * share one definition of "what counts as a PR link".
 */

// Accepts what a person actually pastes: bare host, http, www, and the
// /files, /commits, ?query and #anchor tails GitHub adds while reviewing.
const PR_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)(?:[/?#].*)?$/i;

/**
 * Rewrites any GitHub PR link into the exact string sessions hold in `prUrl`
 * (GitHub's own `html_url`), so the lookup can use the `by_pr_url` index rather
 * than scanning. Returns null when the input is not a PR link at all.
 */
export function canonicalPrUrl(input: string): string | null {
  const match = PR_URL_PATTERN.exec(input.trim());
  if (!match) return null;
  const [, owner, repo, number] = match;
  if (owner === undefined || repo === undefined || number === undefined) {
    return null;
  }
  return `https://github.com/${owner}/${repo}/pull/${Number(number)}`;
}
