import { describe, it, expect } from "vitest";
import {
  categorizeText,
  extractFrequencyTerms,
  buildTemporalGroups,
  buildDailyBreakdown,
  buildWeeklyTrend,
  buildIssuesByDate,
  getDateBucket,
  detectGranularity,
  DAY_MS,
  WEEK_MS,
  ISSUE_KEYWORDS,
} from "../../../backend/convex/reportHelpers";

// --- categorizeText ---

describe("categorizeText", () => {
  it("categorizes bug-related text", () => {
    expect(categorizeText("Fix broken login page")).toContain("bug");
  });

  it("categorizes feature-related text", () => {
    expect(categorizeText("Add new user dashboard feature")).toContain("feature");
  });

  it("categorizes refactor-related text", () => {
    expect(categorizeText("Refactor authentication module")).toContain("refactor");
  });

  it("categorizes docs-related text", () => {
    expect(categorizeText("Update API documentation")).toContain("docs");
  });

  it("categorizes test-related text", () => {
    expect(categorizeText("Add unit test coverage")).toContain("test");
  });

  it("categorizes performance-related text", () => {
    expect(categorizeText("Optimize slow database query latency")).toContain("performance");
  });

  it("categorizes security-related text", () => {
    expect(categorizeText("Fix XSS vulnerability in auth")).toContain("security");
  });

  it("categorizes ui-related text", () => {
    expect(categorizeText("Redesign component layout")).toContain("ui");
  });

  it("categorizes infrastructure-related text", () => {
    expect(categorizeText("Update CI/CD pipeline config")).toContain("infrastructure");
  });

  it("returns uncategorized for text without matching keywords", () => {
    expect(categorizeText("hello world")).toEqual(["uncategorized"]);
  });

  it("returns multiple categories when text matches several", () => {
    const result = categorizeText("Fix broken UI component display error");
    expect(result).toContain("bug");
    expect(result).toContain("ui");
  });

  it("handles case insensitivity", () => {
    expect(categorizeText("FIX BROKEN BUG")).toContain("bug");
  });

  it("handles empty string", () => {
    expect(categorizeText("")).toEqual(["uncategorized"]);
  });

  it("matches partial words within larger words", () => {
    // "optimize" contains "optimize" which is in both refactor and performance
    const result = categorizeText("optimize");
    expect(result).toContain("refactor");
    expect(result).toContain("performance");
  });

  it("verifies all keyword categories are represented in ISSUE_KEYWORDS", () => {
    const expectedCategories = [
      "bug", "feature", "refactor", "docs", "test",
      "performance", "security", "ui", "infrastructure",
    ];
    for (const cat of expectedCategories) {
      expect(ISSUE_KEYWORDS).toHaveProperty(cat);
      expect(ISSUE_KEYWORDS[cat].length).toBeGreaterThan(0);
    }
  });
});

// --- extractFrequencyTerms ---

