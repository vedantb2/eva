import { parseResultEvent, type ParsedResultEvent } from "@/lib/utils/logs";

// Fallbacks are only used for providers that do not report an authoritative
// context window. ACP `usage_update.size` always takes precedence.
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "claude-sonnet-4-20250514": 200000,
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-5-haiku-20241022": 200000,
  "claude-3-opus-20240229": 200000,
  "claude-3-sonnet-20240229": 200000,
  "claude-3-haiku-20240307": 200000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4-turbo": 128000,
  "gpt-4": 8192,
  "gpt-3.5-turbo": 16385,
};

function getMaxTokens(model: string): number {
  return MODEL_CONTEXT_WINDOWS[model] ?? 200000;
}

type AggregatableLog = { rawResultEvent: string | undefined };

function addUsage(
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  },
  event: ParsedResultEvent,
): void {
  totals.inputTokens += event.inputTokens;
  totals.outputTokens += event.outputTokens;
  totals.cacheReadTokens += event.cacheReadTokens;
  totals.cacheCreationTokens += event.cacheCreationTokens;
}

/**
 * Aggregates turn-scoped providers normally, but only counts the newest
 * cumulative Cursor report for each ACP session. Logs arrive newest-first.
 */
export function aggregateContextUsage(logs: AggregatableLog[] | undefined) {
  if (!logs || logs.length === 0) return null;

  const events = logs.map((log) => parseResultEvent(log.rawResultEvent));
  const latestEvent = events.find((event) => event.provider.length > 0);
  const latestModel = events.find((event) => event.model !== "-")?.model ?? "";
  const latestCursorSessionId =
    latestEvent?.provider === "cursor" ? latestEvent.sessionId : "";
  const latestContext =
    latestEvent?.provider === "cursor"
      ? events.find(
          (event) =>
            event.provider === "cursor" &&
            event.sessionId === latestCursorSessionId &&
            event.contextUsedTokens !== undefined &&
            event.contextWindowSize !== undefined,
        )
      : undefined;

  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };
  const countedSessions = new Set<string>();
  let totalCostUsd = 0;
  let costAvailable = false;
  let partial = false;

  for (const event of events) {
    const isSessionTotal =
      event.usageScope === "session" && event.sessionId.length > 0;
    if (isSessionTotal) {
      if (countedSessions.has(event.sessionId)) continue;
      countedSessions.add(event.sessionId);
    }
    if (event.provider === "cursor" && !event.usageAvailable) {
      partial = true;
    }
    if (event.usageAvailable) addUsage(totals, event);
    if (event.costAvailable) {
      totalCostUsd += event.costUsd;
      costAvailable = true;
    }
  }

  const knownUsedTokens =
    totals.inputTokens +
    totals.outputTokens +
    totals.cacheReadTokens +
    totals.cacheCreationTokens;
  const hasAuthoritativeContext = latestContext !== undefined;

  return {
    usedTokens: latestContext?.contextUsedTokens ?? knownUsedTokens,
    maxTokens: latestContext?.contextWindowSize ?? getMaxTokens(latestModel),
    contextUnavailable:
      latestEvent?.provider === "cursor" && !hasAuthoritativeContext,
    partial,
    usage: {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cachedInputReadTokens: totals.cacheReadTokens,
      cachedInputWriteTokens: totals.cacheCreationTokens,
    },
    costs: costAvailable ? { totalUSD: totalCostUsd } : undefined,
  };
}
