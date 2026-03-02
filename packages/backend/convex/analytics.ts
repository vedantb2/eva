import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authQuery, hasRepoAccess } from "./functions";

export const getTaskStats = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      todo: v.number(),
      in_progress: v.number(),
      business_review: v.number(),
      code_review: v.number(),
      done: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return {
        total: 0,
        byStatus: {
          todo: 0,
          in_progress: 0,
          business_review: 0,
          code_review: 0,
          done: 0,
        },
      };
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
    const startTime = args.startTime;
    const filtered =
      startTime !== undefined
        ? tasks.filter((t) => t.createdAt >= startTime)
        : tasks;
    const byStatus = {
      todo: 0,
      in_progress: 0,
      business_review: 0,
      code_review: 0,
      done: 0,
    };
    for (const task of filtered) {
      byStatus[task.status]++;
    }
    return { total: filtered.length, byStatus };
  },
});

export const getRunStats = authQuery({
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
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
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
        .withIndex("by_task", (q) => q.eq("taskId", taskId as Id<"agentTasks">))
        .collect();
      allRuns.push(...runs);
    }
    const startTime = args.startTime;
    const filtered =
      startTime !== undefined
        ? allRuns.filter((r) => r.startedAt && r.startedAt >= startTime)
        : allRuns;
    const byStatus = { queued: 0, running: 0, success: 0, error: 0 };
    let prsCreated = 0;
    for (const run of filtered) {
      byStatus[run.status]++;
      if (run.prUrl) prsCreated++;
    }
    const completed = byStatus.success + byStatus.error;
    const successRate =
      completed > 0 ? Math.round((byStatus.success / completed) * 100) : 0;
    return { total: filtered.length, byStatus, successRate, prsCreated };
  },
});

export const getSessionStats = authQuery({
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
      flag: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return {
        total: 0,
        active: 0,
        messagesByMode: { execute: 0, ask: 0, plan: 0, flag: 0 },
      };
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const startTime = args.startTime;
    const filtered =
      startTime !== undefined
        ? sessions.filter((s) => s._creationTime >= startTime)
        : sessions;
    const active = filtered.filter(
      (s) => s.status === "active" && !s.archived,
    ).length;
    const messagesByMode = { execute: 0, ask: 0, plan: 0, flag: 0 };
    for (const session of filtered) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", session._id))
        .collect();
      for (const msg of msgs) {
        const mode = msg.mode;
        if (mode && mode in messagesByMode) {
          messagesByMode[mode]++;
        }
      }
    }
    return { total: filtered.length, active, messagesByMode };
  },
});

export const getProjectStats = authQuery({
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
      }),
    ),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
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
    const startTime = args.startTime;
    const filtered =
      startTime !== undefined
        ? projects.filter((p) => p._creationTime >= startTime)
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

export const getImpactStats = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    prsShipped: v.number(),
    totalSessions: v.number(),
    sessionsWithPr: v.number(),
    shipRate: v.number(),
    tasksCompleted: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return {
        prsShipped: 0,
        totalSessions: 0,
        sessionsWithPr: 0,
        shipRate: 0,
        tasksCompleted: 0,
      };
    }
    const startTime = args.startTime;
    const prUrls = new Set<string>();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const filteredSessions =
      startTime !== undefined
        ? sessions.filter((s) => s._creationTime >= startTime)
        : sessions;
    let sessionsWithPr = 0;
    for (const s of filteredSessions) {
      if (s.prUrl) {
        sessionsWithPr++;
        prUrls.add(s.prUrl);
      }
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    let tasksCompleted = 0;
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      const filtered =
        startTime !== undefined
          ? tasks.filter((t) => t.updatedAt >= startTime)
          : tasks;
      tasksCompleted += filtered.filter((t) => t.status === "done").length;
      for (const task of filtered) {
        const runs = await ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();
        for (const run of runs) {
          if (run.prUrl) prUrls.add(run.prUrl);
        }
      }
    }
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const filteredProjects =
      startTime !== undefined
        ? projects.filter((p) => p._creationTime >= startTime)
        : projects;
    for (const p of filteredProjects) {
      if (p.prUrl) prUrls.add(p.prUrl);
    }
    const totalSessions = filteredSessions.length;
    const shipRate =
      totalSessions > 0
        ? Math.round((sessionsWithPr / totalSessions) * 100)
        : 0;
    return {
      prsShipped: prUrls.size,
      totalSessions,
      sessionsWithPr,
      shipRate,
      tasksCompleted,
    };
  },
});

export const getActiveUsers = authQuery({
  args: {
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return { count: 0 };
    }
    const fiveMinAgo = Date.now() - 300_000;
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "active"),
      )
      .collect();

    const repoUserIds = new Set<Id<"users">>(
      activeSessions.map((session) => session.userId),
    );
    const activeUserIds = new Set<Id<"users">>();
    for (const userId of repoUserIds) {
      const user = await ctx.db.get(userId);
      if (user?.lastSeenAt !== undefined && user.lastSeenAt >= fiveMinAgo) {
        activeUserIds.add(userId);
      }
    }
    return { count: activeUserIds.size };
  },
});

