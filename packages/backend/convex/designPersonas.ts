import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";

const designPersonaValidator = v.object({
  _id: v.id("designPersonas"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  name: v.string(),
  prompt: v.string(),
});

/** Lists all design personas for a repo. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designPersonaValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    return await ctx.db
      .query("designPersonas")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

/** Fetches a single design persona by ID, with repo access control. */
export const get = authQuery({
  args: { id: v.id("designPersonas") },
  returns: v.union(designPersonaValidator, v.null()),
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.id);
    if (!persona) return null;
    if (!(await hasRepoAccess(ctx.db, persona.repoId, ctx.userId))) return null;
    return persona;
  },
});

/** Creates a new design persona for a repo. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    prompt: v.string(),
  },
  returns: v.id("designPersonas"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    return await ctx.db.insert("designPersonas", {
      repoId: args.repoId,
      userId: ctx.userId,
      name: args.name,
      prompt: args.prompt,
    });
  },
});

/** Updates a design persona's name and prompt. */
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
    if (!(await hasRepoAccess(ctx.db, persona.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.patch(args.id, { name: args.name, prompt: args.prompt });
    return null;
  },
});

/** Deletes a design persona. */
export const remove = authMutation({
  args: { id: v.id("designPersonas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.id);
    if (!persona) throw new Error("Persona not found");
    if (!(await hasRepoAccess(ctx.db, persona.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
