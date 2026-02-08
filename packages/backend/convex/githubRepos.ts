import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(githubRepoValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db.query("githubRepos").collect();
  },
});

export const get = query({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const getByOwnerAndName = query({
  args: { owner: v.string(), name: v.string() },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .first();
  },
});

export const create = mutation({
  args: {
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
  },
  returns: v.id("githubRepos"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const existing = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .first();
    if (existing) {
      throw new Error("Repository already exists");
    }
    return await ctx.db.insert("githubRepos", {
      owner: args.owner,
      name: args.name,
      installationId: args.installationId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const repo = await ctx.db.get(args.id);
    if (!repo) {
      throw new Error("Repository not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
