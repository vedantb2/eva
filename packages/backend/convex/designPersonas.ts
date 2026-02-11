import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const designPersonaValidator = v.object({
  _id: v.id("designPersonas"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  name: v.string(),
  prompt: v.string(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designPersonaValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("designPersonas")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("designPersonas") },
  returns: v.union(designPersonaValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    prompt: v.string(),
  },
  returns: v.id("designPersonas"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("designPersonas", {
      repoId: args.repoId,
      userId,
      name: args.name,
      prompt: args.prompt,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("designPersonas"),
    name: v.string(),
    prompt: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const persona = await ctx.db.get(args.id);
    if (!persona) throw new Error("Persona not found");
    if (persona.userId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { name: args.name, prompt: args.prompt });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("designPersonas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const persona = await ctx.db.get(args.id);
    if (!persona) throw new Error("Persona not found");
    if (persona.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
