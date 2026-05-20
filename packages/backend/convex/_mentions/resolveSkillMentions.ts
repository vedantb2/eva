import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveCanonicalRepoId } from "../_githubRepos/helpers";
import { SKILL_TOKEN_REGEX } from "./skillToken";

interface ResolvedSkill {
  skillId: Id<"repoSkills">;
  title: string;
  prompt: string;
}

export interface ResolvedSkillMentionsResult {
  resolvedMessage: string;
  prefixBlock: string;
}

/**
 * Walks `/[Title](skillId)` tokens in `message`, looks up each skill, validates
 * it belongs to the canonical repo, and returns:
 *   - `resolvedMessage`: tokens replaced inline with plain `/Title`
 *   - `prefixBlock`: deduped skill title + prompt sections for the LLM prompt
 */
export async function resolveSkillMentions(
  ctx: QueryCtx,
  message: string,
  repoId: Id<"githubRepos">,
): Promise<ResolvedSkillMentionsResult> {
  const matches = [...message.matchAll(SKILL_TOKEN_REGEX)];
  if (matches.length === 0) {
    return { resolvedMessage: message, prefixBlock: "" };
  }

  const canonicalId = await resolveCanonicalRepoId(ctx.db, repoId);

  const uniqueIds = new Set<string>();
  for (const match of matches) {
    uniqueIds.add(match[2]);
  }

  const resolved = new Map<string, ResolvedSkill>();
  for (const rawId of uniqueIds) {
    const skillId = ctx.db.normalizeId("repoSkills", rawId);
    if (!skillId) continue;
    const skill = await ctx.db.get(skillId);
    if (!skill) continue;
    if (skill.repoId !== canonicalId) continue;
    resolved.set(rawId, {
      skillId,
      title: skill.title,
      prompt: skill.prompt,
    });
  }

  const resolvedMessage = message.replace(
    SKILL_TOKEN_REGEX,
    (_full, title) => `/${title}`,
  );

  if (resolved.size === 0) {
    return { resolvedMessage, prefixBlock: "" };
  }

  const sections = [...resolved.values()].map(
    (skill) => `### ${skill.title}\n${skill.prompt}`,
  );
  const prefixBlock = `## Referenced skills\n\n${sections.join("\n\n---\n\n")}\n\n---`;

  return { resolvedMessage, prefixBlock };
}

export { stripSkillTokens } from "./skillToken";