describe("extractFrequencyTerms", () => {
  it("returns empty array for empty input", () => {
    expect(extractFrequencyTerms([])).toEqual([]);
  });

  it("returns empty array for texts with only stop words", () => {
    const result = extractFrequencyTerms(["the a an is are was"]);
    expect(result).toEqual([]);
  });

  it("counts word frequencies correctly", () => {
    const result = extractFrequencyTerms([
      "login login login error",
      "login error error",
    ]);
    const loginEntry = result.find((e) => e.term === "login");
    const errorEntry = result.find((e) => e.term === "error");
    expect(loginEntry).toBeDefined();
    expect(loginEntry!.count).toBe(4);
    expect(errorEntry).toBeDefined();
    expect(errorEntry!.count).toBe(3);
  });

  it("sorts by count descending", () => {
    const result = extractFrequencyTerms(["aaa bbb bbb ccc ccc ccc"]);
    expect(result[0].term).toBe("ccc");
    expect(result[1].term).toBe("bbb");
    expect(result[2].term).toBe("aaa");
  });

  it("limits to 50 terms", () => {
    // Generate 60 unique words
    const words = Array.from({ length: 60 }, (_, i) => `word${i}x`);
    const result = extractFrequencyTerms([words.join(" ")]);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("filters out words with 2 or fewer characters", () => {
    const result = extractFrequencyTerms(["ab cd xyz abc"]);
    expect(result.find((e) => e.term === "ab")).toBeUndefined();
    expect(result.find((e) => e.term === "cd")).toBeUndefined();
    expect(result.find((e) => e.term === "xyz")).toBeDefined();
    expect(result.find((e) => e.term === "abc")).toBeDefined();
  });

  it("removes punctuation before counting", () => {
    const result = extractFrequencyTerms(["error! error. error,"]);
    const errorEntry = result.find((e) => e.term === "error");
    expect(errorEntry).toBeDefined();
    expect(errorEntry!.count).toBe(3);
  });

  it("handles special characters in text", () => {
    const result = extractFrequencyTerms(["fix @#$%^& crash"]);
    expect(result.find((e) => e.term === "fix")).toBeDefined();
    expect(result.find((e) => e.term === "crash")).toBeDefined();
  });
});

// --- getDateBucket ---

describe("getDateBucket", () => {
  it("buckets by day correctly", () => {
    // 2024-01-15 14:30:00 UTC
    const ts = new Date(2024, 0, 15, 14, 30, 0).getTime();
    const bucket = getDateBucket(ts, "day");
    const expected = new Date(2024, 0, 15).getTime();
    expect(bucket).toBe(expected);
  });

  it("buckets by month correctly", () => {
    const ts = new Date(2024, 5, 20, 10, 0, 0).getTime();
    const bucket = getDateBucket(ts, "month");
    const expected = new Date(2024, 5, 1).getTime();
    expect(bucket).toBe(expected);
  });

  it("buckets by week (Monday start) correctly", () => {
    // 2024-01-17 is a Wednesday
    const ts = new Date(2024, 0, 17, 12, 0, 0).getTime();
    const bucket = getDateBucket(ts, "week");
    const expected = new Date(2024, 0, 15).getTime(); // Monday Jan 15
    expect(bucket).toBe(expected);
  });

  it("handles Sunday correctly (week start Monday)", () => {
    // 2024-01-14 is a Sunday
    const ts = new Date(2024, 0, 14, 12, 0, 0).getTime();
    const bucket = getDateBucket(ts, "week");
    // Sunday should map to the previous Monday (Jan 8)
    const expected = new Date(2024, 0, 8).getTime();
    expect(bucket).toBe(expected);
  });

  it("handles Monday correctly (stays same week)", () => {
    // 2024-01-15 is a Monday
    const ts = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const bucket = getDateBucket(ts, "week");
    const expected = new Date(2024, 0, 15).getTime();
    expect(bucket).toBe(expected);
  });
});

// --- detectGranularity ---

describe("detectGranularity", () => {
  it("returns 'day' for ranges <= 14 days", () => {
    const start = Date.now();
    const end = start + 14 * DAY_MS;
    expect(detectGranularity(start, end)).toBe("day");
  });

  it("returns 'week' for ranges between 14 and 90 days", () => {
    const start = Date.now();
    const end = start + 45 * DAY_MS;
    expect(detectGranularity(start, end)).toBe("week");
  });

  it("returns 'month' for ranges > 90 days", () => {
    const start = Date.now();
    const end = start + 120 * DAY_MS;
    expect(detectGranularity(start, end)).toBe("month");
  });

  it("returns 'day' for zero range", () => {
    const ts = Date.now();
    expect(detectGranularity(ts, ts)).toBe("day");
  });

  it("returns 'week' at the 90-day boundary", () => {
    const start = Date.now();
    const end = start + 90 * DAY_MS;
    expect(detectGranularity(start, end)).toBe("week");
  });

  it("returns 'month' just past 90 days", () => {
    const start = Date.now();
    const end = start + 91 * DAY_MS;
    expect(detectGranularity(start, end)).toBe("month");
  });
});

// --- buildTemporalGroups ---

describe("buildTemporalGroups", () => {
  it("returns empty array for no data", () => {
    expect(buildTemporalGroups([], [])).toEqual([]);
  });

  it("groups tasks and sessions into weekly buckets", () => {
    const baseTime = new Date(2024, 0, 15).getTime();
    const tasks = [
      { createdAt: baseTime },
      { createdAt: baseTime + 2 * DAY_MS },
    ];
    const sessions = [
      { _creationTime: baseTime + 1 * DAY_MS },
    ];

    const result = buildTemporalGroups(tasks, sessions);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // All items within same week bucket
    const firstGroup = result[0];
    expect(firstGroup.taskCount).toBe(2);
    expect(firstGroup.sessionCount).toBe(1);
  });

  it("separates items across multiple weeks", () => {
    const baseTime = new Date(2024, 0, 1).getTime();
    const tasks = [
      { createdAt: baseTime },
      { createdAt: baseTime + 10 * DAY_MS }, // Second week
    ];
    const sessions: { _creationTime: number }[] = [];

    const result = buildTemporalGroups(tasks, sessions);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const totalTasks = result.reduce((sum, g) => sum + g.taskCount, 0);
    expect(totalTasks).toBe(2);
  });

  it("each group has correct startDate/endDate with bucket size", () => {
    const baseTime = new Date(2024, 0, 1).getTime();
    const bucketSize = 7 * DAY_MS;
    const tasks = [{ createdAt: baseTime }];
    const result = buildTemporalGroups(tasks, [], bucketSize);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].endDate - result[0].startDate).toBe(bucketSize);
  });

  it("handles single item correctly", () => {
    const baseTime = Date.now();
    const tasks = [{ createdAt: baseTime }];
    const result = buildTemporalGroups(tasks, []);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const totalTasks = result.reduce((sum, g) => sum + g.taskCount, 0);
    expect(totalTasks).toBe(1);
  });

  it("respects custom bucket size", () => {
    const baseTime = new Date(2024, 0, 1).getTime();
    const customBucket = 14 * DAY_MS; // 2 weeks
    const tasks = [
      { createdAt: baseTime },
      { createdAt: baseTime + 7 * DAY_MS },
    ];
    const result = buildTemporalGroups(tasks, [], customBucket);
    // Both tasks should be in the same 2-week bucket
    expect(result[0].taskCount).toBe(2);
  });
});

