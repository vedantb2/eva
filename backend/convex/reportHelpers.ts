/**
 * Pure helper functions for report analysis.
 * Extracted from reports.ts to enable unit testing.
 */

// --- Issue categorization ---

export const ISSUE_KEYWORDS: Record<string, string[]> = {
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

export function categorizeText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [category, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(category);
    }
  }
  return matched.length > 0 ? matched : ["uncategorized"];
}

export function extractFrequencyTerms(texts: string[]): { term: string; count: number }[] {
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

// --- Temporal grouping ---

export type Granularity = "day" | "week" | "month";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export function getDateBucket(timestamp: number, granularity: Granularity): number {
  const date = new Date(timestamp);
  if (granularity === "day") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  } else if (granularity === "week") {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(date.getFullYear(), date.getMonth(), diff).getTime();
  } else {
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  }
}

export function detectGranularity(minTime: number, maxTime: number): Granularity {
  const range = maxTime - minTime;
  if (range <= 14 * DAY_MS) return "day";
  if (range <= 90 * DAY_MS) return "week";
  return "month";
}

// Minimal interfaces for temporal grouping functions
interface TimestampedTask {
  createdAt: number;
  title?: string;
  description?: string;
  status?: string;
}

interface TimestampedSession {
  _creationTime: number;
  title?: string;
  messages?: Array<{ content: string }>;
}

interface TimestampedRun {
  status: string;
  startedAt?: number;
}

export function buildTemporalGroups(
  tasks: TimestampedTask[],
  sessions: TimestampedSession[],
  bucketSizeMs: number = 7 * 24 * 60 * 60 * 1000
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

export function buildDailyBreakdown(
  tasks: TimestampedTask[],
  sessions: TimestampedSession[],
  runs: TimestampedRun[]
): { date: number; taskCount: number; sessionCount: number; issueCount: number }[] {
  const buckets: Record<
    number,
    { taskCount: number; sessionCount: number; issueCount: number }
  > = {};

  for (const task of tasks) {
    const bucket = getDateBucket(task.createdAt, "day");
    if (!buckets[bucket]) buckets[bucket] = { taskCount: 0, sessionCount: 0, issueCount: 0 };
    buckets[bucket].taskCount++;
  }

  for (const session of sessions) {
    const bucket = getDateBucket(session._creationTime, "day");
    if (!buckets[bucket]) buckets[bucket] = { taskCount: 0, sessionCount: 0, issueCount: 0 };
    buckets[bucket].sessionCount++;
  }

  for (const run of runs) {
    if (run.status === "error" && run.startedAt) {
      const bucket = getDateBucket(run.startedAt, "day");
      if (!buckets[bucket]) buckets[bucket] = { taskCount: 0, sessionCount: 0, issueCount: 0 };
      buckets[bucket].issueCount++;
    }
  }

  return Object.entries(buckets)
    .map(([dateStr, data]) => ({
      date: Number(dateStr),
      ...data,
    }))
    .sort((a, b) => a.date - b.date);
}

export function buildWeeklyTrend(
  tasks: (TimestampedTask & { status?: string })[],
  sessions: TimestampedSession[],
  runs: TimestampedRun[]
): {
  weekStart: number;
  taskCount: number;
  sessionCount: number;
  completedCount: number;
  errorCount: number;
}[] {
  const buckets: Record<
    number,
    { taskCount: number; sessionCount: number; completedCount: number; errorCount: number }
  > = {};

  for (const task of tasks) {
    const bucket = getDateBucket(task.createdAt, "week");
    if (!buckets[bucket])
      buckets[bucket] = { taskCount: 0, sessionCount: 0, completedCount: 0, errorCount: 0 };
    buckets[bucket].taskCount++;
    if (task.status === "done") buckets[bucket].completedCount++;
  }

  for (const session of sessions) {
    const bucket = getDateBucket(session._creationTime, "week");
    if (!buckets[bucket])
      buckets[bucket] = { taskCount: 0, sessionCount: 0, completedCount: 0, errorCount: 0 };
    buckets[bucket].sessionCount++;
  }

  for (const run of runs) {
    if (run.startedAt) {
      const bucket = getDateBucket(run.startedAt, "week");
      if (!buckets[bucket])
        buckets[bucket] = { taskCount: 0, sessionCount: 0, completedCount: 0, errorCount: 0 };
      if (run.status === "error") buckets[bucket].errorCount++;
    }
  }

  return Object.entries(buckets)
    .map(([dateStr, data]) => ({
      weekStart: Number(dateStr),
      ...data,
    }))
    .sort((a, b) => a.weekStart - b.weekStart);
}

export function buildIssuesByDate(
  tasks: (TimestampedTask & { title?: string; description?: string })[],
  sessions: (TimestampedSession & { title?: string; messages?: Array<{ content: string }> })[],
  granularity?: Granularity
): {
  date: number;
  granularity: Granularity;
  issues: { category: string; count: number }[];
  totalItems: number;
}[] {
  const allTimestamps = [
    ...tasks.map((t) => t.createdAt),
    ...sessions.map((s) => s._creationTime),
  ];
  if (allTimestamps.length === 0) return [];

  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const gran = granularity || detectGranularity(minTime, maxTime);

  const buckets: Record<
    number,
    { categories: Record<string, number>; totalItems: number }
  > = {};

  for (const task of tasks) {
    const bucket = getDateBucket(task.createdAt, gran);
    if (!buckets[bucket]) buckets[bucket] = { categories: {}, totalItems: 0 };
    buckets[bucket].totalItems++;
    const text = [task.title || "", task.description || ""].join(" ");
    const cats = categorizeText(text);
    for (const cat of cats) {
      buckets[bucket].categories[cat] = (buckets[bucket].categories[cat] || 0) + 1;
    }
  }

  for (const session of sessions) {
    const bucket = getDateBucket(session._creationTime, gran);
    if (!buckets[bucket]) buckets[bucket] = { categories: {}, totalItems: 0 };
    buckets[bucket].totalItems++;
    const text = [session.title || "", ...(session.messages || []).map((m) => m.content)].join(" ");
    const cats = categorizeText(text);
    for (const cat of cats) {
      buckets[bucket].categories[cat] = (buckets[bucket].categories[cat] || 0) + 1;
    }
  }

  return Object.entries(buckets)
    .map(([dateStr, data]) => ({
      date: Number(dateStr),
      granularity: gran,
      issues: Object.entries(data.categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      totalItems: data.totalItems,
    }))
    .sort((a, b) => a.date - b.date);
}
