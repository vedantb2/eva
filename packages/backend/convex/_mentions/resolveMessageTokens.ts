import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveDocMentions } from "./resolveDocMentions";
import { resolveSkillMentions } from "./resolveSkillMentions";

export interface ResolvedMessageTokensResult {
  resolvedMessage: string;
  prefixBlock: string;
}

/** Resolves doc `@` mentions and skill `/` tokens for chat execution prompts. */
export async function resolveMessageTokens(
  ctx: QueryCtx,
  message: string,
  repoId: Id<"githubRepos">,
): Promise<ResolvedMessageTokensResult> {
  const { resolvedMessage: afterDocs, prefixBlock: docBlock } =
    await resolveDocMentions(ctx, message, repoId);
  const { resolvedMessage, prefixBlock: skillBlock } =
    await resolveSkillMentions(ctx, afterDocs, repoId);
  const prefixBlock = [docBlock, skillBlock].filter(Boolean).join("\n\n");
  return { resolvedMessage, prefixBlock };
}
