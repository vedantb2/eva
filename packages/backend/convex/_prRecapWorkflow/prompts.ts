export interface PrRecapDiffStats {
  additions: number;
  deletions: number;
  changedFiles: number;
  truncated: boolean;
}

/** Builds the Claude Code prompt for generating a markdown PR recap from diff text. */
export function buildPrRecapPrompt(params: {
  prTitle: string;
  prNumber: number;
  prUrl: string;
  headSha: string;
  diffText: string;
  diffStats: PrRecapDiffStats;
}): string {
  const truncatedNote = params.diffStats.truncated
    ? " (diff truncated for size)"
    : "";

  return `You are generating a PR visual recap as markdown for code reviewers.

PR #${params.prNumber}: ${params.prTitle}
URL: ${params.prUrl}
Head SHA: ${params.headSha}
Stats: +${params.diffStats.additions} -${params.diffStats.deletions} across ${params.diffStats.changedFiles} files${truncatedNote}

Write a structured markdown recap with these sections:
## Summary
## Schema/API changes
## Before/After
## Risks
## Files touched

Focus on what changed and why it matters to reviewers. Use the diff below.

Output ONLY markdown. No preamble, no JSON wrapper.

## Diff
${params.diffText}`;
}
