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

interface UsageLimitsIndicatorProps {
  repoId: Id<"githubRepos">;
  /**
   * The credential the open chat is running on. Scopes the chip / bar only —
   * the popover still lists every Claude account on the repo. Absent on
   * Cursor/Codex chats (and while the sticky account is still loading).
   */
  accountScope?: UsageAccountScope;
}

/**
 * Plan-usage chip for the open chat's Claude account, with a popover that
 * shows every Claude account on the repo. Simple view hides it with the
 * context gauge.
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
  const chipRows = accountScope
    ? usageRowsForAccount(rows, accountScope)
    : rows;
  const summary = chipSummary(chipRows, now);

  return (
    // A popover rather than a hover card: the card now carries refresh
    // controls, so it has to be reachable by click, keyboard and touch.
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
        <UsageLimitsDetails repoId={repoId} rows={rows} now={now} />
      </PopoverContent>
    </Popover>
  );
}
