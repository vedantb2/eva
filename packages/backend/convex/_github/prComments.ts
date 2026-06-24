export const PR_RECAP_COMMENT_MARKER = "<!-- eva-pr-recap -->";

/** Builds the sticky GitHub PR comment body linking to the Eva recap doc. */
export function buildPrRecapCommentBody(params: {
  evaDocUrl: string;
  prNumber: number;
  headSha: string;
  status: "ready" | "error" | "skipped";
  message?: string;
}): string {
  if (params.status === "skipped") {
    return `${PR_RECAP_COMMENT_MARKER}
_Eva skipped generating a recap for this update${params.message ? `: ${params.message}` : "."}_`;
  }

  if (params.status === "error") {
    return `${PR_RECAP_COMMENT_MARKER}
_Eva could not generate a PR recap${params.message ? `: ${params.message}` : "."}_`;
  }

  return `${PR_RECAP_COMMENT_MARKER}
## Eva PR recap

Visual recap for PR #${params.prNumber} (\`${params.headSha.slice(0, 7)}\`):

[View recap in Eva](${params.evaDocUrl})`;
}
