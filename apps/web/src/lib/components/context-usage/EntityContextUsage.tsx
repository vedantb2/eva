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
  Button,
} from "@eva/ui";
import { aggregateContextUsage } from "./contextUsage";

function ContextUsageDisplay({
  aggregated,
}: {
  aggregated: ReturnType<typeof aggregateContextUsage>;
}) {
  if (!aggregated) return null;

  return (
    <Context
      usedTokens={aggregated.usedTokens}
      maxTokens={aggregated.maxTokens}
      usage={aggregated.usage}
      costs={aggregated.costs}
    >
      {aggregated.contextUnavailable ? (
        <ContextTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Cursor context usage unavailable"
          >
            <span className="font-medium text-muted-foreground text-xs">—</span>
            <span
              aria-hidden="true"
              className="size-4 rounded-full border border-dashed border-muted-foreground/70"
            />
          </Button>
        </ContextTrigger>
      ) : (
        <ContextTrigger />
      )}
      <ContextContent>
        {aggregated.contextUnavailable ? (
          <ContextContentHeader>
            <p className="text-sm font-medium">Context usage unavailable</p>
            <p className="text-xs text-muted-foreground">
              Cursor ACP did not report context occupancy for this session.
            </p>
          </ContextContentHeader>
        ) : (
          <ContextContentHeader />
        )}
        <ContextContentBody className="space-y-1">
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextCacheReadUsage />
          <ContextCacheWriteUsage />
          {aggregated.partial ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Cursor did not report token totals for part of this usage.
            </p>
          ) : null}
        </ContextContentBody>
        {aggregated.contextUnavailable ? (
          <ContextContentFooter>
            <span className="text-muted-foreground">Cursor ACP</span>
            <span>Not reported</span>
          </ContextContentFooter>
        ) : (
          <ContextContentFooter />
        )}
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
  const logs = useQuery(api.logs.getByEntityId, { repoId, entityId });
  const aggregated = aggregateContextUsage(logs);
  return <ContextUsageDisplay aggregated={aggregated} />;
}

interface ProjectContextUsageProps {
  repoId: Id<"githubRepos">;
  projectId: Id<"projects">;
}

// Aggregates usage across every log tagged with the projectId — project chats,
// project tasks, audits, interviews — so the project header reflects total spend.
export function ProjectContextUsage({
  repoId,
  projectId,
}: ProjectContextUsageProps) {
  const logs = useQuery(api.logs.getByProjectId, { repoId, projectId });
  const aggregated = aggregateContextUsage(logs);
  return <ContextUsageDisplay aggregated={aggregated} />;
}
