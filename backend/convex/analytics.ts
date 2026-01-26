import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

export const getTaskStats = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      todo: v.number(),
      in_progress: v.number(),
      code_review: v.number(),
      done: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return { total: 0, byStatus: { todo: 0, in_progress: 0, code_review: 0, done: 0 } };
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const tasks = [];
    for (const board of boards) {
      const boardTasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      tasks.push(...boardTasks);
    }
    const filtered = args.startTime
      ? tasks.filter((t) => t.createdAt >= args.startTime!)
      : tasks;
    const byStatus = { todo: 0, in_progress: 0, code_review: 0, done: 0 };
    for (const task of filtered) {
      byStatus[task.status]++;
    }
    return { total: filtered.length, byStatus };
  },
});

export const getRunStats = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      queued: v.number(),
      running: v.number(),
      success: v.number(),
      error: v.number(),
    }),
    successRate: v.number(),
    prsCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return {
        total: 0,
        byStatus: { queued: 0, running: 0, success: 0, error: 0 },
        successRate: 0,
        prsCreated: 0,
      };
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const taskIds = new Set<string>();
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      for (const task of tasks) {
        taskIds.add(task._id);
      }
    }
    const allRuns = [];
    for (const taskId of taskIds) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", taskId as never))
        .collect();
      allRuns.push(...runs);
    }
    const filtered = args.startTime
      ? allRuns.filter((r) => r.startedAt && r.startedAt >= args.startTime!)
      : allRuns;
    const byStatus = { queued: 0, running: 0, success: 0, error: 0 };
    let prsCreated = 0;
    for (const run of filtered) {
      byStatus[run.status]++;
      if (run.prUrl) prsCreated++;
    }
    const completed = byStatus.success + byStatus.error;
    const successRate = completed > 0 ? Math.round((byStatus.success / completed) * 100) : 0;
    return { total: filtered.length, byStatus, successRate, prsCreated };
  },
});

export const getSessionStats = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    active: v.number(),
    messagesByMode: v.object({
      execute: v.number(),
      ask: v.number(),
      plan: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return { total: 0, active: 0, messagesByMode: { execute: 0, ask: 0, plan: 0 } };
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const filtered = args.startTime
      ? sessions.filter((s) => s._creationTime >= args.startTime!)
      : sessions;
    const active = filtered.filter((s) => s.status === "active" && !s.archived).length;
    const messagesByMode = { execute: 0, ask: 0, plan: 0, flag: 0 };
    for (const session of filtered) {
      for (const msg of session.messages) {
        if (msg.mode && msg.mode in messagesByMode) {
          messagesByMode[msg.mode]++;
        }
      }
    }
    return { total: filtered.length, active, messagesByMode };
  },
});

export const getProjectStats = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    byPhase: v.object({
      draft: v.number(),
      finalized: v.number(),
      active: v.number(),
      completed: v.number(),
    }),
    topProjects: v.array(
      v.object({
        id: v.id("projects"),
        title: v.string(),
        tasksTotal: v.number(),
        tasksDone: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return {
        total: 0,
        byPhase: { draft: 0, finalized: 0, active: 0, completed: 0 },
        topProjects: [],
      };
    }
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const filtered = args.startTime
      ? projects.filter((p) => p._creationTime >= args.startTime!)
      : projects;
    const byPhase = { draft: 0, finalized: 0, active: 0, completed: 0 };
    for (const project of filtered) {
      byPhase[project.phase]++;
    }
    const topProjects = [];
    for (const project of filtered.slice(0, 5)) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      topProjects.push({
        id: project._id,
        title: project.title,
        tasksTotal: tasks.length,
        tasksDone: tasks.filter((t) => t.status === "done").length,
      });
    }
    return { total: filtered.length, byPhase, topProjects };
  },
});

export const getActivityTimeline = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.number(),
    bucketSizeMs: v.number(),
  },
  returns: v.array(
    v.object({
      date: v.number(),
      tasks: v.number(),
      runs: v.number(),
      sessions: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    const now = Date.now();
    const buckets: Record<number, { tasks: number; runs: number; sessions: number }> = {};
    for (let t = args.startTime; t <= now; t += args.bucketSizeMs) {
      buckets[t] = { tasks: 0, runs: 0, sessions: 0 };
    }
    const getBucket = (timestamp: number) => {
      const bucketStart = Math.floor((timestamp - args.startTime) / args.bucketSizeMs) * args.bucketSizeMs + args.startTime;
      return bucketStart;
    };
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      for (const task of tasks) {
        if (task.createdAt >= args.startTime) {
          const bucket = getBucket(task.createdAt);
          if (buckets[bucket]) buckets[bucket].tasks++;
        }
      }
      for (const task of tasks) {
        const runs = await ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();
        for (const run of runs) {
          if (run.startedAt && run.startedAt >= args.startTime) {
            const bucket = getBucket(run.startedAt);
            if (buckets[bucket]) buckets[bucket].runs++;
          }
        }
      }
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    for (const session of sessions) {
      if (session._creationTime >= args.startTime) {
        const bucket = getBucket(session._creationTime);
        if (buckets[bucket]) buckets[bucket].sessions++;
      }
    }
    return Object.entries(buckets)
      .map(([date, data]) => ({ date: Number(date), ...data }))
      .sort((a, b) => a.date - b.date);
  },
});

export const getLeaderboard = query({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      clerkId: v.string(),
      fullName: v.optional(v.string()),
      tasksCompleted: v.number(),
      prsCreated: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const userStats: Record<string, { tasksCompleted: number; prsCreated: number }> = {};
    for (const board of boards) {
      if (!userStats[board.ownerId]) {
        userStats[board.ownerId] = { tasksCompleted: 0, prsCreated: 0 };
      }
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      const filtered = args.startTime
        ? tasks.filter((t) => t.updatedAt >= args.startTime!)
        : tasks;
      userStats[board.ownerId].tasksCompleted += filtered.filter((t) => t.status === "done").length;
      for (const task of filtered) {
        const runs = await ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();
        const filteredRuns = args.startTime
          ? runs.filter((r) => r.finishedAt && r.finishedAt >= args.startTime!)
          : runs;
        userStats[board.ownerId].prsCreated += filteredRuns.filter((r) => r.prUrl).length;
      }
    }
    const leaderboard = [];
    for (const [clerkId, stats] of Object.entries(userStats)) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
      leaderboard.push({
        clerkId,
        fullName: user?.fullName ?? undefined,
        ...stats,
      });
    }
    return leaderboard
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted || b.prsCreated - a.prsCreated)
      .slice(0, 5);
  },
});
