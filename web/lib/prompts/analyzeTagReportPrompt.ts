export function buildAnalyzeTagReportPrompt(data: {
  tagId: string;
  tasks: Array<{
    title: string;
    description?: string;
    status: string;
    createdAt: number;
    updatedAt: number;
  }>;
  runs: Array<{
    taskTitle: string;
    status: string;
    resultSummary?: string;
    errorLogs: string[];
    error?: string;
  }>;
  sessions: Array<{
    title: string;
    status: string;
    messageCount: number;
    messages: Array<{ role: string; content: string }>;
  }>;
}): string {
  const taskSummaries = data.tasks
    .map(
      (t, i) =>
        `Task ${i + 1}: [${t.status}] "${t.title}"${t.description ? `\n  Description: ${t.description}` : ""}`
    )
    .join("\n");

  const runSummaries = data.runs
    .map((r, i) => {
      let summary = `Run ${i + 1}: [${r.status}] for "${r.taskTitle}"`;
      if (r.resultSummary) summary += `\n  Result: ${r.resultSummary}`;
      if (r.error) summary += `\n  Error: ${r.error}`;
      if (r.errorLogs.length > 0)
        summary += `\n  Error logs:\n    ${r.errorLogs.join("\n    ")}`;
      return summary;
    })
    .join("\n");

  const sessionSummaries = data.sessions
    .map((s, i) => {
      const recentMessages = s.messages
        .slice(-10)
        .map((m) => `    [${m.role}]: ${m.content.slice(0, 300)}`)
        .join("\n");
      return `Session ${i + 1}: [${s.status}] "${s.title}" (${s.messageCount} messages)\n  Recent messages:\n${recentMessages}`;
    })
    .join("\n\n");

  return `You are analyzing work data for a software development project tagged "${data.tagId}". Your goal is to identify patterns, common issues, and provide actionable insights.

## Work Data

### Tasks (${data.tasks.length} total)
${taskSummaries || "No tasks found."}

### Agent Runs (${data.runs.length} total)
${runSummaries || "No runs found."}

### Sessions (${data.sessions.length} total)
${sessionSummaries || "No sessions found."}

## Instructions

Analyze the work data above and produce a structured JSON report with the following:

1. **summary**: A 2-4 sentence high-level overview of the work patterns, key findings, and overall health of this tag's work items.

2. **topIssueCategories**: Identify the top issue categories found in the work data. For each category:
   - category: A short label (e.g., "Bug Fixes", "Feature Implementation", "Configuration Issues")
   - description: A sentence explaining what this category covers
   - count: How many work items fall into this category
   - severity: "low", "medium", or "high" based on impact
   - examples: 1-3 specific examples from the data

3. **commonErrorPatterns**: Identify recurring error patterns from runs and sessions:
   - pattern: Short label for the error pattern
   - description: What causes this error
   - frequency: How many times it appeared
   - suggestedFix: A suggested fix or mitigation (optional)

4. **temporalTrends**: Identify any time-based trends:
   - trend: Short label for the trend
   - description: What the trend indicates

5. **recommendations**: 3-5 actionable recommendations to improve development workflow based on the patterns found.

You MUST output ONLY valid JSON matching this exact structure. No markdown. No explanations outside JSON.

{
  "summary": "string",
  "topIssueCategories": [
    {
      "category": "string",
      "description": "string",
      "count": number,
      "severity": "low" | "medium" | "high",
      "examples": ["string"]
    }
  ],
  "commonErrorPatterns": [
    {
      "pattern": "string",
      "description": "string",
      "frequency": number,
      "suggestedFix": "string or omit"
    }
  ],
  "temporalTrends": [
    {
      "trend": "string",
      "description": "string"
    }
  ],
  "recommendations": ["string"]
}`;
}
