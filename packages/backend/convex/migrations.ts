import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const assignOrphanRepos = internalMutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
  }),
  handler: async (ctx) => {
    const FALLBACK_USER_ID = "kn7dz0w9h66cp8e1kem5ddnv8d7z29fa";

    const normalizedUserId = ctx.db.normalizeId("users", FALLBACK_USER_ID);
    if (!normalizedUserId) {
      throw new Error("Invalid fallback user ID");
    }

    const allRepos = await ctx.db.query("githubRepos").collect();
    const orphanRepos = allRepos.filter(
      (repo) => repo.connectedBy === undefined,
    );

    for (const repo of orphanRepos) {
      await ctx.db.patch(repo._id, { connectedBy: normalizedUserId });
    }

    return { migratedCount: orphanRepos.length };
  },
});

export const createPersonalTeamsAndMigrate = internalMutation({
  args: {},
  returns: v.object({
    teamsCreated: v.number(),
    reposUpdated: v.number(),
  }),
  handler: async (ctx) => {
    let teamsCreated = 0;
    let reposUpdated = 0;

    const allUsers = await ctx.db.query("users").collect();

    for (const user of allUsers) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_created_by", (q) => q.eq("createdBy", user._id))
        .collect();

      const hasPersonalTeam = teams.some((t) => t.isPersonal === true);

      if (!hasPersonalTeam) {
        const personalTeamId = await ctx.runMutation(
          internal.teams.getOrCreatePersonal,
          {
            userId: user._id,
          },
        );
        teamsCreated++;

        const userRepos = await ctx.db.query("githubRepos").collect();
        const ownedRepos = userRepos.filter(
          (r) => r.connectedBy === user._id && !r.teamId,
        );

        for (const repo of ownedRepos) {
          await ctx.db.patch(repo._id, { teamId: personalTeamId });
          reposUpdated++;
        }
      }
    }

    const allRepos = await ctx.db.query("githubRepos").collect();
    const reposWithoutTeam = allRepos.filter((r) => !r.teamId && r.connectedBy);

    for (const repo of reposWithoutTeam) {
      if (!repo.connectedBy) continue;

      const owner = await ctx.db.get(repo.connectedBy);
      if (!owner) continue;

      const personalTeamId = await ctx.runMutation(
        internal.teams.getOrCreatePersonal,
        {
          userId: owner._id,
        },
      );

      await ctx.db.patch(repo._id, { teamId: personalTeamId });
      reposUpdated++;
    }

    return { teamsCreated, reposUpdated };
  },
});

export const removeTeamSlugs = internalMutation({
  args: {},
  returns: v.object({
    teamsUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const allTeams = await ctx.db.query("teams").collect();

    for (const team of allTeams) {
      await ctx.db.replace(team._id, {
        name: team.name,
        createdBy: team.createdBy,
        createdAt: team.createdAt,
        isPersonal: team.isPersonal,
      });
    }

    return { teamsUpdated: allTeams.length };
  },
});