// --- buildDailyBreakdown ---

describe("buildDailyBreakdown", () => {
  it("returns empty array for no data", () => {
    expect(buildDailyBreakdown([], [], [])).toEqual([]);
  });

  it("counts tasks per day", () => {
    const day1 = new Date(2024, 0, 15, 10, 0).getTime();
    const day1Later = new Date(2024, 0, 15, 14, 0).getTime();
    const day2 = new Date(2024, 0, 16, 10, 0).getTime();

    const tasks = [
      { createdAt: day1 },
      { createdAt: day1Later },
      { createdAt: day2 },
    ];

    const result = buildDailyBreakdown(tasks, [], []);
    expect(result.length).toBe(2);

    const bucket1 = result.find(
      (r) => r.date === new Date(2024, 0, 15).getTime()
    );
    expect(bucket1!.taskCount).toBe(2);

    const bucket2 = result.find(
      (r) => r.date === new Date(2024, 0, 16).getTime()
    );
    expect(bucket2!.taskCount).toBe(1);
  });

  it("counts sessions per day", () => {
    const ts = new Date(2024, 0, 15, 10, 0).getTime();
    const sessions = [{ _creationTime: ts }, { _creationTime: ts + 3600000 }];

    const result = buildDailyBreakdown([], sessions, []);
    expect(result.length).toBe(1);
    expect(result[0].sessionCount).toBe(2);
  });

  it("counts only error runs as issues", () => {
    const ts = new Date(2024, 0, 15, 10, 0).getTime();
    const runs = [
      { status: "error", startedAt: ts },
      { status: "success", startedAt: ts },
      { status: "error", startedAt: ts + 3600000 },
    ];

    const result = buildDailyBreakdown([], [], runs);
    expect(result.length).toBe(1);
    expect(result[0].issueCount).toBe(2);
  });

  it("ignores runs without startedAt", () => {
    const runs = [{ status: "error" }];
    const result = buildDailyBreakdown([], [], runs);
    expect(result).toEqual([]);
  });

  it("results are sorted by date ascending", () => {
    const tasks = [
      { createdAt: new Date(2024, 0, 20).getTime() },
      { createdAt: new Date(2024, 0, 10).getTime() },
      { createdAt: new Date(2024, 0, 15).getTime() },
    ];

    const result = buildDailyBreakdown(tasks, [], []);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date).toBeGreaterThan(result[i - 1].date);
    }
  });
});

// --- buildWeeklyTrend ---

