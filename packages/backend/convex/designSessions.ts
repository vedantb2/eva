import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { roleValidator, sessionStatusValidator } from "./validators";
import { authQuery, authMutation } from "./functions";

const variationValidator = v.object({
  label: v.string(),
  route: v.optional(v.string()),
  filePath: v.optional(v.string()),
});

const messageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  personaId: v.optional(v.id("designPersonas")),
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
  branchName: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  selectedVariationIndex: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  messages: v.array(messageValidator),
});

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(designSessionValidator),
  handler: async (ctx, args) => {
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

export const get = authQuery({
  args: { id: v.id("designSessions") },
  returns: v.union(designSessionValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("designSessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("designSessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      status: "active",
      messages: [],
      updatedAt: Date.now(),
    });
  },
});

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
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        {
          role: args.role,
          content: args.content,
          timestamp: Date.now(),
          activityLog: args.activityLog,
          userId: ctx.userId,
          personaId: args.personaId,
          variations: args.variations,
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

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

export const startSandbox = authMutation({
  args: {
    id: v.id("designSessions"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");
    const branchName = session.branchName || `design/${args.id}`;
    await ctx.scheduler.runAfter(0, internal.daytona.startDesignSandbox, {
      designSessionId: args.id,
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
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }
    await ctx.db.patch(args.id, {
      sandboxId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const sandboxReady = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    sandboxId: v.string(),
    branchName: v.string(),
    isNew: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.patch(args.designSessionId, {
      sandboxId: args.sandboxId,
      branchName: args.branchName,
      status: "active",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const sandboxError = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;
    await ctx.db.patch(args.designSessionId, {
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

export const executeMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    personaId: v.optional(v.id("designPersonas")),
    convexToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        {
          role: "user" as const,
          content: args.message,
          timestamp: now,
          userId: ctx.userId,
          personaId: args.personaId,
        },
        {
          role: "assistant" as const,
          content: "",
          timestamp: now,
          activityLog: "",
        },
      ],
      updatedAt: now,
    });

    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId: args.id,
        message: args.message,
        personaId: args.personaId,
        convexToken: args.convexToken,
      },
    );

    await ctx.db.patch(args.id, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

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

    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      last.content = "Design generation cancelled.";
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.id)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    await ctx.db.patch(args.id, {
      messages,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const clearMessages = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (session.userId !== ctx.userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, {
      messages: [],
      selectedVariationIndex: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const archive = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (session.userId !== ctx.userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { archived: true });
    return null;
  },
});
