/** Canonical GitHub PR URL for an owner/repo + PR number. */
export function githubPrUrl(
  owner: string,
  repoName: string,
  prNumber: number,
): string {
  return `https://github.com/${owner}/${repoName}/pull/${prNumber}`;
}
