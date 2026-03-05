import { internal } from "../_generated/api";
import { v } from "convex/values";
import { roleValidator, phaseValidator } from "../validators";
import {
  authMutation,
  hasRepoAccess,
  getProjectWithAccess,
  deleteTaskRelatedData,
} from "../functions";

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    rawInput: v.string(),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    return await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.rawInput,
      baseBranch: args.baseBranch,
      phase: "draft",
      projectStartDate: Date.now(),
      conversationHistory: [
        {
          role: "user",
          content: args.rawInput,
          userId: ctx.userId,
        },
      ],
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    branchName: v.optional(v.string()),
    generatedSpec: v.optional(v.string()),
    phase: v.optional(phaseValidator),
    projectLead: v.optional(v.id("users")),
    members: v.optional(v.array(v.id("users"))),
    projectStartDate: v.optional(v.number()),
    projectEndDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const addMessage = authMutation({
  args: {
    id: v.id("projects"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      conversationHistory: [
        ...project.conversationHistory,
        {
          role: args.role,
          content: args.content,
          activityLog: args.activityLog,
          userId: ctx.userId,
        },
      ],
    });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const deleteCascade = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      await deleteTaskRelatedData(ctx, task._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const clearMessages = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      conversationHistory: [],
    });
    return null;
  },
});

export const updatePrUrl = authMutation({
  args: {
    id: v.id("projects"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { prUrl: args.prUrl });
    return null;
  },
});

export const updateProjectSandbox = authMutation({
  args: {
    id: v.id("projects"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      sandboxId: args.sandboxId,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

export const clearProjectSandbox = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    if (project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: project.sandboxId,
        repoId: project.repoId,
      });
    }
    await ctx.db.patch(args.id, {
      sandboxId: undefined,
      lastSandboxActivity: undefined,
    });
    return null;
  },
});

export const updateLastSandboxActivity = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { lastSandboxActivity: Date.now() });
    return null;
  },
});

export const updateLastConversationMessage = authMutation({
  args: {
    id: v.id("projects"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const messages = [...project.conversationHistory];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { conversationHistory: messages });
    return null;
  },
});
