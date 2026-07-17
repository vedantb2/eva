import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { authQuery, hasRepoAccess } from "../functions";
import { entityVisible, filterActiveEntities } from "../numId";
import { firstUserMessagePreview } from "../_messages/preview";
import { sessionFields } from "../validators";
import { sessionValidator } from "./helpers";

/** Session list row: document fields plus first-user-message hover preview. */
const sessionListItemValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  ...sessionFields,
  firstMessagePreview: v.union(v.string(), v.null()),
});

/** Sorts sessions by most recently updated (falling back to creation time). */
function byMostRecentlyUpdated(a: Doc<"sessions">, b: Doc<"sessions">): number {
  return (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime);
}

/** Attaches a short first-user-message preview for sidebar hover cards. */
async function withFirstMessagePreviews(
  db: Parameters<typeof firstUserMessagePreview>[0],
  sessions: Doc<"sessions">[],
) {
  return await Promise.all(
    sessions.map(async (session) => ({
      ...session,
      firstMessagePreview: await firstUserMessagePreview(db, session._id),
    })),
  );
}

/** Lists all non-archived sessions for a repo, sorted by most recently updated. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionListItemValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = filterActiveEntities(
      await ctx.db
        .query("sessions")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .filter((q) => q.neq(q.field("archived"), true))
        .collect(),
    );
    return await withFirstMessagePreviews(
      ctx.db,
      sessions.sort(byMostRecentlyUpdated),
    );
  },
});

/** Lists all archived sessions for a repo, sorted by most recently updated. */
export const listArchived = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionListItemValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = filterActiveEntities(
      await ctx.db
        .query("sessions")
        .withIndex("by_repo_and_archived", (q) =>
          q.eq("repoId", args.repoId).eq("archived", true),
        )
        .collect(),
    );
    return await withFirstMessagePreviews(
      ctx.db,
      sessions.sort(byMostRecentlyUpdated),
    );
  },
});

/** Counts non-archived sessions with "active" status for a repo. */
export const countActive = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return 0;
    const sessions = filterActiveEntities(
      await ctx.db
        .query("sessions")
        .withIndex("by_repo_and_status", (q) =>
          q.eq("repoId", args.repoId).eq("status", "active"),
        )
        .filter((q) => q.neq(q.field("archived"), true))
        .collect(),
    );
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
    return entityVisible(session);
  },
});

/** Resolves a session by per-repo numeric id (URL segment). */
export const getByNumId = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    numId: v.number(),
  },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", args.repoId).eq("numId", args.numId),
      )
      .first();
    return entityVisible(session);
  },
});
