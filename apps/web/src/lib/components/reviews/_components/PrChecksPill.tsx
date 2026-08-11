"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@eva/ui";
import {
  checksOverallTone,
  checksPillLabel,
  countChecks,
} from "./prMergeState";
import { ToneIcon, type PrCheck } from "./prOverviewMeta";

/**
 * CI standing on the tab row. The full verdict lives in the merge box at the foot
 * of Overview, which is three screens down a long scroll and invisible from Diffs
 * — so the one number that decides whether a review is worth starting sits where
 * every tab can see it, and clicking it goes to the detail.
 *
 * Renders nothing until a check reports: an empty pill would read as "no CI" when
 * the truth is "not yet".
 */
export function PrChecksPill({
  checks,
  onSelect,
}: {
  checks: readonly PrCheck[];
  onSelect: () => void;
}) {
  const counts = countChecks(checks);
  const label = checksPillLabel(counts);
  if (label === null) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className="motion-press flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.98]"
        >
          <ToneIcon tone={checksOverallTone(counts)} size={13} />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Show every check on Overview
      </TooltipContent>
    </Tooltip>
  );
}
