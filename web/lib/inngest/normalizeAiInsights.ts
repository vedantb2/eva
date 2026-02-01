/**
 * Normalizes and validates AI-generated insights from Claude responses.
 * Extracted for testability.
 */

export interface AiInsights {
  summary: string;
  topIssueCategories: Array<{
    category: string;
    description: string;
    count: number;
    severity: "low" | "medium" | "high";
    examples: string[];
  }>;
  commonErrorPatterns: Array<{
    pattern: string;
    description: string;
    frequency: number;
    suggestedFix?: string;
  }>;
  temporalTrends: Array<{
    trend: string;
    description: string;
  }>;
  recommendations: string[];
}

/**
 * Extract JSON from a text response that may contain markdown or other wrapping.
 */
export function extractJsonFromResponse(responseText: string): string {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Failed to parse AI response as JSON: ${responseText.slice(0, 200)}`
    );
  }
  return jsonMatch[0];
}

/**
 * Normalize a parsed (but potentially incomplete) AI insights object
 * into a fully validated AiInsights structure with safe defaults.
 */
export function normalizeAiInsights(parsed: Partial<AiInsights>): AiInsights {
  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Analysis completed.",
    topIssueCategories: Array.isArray(parsed.topIssueCategories)
      ? parsed.topIssueCategories.map((c) => ({
          category: c.category || "Unknown",
          description: c.description || "",
          count: typeof c.count === "number" ? c.count : 0,
          severity: (["low", "medium", "high"].includes(c.severity)
            ? c.severity
            : "medium") as "low" | "medium" | "high",
          examples: Array.isArray(c.examples)
            ? c.examples.filter((e): e is string => typeof e === "string")
            : [],
        }))
      : [],
    commonErrorPatterns: Array.isArray(parsed.commonErrorPatterns)
      ? parsed.commonErrorPatterns.map((p) => ({
          pattern: p.pattern || "Unknown",
          description: p.description || "",
          frequency: typeof p.frequency === "number" ? p.frequency : 0,
          ...(p.suggestedFix ? { suggestedFix: p.suggestedFix } : {}),
        }))
      : [],
    temporalTrends: Array.isArray(parsed.temporalTrends)
      ? parsed.temporalTrends.map((t) => ({
          trend: t.trend || "Unknown",
          description: t.description || "",
        }))
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter(
          (r): r is string => typeof r === "string"
        )
      : [],
  };
}
