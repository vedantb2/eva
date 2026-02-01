import { describe, it, expect } from "vitest";
import {
  extractJsonFromResponse,
  normalizeAiInsights,
} from "../inngest/normalizeAiInsights";

// --- extractJsonFromResponse ---

describe("extractJsonFromResponse", () => {
  it("extracts clean JSON", () => {
    const json = '{"summary": "hello"}';
    expect(extractJsonFromResponse(json)).toBe(json);
  });

  it("extracts JSON wrapped in markdown code block", () => {
    const input = '```json\n{"summary": "hello"}\n```';
    const result = extractJsonFromResponse(input);
    expect(JSON.parse(result)).toEqual({ summary: "hello" });
  });

  it("extracts JSON with surrounding text", () => {
    const input = 'Here is the analysis:\n{"summary": "test"}\nEnd of analysis.';
    const result = extractJsonFromResponse(input);
    expect(JSON.parse(result)).toEqual({ summary: "test" });
  });

  it("handles nested JSON objects", () => {
    const json = '{"a": {"b": "c"}, "d": [1, 2]}';
    const result = extractJsonFromResponse(json);
    expect(JSON.parse(result)).toEqual({ a: { b: "c" }, d: [1, 2] });
  });

  it("throws on response with no JSON", () => {
    expect(() => extractJsonFromResponse("No JSON here")).toThrow(
      "Failed to parse AI response as JSON"
    );
  });

  it("throws on empty string", () => {
    expect(() => extractJsonFromResponse("")).toThrow(
      "Failed to parse AI response as JSON"
    );
  });

  it("includes response preview in error message", () => {
    const longText = "A".repeat(300);
    try {
      extractJsonFromResponse(longText);
    } catch (e: unknown) {
      const message = (e as Error).message;
      // Should include first 200 chars in preview
      expect(message).toContain("A".repeat(200));
      // Should NOT include full 300 chars
      expect(message.length).toBeLessThan(300 + 100); // message prefix + 200
    }
  });
});

// --- normalizeAiInsights ---

