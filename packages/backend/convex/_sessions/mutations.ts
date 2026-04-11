import { v } from "convex/values";
import { internal } from "../_generated/api";
import { authMutation, hasRepoAccess } from "../functions";
import {
  roleValidator,
  sessionModeValidator,
  sessionStatusValidator,
} from "../validators";
import { workflow } from "../workflowManager";

/** Creates a new session with a sandbox startup workflow. */
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
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "starting",
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });
    const branchName = `eva/session-${sessionId}`;
    await ctx.db.patch(sessionId, { branchName });
    const baseBranch = repo.defaultBaseBranch ?? "main";
    await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionSandboxStartupWorkflow,
      {
        sessionId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: args.repoId,
      },
    );
    return sessionId;
  },
});

/** Adds a message to a session conversation. */
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

/** Updates the status of a session. */
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

/** Updates editable fields (title, branch, PR URL) on a session. */
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

/** Updates the summary bullet points on a session. */
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

/** Archives a session so it no longer appears in the active list. */
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

/** Stores or updates the plan content for a session. */
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

/** Updates the content or activity log of the most recent message in a session. */
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
