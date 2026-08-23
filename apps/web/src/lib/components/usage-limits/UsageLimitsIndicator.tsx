"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@eva/ui";
import { useSimpleView } from "@/lib/hooks/useSimpleView";
import { chipSummary, USAGE_TONE_TEXT_CLASS } from "./_utils";
import { UsageBar } from "./UsageBar";
import { UsageLimitsDetails } from "./UsageLimitsDetails";

interface UsageLimitsIndicatorProps {
  repoId: Id<"githubRepos">;
}

/**
 * The agent's plan headroom, next to the context gauge it is a sibling of.
 *
 * Nothing renders until a turn has reported a reading, so a repo whose provider
 * exposes no limits (an API key, a self-hosted model) never grows an empty chip.
 * Simple view hides it for the same reason it hides the context gauge.
 */
export function UsageLimitsIndicator({ repoId }: UsageLimitsIndicatorProps) {
  const simpleView = useSimpleView();
  const rows = useQuery(
    api.usageLimits.getByRepo,
    simpleView ? "skip" : { repoId },
  );
  if (simpleView) return null;
  const summary = rows === undefined ? undefined : chipSummary(rows);
  if (!rows || !summary) return null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Agent plan usage"
        >
          <span
            className={`font-medium text-xs tabular-nums ${USAGE_TONE_TEXT_CLASS[summary.tone]}`}
          >
            {summary.label}
          </span>
          {summary.utilization !== undefined && (
            <UsageBar
              utilization={summary.utilization}
              tone={summary.tone}
              className="w-6 shrink-0"
            />
          )}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-72 overflow-hidden p-0">
        <UsageLimitsDetails rows={rows} />
      </HoverCardContent>
    </HoverCard>
  );
}
