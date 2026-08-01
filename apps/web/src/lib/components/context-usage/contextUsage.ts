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

export type ContextUsageReporting =
  | { status: "complete" }
  | { status: "partial"; providers: string[] }
  | { status: "unavailable"; provider: string };

function providerName(event: ParsedResultEvent): string {
  const provider = event.provider.toLowerCase();
  if (provider === "claude" || provider === "anthropic") return "Claude";
  if (provider === "codex" || provider === "openai") return "Codex";
  if (provider === "opencode") return "OpenCode";
  if (provider === "cursor") return "Cursor";

  // Historical Claude result events predate the explicit provider field.
  if (event.model.toLowerCase().includes("claude")) return "Claude";
  return provider.length > 0 ? provider : "Model provider";
}

function hasResultMetadata(event: ParsedResultEvent): boolean {
  return (
    event.provider.length > 0 ||
    event.model !== "-" ||
    event.usageAvailable ||
    event.costAvailable ||
    event.contextUsedTokens !== undefined ||
    event.contextWindowSize !== undefined
  );
}

function isContextReportForLatestProvider(
  event: ParsedResultEvent,
  latestEvent: ParsedResultEvent,
): boolean {
  if (
    event.contextUsedTokens === undefined ||
    event.contextWindowSize === undefined
  ) {
    return false;
  }
  if (latestEvent.sessionId.length > 0) {
    return event.sessionId === latestEvent.sessionId;
  }
  return event === latestEvent;
}

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
  // Provider tags were added after usage logging. Treat the newest event with
  // real result metadata as current so a valid historical Claude event is not
  // skipped in favour of an older, explicitly-tagged Cursor event.
  const latestEvent = events.find(hasResultMetadata);
  if (latestEvent === undefined) return null;
  const latestModel = events.find((event) => event.model !== "-")?.model ?? "";
  const latestContext = events.find((event) =>
    isContextReportForLatestProvider(event, latestEvent),
  );

  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };
  const countedSessions = new Set<string>();
  const incompleteProviders = new Set<string>();
  let totalCostUsd = 0;
  let costAvailable = false;
  let usageAvailable = false;

  for (const event of events) {
    const isSessionTotal =
      event.usageScope === "session" && event.sessionId.length > 0;
    if (isSessionTotal) {
      if (countedSessions.has(event.sessionId)) continue;
      countedSessions.add(event.sessionId);
    }
    if (!event.usageAvailable && event.provider.length > 0) {
      incompleteProviders.add(providerName(event));
    }
    if (event.usageAvailable) {
      usageAvailable = true;
      addUsage(totals, event);
    }
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
  if (providerName(latestEvent) === "Cursor" && !hasAuthoritativeContext) {
    incompleteProviders.add("Cursor");
  }

  let reporting: ContextUsageReporting;
  if (!usageAvailable && !hasAuthoritativeContext) {
    reporting = {
      status: "unavailable",
      provider: providerName(latestEvent),
    };
  } else if (incompleteProviders.size > 0) {
    reporting = {
      status: "partial",
      providers: Array.from(incompleteProviders),
    };
  } else {
    reporting = { status: "complete" };
  }

  return {
    usedTokens: latestContext?.contextUsedTokens ?? knownUsedTokens,
    maxTokens: latestContext?.contextWindowSize ?? getMaxTokens(latestModel),
    reporting,
    usage: {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cachedInputReadTokens: totals.cacheReadTokens,
      cachedInputWriteTokens: totals.cacheCreationTokens,
    },
    costs: costAvailable ? { totalUSD: totalCostUsd } : undefined,
  };
}
