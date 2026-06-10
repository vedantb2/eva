import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { components } from "./_generated/api";
import { evaluationStatusValidator, roleValidator } from "./validators";
import { docFields } from "./validators";
import { prosemirrorSync } from "./prosemirrorSync";

const interviewMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

const docValidator = v.object({
  _id: v.id("docs"),
  _creationTime: v.number(),
  ...docFields,
});

/**
 * Wraps markdown content as a minimal ProseMirror doc for the sync component.
 * This does NOT parse markdown structure — headings/lists stay as plain text
 * until the doc is next edited in the rich editor (a server-side markdown
 * parser would need the full TipTap schema in the isolate). Shared by the
 * create / lazy-migration / session-import paths so they behave identically.
 */
function planToDocJson(content: string): {
  type: string;
  content: Array<Record<string, unknown>>;
} {
  return content.trim()
    ? {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: content }] },
        ],
      }
    : { type: "doc", content: [{ type: "paragraph" }] };
}

/** Lists all docs for a given repo, filtered by user access. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(docValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    return await ctx.db
      .query("docs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

/** Fetches a single doc by ID, with access control. */
export const get = authQuery({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    if (!(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId))) return null;
    return doc;
  },
});

/** Creates a new doc in a repo. Requirements/userFlows are populated by extraction (docPrdWorkflow), not by this mutation. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    const docId = await ctx.db.insert("docs", {
      repoId: args.repoId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    await prosemirrorSync.create(ctx, docId, planToDocJson(args.content));

    return docId;
  },
});

/** Updates a doc's title or description. Content is now managed via live sync. */
export const update = authMutation({
  args: {
    id: v.id("docs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    const updates: {
      title?: string;
      content?: string;
      description?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Returns the doc associated with a session, if any. Used by PRD tab to determine Save vs Update label. */
export const getBySession = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return await ctx.db
      .query("docs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/** Saves a session's plan content as a doc. If a doc already exists for this session, updates its content. */
export const createFromSession = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const planContent = session.planContent?.trim();
    if (!planContent) {
      throw new Error("Session has no plan content to save");
    }
    const existing = await ctx.db
      .query("docs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    const now = Date.now();
    const planJson = planToDocJson(session.planContent ?? "");

    if (existing) {
      // "Update Document": overwrite the live synced doc with the latest plan.
      // We reset the sync component's data and recreate it (rather than a
      // server-side transform, which would need the full editor schema in the
      // isolate). This is an explicit, infrequent overwrite, so clobbering any
      // in-flight collaborative edits on this doc is acceptable.
      const snapshot = await ctx.runQuery(
        components.prosemirrorSync.lib.getSnapshot,
        { id: existing._id },
      );
      if (snapshot.content !== null) {
        await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
          id: existing._id,
        });
      }
      await prosemirrorSync.create(ctx, existing._id, planJson);
      await ctx.db.patch(existing._id, {
        content: session.planContent ?? "",
        contentUpdatedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    const docId = await ctx.db.insert("docs", {
      repoId: session.repoId,
      sessionId: args.sessionId,
      title: session.title,
      content: session.planContent ?? "",
      contentUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await prosemirrorSync.create(ctx, docId, planJson);
    return docId;
  },
});

/** Ensures a sync document exists for a legacy doc (lazy migration). */
export const ensureSyncDoc = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    if (!(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const existing = await ctx.runQuery(
      components.prosemirrorSync.lib.getSnapshot,
      { id: args.id },
    );
    if (existing.content !== null) return null;

    await prosemirrorSync.create(ctx, args.id, planToDocJson(doc.content));
    return null;
  },
});

/** Deletes a doc and all associated data. */
export const remove = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }

    await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
      id: args.id,
    });

    const comments = await ctx.db
      .query("docComments")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const subscribers = await ctx.db
      .query("docSubscribers")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const sub of subscribers) {
      await ctx.db.delete(sub._id);
    }

    const versions = await ctx.db
      .query("docVersions")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const ver of versions) {
      await ctx.db.delete(ver._id);
    }

    const drafts = await ctx.db
      .query("docVersionDrafts")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const draft of drafts) {
      await ctx.db.delete(draft._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/** Appends a message to the doc's interview conversation history. */
export const addInterviewMessage = authMutation({
  args: {
    id: v.id("docs"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    const history = doc.interviewHistory ?? [];
    history.push({
      role: args.role,
      content: args.content,
      activityLog: args.activityLog,
      userId: ctx.userId,
    });
    await ctx.db.patch(args.id, { interviewHistory: history });
    return null;
  },
});

/** Clears a doc's interview history and associated sandbox. */
export const clearInterview = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    await ctx.db.patch(args.id, {
      interviewHistory: undefined,
      sandboxId: undefined,
    });
    return null;
  },
});
