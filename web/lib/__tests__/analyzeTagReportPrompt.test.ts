import { describe, it, expect } from "vitest";
import { buildAnalyzeTagReportPrompt } from "../prompts/analyzeTagReportPrompt";

describe("buildAnalyzeTagReportPrompt", () => {
  const baseData = {
    tagId: "v1.0",
    tasks: [],
    runs: [],
    sessions: [],
  };

  it("returns a non-empty string", () => {
    const result = buildAnalyzeTagReportPrompt(baseData);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the tag ID in the prompt", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tagId: "sprint-42",
    });
    expect(result).toContain("sprint-42");
  });

  it("includes task summaries when tasks are provided", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Fix authentication bug",
          description: "Login fails when session expires",
          status: "done",
          createdAt: new Date("2024-01-15").getTime(),
          updatedAt: new Date("2024-01-17").getTime(),
        },
      ],
    });

    expect(result).toContain("Fix authentication bug");
    expect(result).toContain("Login fails when session expires");
    expect(result).toContain("[done]");
    expect(result).toContain("2024-01-15");
  });

  it("includes task count in the header", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Task 1",
          status: "done",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          title: "Task 2",
          status: "todo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    expect(result).toContain("Tasks (2 total)");
  });

  it("includes multi-tag info when task has multiple tags", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Multi-tag task",
          status: "done",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ["v1.0", "bug", "urgent"],
        },
      ],
    });

    expect(result).toContain("Tags: v1.0, bug, urgent");
  });

  it("does not show tags line when task has only one tag", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Single-tag task",
          status: "done",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ["v1.0"],
        },
      ],
    });

    expect(result).not.toContain("Tags:");
  });

  it("includes run summaries with results and errors", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      runs: [
        {
          taskTitle: "Deploy task",
          status: "error",
          resultSummary: "Failed to connect to server",
          error: "ECONNREFUSED",
          errorLogs: ["Connection refused at port 3000"],
          startedAt: new Date("2024-01-15").getTime(),
        },
      ],
    });

    expect(result).toContain("Deploy task");
    expect(result).toContain("[error]");
    expect(result).toContain("Failed to connect to server");
    expect(result).toContain("ECONNREFUSED");
    expect(result).toContain("Connection refused at port 3000");
  });

  it("includes session summaries with recent messages", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      sessions: [
        {
          title: "Debug Session",
          status: "active",
          messageCount: 5,
          createdAt: new Date("2024-01-15").getTime(),
          messages: [
            { role: "user", content: "How do I fix this bug?" },
            { role: "assistant", content: "Let me check the code." },
          ],
        },
      ],
    });

    expect(result).toContain("Debug Session");
    expect(result).toContain("[active]");
    expect(result).toContain("5 messages");
    expect(result).toContain("How do I fix this bug?");
    expect(result).toContain("Let me check the code.");
  });

  it("limits session messages to last 10", () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: "user",
      content: `Message number ${i + 1}`,
    }));

    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      sessions: [
        {
          title: "Long session",
          status: "active",
          messageCount: 20,
          messages,
        },
      ],
    });

    // Should NOT contain early messages (use exact line match to avoid substring matches)
    expect(result).not.toMatch(/\[user\]: Message number 1\n/);
    expect(result).not.toMatch(/\[user\]: Message number 10\n/);
    // Should contain late messages (11-20)
    expect(result).toContain("Message number 11");
    expect(result).toContain("Message number 20");
  });

  it("truncates long message content to 300 chars", () => {
    const longMessage = "A".repeat(500);
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      sessions: [
        {
          title: "Session",
          status: "active",
          messageCount: 1,
          messages: [{ role: "user", content: longMessage }],
        },
      ],
    });

    // The full 500-char message should be truncated
    expect(result).not.toContain("A".repeat(500));
    expect(result).toContain("A".repeat(300));
  });

  it("builds a timeline from tasks, sessions, and error runs", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Task 1",
          status: "done",
          createdAt: new Date("2024-01-10").getTime(),
          updatedAt: new Date("2024-01-12").getTime(),
        },
      ],
      runs: [
        {
          taskTitle: "Task 1",
          status: "error",
          errorLogs: [],
          error: "crash",
          startedAt: new Date("2024-01-11").getTime(),
        },
      ],
      sessions: [
        {
          title: "Session 1",
          status: "active",
          messageCount: 3,
          createdAt: new Date("2024-01-12").getTime(),
          messages: [],
        },
      ],
    });

    expect(result).toContain("### Timeline");
    expect(result).toContain("[task]");
    expect(result).toContain("[error]");
    expect(result).toContain("[session]");
  });

  it("timeline is sorted chronologically", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      tasks: [
        {
          title: "Later task",
          status: "done",
          createdAt: new Date("2024-02-01").getTime(),
          updatedAt: new Date("2024-02-01").getTime(),
        },
        {
          title: "Earlier task",
          status: "done",
          createdAt: new Date("2024-01-01").getTime(),
          updatedAt: new Date("2024-01-01").getTime(),
        },
      ],
    });

    const earlierIdx = result.indexOf("Earlier task");
    const laterIdx = result.indexOf("Later task");
    // In the timeline section, earlier should come first
    // The timeline is built from allDates sorted by date
    const timelineStart = result.indexOf("### Timeline");
    const timelineEarlier = result.indexOf("2024-01-01", timelineStart);
    const timelineLater = result.indexOf("2024-02-01", timelineStart);
    expect(timelineEarlier).toBeLessThan(timelineLater);
  });

  it("includes JSON schema instructions", () => {
    const result = buildAnalyzeTagReportPrompt(baseData);
    expect(result).toContain("summary");
    expect(result).toContain("topIssueCategories");
    expect(result).toContain("commonErrorPatterns");
    expect(result).toContain("temporalTrends");
    expect(result).toContain("recommendations");
    expect(result).toContain("valid JSON");
  });

  it("handles empty data gracefully", () => {
    const result = buildAnalyzeTagReportPrompt(baseData);
    expect(result).toContain("No tasks found.");
    expect(result).toContain("No runs found.");
    expect(result).toContain("No sessions found.");
  });

  it("shows 'No timeline data available.' when no timeline data", () => {
    const result = buildAnalyzeTagReportPrompt(baseData);
    expect(result).toContain("No timeline data available.");
  });

  it("excludes non-error runs from timeline", () => {
    const result = buildAnalyzeTagReportPrompt({
      ...baseData,
      runs: [
        {
          taskTitle: "Task",
          status: "success",
          errorLogs: [],
          startedAt: new Date("2024-01-15").getTime(),
        },
      ],
    });

    // Success runs should not appear in timeline
    const timelineSection = result.slice(result.indexOf("### Timeline"));
    expect(timelineSection).not.toContain("[error]");
  });
});
