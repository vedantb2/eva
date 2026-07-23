/** Canonical GitHub PR URL for an owner/repo + PR number. */
export function githubPrUrl(
  owner: string,
  repoName: string,
  prNumber: number,
): string {
  return `https://github.com/${owner}/${repoName}/pull/${prNumber}`;
}

/** Parse a positive PR number from a GitHub pull URL, or undefined if absent/invalid. */
export function prNumberFromGithubUrl(prUrl: string): number | undefined {
  const match = /\/pull\/(\d+)(?:\/|$|\?|#)/.exec(prUrl);
  if (match === null) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
