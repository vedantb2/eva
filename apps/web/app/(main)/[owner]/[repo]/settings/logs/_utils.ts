const ENTITY_TYPE_LABELS: Record<string, string> = {
  quickTask: "Quick Tasks",
  session: "Sessions",
  designSession: "Design Sessions",
  researchQuery: "Research Queries",
  project: "Projects",
  doc: "Docs",
  evaluation: "Evaluations",
  sessionAudit: "Session Audits",
  taskAudit: "Task Audits",
  summarize: "Summaries",
  testGen: "Test Generation",
};

export function labelFor(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(count: number): string {
  if (count === 0) return "0";
  if (count >= 1e12) return `${(count / 1e12).toFixed(1)}T`;
  if (count >= 1e9) return `${(count / 1e9).toFixed(1)}B`;
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}k`;
  return String(count);
}

export const USD_TO_GBP = 0.79;

export interface ParsedResultEvent {
  costUsd: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

const EMPTY_PARSED: ParsedResultEvent = {
  costUsd: 0,
  model: "-",
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
};

export function parseResultEvent(raw: string | undefined): ParsedResultEvent {
  if (!raw) return EMPTY_PARSED;
  try {
    const parsed = JSON.parse(raw);
    const usage = parsed.usage ?? {};
    const modelUsage = parsed.modelUsage ?? {};
    const modelKeys = Object.keys(modelUsage);
    const inputTokens =
      (typeof usage.input_tokens === "number" ? usage.input_tokens : 0) +
      (typeof usage.cache_read_input_tokens === "number"
        ? usage.cache_read_input_tokens
        : 0) +
      (typeof usage.cache_creation_input_tokens === "number"
        ? usage.cache_creation_input_tokens
        : 0);
    return {
      costUsd:
        typeof parsed.total_cost_usd === "number" ? parsed.total_cost_usd : 0,
      model: modelKeys.length > 0 ? modelKeys[0] : "-",
      inputTokens,
      outputTokens:
        typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
      durationMs:
        typeof parsed.duration_ms === "number" ? parsed.duration_ms : 0,
      cacheReadTokens:
        typeof usage.cache_read_input_tokens === "number"
          ? usage.cache_read_input_tokens
          : 0,
      cacheCreationTokens:
        typeof usage.cache_creation_input_tokens === "number"
          ? usage.cache_creation_input_tokens
          : 0,
    };
  } catch {
    return EMPTY_PARSED;
  }
}
