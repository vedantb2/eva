import { v } from "convex/values";
import { designSessionFields } from "../validators";
import { authQuery, hasRepoAccess } from "../functions";
import { entityVisible, filterActiveEntities } from "../numId";

export const designSessionValidator = v.object({
  _id: v.id("designSessions"),
  _creationTime: v.number(),
  ...designSessionFields,
});

/** Lists active (non-archived) design sessions for a repo, sorted by most recently updated. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = filterActiveEntities(
      await ctx.db
        .query("designSessions")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .collect(),
    );
    return sessions
      .filter((s) => !s.archived)
      .sort(
        (a, b) =>
          (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
      );
  },
});

/** Lists archived design sessions for a repo. */
export const listArchived = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = filterActiveEntities(
      await ctx.db
        .query("designSessions")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .collect(),
    );
    return sessions
      .filter((s) => s.archived === true)
      .sort(
        (a, b) =>
          (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
      );
  },
});

/** Counts the number of active, non-archived design sessions for a repo. */
export const countActive = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return 0;
    const sessions = filterActiveEntities(
      await ctx.db
        .query("designSessions")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .collect(),
    );
    return sessions.filter((s) => s.status === "active" && !s.archived).length;
  },
});

/** Fetches a single design session by ID, with repo access control. */
export const get = authQuery({
  args: { id: v.id("designSessions") },
  returns: v.union(designSessionValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return entityVisible(session);
  },
});

/** Resolves a design session by per-repo numeric id (URL segment). */
export const getByNumId = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    numId: v.number(),
  },
  returns: v.union(designSessionValidator, v.null()),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return null;
    const session = await ctx.db
      .query("designSessions")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", args.repoId).eq("numId", args.numId),
      )
      .first();
    return entityVisible(session);
  },
});