export const getActivityTimeline = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.number(),
    bucketSizeMs: v.number(),
  },
  returns: v.array(
    v.object({
      date: v.number(),
      tasks: v.number(),
      tasksCompleted: v.number(),
      runs: v.number(),
      sessions: v.number(),
      sessionsWithPr: v.number(),
      activeUsers: v.number(),
      prsShipped: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const now = Date.now();
    const buckets: Record<
      number,
      {
        tasks: number;
        tasksCompleted: number;
        runs: number;
        sessions: number;
        sessionsWithPr: number;
        prsShipped: number;
      }
    > = {};
    const activeUsersByBucket: Record<number, Set<Id<"users">>> = {};
    for (let t = args.startTime; t <= now; t += args.bucketSizeMs) {
      buckets[t] = {
        tasks: 0,
        tasksCompleted: 0,
        runs: 0,
        sessions: 0,
        sessionsWithPr: 0,
        prsShipped: 0,
      };
      activeUsersByBucket[t] = new Set<Id<"users">>();
    }
    const getBucket = (timestamp: number) => {
      const bucketStart =
        Math.floor((timestamp - args.startTime) / args.bucketSizeMs) *
          args.bucketSizeMs +
        args.startTime;
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
        if (task.status === "done" && task.updatedAt >= args.startTime) {
          const bucket = getBucket(task.updatedAt);
          if (buckets[bucket]) buckets[bucket].tasksCompleted++;
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
            if (buckets[bucket]) {
              buckets[bucket].runs++;
              if (run.prUrl) buckets[bucket].prsShipped++;
            }
          }
        }
      }
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const usersInActiveSessions = new Set<Id<"users">>();
    for (const session of sessions) {
      if (session._creationTime >= args.startTime) {
        const bucket = getBucket(session._creationTime);
        if (buckets[bucket]) {
          buckets[bucket].sessions++;
          if (session.prUrl) {
            buckets[bucket].prsShipped++;
            buckets[bucket].sessionsWithPr++;
          }
        }
      }
      if (session.status === "active") {
        usersInActiveSessions.add(session.userId);
      }
    }
    for (const userId of usersInActiveSessions) {
      const user = await ctx.db.get(userId);
      if (user?.lastSeenAt !== undefined && user.lastSeenAt >= args.startTime) {
        const bucket = getBucket(user.lastSeenAt);
        const users = activeUsersByBucket[bucket];
        if (users) {
          users.add(userId);
        }
      }
    }
    return Object.entries(buckets)
      .map(([date, data]) => ({
        date: Number(date),
        ...data,
        activeUsers: activeUsersByBucket[Number(date)]?.size ?? 0,
      }))
      .sort((a, b) => a.date - b.date);
  },
});

export const getLeaderboard = authQuery({
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
      sessionsWithPr: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const userStats: Record<
      string,
      { tasksCompleted: number; prsCreated: number; sessionsWithPr: number }
    > = {};
    for (const board of boards) {
      if (!userStats[board.ownerId]) {
        userStats[board.ownerId] = {
          tasksCompleted: 0,
          prsCreated: 0,
          sessionsWithPr: 0,
        };
      }
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      const startTime = args.startTime;
      const filtered =
        startTime !== undefined
          ? tasks.filter((t) => t.updatedAt >= startTime)
          : tasks;
      userStats[board.ownerId].tasksCompleted += filtered.filter(
        (t) => t.status === "done",
      ).length;
      for (const task of filtered) {
        const runs = await ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();
        const startTime = args.startTime;
        const filteredRuns =
          startTime !== undefined
            ? runs.filter((r) => r.finishedAt && r.finishedAt >= startTime)
            : runs;
        userStats[board.ownerId].prsCreated += filteredRuns.filter(
          (r) => r.prUrl,
        ).length;
      }
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const startTime = args.startTime;
    const filteredSessions =
      startTime !== undefined
        ? sessions.filter((s) => s._creationTime >= startTime)
        : sessions;
    const userIdToClerkId: Record<string, string> = {};
    for (const session of filteredSessions) {
      if (!userIdToClerkId[session.userId]) {
        const user = await ctx.db.get(session.userId);
        if (user?.clerkId) userIdToClerkId[session.userId] = user.clerkId;
      }
      const clerkId = userIdToClerkId[session.userId];
      if (clerkId && session.prUrl) {
        if (!userStats[clerkId]) {
          userStats[clerkId] = {
            tasksCompleted: 0,
            prsCreated: 0,
            sessionsWithPr: 0,
          };
        }
        userStats[clerkId].sessionsWithPr++;
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
      .sort(
        (a, b) =>
          b.prsCreated - a.prsCreated || b.tasksCompleted - a.tasksCompleted,
      )
      .slice(0, 5);
  },
});
