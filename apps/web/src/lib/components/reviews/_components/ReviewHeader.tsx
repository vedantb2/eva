"use client";

import type { ReactNode } from "react";
import { Button, Spinner, cn } from "@eva/ui";
import { IconArrowNarrowLeft, IconRefresh } from "@tabler/icons-react";
import { headerBlocker } from "./prMergeState";
import { PrRemedyButton } from "./PrRemedyButton";
import {
  PrStatusPill,
  ToneIcon,
  type PrOverview,
  type StatusTone,
} from "./prOverviewMeta";

const BLOCKER_TONE_CLASS: Record<StatusTone, string> = {
  failure: "text-destructive",
  pending: "text-muted-foreground",
  neutral: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-300",
};

/**
 * The chrome above the review tabs: who owns the change, what is being merged
 * into what, how big it is, and whether anything is in the way.
 *
 * Deliberately above the tab row rather than inside Overview. All of this stays
 * true while the reader is in Diffs or Recap, and burying it in one tab meant the
 * other two gave no way to tell a mergeable pull request from a conflicted one.
 *
 * Two rows, plus a third only when something blocks. The title row opens with the
 * lifecycle pill, so the first thing read is what state this pull request is in;
 * the line under it is whose branch this is and where it is going. Size and
 * freshness live on the tab row (`PrTabRail`), which is on screen for every tab.
 *
 * Colour is spent on the status pill and, when it appears, the blocker line. The
 * rest is neutral, so those two are what the eye lands on.
 *
 * `onRefresh` is absent where the surface's own chrome carries a Refresh control,
 * so the two never both appear.
 */
export function ReviewHeader({
  overview,
  refreshing,
  onRefresh,
  title,
  breadcrumb,
}: {
  overview: PrOverview;
  refreshing: boolean;
  onRefresh?: () => void;
  /** The surface's own block above this one — the standalone page's PR title. */
  title?: ReactNode;
  /** Repository breadcrumb, above the title row. Standalone page only. */
  breadcrumb?: ReactNode;
}) {
  const blocker = headerBlocker(overview);

  return (
    <div className="shrink-0 space-y-2 px-4 pt-3">
      {breadcrumb}
      {title === undefined ? null : (
        // The pill leads the title rather than trailing the author line, so the
        // state of the pull request is read before its name. `mt-0.5` optically
        // centres a 20px pill on the title's first line rather than on the block,
        // which is what `items-center` would do once the title wraps.
        <div className="flex min-w-0 items-start gap-2">
          <PrStatusPill
            status={overview.status}
            draft={overview.draft}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">{title}</div>
        </div>
      )}

      {/* One secondary line: who, from where to where, how big, how fresh. The
          author and the branches are the same fact — this person's branch — so
          they sit together rather than in the two rows this replaced. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
        {/* No title slot means the compact sandbox pane, which has no large type
            for the pill to lead; it opens this line instead. */}
        {title === undefined ? (
          <PrStatusPill status={overview.status} draft={overview.draft} />
        ) : null}

        {overview.authorAvatarUrl ? (
          <img
            src={overview.authorAvatarUrl}
            alt=""
            className="size-4 shrink-0 rounded-full"
          />
        ) : null}
        <span className="min-w-0 truncate font-medium text-foreground">
          {overview.authorLogin ?? "Someone"}
        </span>

        {/* Target on the left, as the arrow reads: this branch goes into that
            one. `flex-auto` and not `flex-1`: the line breaks on content widths,
            so a trailing control wraps as a unit instead of the branches
            shrinking to nothing to keep everything on one line. */}
        <span className="flex min-w-0 flex-auto items-center gap-1.5">
          {/* Base refs are short and always worth reading in full; head refs are
              generated (`eva/task-m57569wftd7p63r0mrc53…`), so the head is the
              one that gives up width when the row is tight. */}
          <BranchChip name={overview.baseRef} className="shrink-0" />
          <IconArrowNarrowLeft
            size={14}
            className="shrink-0 text-muted-foreground"
            aria-label="merges from"
          />
          <BranchChip name={overview.headRef} />
        </span>

        {/* Freshness and the diffstat used to end this line. They sit on the tab
            row now (`PrTabRail`), which has an empty right half on every surface
            and keeps this line to one fact: whose branch this is. */}
        {onRefresh === undefined ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh"
            className="-my-1 ml-auto size-7 shrink-0 p-0 text-muted-foreground"
          >
            {refreshing ? (
              <Spinner size="sm" />
            ) : (
              <IconRefresh size={14} aria-hidden />
            )}
          </Button>
        )}
      </div>

      {blocker === null ? null : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "flex min-w-0 items-center gap-1.5 text-xs font-medium",
              BLOCKER_TONE_CLASS[blocker.tone],
            )}
          >
            <ToneIcon tone={blocker.tone} size={13} />
            {blocker.label}
          </span>
          {blocker.remedy === null ? null : (
            // Right-aligned like the two rows above it, so Refresh, the change
            // totals, and the remedy form one rail down the header's edge.
            <span className="ml-auto">
              <PrRemedyButton
                remedy={blocker.remedy}
                headRef={overview.headRef}
                tone={blocker.tone}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BranchChip({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "min-w-0 truncate rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground",
        className,
      )}
      title={name}
    >
      {name}
    </span>
  );
}
