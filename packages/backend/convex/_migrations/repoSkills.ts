import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/** Moves legacy prompt-backed skills into the GitHub metadata shape. */
export const migrateRepoSkillsToGithubMetadata = internalMutation({
  args: {},
  returns: v.object({ migrated: v.number() }),
  handler: async (ctx) => {
    const skills = await ctx.db.query("repoSkills").collect();
    const migratedAt = Date.now();
    let migrated = 0;

    for (const skill of skills) {
      const existingDescription = skill.description?.trim();
      const promptDescription = skill.prompt?.trim();
      const description =
        existingDescription || promptDescription || "Legacy prompt skill";

      await ctx.db.patch(skill._id, {
        description,
        available: false,
        unavailableSince: skill.unavailableSince ?? migratedAt,
        prompt: undefined,
      });
      migrated++;
    }

    return { migrated };
  },
});
