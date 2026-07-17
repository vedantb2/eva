import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { MENTION_TOKEN_REGEX } from "./mentionToken";

interface ResolvedMention {
  docId: Id<"docs">;
  title: string;
  content: string;
}

export interface ResolvedMentionsResult {
  resolvedMessage: string;
  prefixBlock: string;
}

/**
 * Walks `@[Title](docId)` tokens in `message`, looks up each doc, validates
 * it belongs to `repoId`, and returns:
 *   - `resolvedMessage`: tokens replaced inline with plain `@Title`
 *   - `prefixBlock`: deduped doc title + content sections, suitable for
 *     prepending to the LLM prompt
 *
 * Tokens whose docs don't exist or belong to a different repo are still
 * replaced inline with `@Title` (snapshot title from the token) so the prose
 * stays readable, but they're omitted from the prefix block.
 */
export async function resolveDocMentions(
  ctx: QueryCtx,
  message: string,
  repoId: Id<"githubRepos">,
): Promise<ResolvedMentionsResult> {
  const matches = [...message.matchAll(MENTION_TOKEN_REGEX)];
  if (matches.length === 0) {
    return { resolvedMessage: message, prefixBlock: "" };
  }

  const uniqueIds = new Set<string>();
  for (const match of matches) {
    uniqueIds.add(match[2]);
  }

  const resolved = new Map<string, ResolvedMention>();
  for (const rawId of uniqueIds) {
    const docId = ctx.db.normalizeId("docs", rawId);
    if (!docId) continue;
    const doc = await ctx.db.get(docId);
    if (!doc) continue;
    if (doc.repoId !== repoId) continue;
    resolved.set(rawId, { docId, title: doc.title, content: doc.content });
  }

  const resolvedMessage = stripMentionTokens(message);

  if (resolved.size === 0) {
    return { resolvedMessage, prefixBlock: "" };
  }

  const sections = [...resolved.values()].map(
    (doc) => `### ${doc.title}\n${doc.content}`,
  );
  const prefixBlock = `## Referenced documents\n\n${sections.join("\n\n---\n\n")}\n\n---`;

  return { resolvedMessage, prefixBlock };
}

/**
 * Replaces every `@[Title](docId)` token with plain `@Title`. Used when
 * embedding historical messages into a follow-up prompt — we want the
 * conversation to read naturally without re-injecting old doc content.
 */
export function stripMentionTokens(message: string): string {
  return message.replace(MENTION_TOKEN_REGEX, (_full, title) => `@${title}`);
}
