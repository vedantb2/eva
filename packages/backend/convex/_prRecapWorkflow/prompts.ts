export interface PrRecapDiffStats {
  additions: number;
  deletions: number;
  changedFiles: number;
  truncated: boolean;
}

export interface PrRecapReviewerFeedback {
  anchorText?: string;
  content: string;
}

/** Builds the Claude Code prompt for generating a markdown PR recap from diff text. */
export function buildPrRecapPrompt(params: {
  prTitle: string;
  prNumber: number;
  prUrl: string;
  headSha: string;
  diffText: string;
  diffStats: PrRecapDiffStats;
  reviewerFeedback?: PrRecapReviewerFeedback[];
}): string {
  const truncatedNote = params.diffStats.truncated
    ? " (diff truncated for size)"
    : "";

  const feedbackSection =
    params.reviewerFeedback && params.reviewerFeedback.length > 0
      ? `

## Reviewer feedback to address
Revise the recap to incorporate this feedback from reviewers on the previous version:

${params.reviewerFeedback
  .map((item) => {
    const anchor = item.anchorText ? `On "${item.anchorText}": ` : "";
    return `- ${anchor}${item.content}`;
  })
  .join("\n")}
`
      : "";

  return `You are generating a PR visual recap as markdown for code reviewers.

PR #${params.prNumber}: ${params.prTitle}
URL: ${params.prUrl}
Head SHA: ${params.headSha}
Stats: +${params.diffStats.additions} -${params.diffStats.deletions} across ${params.diffStats.changedFiles} files${truncatedNote}
${feedbackSection}
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
