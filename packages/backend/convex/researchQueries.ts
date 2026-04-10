import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { roleValidator, queryConfirmationStatusValidator } from "./validators";

const researchQueryValidator = v.object({
  _id: v.id("researchQueries"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")),
  activeWorkflowId: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
});

/** Lists all research queries for a repo, sorted by most recently updated. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(researchQueryValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const queries = await ctx.db
      .query("researchQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return queries.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Fetches a single research query by ID, with repo access control. */
export const get = authQuery({
  args: { id: v.id("researchQueries") },
  returns: v.union(researchQueryValidator, v.null()),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.id);
    if (!rq) return null;
    if (!(await hasRepoAccess(ctx.db, rq.repoId, ctx.userId))) return null;
    return rq;
  },
});

/** Creates a new research query in a repo. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("researchQueries"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    return await ctx.db.insert("researchQueries", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
    });
  },
});

/** Adds a chat message to a research query conversation. */
export const addMessage = authMutation({
  args: {
    id: v.id("researchQueries"),
    role: roleValidator,
    content: v.string(),
    queryCode: v.optional(v.string()),
    status: v.optional(queryConfirmationStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.id);
    if (!rq) {
      throw new Error("Query not found");
    }
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
      queryCode: args.queryCode,
      status: args.status,
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Updates the most recent message in a research query (for streaming). */
export const updateLastMessage = authMutation({
  args: {
    id: v.id("researchQueries"),
    content: v.string(),
    queryCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.id);
    if (!rq) throw new Error("Query not found");
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (!last) return null;
    const patch: { content: string; queryCode?: string } = {
      content: args.content,
    };
    if (args.queryCode !== undefined) patch.queryCode = args.queryCode;
    await ctx.db.patch(last._id, patch);
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Updates the confirmation status of a specific message in a research query. */
export const updateMessageStatus = authMutation({
  args: {
    id: v.id("researchQueries"),
    messageId: v.id("messages"),
    status: queryConfirmationStatusValidator,
    content: v.optional(v.string()),
    queryCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: {
      status: "pending" | "confirmed" | "cancelled";
      content?: string;
      queryCode?: string;
    } = { status: args.status };
    if (args.content !== undefined) patch.content = args.content;
    if (args.queryCode !== undefined) patch.queryCode = args.queryCode;
    await ctx.db.patch(args.messageId, patch);
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Updates a research query's title. */
export const update = authMutation({
  args: {
    id: v.id("researchQueries"),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.id);
    if (!rq) {
      throw new Error("Query not found");
    }
    const updates: { title?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Deletes a research query and all its associated messages. */
export const remove = authMutation({
  args: { id: v.id("researchQueries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.id);
    if (!rq) {
      throw new Error("Query not found");
    }
    if (!(await hasRepoAccess(ctx.db, rq.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
