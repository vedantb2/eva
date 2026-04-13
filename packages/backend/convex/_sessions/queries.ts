import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "../functions";
import { sessionValidator } from "./helpers";

/** Lists all non-archived sessions for a repo, sorted by most recently updated. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();
    return sessions.sort(
      (a, b) =>
        (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
    );
  },
});

/** Lists all archived sessions for a repo, sorted by most recently updated. */
export const listArchived = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_archived", (q) =>
        q.eq("repoId", args.repoId).eq("archived", true),
      )
      .collect();
    return sessions.sort(
      (a, b) =>
        (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
    );
  },
});

/** Counts non-archived sessions with "active" status for a repo. */
export const countActive = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return 0;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "active"),
      )
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();
    return sessions.length;
  },
});

/** Retrieves a single session by ID, returning null if not found or unauthorized. */
export const get = authQuery({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return session;
  },
});