describe("buildWeeklyTrend", () => {
  it("returns empty array for no data", () => {
    expect(buildWeeklyTrend([], [], [])).toEqual([]);
  });

  it("counts tasks and completed tasks per week", () => {
    const week1 = new Date(2024, 0, 15, 10, 0).getTime(); // Monday
    const tasks = [
      { createdAt: week1, status: "done" },
      { createdAt: week1 + DAY_MS, status: "in_progress" },
      { createdAt: week1 + 2 * DAY_MS, status: "done" },
    ];

    const result = buildWeeklyTrend(tasks, [], []);
    expect(result.length).toBe(1);
    expect(result[0].taskCount).toBe(3);
    expect(result[0].completedCount).toBe(2);
  });

  it("counts sessions per week", () => {
    const ts = new Date(2024, 0, 15).getTime();
    const sessions = [{ _creationTime: ts }];

    const result = buildWeeklyTrend([], sessions, []);
    expect(result.length).toBe(1);
    expect(result[0].sessionCount).toBe(1);
  });

  it("counts error runs per week", () => {
    const ts = new Date(2024, 0, 15).getTime();
    const runs = [
      { status: "error", startedAt: ts },
      { status: "success", startedAt: ts },
    ];

    const result = buildWeeklyTrend([], [], runs);
    expect(result.length).toBe(1);
    expect(result[0].errorCount).toBe(1);
  });

  it("separates data across multiple weeks", () => {
    const week1 = new Date(2024, 0, 15).getTime();
    const week2 = new Date(2024, 0, 22).getTime();

    const tasks = [
      { createdAt: week1, status: "done" },
      { createdAt: week2, status: "todo" },
    ];

    const result = buildWeeklyTrend(tasks, [], []);
    expect(result.length).toBe(2);
  });

  it("results are sorted by weekStart ascending", () => {
    const tasks = [
      { createdAt: new Date(2024, 1, 1).getTime(), status: "done" },
      { createdAt: new Date(2024, 0, 1).getTime(), status: "done" },
    ];

    const result = buildWeeklyTrend(tasks, [], []);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].weekStart).toBeGreaterThan(result[i - 1].weekStart);
    }
  });
});

// --- buildIssuesByDate ---

describe("buildIssuesByDate", () => {
  it("returns empty array for no data", () => {
    expect(buildIssuesByDate([], [])).toEqual([]);
  });

  it("categorizes tasks by date", () => {
    const ts = new Date(2024, 0, 15).getTime();
    const tasks = [
      { createdAt: ts, title: "Fix login bug", description: "" },
      { createdAt: ts + 3600000, title: "Add new feature", description: "" },
    ];

    const result = buildIssuesByDate(tasks, [], "day");
    expect(result.length).toBe(1);
    expect(result[0].totalItems).toBe(2);

    const bugCat = result[0].issues.find((i) => i.category === "bug");
    expect(bugCat).toBeDefined();
    const featureCat = result[0].issues.find((i) => i.category === "feature");
    expect(featureCat).toBeDefined();
  });

  it("auto-detects granularity from data range", () => {
    const ts1 = new Date(2024, 0, 1).getTime();
    const ts2 = new Date(2024, 2, 1).getTime(); // ~60 days later

    const tasks = [
      { createdAt: ts1, title: "Bug fix" },
      { createdAt: ts2, title: "Another bug fix" },
    ];

    const result = buildIssuesByDate(tasks, []);
    // 60 days => "week" granularity
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].granularity).toBe("week");
  });

  it("includes session data in categorization", () => {
    const ts = new Date(2024, 0, 15).getTime();
    const sessions = [
      {
        _creationTime: ts,
        title: "Debug session",
        messages: [{ content: "fix the broken auth error" }],
      },
    ];

    const result = buildIssuesByDate([], sessions, "day");
    expect(result.length).toBe(1);
    expect(result[0].totalItems).toBe(1);
    // Should find bug and security categories from the session content
    const bugCat = result[0].issues.find((i) => i.category === "bug");
    expect(bugCat).toBeDefined();
  });

  it("issues are sorted by count descending within each bucket", () => {
    const ts = new Date(2024, 0, 15).getTime();
    const tasks = [
      { createdAt: ts, title: "Fix bug error crash broken" },
      { createdAt: ts + 1000, title: "Fix another bug error" },
      { createdAt: ts + 2000, title: "New feature" },
    ];

    const result = buildIssuesByDate(tasks, [], "day");
    expect(result.length).toBe(1);
    // Issues within the bucket should be sorted desc by count
    for (let i = 1; i < result[0].issues.length; i++) {
      expect(result[0].issues[i].count).toBeLessThanOrEqual(
        result[0].issues[i - 1].count
      );
    }
  });

  it("results are sorted by date ascending", () => {
    const ts1 = new Date(2024, 0, 20).getTime();
    const ts2 = new Date(2024, 0, 10).getTime();

    const tasks = [
      { createdAt: ts1, title: "Fix bug" },
      { createdAt: ts2, title: "Fix bug" },
    ];

    const result = buildIssuesByDate(tasks, [], "day");
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date).toBeGreaterThan(result[i - 1].date);
    }
  });
});
