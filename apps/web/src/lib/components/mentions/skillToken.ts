import type { Id } from "@conductor/backend";
import { CONVEX_ID_PATTERN } from "./mentionToken";

/**
 * Token format for inline skill references: `/[Title](skillId)`.
 */
export const SKILL_TOKEN_REGEX = /\/\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g;

export function isSkillTokenId(id: string): id is Id<"repoSkills"> {
  return CONVEX_ID_PATTERN.test(id);
}

export function formatSkillToken(title: string, id: string): string {
  return `/[${title}](${id})`;
}
