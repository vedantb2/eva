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

export const renameReposConductorToEva = internalMutation({
  args: {},
  returns: v.object({
    updatedCount: v.number(),
  }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const conductorRepos = allRepos.filter((repo) => repo.name === "conductor");

    for (const repo of conductorRepos) {
      await ctx.db.patch(repo._id, { name: "eva" });
    }

    return { updatedCount: conductorRepos.length };
  },
});

export const migrateBoardsAndCommentsToUserIds = internalMutation({
  args: {},
  returns: v.object({
    boardsUpdated: v.number(),
    commentsUpdated: v.number(),
    boardsSkipped: v.number(),
    commentsSkipped: v.number(),
  }),
  handler: async (ctx) => {
    let boardsUpdated = 0;
    let commentsUpdated = 0;
    let boardsSkipped = 0;
    let commentsSkipped = 0;

    const allBoards = await ctx.db.query("boards").collect();
    for (const board of allBoards) {
      const ownerId = board.ownerId;
      if (typeof ownerId !== "string") {
        continue;
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", ownerId))
        .first();

      if (user) {
        await ctx.db.patch(board._id, { ownerId: user._id });
        boardsUpdated++;
      } else {
        boardsSkipped++;
      }
    }

    const allComments = await ctx.db.query("taskComments").collect();
    for (const comment of allComments) {
      const authorId = comment.authorId;
      if (typeof authorId !== "string") {
        continue;
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", authorId))
        .first();

      if (user) {
        await ctx.db.patch(comment._id, { authorId: user._id });
        commentsUpdated++;
      } else {
        commentsSkipped++;
      }
    }

    return { boardsUpdated, commentsUpdated, boardsSkipped, commentsSkipped };
  },
});
