import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getCurrentUserId } from "./auth";
import { type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
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
  activeWorkflowId: v.optional(v.string()),
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
    personaId: v.optional(v.id("designPersonas")),
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
          personaId: args.personaId,
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

export const updateSandbox = internalMutation({
  args: {
    id: v.id("designSessions"),
    sandboxId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

export const executeMessage = mutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    personaId: v.optional(v.id("designPersonas")),
    githubToken: v.string(),
    convexToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    // Add user message + empty assistant message (signals "generating" to UI)
    const now = Date.now();
    await ctx.db.patch(args.id, {
      messages: [
        ...session.messages,
        {
          role: "user" as const,
          content: args.message,
          timestamp: now,
          userId,
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

    // Start workflow
    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId: args.id,
        message: args.message,
        personaId: args.personaId,
        convexToken: args.convexToken,
        githubToken: args.githubToken,
      },
    );

    // Store workflowId on the session
    await ctx.db.patch(args.id, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const cancelExecution = mutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    if (session.activeWorkflowId) {
      try {
        await workflow.cancel(ctx, session.activeWorkflowId as WorkflowId);
      } catch {
        // Workflow may have already completed
      }
    }

    // Update the last message to show cancellation
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      last.content = "Design generation cancelled.";
    }

    // Clear streaming
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
