import { v } from "convex/values";
import { roleValidator, variationValidator } from "../validators";
import { authMutation, hasRepoAccess } from "../functions";
import { allocateNumId } from "../numId";

/** Creates a new design session in a repo with "closed" initial status. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("designSessions"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const numId = await allocateNumId(ctx.db, args.repoId, "designSessions");
    return await ctx.db.insert("designSessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "closed",
      updatedAt: Date.now(),
      numId,
    });
  },
});

/** Updates a design session's title. */
export const update = authMutation({
  args: {
    id: v.id("designSessions"),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const updates: { title?: string } = {};
    if (args.title !== undefined) updates.title = args.title;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Adds a chat message to a design session conversation. */
export const addMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
    personaId: v.optional(v.id("designPersonas")),
    variations: v.optional(v.array(variationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      activityLog: args.activityLog,
      userId: ctx.userId,
      personaId: args.personaId,
      variations: args.variations,
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Updates the most recent message in a design session (for streaming). */
export const updateLastMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (!last) return null;
    const patch: {
      content?: string;
      activityLog?: string;
      variations?: Array<{ label: string; route?: string; filePath?: string }>;
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;
    await ctx.db.patch(last._id, patch);
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Selects a design variation by index for the current session. */
export const selectVariation = authMutation({
  args: {
    id: v.id("designSessions"),
    variationIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    await ctx.db.patch(args.id, {
      selectedVariationIndex: args.variationIndex,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Archives a design session, removing it from active lists. */
export const archive = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.patch(args.id, { archived: true });
    return null;
  },
});

/** Unarchives a design session, restoring it to the active list. */
export const unarchive = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.patch(args.id, { archived: false });
    return null;
  },
});
