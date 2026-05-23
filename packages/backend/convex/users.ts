import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";
import { roleUserValidator } from "./validators";
import { authQuery } from "./functions";

/** Returns the Clerk ID for a user (internal use only). */
export const getInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.object({ clerkId: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.clerkId) return null;
    return { clerkId: user.clerkId };
  },
});

/** Fetches a user's public profile (name, last seen) by their ID. */
export const get = authQuery({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      email: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
      lastSeenPath: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      lastSeenAt: user.lastSeenAt,
      lastSeenPath: user.lastSeenPath,
    };
  },
});

/** Lists teammates across all of the current user's teams who were active in the last 2 minutes. */
export const listOnlineTeammates = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
      lastSeenPath: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const teammateIds = new Map<string, Id<"users">>();
    for (const membership of memberships) {
      const teamMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect();
      for (const tm of teamMembers) {
        if (tm.userId !== ctx.userId) {
          teammateIds.set(tm.userId, tm.userId);
        }
      }
    }

    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    const online = [];
    for (const id of teammateIds.values()) {
      const user = await ctx.db.get(id);
      if (user && user.lastSeenAt && now - user.lastSeenAt < twoMinutes) {
        online.push({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          lastSeenAt: user.lastSeenAt,
          lastSeenPath: user.lastSeenPath,
        });
      }
    }
    return online;
  },
});

/** Lists the current user's team name and all teammates, sorted with online users first. */
export const listTeamWithMembers = authQuery({
  args: {},
  returns: v.union(
    v.object({
      teamName: v.string(),
      members: v.array(
        v.object({
          _id: v.id("users"),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          fullName: v.optional(v.string()),
          lastSeenAt: v.optional(v.number()),
          lastSeenPath: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    if (memberships.length === 0) return null;

    const teamMembership = memberships[0];
    const team = await ctx.db.get(teamMembership.teamId);
    if (!team) return null;

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

    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamMembership.teamId))
      .collect();

    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    const members = [];
    for (const tm of teamMembers) {
      if (tm.userId === ctx.userId) continue;
      const user = await ctx.db.get(tm.userId);
      if (user) {
        members.push({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          lastSeenAt: user.lastSeenAt,
          lastSeenPath: user.lastSeenPath,
        });
      }
    }

    members.sort((a, b) => {
      const aOnline = a.lastSeenAt && now - a.lastSeenAt < twoMinutes;
      const bOnline = b.lastSeenAt && now - b.lastSeenAt < twoMinutes;
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return 0;
    });

    return { teamName: displayName, members };
  },
});

/** Lists all users in the system with their basic profile info. */
export const listAll = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      role: v.optional(roleUserValidator),
    }),
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: u.fullName,
      role: u.role,
    }));
  },
});
