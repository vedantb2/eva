import { z } from "zod";

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

// Boundary schema for the Claude Code result-event JSON. Every field carries a
// `.catch` default matching EMPTY_PARSED, so a missing or mistyped value falls
// back rather than failing the whole parse — the same tolerance the previous
// typeof-guarded reads provided.
const usageSchema = z
  .object({
    input_tokens: z.number().catch(0),
    output_tokens: z.number().catch(0),
    cache_read_input_tokens: z.number().catch(0),
    cache_creation_input_tokens: z.number().catch(0),
  })
  .catch({
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  });

const modelUsageSchema = z
  .record(
    z.string(),
    z.object({ costUSD: z.number().optional().catch(undefined) }).catch({}),
  )
  .catch({});

const resultEventSchema = z.object({
  total_cost_usd: z.number().catch(0),
  provider: z.string().catch(""),
  duration_ms: z.number().catch(0),
  usage: usageSchema,
  modelUsage: modelUsageSchema,
});

type ModelUsage = z.infer<typeof modelUsageSchema>;

/** Finds the model with the highest cost from modelUsage object. */
function getPrimaryModel(modelUsage: ModelUsage): string {
  let primaryModel = "-";
  let highestCost = -1;
  for (const [model, usage] of Object.entries(modelUsage)) {
    if (typeof usage.costUSD === "number" && usage.costUSD > highestCost) {
      highestCost = usage.costUSD;
      primaryModel = model;
    }
  }
  // Fallback to first key if no cost data
  const keys = Object.keys(modelUsage);
  if (primaryModel === "-" && keys.length > 0) {
    primaryModel = keys[0];
  }
  return primaryModel;
}

export function parseResultEvent(raw: string | undefined): ParsedResultEvent {
  if (!raw) return EMPTY_PARSED;
  try {
    const parsed = resultEventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_PARSED;
    const data = parsed.data;
    // Keep the four token categories semantically distinct. Pure input (non-cached)
    // must not be conflated with cache reads/creations; their pricing differs by ~10-25x.
    return {
      costUsd: data.total_cost_usd,
      model: getPrimaryModel(data.modelUsage),
      provider: data.provider,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      durationMs: data.duration_ms,
      cacheReadTokens: data.usage.cache_read_input_tokens,
      cacheCreationTokens: data.usage.cache_creation_input_tokens,
    };
  } catch {
    return EMPTY_PARSED;
  }
}

export function getTotalInputTokens(event: ParsedResultEvent): number {
  return event.inputTokens + event.cacheReadTokens + event.cacheCreationTokens;
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
