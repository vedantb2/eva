import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Stores a SKILL.md body outside the metadata row used by list subscriptions. */
export async function upsertRepoSkillContent(
  ctx: MutationCtx,
  skillId: Id<"repoSkills">,
  content: string,
): Promise<void> {
  const existing = await ctx.db
    .query("repoSkillContents")
    .withIndex("by_skill", (q) => q.eq("skillId", skillId))
    .unique();
  if (existing) {
    if (existing.content !== content) {
      await ctx.db.patch(existing._id, { content });
    }
    return;
  }
  await ctx.db.insert("repoSkillContents", { skillId, content });
}
