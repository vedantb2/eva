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
      {aggregated.reporting.status === "unavailable" ? (
        <ContextTrigger>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${aggregated.reporting.provider} context usage unavailable`}
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
        {aggregated.reporting.status === "unavailable" ? (
          <ContextContentHeader>
            <p className="text-sm font-medium">Context usage unavailable</p>
            <p className="text-xs text-muted-foreground">
              {aggregated.reporting.provider} did not report token or context
              usage for this run.
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
          {aggregated.reporting.status === "partial" ? (
            <p className="pt-1 text-xs text-muted-foreground">
              {aggregated.reporting.providers.join(", ")} did not report
              complete context or token data for part of this usage.
            </p>
          ) : null}
        </ContextContentBody>
        {aggregated.reporting.status === "unavailable" ? (
          <ContextContentFooter>
            <span className="text-muted-foreground">
              {aggregated.reporting.provider}
            </span>
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
