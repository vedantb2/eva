/**
 * Token format for inline document mentions: `@[Title](docId)`.
 * Mirrors the backend regex in `_mentions/mentionToken.ts`. Restricting the
 * docId capture to the Convex Id charset avoids false positives with regular
 * markdown links.
 */
export const MENTION_TOKEN_REGEX = /@\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g;

export function formatMentionToken(title: string, docId: string): string {
  return `@[${title}](${docId})`;
}
