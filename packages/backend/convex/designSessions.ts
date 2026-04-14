import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import {
  aiModelValidator,
  normalizeAIModel,
  roleValidator,
  sessionStatusValidator,
  variationValidator,
} from "./validators";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import { startNextQueuedDesignMessage } from "./_queues/helpers";

const designSessionValidator = v.object({
  _id: v.id("designSessions"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  status: sessionStatusValidator,
  sandboxId: v.optional(v.string()),
  branchName: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  selectedVariationIndex: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  devPort: v.optional(v.number()),
});

/** Workflow that provisions or reconnects a sandbox for a design session. */
export const designSandboxStartupWorkflow = workflow.define({
  args: {
    designSessionId: v.id("designSessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runAction(internal.daytona.startDesignSandbox, {
      designSessionId: args.designSessionId,
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });
  },
});

/** Lists active (non-archived) design sessions for a repo, sorted by most recently updated. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
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

/** Lists archived design sessions for a repo. */
export const listArchived = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const sessions = await ctx.db
      .query("designSessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return sessions
      .filter((s) => s.archived === true)
      .sort(
        (a, b) =>
          (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
      );
  },
});

/** Counts the number of active, non-archived design sessions for a repo. */
export const countActive = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return 0;
    const sessions = await ctx.db
      .query("designSessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return sessions.filter((s) => s.status === "active" && !s.archived).length;
  },
});

/** Fetches a single design session by ID, with repo access control. */
export const get = authQuery({
  args: { id: v.id("designSessions") },
  returns: v.union(designSessionValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return session;
  },
});

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
    return await ctx.db.insert("designSessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "closed",
      updatedAt: Date.now(),
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

/** Updates the sandbox ID and/or branch name for a design session (internal). */
export const updateSandbox = internalMutation({
  args: {
    id: v.id("designSessions"),
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const updates: Record<string, string | number> = {
      updatedAt: Date.now(),
    };
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Starts a sandbox for a design session by kicking off the startup workflow. */
export const startSandbox = authMutation({
  args: {
    id: v.id("designSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const branchName = session.branchName || `eva/design-${args.id}`;
    const baseBranch = repo.defaultBaseBranch ?? "main";
    await ctx.db.patch(args.id, {
      status: "starting",
      updatedAt: Date.now(),
    });
    await workflow.start(
      ctx,
      internal.designSessions.designSandboxStartupWorkflow,
      {
        designSessionId: args.id,
        existingSandboxId: session.sandboxId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: session.repoId,
      },
    );
    return null;
  },
});

/** Closes the design session UI without stopping the sandbox (lets Daytona auto-stop after 15min idle). */
export const stopSandbox = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    // Don't stop the sandbox immediately — let Daytona's autoStopInterval (15min) handle it.
    // If user returns within 15 minutes, sandbox is still running = instant resume.
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "assistant",
      content: "Sandbox stopped",
      timestamp: Date.now(),
      userId: ctx.userId,
      isSystemAlert: true,
    });
    await ctx.db.patch(args.id, {
      // Keep sandboxId so we can resume the stopped sandbox later
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks a design session's sandbox as active after successful startup. */
export const sandboxReady = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    sandboxId: v.string(),
    branchName: v.string(),
    isNew: v.boolean(),
    devPort: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.insert("messages", {
      parentId: args.designSessionId,
      role: "assistant",
      content: args.isNew ? "Sandbox started" : "Sandbox reconnected",
      timestamp: Date.now(),
      isSystemAlert: true,
    });
    await ctx.db.patch(args.designSessionId, {
      sandboxId: args.sandboxId,
      branchName: args.branchName,
      status: "active",
      updatedAt: Date.now(),
      devPort: args.devPort,
    });
    return null;
  },
});

/** Records a sandbox startup failure for a design session. */
export const sandboxError = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.insert("messages", {
      parentId: args.designSessionId,
      role: "assistant",
      content: "Failed to start sandbox",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });
    await ctx.db.patch(args.designSessionId, {
      status: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Sends a message to the AI for design generation, starting a workflow with timeout watchdog. */
export const executeMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    model: aiModelValidator,
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    const now = Date.now();
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "user",
      content: args.message,
      timestamp: now,
      userId: ctx.userId,
      personaId: args.personaId,
    });
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "assistant",
      content: "",
      timestamp: now,
      activityLog: "",
    });
    await ctx.db.patch(args.id, { updatedAt: now });

    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId: args.id,
        message: args.message,
        model: normalizeAIModel(args.model),
        personaId: args.personaId,
        userId: ctx.userId,
        numDesigns: args.numDesigns ?? 3,
      },
    );

    await ctx.db.patch(args.id, {
      activeWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleDesignSession,
      { designSessionId: args.id, workflowId: String(workflowId) },
    );

    return null;
  },
});

/** Queues a message for later execution when the session is busy. */
export const enqueueMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    model: aiModelValidator,
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    await ctx.db.insert("queuedMessages", {
      parentId: args.id,
      content,
      createdAt: Date.now(),
      userId: ctx.userId,
      model: normalizeAIModel(args.model),
      personaId: args.personaId,
      numDesigns: args.numDesigns ?? 3,
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Cancels the active design workflow and starts processing any queued messages. */
export const cancelExecution = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    if (session.activeWorkflowId) {
      try {
        await workflow.cancel(ctx, session.activeWorkflowId as WorkflowId);
      } catch {
        // Workflow may have already completed
      }
    }

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && !last.content) {
      await ctx.db.patch(last._id, {
        content: "Design generation cancelled.",
      });
    }

    await clearStreamingActivity(ctx, String(args.id));

    await ctx.db.patch(args.id, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedDesignMessage(ctx, args.id);
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
