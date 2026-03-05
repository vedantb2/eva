import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { roleValidator, sessionStatusValidator } from "./validators";

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
  planContent: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
});

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
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

export const listArchived = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return sessions
      .filter((session) => session.archived === true)
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
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return session;
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "active",
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(sessionId, {
      branchName: `session/${sessionId}`,
    });
    return sessionId;
  },
});

export const addMessage = authMutation({
  args: {
    id: v.id("sessions"),
    role: roleValidator,
    content: v.string(),
    mode: v.optional(
      v.union(
        v.literal("execute"),
        v.literal("ask"),
        v.literal("plan"),
        v.literal("flag"),
      ),
    ),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      mode: args.mode,
      activityLog: args.activityLog,
      userId: ctx.userId,
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
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
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
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

export const updatePtySessionInternal = internalMutation({
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

export const getOrCreateExtensionSession = authMutation({
  args: {
    repoId: v.id("githubRepos"),
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
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "active"),
      )
      .collect();
    const existingSession = activeSessions.find(
      (s) =>
        s.userId === ctx.userId &&
        s.title === "Extension Session" &&
        s.archived !== true,
    );

    if (existingSession) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", existingSession._id))
        .collect();
      return {
        id: existingSession._id,
        repoId: existingSession.repoId,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
    }

    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: "Extension Session",
      status: "active",
      updatedAt: Date.now(),
    });
    await ctx.db.patch(sessionId, {
      branchName: `session/${sessionId}`,
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
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (!last) return null;
    const patch: { content?: string; activityLog?: string } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    await ctx.db.patch(last._id, patch);
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
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
    const branchName = session.branchName || repo.defaultBaseBranch || `session/${args.sessionId}`;
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
      await ctx.scheduler.runAfter(0, internal.daytona.stopSandbox, {
        sessionId: args.sessionId,
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "Sandbox stopped",
      timestamp: Date.now(),
      userId: ctx.userId,
      isSystemAlert: true,
    });
    await ctx.db.patch(args.sessionId, {
      sandboxId: session.sandboxId,
      ptySessionId: undefined,
      status: "closed",
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
    devPort: v.optional(v.number()),
    devCommand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const content = args.isNew ? "Sandbox started" : "Sandbox reconnected";
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content,
      timestamp: Date.now(),
      isSystemAlert: true,
    });
    await ctx.db.patch(args.sessionId, {
      updatedAt: Date.now(),
      sandboxId: args.sandboxId,
      branchName: args.branchName,
      status: "active",
      devPort: args.devPort,
      devCommand: args.devCommand,
    });
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
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "Failed to start sandbox",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    await ctx.db.patch(args.sessionId, {
      status: "closed",
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
