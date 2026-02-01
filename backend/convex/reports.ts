import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { getCurrentUserId } from "./auth";
import { taskStatusValidator, reportStatusValidator } from "./validators";
import {
  categorizeText,
  extractFrequencyTerms,
  buildTemporalGroups,
  buildIssuesByDate,
  buildDailyBreakdown,
  buildWeeklyTrend,
} from "./reportHelpers";

// --- Validators ---

const issueCategoryValidator = v.object({
  category: v.string(),
  count: v.number(),
  taskIds: v.array(v.id("agentTasks")),
  sessionIds: v.array(v.id("sessions")),
});

const frequencyEntryValidator = v.object({
  term: v.string(),
  count: v.number(),
});

const temporalGroupValidator = v.object({
  startDate: v.number(),
  endDate: v.number(),
  taskCount: v.number(),
  sessionCount: v.number(),
});

const workPatternsValidator = v.object({
  avgTaskDuration: v.optional(v.number()),
  avgSessionMessages: v.number(),
  statusDistribution: v.object({
    todo: v.number(),
    in_progress: v.number(),
    business_review: v.number(),
    code_review: v.number(),
    done: v.number(),
  }),
  runSuccessRate: v.number(),
});

const issuesByDateEntryValidator = v.object({
  date: v.number(),
  granularity: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
  issues: v.array(
    v.object({
      category: v.string(),
      count: v.number(),
    })
  ),
  totalItems: v.number(),
});

const dailyBreakdownValidator = v.object({
  date: v.number(),
  taskCount: v.number(),
  sessionCount: v.number(),
  issueCount: v.number(),
});

const weeklyTrendValidator = v.object({
  weekStart: v.number(),
  taskCount: v.number(),
  sessionCount: v.number(),
  completedCount: v.number(),
  errorCount: v.number(),
});

const analysisResultsValidator = v.object({
  issueCategories: v.array(issueCategoryValidator),
  frequencyMap: v.array(frequencyEntryValidator),
  temporalGroups: v.array(temporalGroupValidator),
  workPatterns: workPatternsValidator,
  issuesByDate: v.optional(v.array(issuesByDateEntryValidator)),
  dailyBreakdown: v.optional(v.array(dailyBreakdownValidator)),
  weeklyTrend: v.optional(v.array(weeklyTrendValidator)),
});

const workItemCountsValidator = v.object({
  totalTasks: v.number(),
  activeTasks: v.number(),
  deletedTasks: v.number(),
  totalSessions: v.number(),
  activeSessions: v.number(),
  deletedSessions: v.number(),
});

