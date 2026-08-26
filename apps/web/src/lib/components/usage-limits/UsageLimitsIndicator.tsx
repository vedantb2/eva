"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@eva/ui";
import { useSimpleView } from "@/lib/hooks/useSimpleView";
import { chipSummary, USAGE_TONE_TEXT_CLASS } from "./_utils";
import { UsageBar } from "./UsageBar";
import { UsageLimitsDetails } from "./UsageLimitsDetails";
import { useMinuteNow } from "./_useMinuteNow";

interface UsageLimitsIndicatorProps {
  repoId: Id<"githubRepos">;
}

/**
 * Every Claude account's plan headroom for this repo — not the sticky session
 * credential. Mounted on session and sandbox headers regardless of which
 * provider the open chat is running, so Cursor/Codex surfaces still show the
 * Claude meters people care about. Simple view hides it with the context gauge.
 */
export function UsageLimitsIndicator({ repoId }: UsageLimitsIndicatorProps) {
  const simpleView = useSimpleView();
  const now = useMinuteNow();
  const rows = useQuery(
    api.usageLimits.getByRepo,
    simpleView ? "skip" : { repoId, now },
  );
  if (simpleView) return null;
  if (rows === undefined) return null;
  const summary = chipSummary(rows, now);

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
