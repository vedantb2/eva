"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import { useSimpleView } from "@/lib/hooks/useSimpleView";
import {
  chipSummary,
  usageRowsForAccount,
  USAGE_TONE_TEXT_CLASS,
  type UsageAccountScope,
} from "./_utils";
import { UsageBar } from "./UsageBar";
import { UsageLimitsDetails } from "./UsageLimitsDetails";
import { useMinuteNow } from "./_useMinuteNow";

interface UsageLimitsIndicatorProps {
  repoId: Id<"githubRepos">;
  accountScope?: UsageAccountScope;
}

/**
 * The agent's plan headroom, next to the context gauge it is a sibling of.
 *
 * Unscoped surfaces stay hidden until a reading exists. Account-aware sandbox
 * chats keep a quiet placeholder visible so switching credentials cannot leave
 * another account's stale percentage beside the model picker. Simple view hides
 * it for the same reason it hides the context gauge.
 */
export function UsageLimitsIndicator({
  repoId,
  accountScope,
}: UsageLimitsIndicatorProps) {
  const simpleView = useSimpleView();
  const now = useMinuteNow();
  const rows = useQuery(
    api.usageLimits.getByRepo,
    simpleView ? "skip" : { repoId, now },
  );
  if (simpleView) return null;
  if (rows === undefined) return null;
  const visibleRows = usageRowsForAccount(rows, accountScope);
  const summary = chipSummary(visibleRows, now);
  if (!summary && !accountScope) return null;

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
            className={`font-medium text-xs tabular-nums ${USAGE_TONE_TEXT_CLASS[summary?.tone ?? "neutral"]}`}
          >
            {summary?.label ?? "—"}
          </span>
          {summary?.utilization !== undefined && (
            <UsageBar
              utilization={summary.utilization}
              tone={summary.tone}
              className="w-6 shrink-0"
            />
          )}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-72 overflow-hidden p-0">
        <UsageLimitsDetails
          rows={visibleRows}
          emptyAccountLabel={accountScope?.accountLabel}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
