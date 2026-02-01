import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { getCurrentUserId } from "./auth";
import { taskStatusValidator, reportStatusValidator } from "./validators";

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

const analysisResultsValidator = v.object({
  issueCategories: v.array(issueCategoryValidator),
  frequencyMap: v.array(frequencyEntryValidator),
  temporalGroups: v.array(temporalGroupValidator),
  workPatterns: workPatternsValidator,
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

const reportValidator = v.object({
  _id: v.id("reports"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  tagId: v.string(),
  status: reportStatusValidator,
  generatedAt: v.number(),
  analysisResults: analysisResultsValidator,
  aiInsights: v.optional(aiInsightsValidator),
  error: v.optional(v.string()),
  workItemCounts: workItemCountsValidator,
  metadata: metadataValidator,
  createdAt: v.number(),
});

// --- Helper: Analyze issue patterns ---

const ISSUE_KEYWORDS: Record<string, string[]> = {
  bug: ["bug", "fix", "error", "broken", "crash", "issue", "defect", "fail"],
  feature: ["feature", "add", "new", "implement", "create", "build", "enhance"],
  refactor: ["refactor", "clean", "improve", "optimize", "restructure", "reorganize"],
  docs: ["doc", "documentation", "readme", "comment", "guide", "explain"],
  test: ["test", "spec", "coverage", "assert", "verify", "validate"],
  performance: ["perf", "performance", "slow", "fast", "speed", "optimize", "latency"],
  security: ["security", "auth", "permission", "vulnerability", "xss", "injection"],
  ui: ["ui", "ux", "design", "style", "layout", "component", "render", "display"],
  infrastructure: ["deploy", "ci", "cd", "pipeline", "infra", "config", "env", "docker"],
};

function categorizeText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [category, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(category);
    }
  }
  return matched.length > 0 ? matched : ["uncategorized"];
}

function extractFrequencyTerms(texts: string[]): { term: string; count: number }[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
    "every", "all", "any", "few", "more", "most", "other", "some", "such",
    "than", "too", "very", "just", "about", "up", "out", "if", "then",
    "this", "that", "these", "those", "it", "its", "i", "we", "you", "he",
    "she", "they", "me", "us", "him", "her", "them", "my", "our", "your",
  ]);

  const wordCounts: Record<string, number> = {};
  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  return Object.entries(wordCounts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

function buildTemporalGroups(
  tasks: Doc<"agentTasks">[],
  sessions: Doc<"sessions">[],
  bucketSizeMs: number = 7 * 24 * 60 * 60 * 1000 // 1 week
): { startDate: number; endDate: number; taskCount: number; sessionCount: number }[] {
  const allTimestamps = [
    ...tasks.map((t) => t.createdAt),
    ...sessions.map((s) => s._creationTime),
  ];
  if (allTimestamps.length === 0) return [];

  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);

  const groups: Record<number, { taskCount: number; sessionCount: number }> = {};
  for (let t = minTime; t <= maxTime + bucketSizeMs; t += bucketSizeMs) {
    const bucketStart = Math.floor((t - minTime) / bucketSizeMs) * bucketSizeMs + minTime;
    if (!groups[bucketStart]) {
      groups[bucketStart] = { taskCount: 0, sessionCount: 0 };
    }
  }

  for (const task of tasks) {
    const bucketStart =
      Math.floor((task.createdAt - minTime) / bucketSizeMs) * bucketSizeMs + minTime;
    if (groups[bucketStart]) groups[bucketStart].taskCount++;
  }

  for (const session of sessions) {
    const bucketStart =
      Math.floor((session._creationTime - minTime) / bucketSizeMs) * bucketSizeMs + minTime;
    if (groups[bucketStart]) groups[bucketStart].sessionCount++;
  }

  return Object.entries(groups)
    .map(([start, data]) => ({
      startDate: Number(start),
      endDate: Number(start) + bucketSizeMs,
      ...data,
    }))
    .sort((a, b) => a.startDate - b.startDate);
}

// --- Mutations ---

export const createReport = mutation({
  args: {
    repoId: v.id("githubRepos"),
    tagId: v.string(),
    notes: v.optional(v.string()),
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

    // Gather all agentTasks for this repo that have matching tag
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

    // Filter tasks by tag (including soft-deleted)
    const taggedTasks = allTasks.filter(
      (t) => t.tags && t.tags.includes(args.tagId)
    );
    const activeTasks = taggedTasks.filter((t) => !t.deletedAt);
    const deletedTasks = taggedTasks.filter((t) => !!t.deletedAt);

    // Gather all sessions for this repo that have matching tag
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const taggedSessions = allSessions.filter(
      (s) => s.tags && s.tags.includes(args.tagId)
    );
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
      status: "pending",
      generatedAt: now,
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
