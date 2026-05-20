import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { resolveCanonicalRepoId } from "./_githubRepos/helpers";

const repoSkillValidator = v.object({
  _id: v.id("repoSkills"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  title: v.string(),
  prompt: v.string(),
  createdAt: v.number(),
});

/** Lists all skills for a repo (resolved to canonical repo for monorepos). */
export const listByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(repoSkillValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    return await ctx.db
      .query("repoSkills")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
      .collect();
  },
});

/** Creates a repo skill. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    prompt: v.string(),
  },
  returns: v.id("repoSkills"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const title = args.title.trim();
    const prompt = args.prompt.trim();
    if (!title || !prompt) {
      throw new Error("Title and prompt are required");
    }
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    return await ctx.db.insert("repoSkills", {
      repoId: canonicalId,
      title,
      prompt,
      createdAt: Date.now(),
    });
  },
});

/** Updates a repo skill's title and prompt. */
export const update = authMutation({
  args: {
    id: v.id("repoSkills"),
    title: v.string(),
    prompt: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    if (!skill) throw new Error("Skill not found");
    if (!(await hasRepoAccess(ctx.db, skill.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const title = args.title.trim();
    const prompt = args.prompt.trim();
    if (!title || !prompt) {
      throw new Error("Title and prompt are required");
    }
    await ctx.db.patch(args.id, { title, prompt });
    return null;
  },
});

/** Deletes a repo skill. */
export const remove = authMutation({
  args: { id: v.id("repoSkills") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    if (!skill) throw new Error("Skill not found");
    if (!(await hasRepoAccess(ctx.db, skill.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
