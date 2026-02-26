import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
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
  updatedAt: v.optional(v.number()),
  status: sessionStatusValidator,
  archived: v.optional(v.boolean()),
  summary: v.optional(v.array(v.string())),
  createdBy: v.optional(v.id("users")),
  messages: v.array(messageValidator),
  fileDiffs: v.optional(v.array(fileDiffValidator)),
  planContent: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
});

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return sessions
      .filter((session) => !session.archived)
      .sort(
        (a, b) =>
          (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
      );
  },
});

export const get = authQuery({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "active",
      messages: [],
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });
  },
});

export const addMessage = authMutation({
  args: {
    id: v.id("sessions"),
    role: roleValidator,
    content: v.string(),
    mode: v.optional(sessionModeValidator),
    activityLog: v.optional(v.string()),
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
        {
          role: args.role,
          content: args.content,
          timestamp: Date.now(),
          mode: args.mode,
          activityLog: args.activityLog,
          userId: ctx.userId,
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateStatus = authMutation({
  args: {
    id: v.id("sessions"),
    status: sessionStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const update = authMutation({
  args: {
    id: v.id("sessions"),
    title: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

export const updateSummary = authMutation({
  args: {
    id: v.id("sessions"),
    summary: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { summary: args.summary });
    return null;
  },
});

export const archive = authMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.userId !== ctx.userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { archived: true });
    return null;
  },
});

export const updateSandbox = authMutation({
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
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.prUrl !== undefined) updates.prUrl = args.prUrl;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const clearSandbox = authMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, { sandboxId: undefined, status: "closed" });
    return null;
  },
});

export const updatePtySession = authMutation({
  args: {
    id: v.id("sessions"),
    ptySessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      ptySessionId: args.ptySessionId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateFileDiffs = authMutation({
  args: {
    id: v.id("sessions"),
    fileDiffs: v.array(fileDiffValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
      updatedAt: Date.now(),
    });

    return {
      id: sessionId,
      repoId: args.repoId,
      messages: [],
    };
  },
});

export const updatePlanContent = authMutation({
  args: {
    id: v.id("sessions"),
    planContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    await ctx.db.patch(args.id, { planContent: args.planContent });
    return null;
  },
});

export const updateLastMessage = authMutation({
  args: {
    id: v.id("sessions"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { messages, updatedAt: Date.now() });
    return null;
  },
});

export const startSandbox = authMutation({
  args: {
    sessionId: v.id("sessions"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const branchName = session.branchName || "main";
    await ctx.scheduler.runAfter(0, internal.daytona.startSessionSandbox, {
      sessionId: args.sessionId,
      existingSandboxId: session.sandboxId,
      installationId: args.installationId,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      repoId: session.repoId,
    });
    return null;
  },
});

export const stopSandbox = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }
    await ctx.db.patch(args.sessionId, {
      sandboxId: undefined,
      status: "closed",
      messages: [
        ...session.messages,
        {
          role: "assistant" as const,
          content: "Sandbox stopped. Start the sandbox to continue working.",
          timestamp: Date.now(),
          userId: ctx.userId,
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const sandboxReady = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    branchName: v.string(),
    isNew: v.boolean(),
    usedSnapshot: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const content = args.isNew
      ? args.usedSnapshot === true
        ? `Sandbox started from snapshot! Ready on branch \`${args.branchName}\`. Dev server is starting automatically.`
        : args.usedSnapshot === false
          ? `Sandbox started from base image. Ready on branch \`${args.branchName}\`. Dev server is starting automatically.`
          : `Sandbox started! Ready on branch \`${args.branchName}\`. Dev server is starting automatically.`
      : `Sandbox reconnected! Continuing work on branch \`${args.branchName}\`.`;
    const patch: {
      messages: typeof session.messages;
      updatedAt: number;
      sandboxId: string;
      branchName: string;
      status: "active";
    } = {
      messages: [
        ...session.messages,
        {
          role: "assistant" as const,
          content,
          timestamp: Date.now(),
        },
      ],
      updatedAt: Date.now(),
      sandboxId: args.sandboxId,
      branchName: args.branchName,
      status: "active",
    };
    await ctx.db.patch(args.sessionId, patch);
    return null;
  },
});

export const sandboxError = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    await ctx.db.patch(args.sessionId, {
      messages: [
        ...session.messages,
        {
          role: "assistant" as const,
          content: `Failed to start sandbox: ${args.error}`,
          timestamp: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("sessions") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const setPrUrl = internalMutation({
  args: {
    id: v.id("sessions"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { prUrl: args.prUrl, updatedAt: Date.now() });
    return null;
  },
});
