import { z } from "zod";

const USD_TO_GBP = 0.74;
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
  /** Provider context window for this result, or 0 when the event omitted it. */
  contextWindow: number;
  /**
   * Tokens occupying the context window at the end of this result — last
   * iteration when present, otherwise the request's usage totals. Not the
   * sum of cache reads across the whole request/session.
   */
  contextUsedTokens: number;
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
  contextWindow: 0,
  contextUsedTokens: 0,
};

const tokenCountFields = {
  input_tokens: z.number().catch(0),
  output_tokens: z.number().catch(0),
  cache_read_input_tokens: z.number().catch(0),
  cache_creation_input_tokens: z.number().catch(0),
};

const emptyTokenCounts = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

// Boundary schema for the Claude Code result-event JSON. Every field carries a
// `.catch` default matching EMPTY_PARSED, so a missing or mistyped value falls
// back rather than failing the whole parse — the same tolerance the previous
// typeof-guarded reads provided.
const usageSchema = z
  .object({
    ...tokenCountFields,
    iterations: z.array(z.object(tokenCountFields)).catch([]),
  })
  .catch({
    ...emptyTokenCounts,
    iterations: [],
  });

const modelUsageSchema = z
  .record(
    z.string(),
    z
      .object({
        costUSD: z.number().optional().catch(undefined),
        contextWindow: z.number().optional().catch(undefined),
      })
      .catch({}),
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
  const first = keys[0];
  if (primaryModel === "-" && first !== undefined) {
    primaryModel = first;
  }
  return primaryModel;
}

function getPrimaryContextWindow(
  modelUsage: ModelUsage,
  model: string,
): number {
  const row = modelUsage[model];
  if (row && typeof row.contextWindow === "number" && row.contextWindow > 0) {
    return row.contextWindow;
  }
  return 0;
}

function occupancyFromUsage(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  iterations: Array<{
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
  }>;
}): number {
  const last = usage.iterations[usage.iterations.length - 1];
  const counts = last ?? usage;
  return (
    counts.input_tokens +
    counts.output_tokens +
    counts.cache_read_input_tokens +
    counts.cache_creation_input_tokens
  );
}

export function parseResultEvent(raw: string | undefined): ParsedResultEvent {
  if (!raw) return EMPTY_PARSED;
  try {
    const parsed = resultEventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_PARSED;
    const data = parsed.data;
    const model = getPrimaryModel(data.modelUsage);
    // Keep the four token categories semantically distinct. Pure input (non-cached)
    // must not be conflated with cache reads/creations; their pricing differs by ~10-25x.
    return {
      costUsd: data.total_cost_usd,
      model,
      provider: data.provider,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      durationMs: data.duration_ms,
      cacheReadTokens: data.usage.cache_read_input_tokens,
      cacheCreationTokens: data.usage.cache_creation_input_tokens,
      contextWindow: getPrimaryContextWindow(data.modelUsage, model),
      contextUsedTokens: occupancyFromUsage(data.usage),
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
