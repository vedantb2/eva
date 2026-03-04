import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("taskDrafts"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      baseBranch: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const drafts = await ctx.db
      .query("taskDrafts")
      .withIndex("by_repo_and_user", (q) =>
        q.eq("repoId", args.repoId).eq("createdBy", ctx.userId),
      )
      .collect();
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const save = authMutation({
  args: {
    id: v.optional(v.id("taskDrafts")),
    repoId: v.id("githubRepos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("taskDrafts"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.createdBy !== ctx.userId)
        throw new Error("Draft not found");
      await ctx.db.patch(args.id, {
        title: args.title,
        description: args.description,
        baseBranch: args.baseBranch,
        updatedAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("taskDrafts", {
      repoId: args.repoId,
      title: args.title,
      description: args.description,
      baseBranch: args.baseBranch,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = authMutation({
  args: { id: v.id("taskDrafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id);
    if (!draft || draft.createdBy !== ctx.userId)
      throw new Error("Draft not found");
    await ctx.db.delete(args.id);
    return null;
  },
});
