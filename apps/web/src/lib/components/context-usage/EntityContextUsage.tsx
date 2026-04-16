"use client";

import { useQuery } from "convex/react";
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
  ContextCacheUsage,
} from "@conductor/ui";
import { parseResultEvent } from "@/lib/utils/logs";
import { useMemo } from "react";

// Model context window sizes (in tokens)
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

// Map our model names to tokenlens ModelId format
function toTokenlensModelId(model: string): string {
  // Anthropic models
  if (model.startsWith("claude-")) {
    return `anthropic:${model}`;
  }
  // OpenAI models
  if (model.startsWith("gpt-")) {
    return `openai:${model}`;
  }
  // Default to anthropic prefix for unknown models
  return `anthropic:${model}`;
}

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
    let latestModel = "";

    for (const log of logs) {
      const parsed = parseResultEvent(log.rawResultEvent);
      totalInputTokens += parsed.inputTokens;
      totalOutputTokens += parsed.outputTokens;
      totalCacheReadTokens += parsed.cacheReadTokens;
      totalCacheCreationTokens += parsed.cacheCreationTokens;
      if (parsed.model !== "-" && !latestModel) {
        latestModel = parsed.model;
      }
    }

    const totalUsedTokens =
      totalInputTokens + totalOutputTokens + totalCacheReadTokens;

    return {
      usedTokens: totalUsedTokens,
      maxTokens: getMaxTokens(latestModel),
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedInputTokens: totalCacheReadTokens + totalCacheCreationTokens,
      },
      modelId: latestModel ? toTokenlensModelId(latestModel) : undefined,
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
      modelId={aggregatedData.modelId}
    >
      <ContextTrigger />
      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody className="space-y-1">
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextCacheUsage />
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  );
}
