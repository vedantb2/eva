"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@eva/ui";
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
import type { UsageRefreshTarget } from "./UsageRefreshButton";

interface UsageLimitsIndicatorProps {
  repoId: Id<"githubRepos">;
  /** Always a Claude credential — callers omit this component otherwise. */
  accountScope: UsageAccountScope;
  /** The live daemon that answers an on-demand refresh. */
  refreshTarget: UsageRefreshTarget;
}

/**
 * The agent's Claude plan headroom, next to the context gauge it is a sibling of.
 *
 * Only mounted on Claude chats: other providers have no plan windows, and an
 * unscoped read would show whichever Claude account last reported on the repo.
 * Simple view hides it for the same reason it hides the context gauge.
 */
export function UsageLimitsIndicator({
  repoId,
  accountScope,
  refreshTarget,
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

  return (
    // A popover rather than a hover card: the card now carries a refresh
    // button, so it has to be reachable by click, keyboard and touch.
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 overflow-hidden p-0">
        <UsageLimitsDetails
          repoId={repoId}
          rows={visibleRows}
          now={now}
          accountScope={accountScope}
          refreshTarget={refreshTarget}
        />
      </PopoverContent>
    </Popover>
  );
}
