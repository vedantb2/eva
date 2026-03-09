import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authQuery, hasRepoAccess } from "./functions";

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
    const filteredTasks =
      startTime !== undefined
        ? await ctx.db
            .query("agentTasks")
            .withIndex("by_repo_and_updatedAt", (q) =>
              q.eq("repoId", args.repoId).gte("updatedAt", startTime),
            )
            .collect()
        : await ctx.db
            .query("agentTasks")
            .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
            .collect();
    const tasksCompleted = filteredTasks.filter(
      (t) => t.status === "done",
    ).length;
    const taskRunResults = await Promise.all(
      filteredTasks.map((task) =>
        ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect(),
      ),
    );
    for (const runs of taskRunResults) {
      for (const run of runs) {
        if (run.prUrl) prUrls.add(run.prUrl);
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

    const repoUserIds = [
      ...new Set<Id<"users">>(activeSessions.map((session) => session.userId)),
    ];
    const users = await Promise.all(repoUserIds.map((id) => ctx.db.get(id)));
    const activeCount = users.filter(
      (u) => u?.lastSeenAt !== undefined && u.lastSeenAt >= fiveMinAgo,
    ).length;
    return { count: activeCount };
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
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
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
    const allTaskRuns = await Promise.all(
      tasks.map((task) =>
        ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect(),
      ),
    );
    for (const runs of allTaskRuns) {
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
    const activeSessionUserIds = [...usersInActiveSessions];
    const activeSessionUsers = await Promise.all(
      activeSessionUserIds.map((id) => ctx.db.get(id)),
    );
    for (let i = 0; i < activeSessionUserIds.length; i++) {
      const user = activeSessionUsers[i];
      if (user?.lastSeenAt !== undefined && user.lastSeenAt >= args.startTime) {
        const bucket = getBucket(user.lastSeenAt);
        const bucketUsers = activeUsersByBucket[bucket];
        if (bucketUsers) {
          bucketUsers.add(activeSessionUserIds[i]);
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
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const userStats = new Map<
      Id<"users">,
      { tasksCompleted: number; prsCreated: number; sessionsWithPr: number }
    >();
    const startTime = args.startTime;
    const filteredTasks =
      startTime !== undefined
        ? tasks.filter((t) => t.updatedAt >= startTime)
        : tasks;
    const tasksWithCreator = filteredTasks.filter((t) => t.createdBy);
    const leaderboardRuns = await Promise.all(
      tasksWithCreator.map((task) =>
        ctx.db
          .query("agentRuns")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect(),
      ),
    );
    for (let i = 0; i < tasksWithCreator.length; i++) {
      const task = tasksWithCreator[i];
      if (!task.createdBy) continue;
      const cur = userStats.get(task.createdBy) ?? {
        tasksCompleted: 0,
        prsCreated: 0,
        sessionsWithPr: 0,
      };
      if (task.status === "done") cur.tasksCompleted++;
      const runs = leaderboardRuns[i];
      const filteredRuns =
        startTime !== undefined
          ? runs.filter((r) => r.finishedAt && r.finishedAt >= startTime)
          : runs;
      cur.prsCreated += filteredRuns.filter((r) => r.prUrl).length;
      userStats.set(task.createdBy, cur);
    }
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const filteredSessions =
      startTime !== undefined
        ? sessions.filter((s) => s._creationTime >= startTime)
        : sessions;
    for (const session of filteredSessions) {
      if (session.prUrl) {
        const cur = userStats.get(session.userId) ?? {
          tasksCompleted: 0,
          prsCreated: 0,
          sessionsWithPr: 0,
        };
        cur.sessionsWithPr++;
        userStats.set(session.userId, cur);
      }
    }
    const userStatEntries = [...userStats.entries()];
    const leaderboardUsers = await Promise.all(
      userStatEntries.map(([userId]) => ctx.db.get(userId)),
    );
    const leaderboard = userStatEntries
      .map(([, stats], i) => {
        const user = leaderboardUsers[i];
        const clerkId = user?.clerkId ?? "";
        if (!clerkId) return null;
        return {
          clerkId,
          fullName: user?.fullName ?? undefined,
          ...stats,
        };
      })
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);
    return leaderboard
      .sort(
        (a, b) =>
          b.prsCreated - a.prsCreated || b.tasksCompleted - a.tasksCompleted,
      )
      .slice(0, 5);
  },
});
