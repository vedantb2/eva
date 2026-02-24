import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./functions";

export const list = authQuery({
  args: { teamId: v.id("teams") },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) return [];

    const doc = await ctx.db
      .query("teamEnvVars")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!doc) return [];
    return doc.vars.map((entry) => ({ key: entry.key, value: "••••••" }));
  },
});

export const getForSandbox = internalQuery({
  args: { teamId: v.id("teams") },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("teamEnvVars")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
    if (!doc) return [];
    return doc.vars;
  },
});

export const upsertVarInternal = internalMutation({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("teamEnvVars")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
    if (doc) {
      const vars = doc.vars.filter((entry) => entry.key !== args.key);
      vars.push({ key: args.key, value: args.value });
      await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("teamEnvVars", {
        teamId: args.teamId,
        vars: [{ key: args.key, value: args.value }],
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const removeVar = authMutation({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) throw new Error("Not a team member");

    const doc = await ctx.db
      .query("teamEnvVars")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!doc) return null;

    const vars = doc.vars.filter((entry) => entry.key !== args.key);
    await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    return null;
  },
});
