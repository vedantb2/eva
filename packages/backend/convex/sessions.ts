import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import {
  roleValidator,
  sessionModeValidator,
  sessionStatusValidator,
} from "./validators";

const messageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  mode: v.optional(sessionModeValidator),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

const fileDiffValidator = v.object({
  file: v.string(),
  status: v.string(),
  diff: v.string(),
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
  ptySessionId: v.optional(v.string()),
  lastActivityAt: v.optional(v.number()),
  status: sessionStatusValidator,
  archived: v.optional(v.boolean()),
  summary: v.optional(v.array(v.string())),
  createdBy: v.optional(v.id("users")),
  messages: v.array(messageValidator),
  fileDiffs: v.optional(v.array(fileDiffValidator)),
  planContent: v.optional(v.string()),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    // Filter out archived sessions
    return sessions.filter((session) => !session.archived);
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
      createdBy: userId,
    });
  },
});

export const addMessage = mutation({
  args: {
    id: v.id("sessions"),
    role: roleValidator,
    content: v.string(),
    mode: v.optional(sessionModeValidator),
    activityLog: v.optional(v.string()),
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
        {
          role: args.role,
          content: args.content,
          timestamp: Date.now(),
          mode: args.mode,
          activityLog: args.activityLog,
          userId,
        },
      ],
    });
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("sessions"),
    status: sessionStatusValidator,
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

export const updateSummary = mutation({
  args: {
    id: v.id("sessions"),
    summary: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    await ctx.db.patch(args.id, { summary: args.summary });
    return null;
  },
});

export const archive = mutation({
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
    await ctx.db.patch(args.id, { archived: true });
    return null;
  },
});

export const updateSandbox = mutation({
  args: {
    id: v.id("sessions"),
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
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

export const clearSandbox = mutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { sandboxId: undefined, status: "closed" });
    return null;
  },
});

export const updatePtySession = mutation({
  args: {
    id: v.id("sessions"),
    ptySessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      ptySessionId: args.ptySessionId,
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

export const updateFileDiffs = mutation({
  args: {
    id: v.id("sessions"),
    fileDiffs: v.array(fileDiffValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { fileDiffs: args.fileDiffs });
    return null;
  },
});

export const getOrCreateExtensionSession = mutation({
  args: {
    repoId: v.id("githubRepos"),
    clerkId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    repoId: v.string(),
    messages: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("title"), "Extension Session"),
          q.neq(q.field("archived"), true),
        ),
      )
      .first();

    if (existingSession) {
      return {
        id: existingSession._id,
        repoId: existingSession.repoId,
        messages: existingSession.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
    }

    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: user._id,
      title: "Extension Session",
      status: "active",
      messages: [],
    });

    return {
      id: sessionId,
      repoId: args.repoId,
      messages: [],
    };
  },
});

export const updatePlanContent = mutation({
  args: {
    id: v.id("sessions"),
    planContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    await ctx.db.patch(args.id, { planContent: args.planContent });
    return null;
  },
});

export const updateLastMessage = mutation({
  args: {
    id: v.id("sessions"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getCurrentUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { messages });
    return null;
  },
});
