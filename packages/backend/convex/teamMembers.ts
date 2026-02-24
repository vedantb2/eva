import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { teamMemberRoleValidator } from "./validators";

export const list = authQuery({
  args: { teamId: v.id("teams") },
  returns: v.array(
    v.object({
      _id: v.id("teamMembers"),
      _creationTime: v.number(),
      teamId: v.id("teams"),
      userId: v.id("users"),
      role: teamMemberRoleValidator,
      joinedAt: v.number(),
      user: v.union(
        v.object({
          _id: v.id("users"),
          email: v.optional(v.string()),
          fullName: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const currentUserMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!currentUserMembership) return [];

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithUsers = [];
    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      membersWithUsers.push({
        ...member,
        user: user
          ? {
              _id: user._id,
              email: user.email,
              fullName: user.fullName,
            }
          : null,
      });
    }

    return membersWithUsers;
  },
});

export const add = authMutation({
  args: {
    teamId: v.id("teams"),
    userEmail: v.string(),
  },
  returns: v.id("teamMembers"),
  handler: async (ctx, args) => {
    const currentUserMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!currentUserMembership || currentUserMembership.role !== "owner") {
      throw new Error("Only team owners can add members");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!targetUser) {
      throw new Error("User not found");
    }

    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", targetUser._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this team");
    }

    const memberId = await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: targetUser._id,
      role: "member",
      joinedAt: Date.now(),
    });

    return memberId;
  },
});

export const remove = authMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUserMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!currentUserMembership || currentUserMembership.role !== "owner") {
      throw new Error("Only team owners can remove members");
    }

    const targetMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (!targetMembership) {
      throw new Error("User is not a member of this team");
    }

    if (args.userId === ctx.userId) {
      const allOwners = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (allOwners.length === 1) {
        throw new Error("Cannot remove the last owner from the team");
      }
    }

    await ctx.db.delete(targetMembership._id);
    return null;
  },
});

export const updateRole = authMutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: teamMemberRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUserMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!currentUserMembership || currentUserMembership.role !== "owner") {
      throw new Error("Only team owners can change member roles");
    }

    const targetMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId),
      )
      .first();

    if (!targetMembership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.patch(targetMembership._id, { role: args.role });
    return null;
  },
});
