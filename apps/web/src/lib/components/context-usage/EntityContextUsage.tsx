"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
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
} from "@eva/ui";
import { parseResultEvent } from "@/lib/utils/logs";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

// Model context window sizes (in tokens). Used for the usage percentage display;
// not for cost (cost comes from Claude's `total_cost_usd` in the result event).
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "claude-opus-5": 1000000,
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

/**
 * Context-window occupancy is the latest result, not the sum of every turn's
 * cache reads. Session 65 summed ~29M cache-read tokens against a 200k default
 * window and rendered 14,530.8%. Cost still sums across the session.
 */
export function aggregateUsage(logs: AggregatableLog[] | undefined) {
  if (!logs || logs.length === 0) return null;

  let totalCostUsd = 0;
  let latest: ReturnType<typeof parseResultEvent> | null = null;

  for (const log of logs) {
    const parsed = parseResultEvent(log.rawResultEvent);
    totalCostUsd += parsed.costUsd;
    if (latest === null && parsed.model !== "-") {
      latest = parsed;
    }
  }

  if (latest === null) {
    const first = logs[0];
    if (first === undefined) return null;
    latest = parseResultEvent(first.rawResultEvent);
  }

  const maxTokens =
    latest.contextWindow > 0
      ? latest.contextWindow
      : getMaxTokens(latest.model);

  return {
    usedTokens: latest.contextUsedTokens,
    maxTokens,
    usage: {
      inputTokens: latest.inputTokens,
      outputTokens: latest.outputTokens,
      cachedInputReadTokens: latest.cacheReadTokens,
      cachedInputWriteTokens: latest.cacheCreationTokens,
    },
    costs: {
      totalUSD: totalCostUsd,
    },
  };
}

function ContextUsageDisplay({
  aggregated,
}: {
  aggregated: ReturnType<typeof aggregateUsage>;
}) {
  if (!aggregated) return null;

  return (
    <Context
      usedTokens={aggregated.usedTokens}
      maxTokens={aggregated.maxTokens}
      usage={aggregated.usage}
      costs={aggregated.costs}
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

interface EntityContextUsageProps {
  repoId: Id<"githubRepos">;
  entityId: string;
}

export function EntityContextUsage({
  repoId,
  entityId,
}: EntityContextUsageProps) {
  const simpleView = useSimpleView();
  const logs = useQuery(
    api.logs.getByEntityId,
    simpleView ? "skip" : { repoId, entityId },
  );
  if (simpleView) return null;
  const aggregated = aggregateUsage(logs);
  return <ContextUsageDisplay aggregated={aggregated} />;
}

interface ProjectContextUsageProps {
  repoId: Id<"githubRepos">;
  projectId: Id<"projects">;
}

// Aggregates usage across every log tagged with the projectId — project chats,
// project tasks, interviews — so the project header reflects total spend.
export function ProjectContextUsage({
  repoId,
  projectId,
}: ProjectContextUsageProps) {
  const simpleView = useSimpleView();
  const logs = useQuery(
    api.logs.getByProjectId,
    simpleView ? "skip" : { repoId, projectId },
  );
  if (simpleView) return null;
  const aggregated = aggregateUsage(logs);
  return <ContextUsageDisplay aggregated={aggregated} />;
}
