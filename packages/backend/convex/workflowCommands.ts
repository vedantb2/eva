import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { workflowCommandStateValidator } from "./validators";

const workflowCommandValidator = v.object({
  _id: v.id("workflowCommands"),
  _creationTime: v.number(),
  runId: v.id("agentRuns"),
  taskId: v.id("agentTasks"),
  projectId: v.optional(v.id("projects")),
  repoId: v.id("githubRepos"),
  workflowId: v.string(),
  workflowEventKey: v.string(),
  sandboxId: v.string(),
  sessionId: v.string(),
  commandId: v.optional(v.string()),
  state: workflowCommandStateValidator,
  lastOutputLength: v.number(),
  activityLog: v.string(),
  resultText: v.optional(v.string()),
  isError: v.optional(v.boolean()),
  exitCode: v.optional(v.number()),
  error: v.optional(v.string()),
  callbackTokenId: v.string(),
  callbackExpiresAt: v.number(),
  completionSource: v.optional(
    v.union(v.literal("callback"), v.literal("poll")),
  ),
  startedAt: v.number(),
  updatedAt: v.number(),
  finishedAt: v.optional(v.number()),
});

export const getInternal = internalQuery({
  args: { id: v.id("workflowCommands") },
  returns: v.union(workflowCommandValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByRunInternal = internalQuery({
  args: { runId: v.id("agentRuns") },
  returns: v.union(workflowCommandValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowCommands")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .first();
  },
});

export const getByCommandInternal = internalQuery({
  args: {
    sandboxId: v.string(),
    sessionId: v.string(),
    commandId: v.string(),
  },
  returns: v.union(workflowCommandValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowCommands")
      .withIndex("by_command", (q) =>
        q
          .eq("sandboxId", args.sandboxId)
          .eq("sessionId", args.sessionId)
          .eq("commandId", args.commandId),
      )
      .first();
  },
});

export const getByCallbackTokenIdInternal = internalQuery({
  args: { callbackTokenId: v.string() },
  returns: v.union(workflowCommandValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowCommands")
      .withIndex("by_callback_token_id", (q) =>
        q.eq("callbackTokenId", args.callbackTokenId),
      )
      .first();
  },
});

export const createInternal = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    projectId: v.optional(v.id("projects")),
    repoId: v.id("githubRepos"),
    workflowId: v.string(),
    workflowEventKey: v.string(),
    sandboxId: v.string(),
    sessionId: v.string(),
    callbackTokenId: v.string(),
    callbackExpiresAt: v.number(),
  },
  returns: v.id("workflowCommands"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflowCommands", {
      ...args,
      state: "running",
      lastOutputLength: 0,
      activityLog: "[]",
      startedAt: now,
      updatedAt: now,
    });
  },
});

export const setCommandIdInternal = internalMutation({
  args: {
    id: v.id("workflowCommands"),
    commandId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      commandId: args.commandId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateStreamingInternal = internalMutation({
  args: {
    id: v.id("workflowCommands"),
    lastOutputLength: v.number(),
    activityLog: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastOutputLength: args.lastOutputLength,
      activityLog: args.activityLog,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const completeInternal = internalMutation({
  args: {
    id: v.id("workflowCommands"),
    state: workflowCommandStateValidator,
    resultText: v.optional(v.string()),
    isError: v.optional(v.boolean()),
    exitCode: v.optional(v.number()),
    error: v.optional(v.string()),
    completionSource: v.optional(
      v.union(v.literal("callback"), v.literal("poll")),
    ),
    activityLog: v.optional(v.string()),
    lastOutputLength: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      state: args.state,
      resultText: args.resultText,
      isError: args.isError,
      exitCode: args.exitCode,
      error: args.error,
      completionSource: args.completionSource,
      activityLog: args.activityLog,
      lastOutputLength: args.lastOutputLength,
      updatedAt: now,
      finishedAt: now,
    });
    return null;
  },
});
