import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";

const VERSION_CAP = 100;

/** Upserts a draft entry, tracking who has edited since the last saved version. */
export const touchDraft = authMutation({
  args: { docId: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      throw new Error("Document not found");
    const existing = await ctx.db
      .query("docVersionDrafts")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .first();
    const now = Date.now();
    if (existing) {
      const authorIds = existing.authorIds.includes(ctx.userId)
        ? existing.authorIds
        : [...existing.authorIds, ctx.userId];
      await ctx.db.patch(existing._id, { authorIds, updatedAt: now });
    } else {
      await ctx.db.insert("docVersionDrafts", {
        docId: args.docId,
        authorIds: [ctx.userId],
        updatedAt: now,
      });
    }
    return null;
  },
});

/** Saves a version snapshot. Dedupes against the latest version. */
export const saveVersion = authMutation({
  args: {
    docId: v.id("docs"),
    content: v.string(),
    pmContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      throw new Error("Document not found");

    const existing = await ctx.db
      .query("docVersions")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .order("desc")
      .first();
    if (existing && existing.pmContent === args.pmContent) return null;

    const draft = await ctx.db
      .query("docVersionDrafts")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .first();
    const authorIds =
      draft && draft.authorIds.length > 0 ? draft.authorIds : [ctx.userId];

    await ctx.db.insert("docVersions", {
      docId: args.docId,
      title: doc.title,
      content: args.content,
      pmContent: args.pmContent,
      authorIds,
      createdAt: Date.now(),
    });

    if (draft) {
      await ctx.db.delete(draft._id);
    }

    const allVersions = await ctx.db
      .query("docVersions")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .order("asc")
      .collect();
    if (allVersions.length > VERSION_CAP) {
      const toDelete = allVersions.slice(0, allVersions.length - VERSION_CAP);
      for (const ver of toDelete) {
        await ctx.db.delete(ver._id);
      }
    }

    return null;
  },
});

/** Lists versions (lightweight, no content fields). */
export const list = authQuery({
  args: { docId: v.id("docs") },
  returns: v.array(
    v.object({
      _id: v.id("docVersions"),
      title: v.string(),
      authorIds: v.array(v.id("users")),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      return [];
    const versions = await ctx.db
      .query("docVersions")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .order("desc")
      .collect();
    return versions.map((v) => ({
      _id: v._id,
      title: v.title,
      authorIds: v.authorIds,
      createdAt: v.createdAt,
    }));
  },
});

/** Fetches a full version by ID. */
export const get = authQuery({
  args: { id: v.id("docVersions") },
  returns: v.union(
    v.object({
      _id: v.id("docVersions"),
      docId: v.id("docs"),
      title: v.string(),
      content: v.string(),
      pmContent: v.string(),
      authorIds: v.array(v.id("users")),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.id);
    if (!version) return null;
    const doc = await ctx.db.get(version.docId);
    if (!doc || !(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId)))
      return null;
    return {
      _id: version._id,
      docId: version.docId,
      title: version.title,
      content: version.content,
      pmContent: version.pmContent,
      authorIds: version.authorIds,
      createdAt: version.createdAt,
    };
  },
});
