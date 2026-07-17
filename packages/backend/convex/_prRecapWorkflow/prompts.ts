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

/** Sentinel separating the markdown recap from the HTML walkthrough in agent output. */
export const PR_RECAP_HTML_MARKER = "===EVA_RECAP_HTML===";

/**
 * Builds the Claude Code prompt for a PR recap. The agent returns TWO parts in
 * one response: a markdown recap (stored as the doc content and posted to
 * GitHub) and a self-contained interactive HTML walkthrough (stored in the
 * doc's html field), separated by the PR_RECAP_HTML_MARKER line.
 */
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

  return `You are generating a PR recap for code reviewers in TWO formats.

PR #${params.prNumber}: ${params.prTitle}
URL: ${params.prUrl}
Head SHA: ${params.headSha}
Stats: +${params.diffStats.additions} -${params.diffStats.deletions} across ${params.diffStats.changedFiles} files${truncatedNote}
${feedbackSection}
Produce your output as exactly two parts, in this order, separated by a line containing ONLY the marker ${PR_RECAP_HTML_MARKER}

## PART 1 — Markdown recap (before the marker)
A structured markdown recap with these sections:
## Summary
## Schema/API changes
## Before/After
## Risks
## Files touched

Focus on what changed and why it matters to reviewers.

## PART 2 — Interactive HTML walkthrough (after the marker)
A single self-contained HTML document that walks a reviewer through this PR file by file.

Hard requirements:
- A complete <!doctype html> document with ALL CSS inside one <style> tag and ALL JavaScript inside one <script> tag. No external URLs, CDNs, web fonts, images, or network requests of any kind.
- The page runs inside a sandboxed iframe with NO storage access: do NOT use localStorage, sessionStorage, cookies, IndexedDB, or any storage API. Keep all state in in-memory JavaScript variables.
- Structure it as a stepper: the FIRST step is an overview (summary, the +/- stats, and risks). Each following step covers ONE changed file: show that file's diff hunks in a monospace block (added lines on a green background, removed lines on a red background) and a short plain-English explanation of what changed and why.
- Provide "Previous" and "Next" buttons and a clickable list of files to jump directly to any step, plus a progress indicator like "3 / ${params.diffStats.changedFiles + 1}".
- Responsive and readable on a light background; use a clean neutral palette. Escape any HTML special characters in the diff so code renders literally.

Output ONLY the markdown, then a line with the marker, then the HTML document. No preamble, no JSON, no code fences.

## Diff
${params.diffText}`;
}

/**
 * Splits raw agent output into the markdown recap and the optional HTML
 * walkthrough. Falls back to treating the whole response as markdown when the
 * marker is absent (e.g. an older prompt or a model that ignored the format).
 */
export function parsePrRecapOutput(raw: string): {
  markdown: string;
  html?: string;
} {
  const markerIndex = raw.indexOf(PR_RECAP_HTML_MARKER);
  if (markerIndex === -1) {
    return { markdown: raw.trim() };
  }

  const markdown = raw.slice(0, markerIndex).trim();
  const htmlPart = stripCodeFence(
    raw.slice(markerIndex + PR_RECAP_HTML_MARKER.length).trim(),
  );

  return htmlPart.length > 0 ? { markdown, html: htmlPart } : { markdown };
}

/** Removes a surrounding ```html ... ``` fence if the model added one. */
function stripCodeFence(value: string): string {
  const fenced = value.match(/^```(?:html)?\s*\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : value;
}
