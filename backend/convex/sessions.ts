import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  timestamp: v.number(),
});

const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  branchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  lastActivityAt: v.optional(v.number()),
  status: v.union(v.literal("active"), v.literal("closed")),
  messages: v.array(messageValidator),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId,
      title: args.title,
      status: "active",
      messages: [],
    });
  },
});

export const addMessage = mutation({
  args: {
    id: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        { role: args.role, content: args.content, timestamp: Date.now() },
      ],
    });
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("sessions"),
    status: v.union(v.literal("active"), v.literal("closed")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const update = mutation({
  args: {
    id: v.id("sessions"),
    title: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    const updates: { title?: string; branchName?: string; prUrl?: string } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.prUrl !== undefined) updates.prUrl = args.prUrl;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getNoAuth = query({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const addMessageNoAuth = mutation({
  args: {
    id: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        { role: args.role, content: args.content, timestamp: Date.now() },
      ],
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

export const updateSandboxNoAuth = mutation({
  args: {
    id: v.id("sessions"),
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    const updates: {
      sandboxId?: string;
      branchName?: string;
      prUrl?: string;
      lastActivityAt: number;
    } = { lastActivityAt: Date.now() };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.prUrl !== undefined) updates.prUrl = args.prUrl;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const clearSandboxNoAuth = mutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { sandboxId: undefined });
    return null;
  },
});
