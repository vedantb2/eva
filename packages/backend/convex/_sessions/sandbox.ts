import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../functions";

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
    const branchName =
      session.branchName ||
      repo.defaultBaseBranch ||
      `eva/session-${args.sessionId}`;
    await ctx.db.patch(args.sessionId, {
      status: "starting",
      updatedAt: Date.now(),
    });
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