const metadataValidator = v.optional(
  v.object({
    generatedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
);

const aiInsightsValidator = v.object({
  summary: v.string(),
  topIssueCategories: v.array(
    v.object({
      category: v.string(),
      description: v.string(),
      count: v.number(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      examples: v.array(v.string()),
    })
  ),
  commonErrorPatterns: v.array(
    v.object({
      pattern: v.string(),
      description: v.string(),
      frequency: v.number(),
      suggestedFix: v.optional(v.string()),
    })
  ),
  temporalTrends: v.array(
    v.object({
      trend: v.string(),
      description: v.string(),
    })
  ),
  recommendations: v.array(v.string()),
});

const dateRangeValidator = v.optional(
  v.object({
    start: v.number(),
    end: v.number(),
  })
);

const reportValidator = v.object({
  _id: v.id("reports"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  tagId: v.string(),
  tagIds: v.optional(v.array(v.string())),
  status: reportStatusValidator,
  generatedAt: v.number(),
  dateRange: dateRangeValidator,
  analysisResults: analysisResultsValidator,
  aiInsights: v.optional(aiInsightsValidator),
  error: v.optional(v.string()),
  workItemCounts: workItemCountsValidator,
  metadata: metadataValidator,
  createdAt: v.number(),
});

// Helper functions imported from reportHelpers.ts for testability

// --- Mutations ---

export const createReport = mutation({
  args: {
    repoId: v.id("githubRepos"),
    tagId: v.string(),
    tagIds: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    dateRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const repo = await ctx.db.get(args.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    // Build the set of tags to match against (multi-tag support)
    const effectiveTagIds = args.tagIds && args.tagIds.length > 0
      ? args.tagIds
      : [args.tagId];
    const tagSet = new Set(effectiveTagIds);

    // Gather all agentTasks for this repo that have any matching tag
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const allTasks: Doc<"agentTasks">[] = [];
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      allTasks.push(...tasks);
    }

    // Filter tasks by any matching tag (including soft-deleted)
    let taggedTasks = allTasks.filter(
      (t) => t.tags && t.tags.some((tag) => tagSet.has(tag))
    );

    // Apply date range filter using createdAt (original start date)
    if (args.dateRange) {
      taggedTasks = taggedTasks.filter(
        (t) => t.createdAt >= args.dateRange!.start && t.createdAt <= args.dateRange!.end
      );
    }

    const activeTasks = taggedTasks.filter((t) => !t.deletedAt);
    const deletedTasks = taggedTasks.filter((t) => !!t.deletedAt);

    // Gather all sessions for this repo that have any matching tag
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    let taggedSessions = allSessions.filter(
      (s) => s.tags && s.tags.some((tag) => tagSet.has(tag))
    );

    // Apply date range filter using _creationTime (original start date)
    if (args.dateRange) {
      taggedSessions = taggedSessions.filter(
        (s) => s._creationTime >= args.dateRange!.start && s._creationTime <= args.dateRange!.end
      );
    }

    const activeSessions = taggedSessions.filter((s) => !s.deletedAt);
    const deletedSessions = taggedSessions.filter((s) => !!s.deletedAt);

    // Collect text for analysis from tasks and sessions
    const analysisTexts: string[] = [];
    for (const task of taggedTasks) {
      if (task.title) analysisTexts.push(task.title);
      if (task.description) analysisTexts.push(task.description);
    }

    // Collect run logs and result summaries for tagged tasks
    const allRuns: Doc<"agentRuns">[] = [];
    for (const task of taggedTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      allRuns.push(...runs);
      for (const run of runs) {
        if (run.resultSummary) analysisTexts.push(run.resultSummary);
        for (const log of run.logs) {
          if (log.level === "error") analysisTexts.push(log.message);
        }
      }
    }

    // Collect session messages
    for (const session of taggedSessions) {
      for (const msg of session.messages) {
        analysisTexts.push(msg.content);
      }
    }

    // Build issue categories
    const categoryMap: Record<
      string,
      { taskIds: Set<string>; sessionIds: Set<string>; count: number }
    > = {};

    for (const task of taggedTasks) {
      const text = [task.title, task.description || ""].join(" ");
      const categories = categorizeText(text);
      for (const cat of categories) {
        if (!categoryMap[cat]) {
          categoryMap[cat] = { taskIds: new Set(), sessionIds: new Set(), count: 0 };
        }
        categoryMap[cat].taskIds.add(task._id);
        categoryMap[cat].count++;
      }
    }

    for (const session of taggedSessions) {
      const text = [
        session.title,
        ...session.messages.map((m) => m.content),
      ].join(" ");
      const categories = categorizeText(text);
      for (const cat of categories) {
        if (!categoryMap[cat]) {
          categoryMap[cat] = { taskIds: new Set(), sessionIds: new Set(), count: 0 };
        }
        categoryMap[cat].sessionIds.add(session._id);
        categoryMap[cat].count++;
      }
    }

    const issueCategories = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        count: data.count,
        taskIds: [...data.taskIds] as Id<"agentTasks">[],
        sessionIds: [...data.sessionIds] as Id<"sessions">[],
      }))
      .sort((a, b) => b.count - a.count);

    // Build frequency map
    const frequencyMap = extractFrequencyTerms(analysisTexts);

    // Build temporal groups
    const temporalGroups = buildTemporalGroups(taggedTasks, taggedSessions);

    // Build temporal breakdown data
    const issuesByDate = buildIssuesByDate(taggedTasks, taggedSessions);
    const dailyBreakdown = buildDailyBreakdown(taggedTasks, taggedSessions, allRuns);
    const weeklyTrend = buildWeeklyTrend(taggedTasks, taggedSessions, allRuns);

    // Compute work patterns
    const statusDistribution = {
      todo: 0,
      in_progress: 0,
      business_review: 0,
      code_review: 0,
      done: 0,
    };
    for (const task of taggedTasks) {
      statusDistribution[task.status]++;
    }

    // Average task duration (createdAt to updatedAt for done tasks)
    const doneTasks = taggedTasks.filter((t) => t.status === "done");
    const avgTaskDuration =
      doneTasks.length > 0
        ? doneTasks.reduce((sum, t) => sum + (t.updatedAt - t.createdAt), 0) /
          doneTasks.length
        : undefined;

    // Average session messages
    const avgSessionMessages =
      taggedSessions.length > 0
        ? taggedSessions.reduce((sum, s) => sum + s.messages.length, 0) /
          taggedSessions.length
        : 0;

    // Run success rate
    const completedRuns = allRuns.filter(
      (r) => r.status === "success" || r.status === "error"
    );
    const successfulRuns = allRuns.filter((r) => r.status === "success");
    const runSuccessRate =
      completedRuns.length > 0
        ? Math.round((successfulRuns.length / completedRuns.length) * 100)
        : 0;

    const now = Date.now();

    const reportId = await ctx.db.insert("reports", {
      repoId: args.repoId,
      tagId: args.tagId,
      tagIds: effectiveTagIds.length > 1 ? effectiveTagIds : undefined,
      status: "pending",
      generatedAt: now,
      dateRange: args.dateRange,
      analysisResults: {
        issueCategories,
        frequencyMap,
        temporalGroups,
        workPatterns: {
          avgTaskDuration,
          avgSessionMessages: Math.round(avgSessionMessages * 100) / 100,
          statusDistribution,
          runSuccessRate,
        },
        issuesByDate,
        dailyBreakdown,
        weeklyTrend,
      },
      workItemCounts: {
        totalTasks: taggedTasks.length,
        activeTasks: activeTasks.length,
        deletedTasks: deletedTasks.length,
        totalSessions: taggedSessions.length,
        activeSessions: activeSessions.length,
        deletedSessions: deletedSessions.length,
      },
      metadata: {
        generatedBy: userId,
        notes: args.notes,
      },
      createdAt: now,
    });

    return reportId;
  },
});

export const updateReportStatus = mutation({
  args: {
    id: v.id("reports"),
    status: reportStatusValidator,
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Report not found");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const completeReportAnalysis = mutation({
  args: {
    id: v.id("reports"),
    aiInsights: aiInsightsValidator,
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Report not found");
    await ctx.db.patch(args.id, {
      status: "completed",
      aiInsights: args.aiInsights,
    });
  },
});

export const failReportAnalysis = mutation({
  args: {
    id: v.id("reports"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Report not found");
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
    });
  },
});

// --- Queries ---

export const getReportById = query({
  args: { id: v.id("reports") },
  returns: v.union(reportValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const getReportsByTag = query({
  args: {
    tagId: v.string(),
    repoId: v.optional(v.id("githubRepos")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  returns: v.object({
    reports: v.array(reportValidator),
    nextCursor: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return { reports: [], nextCursor: null };
    }

    const pageSize = args.limit ?? 20;
    let reportsQuery;

    if (args.repoId) {
      reportsQuery = ctx.db
        .query("reports")
        .withIndex("by_repo_and_tag", (q) =>
          q.eq("repoId", args.repoId!).eq("tagId", args.tagId)
        );
    } else {
      reportsQuery = ctx.db
        .query("reports")
        .withIndex("by_tag_and_created", (q) => q.eq("tagId", args.tagId));
    }

    let reports = await reportsQuery.order("desc").collect();

    // Apply cursor-based pagination (cursor is createdAt timestamp)
    if (args.cursor) {
      reports = reports.filter((r) => r.createdAt < args.cursor!);
    }

    const pageReports = reports.slice(0, pageSize);
    const nextCursor =
      pageReports.length === pageSize
        ? pageReports[pageReports.length - 1].createdAt
        : null;

    return { reports: pageReports, nextCursor };
  },
});

export const getReportsByRepo = query({
  args: {
    repoId: v.id("githubRepos"),
    limit: v.optional(v.number()),
  },
  returns: v.array(reportValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();

    const limit = args.limit ?? 50;
    return reports.slice(0, limit);
  },
});

// --- Tag aggregation queries ---

export const getWorkItemsByTag = query({
  args: {
    repoId: v.id("githubRepos"),
    tagId: v.string(),
    includeDeleted: v.optional(v.boolean()),
  },
  returns: v.object({
    tasks: v.array(
      v.object({
        _id: v.id("agentTasks"),
        title: v.string(),
        status: taskStatusValidator,
        createdAt: v.number(),
        deletedAt: v.optional(v.number()),
      })
    ),
    sessions: v.array(
      v.object({
        _id: v.id("sessions"),
        title: v.string(),
        status: v.string(),
        messageCount: v.number(),
        deletedAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return { tasks: [], sessions: [] };
    }

    // Get tasks by repo
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const allTasks: Doc<"agentTasks">[] = [];
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      allTasks.push(...tasks);
    }

    let taggedTasks = allTasks.filter(
      (t) => t.tags && t.tags.includes(args.tagId)
    );
    if (!args.includeDeleted) {
      taggedTasks = taggedTasks.filter((t) => !t.deletedAt);
    }

    // Get sessions by repo
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    let taggedSessions = allSessions.filter(
      (s) => s.tags && s.tags.includes(args.tagId)
    );
    if (!args.includeDeleted) {
      taggedSessions = taggedSessions.filter((s) => !s.deletedAt);
    }

    return {
      tasks: taggedTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
        deletedAt: t.deletedAt,
      })),
      sessions: taggedSessions.map((s) => ({
        _id: s._id,
        title: s.title,
        status: s.status,
        messageCount: s.messages.length,
        deletedAt: s.deletedAt,
      })),
    };
  },
});

export const getAvailableTags = query({
  args: {
    repoId: v.id("githubRepos"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const tagSet = new Set<string>();

    // Collect tags from tasks
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
        if (task.tags) {
          for (const tag of task.tags) tagSet.add(tag);
        }
      }
    }

    // Collect tags from sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    for (const session of sessions) {
      if (session.tags) {
        for (const tag of session.tags) tagSet.add(tag);
      }
    }

    return [...tagSet].sort();
  },
});

export const getWorkItemsByTags = query({
  args: {
    repoId: v.id("githubRepos"),
    tagIds: v.array(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  returns: v.object({
    tasks: v.array(
      v.object({
        _id: v.id("agentTasks"),
        title: v.string(),
        status: taskStatusValidator,
        tags: v.optional(v.array(v.string())),
        createdAt: v.number(),
        deletedAt: v.optional(v.number()),
      })
    ),
    sessions: v.array(
      v.object({
        _id: v.id("sessions"),
        title: v.string(),
        status: v.string(),
        tags: v.optional(v.array(v.string())),
        messageCount: v.number(),
        deletedAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return { tasks: [], sessions: [] };
    }

    if (args.tagIds.length === 0) {
      return { tasks: [], sessions: [] };
    }

    const tagSet = new Set(args.tagIds);

    // Get tasks by repo
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const allTasks: Doc<"agentTasks">[] = [];
    for (const board of boards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      allTasks.push(...tasks);
    }

    let taggedTasks = allTasks.filter(
      (t) => t.tags && t.tags.some((tag) => tagSet.has(tag))
    );
    if (!args.includeDeleted) {
      taggedTasks = taggedTasks.filter((t) => !t.deletedAt);
    }

    // Get sessions by repo
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    let taggedSessions = allSessions.filter(
      (s) => s.tags && s.tags.some((tag) => tagSet.has(tag))
    );
    if (!args.includeDeleted) {
      taggedSessions = taggedSessions.filter((s) => !s.deletedAt);
    }

    return {
      tasks: taggedTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        tags: t.tags,
        createdAt: t.createdAt,
        deletedAt: t.deletedAt,
      })),
      sessions: taggedSessions.map((s) => ({
        _id: s._id,
        title: s.title,
        status: s.status,
        tags: s.tags,
        messageCount: s.messages.length,
        deletedAt: s.deletedAt,
      })),
    };
  },
});
