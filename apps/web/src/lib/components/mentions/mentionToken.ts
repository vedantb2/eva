/**
 * Token format for inline mentions: `@[Label](id)`.
 * Mirrors the backend regex in `_mentions/mentionToken.ts`. Restricting the
 * id capture to the Convex Id charset avoids false positives with regular
 * markdown links.
 */
export const MENTION_TOKEN_REGEX = /@\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g;

export function formatMentionToken(label: string, id: string): string {
  return `@[${label}](${id})`;
}

/** Converts stored `@[Label](id)` tokens back to `@Label` for the mention editor. */
export function mentionTokensToEditableText(content: string): string {
  return content.replace(
    MENTION_TOKEN_REGEX,
    (_match, label: string) => `@${label}`,
  );
}
