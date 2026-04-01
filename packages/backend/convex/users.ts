import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";
import { roleUserValidator } from "./validators";
import { authQuery } from "./functions";

export const getInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.object({ clerkId: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.clerkId) return null;
    return { clerkId: user.clerkId };
  },
});

export const get = authQuery({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
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
      lastSeenAt: user.lastSeenAt,
    };
  },
});

export const listOnlineTeammates = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
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
        });
      }
    }
    return online;
  },
});

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
