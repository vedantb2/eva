import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { MENTION_TOKEN_REGEX } from "./mentionToken";

/**
 * Walks `@[Name](userId)` tokens in `content` and returns deduped, validated
 * user IDs. Same token format as doc mentions — `db.normalizeId` filters out
 * any IDs that don't actually point at the `users` table.
 */
export function extractMentionedUserIds(
  ctx: QueryCtx,
  content: string,
): Id<"users">[] {
  const seen = new Set<string>();
  const result: Id<"users">[] = [];
  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    const rawId = match[2];
    if (seen.has(rawId)) continue;
    seen.add(rawId);
    const userId = ctx.db.normalizeId("users", rawId);
    if (userId) result.push(userId);
  }
  return result;
}
