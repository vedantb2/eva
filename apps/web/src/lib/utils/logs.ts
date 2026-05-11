import { isRecord } from "@conductor/shared/typeGuards";

export const USD_TO_GBP = 0.74;
export const GBP_TO_USD = 1.34;

export interface ParsedResultEvent {
  costUsd: number;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

const EMPTY_PARSED: ParsedResultEvent = {
  costUsd: 0,
  model: "-",
  provider: "",
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
};

/** Finds the model with the highest cost from modelUsage object. */
function getPrimaryModel(modelUsage: Record<string, unknown>): string {
  let primaryModel = "-";
  let highestCost = -1;
  for (const [model, usage] of Object.entries(modelUsage)) {
    if (isRecord(usage) && typeof usage.costUSD === "number") {
      if (usage.costUSD > highestCost) {
        highestCost = usage.costUSD;
        primaryModel = model;
      }
    }
  }
  // Fallback to first key if no cost data
  if (primaryModel === "-" && Object.keys(modelUsage).length > 0) {
    primaryModel = Object.keys(modelUsage)[0];
  }
  return primaryModel;
}

export function parseResultEvent(raw: string | undefined): ParsedResultEvent {
  if (!raw) return EMPTY_PARSED;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_PARSED;
    const usage = isRecord(parsed.usage) ? parsed.usage : {};
    const modelUsage = isRecord(parsed.modelUsage) ? parsed.modelUsage : {};
    // Keep the four token categories semantically distinct. Pure input (non-cached)
    // must not be conflated with cache reads/creations; their pricing differs by ~10-25x.
    return {
      costUsd:
        typeof parsed.total_cost_usd === "number" ? parsed.total_cost_usd : 0,
      model: getPrimaryModel(modelUsage),
      provider: typeof parsed.provider === "string" ? parsed.provider : "",
      inputTokens:
        typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
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

export function formatCost(cost: number): string {
  return `£${(cost * USD_TO_GBP).toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count === 0) return "0";
  if (count >= 1e12) return `${(count / 1e12).toFixed(1)}T`;
  if (count >= 1e9) return `${(count / 1e9).toFixed(1)}B`;
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}k`;
  return String(count);
}
