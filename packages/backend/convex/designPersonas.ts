import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

const designPersonaValidator = v.object({
  _id: v.id("designPersonas"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  name: v.string(),
  prompt: v.string(),
});

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designPersonaValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designPersonas")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = authQuery({
  args: { id: v.id("designPersonas") },
  returns: v.union(designPersonaValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    prompt: v.string(),
  },
  returns: v.id("designPersonas"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("designPersonas", {
      repoId: args.repoId,
      userId: ctx.userId,
      name: args.name,
      prompt: args.prompt,
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("designPersonas"),
    name: v.string(),
    prompt: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.id);
    if (!persona) throw new Error("Persona not found");
    if (persona.userId !== ctx.userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { name: args.name, prompt: args.prompt });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("designPersonas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.id);
    if (!persona) throw new Error("Persona not found");
    if (persona.userId !== ctx.userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
