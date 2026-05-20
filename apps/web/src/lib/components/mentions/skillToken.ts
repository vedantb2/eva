/**
 * Token format for inline skill references: `/[Title](skillId)`.
 */
export const SKILL_TOKEN_REGEX = /\/\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g;

export function formatSkillToken(title: string, id: string): string {
  return `/[${title}](${id})`;
}
