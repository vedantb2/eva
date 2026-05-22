import { stripSkillTokens } from "./skillToken";

export interface ResolvedSkillMentionsResult {
  resolvedMessage: string;
  prefixBlock: string;
}

/**
 * Converts visual slash skill chips back to literal `/skill-name` text.
 * Skill execution is handled by the CLI harness, so Eva does not inject skill
 * content into the prompt.
 */
export function resolveSkillMentions(
  message: string,
): ResolvedSkillMentionsResult {
  return {
    resolvedMessage: stripSkillTokens(message),
    prefixBlock: "",
  };
}

export { stripSkillTokens } from "./skillToken";
