import { z } from "zod";

const USD_TO_GBP = 0.74;
export const GBP_TO_USD = 1.34;

export interface ParsedResultEvent {
  costUsd: number;
  costAvailable: boolean;
  model: string;
  provider: string;
  sessionId: string;
  usageAvailable: boolean;
  usageScope: "turn" | "session";
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  reportedTotalTokens: number | undefined;
  contextUsedTokens: number | undefined;
  contextWindowSize: number | undefined;
}

const EMPTY_PARSED: ParsedResultEvent = {
  costUsd: 0,
  costAvailable: false,
  model: "-",
  provider: "",
  sessionId: "",
  usageAvailable: false,
  usageScope: "turn",
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  reportedTotalTokens: undefined,
  contextUsedTokens: undefined,
  contextWindowSize: undefined,
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
  total_cost_usd: z.number().optional().catch(undefined),
  provider: z.string().catch(""),
  duration_ms: z.number().catch(0),
  usage: usageSchema.optional().catch(undefined),
  usage_available: z.boolean().optional().catch(undefined),
  usage_scope: z.enum(["turn", "session"]).catch("turn"),
  acp_session_id: z.string().catch(""),
  total_tokens: z.number().optional().catch(undefined),
  context_used_tokens: z.number().optional().catch(undefined),
  context_window_size: z.number().optional().catch(undefined),
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
    const usage = data.usage;
    // Keep the four token categories semantically distinct. Pure input (non-cached)
    // must not be conflated with cache reads/creations; their pricing differs by ~10-25x.
    return {
      costUsd: data.total_cost_usd ?? 0,
      costAvailable: data.total_cost_usd !== undefined,
      model: getPrimaryModel(data.modelUsage),
      provider: data.provider,
      sessionId: data.acp_session_id,
      usageAvailable: data.usage_available ?? usage !== undefined,
      usageScope: data.usage_scope,
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      durationMs: data.duration_ms,
      cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
      cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
      reportedTotalTokens: data.total_tokens,
      contextUsedTokens: data.context_used_tokens,
      contextWindowSize: data.context_window_size,
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
