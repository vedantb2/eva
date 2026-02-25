import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { runStatusValidator, logLevelValidator } from "./validators";
import { createNotification } from "./notifications";
import { authQuery, authMutation } from "./functions";

const logEntryValidator = v.object({
  timestamp: v.number(),
  level: logLevelValidator,
  message: v.string(),
});

const agentRunValidator = v.object({
  _id: v.id("agentRuns"),
  _creationTime: v.number(),
  taskId: v.id("agentTasks"),
  status: runStatusValidator,
  logs: v.array(logEntryValidator),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
  resultSummary: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  activityLog: v.optional(v.string()),
});

export const get = authQuery({
  args: { id: v.id("agentRuns") },
  returns: v.union(agentRunValidator, v.null()),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      return null;
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      return null;
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      return null;
    }
    return run;
  },
});

export const getWithDetails = authQuery({
  args: { id: v.id("agentRuns") },
  returns: v.union(
    v.object({
      ...agentRunValidator.fields,
      taskTitle: v.string(),
      taskDescription: v.optional(v.string()),
      boardName: v.string(),
      boardId: v.id("boards"),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      return null;
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      return null;
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      return null;
    }
    return {
      ...run,
      taskTitle: task.title,
      taskDescription: task.description,
      boardName: board.name,
      boardId: board._id,
    };
  },
});

export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(agentRunValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return [];
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      return [];
    }
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  },
});

export const listAll = authQuery({
  args: {},
  returns: v.array(
    v.object({
      ...agentRunValidator.fields,
      taskTitle: v.string(),
      boardName: v.string(),
      boardId: v.id("boards"),
    }),
  ),
  handler: async (ctx) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.userId))
      .collect();
    const boardMap = new Map(boards.map((b) => [b._id, b]));
    const tasks = await ctx.db.query("agentTasks").collect();
    const userTasks = tasks.filter((t) => boardMap.has(t.boardId));
    const taskMap = new Map(userTasks.map((t) => [t._id, t]));
    const runs = await ctx.db.query("agentRuns").collect();
    const userRuns = runs.filter((r) => taskMap.has(r.taskId));
    return userRuns
      .map((run) => {
        const task = taskMap.get(run.taskId);
        const board = task ? boardMap.get(task.boardId) : undefined;
        if (!task || !board) return null;
        return {
          ...run,
          taskTitle: task.title,
          boardName: board.name,
          boardId: board._id,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  },
});

export const updateStatus = authMutation({
  args: {
    id: v.id("agentRuns"),
    status: runStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      throw new Error("Run not found");
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Run not found");
    }
    if (run.status === "success" || run.status === "error") {
      throw new Error("Cannot update completed run");
    }
    await ctx.db.patch(args.id, { status: args.status });
    if (args.status === "running") {
      await ctx.db.patch(task._id, {
        status: "in_progress",
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const appendLog = authMutation({
  args: {
    id: v.id("agentRuns"),
    level: logLevelValidator,
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      throw new Error("Run not found");
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Run not found");
    }
    if (run.status === "success" || run.status === "error") {
      throw new Error("Cannot append to completed run");
    }
    const newLog = {
      timestamp: Date.now(),
      level: args.level,
      message: args.message,
    };
    await ctx.db.patch(args.id, {
      logs: [...run.logs, newLog],
    });
    return null;
  },
});

export const complete = authMutation({
  args: {
    id: v.id("agentRuns"),
    success: v.boolean(),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      throw new Error("Run not found");
    }
    const task = await ctx.db.get(run.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Run not found");
    }
    if (run.status === "success" || run.status === "error") {
      throw new Error("Run already completed");
    }
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.success ? "success" : "error",
      finishedAt: now,
      resultSummary: args.resultSummary,
      prUrl: args.prUrl,
      error: args.error,
      activityLog: args.activityLog,
    });
    await ctx.db.patch(task._id, {
      status: args.success ? "business_review" : "todo",
      updatedAt: now,
    });
    const statusText = args.success ? "succeeded" : "failed";
    const notifyUsers = new Set(
      [task.createdBy, task.assignedTo].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    );
    for (const userId of notifyUsers) {
      await createNotification(ctx, {
        userId,
        type: "run_completed",
        title: `Run ${statusText} for "${task.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
      });
    }
    return null;
  },
});
