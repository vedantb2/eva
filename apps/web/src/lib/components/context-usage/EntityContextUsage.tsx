"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextCacheReadUsage,
  ContextCacheWriteUsage,
} from "@conductor/ui";
import { parseResultEvent } from "@/lib/utils/logs";
import { useMemo } from "react";

// Model context window sizes (in tokens). Used for the usage percentage display;
// not for cost (cost comes from Claude's `total_cost_usd` in the result event).
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

interface EntityContextUsageProps {
  repoId: Id<"githubRepos">;
  entityId: string;
}

export function EntityContextUsage({
  repoId,
  entityId,
}: EntityContextUsageProps) {
  const logs = useQuery(api.logs.getByEntityId, { repoId, entityId });

  const aggregatedData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCostUsd = 0;
    let latestModel = "";

    for (const log of logs) {
      const parsed = parseResultEvent(log.rawResultEvent);
      totalInputTokens += parsed.inputTokens;
      totalOutputTokens += parsed.outputTokens;
      totalCacheReadTokens += parsed.cacheReadTokens;
      totalCacheCreationTokens += parsed.cacheCreationTokens;
      totalCostUsd += parsed.costUsd;
      if (parsed.model !== "-" && !latestModel) {
        latestModel = parsed.model;
      }
    }

    // Total tokens consumed counts every input-side token: pure input, cache
    // reads (still occupy context), cache writes (written into prompt), plus output.
    const totalUsedTokens =
      totalInputTokens +
      totalOutputTokens +
      totalCacheReadTokens +
      totalCacheCreationTokens;

    return {
      usedTokens: totalUsedTokens,
      maxTokens: getMaxTokens(latestModel),
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedInputReadTokens: totalCacheReadTokens,
        cachedInputWriteTokens: totalCacheCreationTokens,
      },
      costs: {
        totalUSD: totalCostUsd,
      },
    };
  }, [logs]);

  // Don't render if no logs or still loading
  if (!aggregatedData) {
    return null;
  }

  return (
    <Context
      usedTokens={aggregatedData.usedTokens}
      maxTokens={aggregatedData.maxTokens}
      usage={aggregatedData.usage}
      costs={aggregatedData.costs}
    >
      <ContextTrigger />
      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody className="space-y-1">
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextCacheReadUsage />
          <ContextCacheWriteUsage />
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  );
}
