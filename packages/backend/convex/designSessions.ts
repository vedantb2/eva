import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import { roleValidator, sessionStatusValidator } from "./validators";

const variationValidator = v.object({
  label: v.string(),
  code: v.string(),
});

const messageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  variations: v.optional(v.array(variationValidator)),
});

const designSessionValidator = v.object({
  _id: v.id("designSessions"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  status: sessionStatusValidator,
  sandboxId: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  selectedVariationIndex: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  messages: v.array(messageValidator),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const sessions = await ctx.db
      .query("designSessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return sessions
      .filter((s) => !s.archived)
      .sort(
        (a, b) =>
          (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
      );
  },
});

export const get = query({
  args: { id: v.id("designSessions") },
  returns: v.union(designSessionValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("designSessions"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("designSessions", {
      repoId: args.repoId,
      userId,
      title: args.title,
      status: "active",
      messages: [],
      updatedAt: Date.now(),
    });
  },
});

export const addMessage = mutation({
  args: {
    id: v.id("designSessions"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        {
          role: args.role,
          content: args.content,
          timestamp: Date.now(),
          activityLog: args.activityLog,
          userId,
          variations: args.variations,
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateLastMessage = mutation({
  args: {
    id: v.id("designSessions"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    if (args.variations !== undefined) last.variations = args.variations;
    await ctx.db.patch(args.id, { messages, updatedAt: Date.now() });
    return null;
  },
});

export const selectVariation = mutation({
  args: {
    id: v.id("designSessions"),
    variationIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    await ctx.db.patch(args.id, {
      selectedVariationIndex: args.variationIndex,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateSandbox = mutation({
  args: {
    id: v.id("designSessions"),
    sandboxId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const updates: { sandboxId?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const archive = mutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (session.userId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { archived: true });
    return null;
  },
});