describe("normalizeAiInsights", () => {
  it("returns complete structure from valid input", () => {
    const input = {
      summary: "Great analysis",
      topIssueCategories: [
        {
          category: "Bugs",
          description: "Bug fixes",
          count: 5,
          severity: "high" as const,
          examples: ["Login crash"],
        },
      ],
      commonErrorPatterns: [
        {
          pattern: "Timeout",
          description: "Server timeout",
          frequency: 3,
          suggestedFix: "Increase timeout",
        },
      ],
      temporalTrends: [
        {
          trend: "Increasing",
          description: "More bugs over time",
        },
      ],
      recommendations: ["Fix bugs faster"],
    };

    const result = normalizeAiInsights(input);
    expect(result).toEqual(input);
  });

  it("provides default summary when missing", () => {
    const result = normalizeAiInsights({});
    expect(result.summary).toBe("Analysis completed.");
  });

  it("provides default summary when non-string", () => {
    const result = normalizeAiInsights({ summary: 42 as unknown as string });
    expect(result.summary).toBe("Analysis completed.");
  });

  it("returns empty arrays when fields are missing", () => {
    const result = normalizeAiInsights({});
    expect(result.topIssueCategories).toEqual([]);
    expect(result.commonErrorPatterns).toEqual([]);
    expect(result.temporalTrends).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });

  it("returns empty arrays when fields are non-arrays", () => {
    const result = normalizeAiInsights({
      topIssueCategories: "not an array" as unknown as [],
      commonErrorPatterns: 42 as unknown as [],
      temporalTrends: null as unknown as [],
      recommendations: {} as unknown as [],
    });
    expect(result.topIssueCategories).toEqual([]);
    expect(result.commonErrorPatterns).toEqual([]);
    expect(result.temporalTrends).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });

  // --- topIssueCategories normalization ---

  it("normalizes topIssueCategories with missing fields", () => {
    const result = normalizeAiInsights({
      topIssueCategories: [
        {
          category: undefined as unknown as string,
          description: undefined as unknown as string,
          count: "not a number" as unknown as number,
          severity: "invalid" as unknown as "low",
          examples: undefined as unknown as string[],
        },
      ],
    });

    expect(result.topIssueCategories[0]).toEqual({
      category: "Unknown",
      description: "",
      count: 0,
      severity: "medium",
      examples: [],
    });
  });

  it("filters non-string examples from topIssueCategories", () => {
    const result = normalizeAiInsights({
      topIssueCategories: [
        {
          category: "Test",
          description: "Test",
          count: 1,
          severity: "low",
          examples: ["valid", 42 as unknown as string, null as unknown as string, "also valid"],
        },
      ],
    });

    expect(result.topIssueCategories[0].examples).toEqual([
      "valid",
      "also valid",
    ]);
  });

  it("preserves valid severity values", () => {
    for (const sev of ["low", "medium", "high"] as const) {
      const result = normalizeAiInsights({
        topIssueCategories: [
          {
            category: "Test",
            description: "",
            count: 0,
            severity: sev,
            examples: [],
          },
        ],
      });
      expect(result.topIssueCategories[0].severity).toBe(sev);
    }
  });

  // --- commonErrorPatterns normalization ---

  it("normalizes commonErrorPatterns with missing fields", () => {
    const result = normalizeAiInsights({
      commonErrorPatterns: [
        {
          pattern: undefined as unknown as string,
          description: undefined as unknown as string,
          frequency: "bad" as unknown as number,
        },
      ],
    });

    expect(result.commonErrorPatterns[0]).toEqual({
      pattern: "Unknown",
      description: "",
      frequency: 0,
    });
  });

  it("includes suggestedFix when present", () => {
    const result = normalizeAiInsights({
      commonErrorPatterns: [
        {
          pattern: "Timeout",
          description: "desc",
          frequency: 1,
          suggestedFix: "Increase timeout",
        },
      ],
    });

    expect(result.commonErrorPatterns[0].suggestedFix).toBe(
      "Increase timeout"
    );
  });

  it("omits suggestedFix when not present", () => {
    const result = normalizeAiInsights({
      commonErrorPatterns: [
        {
          pattern: "Timeout",
          description: "desc",
          frequency: 1,
        },
      ],
    });

    expect(result.commonErrorPatterns[0]).not.toHaveProperty("suggestedFix");
  });

  // --- temporalTrends normalization ---

  it("normalizes temporalTrends with missing fields", () => {
    const result = normalizeAiInsights({
      temporalTrends: [
        {
          trend: undefined as unknown as string,
          description: undefined as unknown as string,
        },
      ],
    });

    expect(result.temporalTrends[0]).toEqual({
      trend: "Unknown",
      description: "",
    });
  });

  // --- recommendations normalization ---

  it("filters non-string recommendations", () => {
    const result = normalizeAiInsights({
      recommendations: [
        "valid rec",
        42 as unknown as string,
        null as unknown as string,
        "another valid",
      ],
    });

    expect(result.recommendations).toEqual(["valid rec", "another valid"]);
  });

  it("handles completely empty parsed response", () => {
    const result = normalizeAiInsights({});
    expect(result.summary).toBe("Analysis completed.");
    expect(result.topIssueCategories).toEqual([]);
    expect(result.commonErrorPatterns).toEqual([]);
    expect(result.temporalTrends).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });

  // --- Integration-like test with realistic AI response ---

  it("handles a realistic AI response", () => {
    const parsed = {
      summary:
        "Over the past 2 weeks, 15 tasks were completed with a focus on bug fixes and feature development. Error rates have decreased, indicating improving stability.",
      topIssueCategories: [
        {
          category: "Authentication Issues",
          description: "Login and session management problems",
          count: 5,
          severity: "high" as const,
          examples: ["Login timeout", "Session expiry bug"],
        },
        {
          category: "UI Rendering",
          description: "Component display issues",
          count: 3,
          severity: "medium" as const,
          examples: ["Dark mode toggle"],
        },
      ],
      commonErrorPatterns: [
        {
          pattern: "Database Connection Timeout",
          description: "Frequent DB timeouts during peak hours",
          frequency: 8,
          suggestedFix: "Implement connection pooling",
        },
      ],
      temporalTrends: [
        {
          trend: "Decreasing Error Rate",
          description: "Errors dropped 40% from week 1 to week 2",
        },
      ],
      recommendations: [
        "Implement connection pooling for database",
        "Add retry logic for authentication flows",
        "Schedule heavy tasks during off-peak hours",
      ],
    };

    const result = normalizeAiInsights(parsed);

    expect(result.summary).toContain("15 tasks");
    expect(result.topIssueCategories).toHaveLength(2);
    expect(result.topIssueCategories[0].severity).toBe("high");
    expect(result.commonErrorPatterns).toHaveLength(1);
    expect(result.commonErrorPatterns[0].suggestedFix).toBeDefined();
    expect(result.temporalTrends).toHaveLength(1);
    expect(result.recommendations).toHaveLength(3);
  });
});
