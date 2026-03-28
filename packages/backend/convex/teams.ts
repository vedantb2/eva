import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./functions";

export const getOrCreatePersonal = internalMutation({
  args: { userId: v.id("users") },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
      .collect();

    const personalTeam = teams.find((t) => t.isPersonal === true);
    if (personalTeam) {
      return personalTeam._id;
    }

    const teamId = await ctx.db.insert("teams", {
      name: "Personal",
      createdBy: args.userId,
      createdAt: Date.now(),
      isPersonal: true,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const create = authMutation({
  args: {
    name: v.string(),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    if (!args.name.trim()) {
      throw new Error("Team name is required");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      createdBy: ctx.userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: ctx.userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const list = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("teams"),
      _creationTime: v.number(),
      name: v.string(),
      displayName: v.string(),
      createdBy: v.id("users"),
      createdAt: v.number(),
      isPersonal: v.optional(v.boolean()),
      userRole: v.union(v.literal("owner"), v.literal("member")),
    }),
  ),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const teams = [];
    for (const membership of memberships) {
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        let displayName = team.name;
        if (team.isPersonal) {
          if (team.createdBy === ctx.userId) {
            displayName = "My Team";
          } else {
            const owner = await ctx.db.get(team.createdBy);
            const ownerName = owner?.firstName ?? owner?.fullName ?? "Unknown";
            displayName = `${ownerName}'s Team`;
          }
        }
        teams.push({
          ...team,
          displayName,
          userRole: membership.role,
        });
      }
    }

    return teams;
  },
});

export const get = authQuery({
  args: { id: v.id("teams") },
  returns: v.union(
    v.object({
      _id: v.id("teams"),
      _creationTime: v.number(),
      name: v.string(),
      displayName: v.string(),
      createdBy: v.id("users"),
      createdAt: v.number(),
      isPersonal: v.optional(v.boolean()),
      userRole: v.union(v.literal("owner"), v.literal("member")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.id);
    if (!team) return null;

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.id).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) return null;

    let displayName = team.name;
    if (team.isPersonal) {
      if (team.createdBy === ctx.userId) {
        displayName = "My Team";
      } else {
        const owner = await ctx.db.get(team.createdBy);
        const ownerName = owner?.firstName ?? owner?.fullName ?? "Unknown";
        displayName = `${ownerName}'s Team`;
      }
    }

    return {
      ...team,
      displayName,
      userRole: membership.role,
    };
  },
});

export const update = authMutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.id).eq("userId", ctx.userId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only team owners can update team settings");
    }

    const updates: { name?: string } = {};
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("teams") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.id);
    if (!team) throw new Error("Team not found");

    if (team.isPersonal === true) {
      throw new Error("Cannot delete Personal team");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.id).eq("userId", ctx.userId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only team owners can delete the team");
    }

    const allMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();
    for (const member of allMembers) {
      await ctx.db.delete(member._id);
    }

    const teamRepos = await ctx.db
      .query("githubRepos")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();
    for (const repo of teamRepos) {
      await ctx.db.patch(repo._id, { teamId: undefined });
    }

    const teamEnvVars = await ctx.db
      .query("teamEnvVars")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .first();
    if (teamEnvVars) {
      await ctx.db.delete(teamEnvVars._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
