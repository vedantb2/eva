"use client";

import type { ReactNode } from "react";
import { Button, Spinner, cn } from "@eva/ui";
import {
  IconArrowNarrowLeft,
  IconFiles,
  IconGitCommit,
  IconRefresh,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { DiffCountBar } from "@/lib/components/sandbox/DiffFileBadges";
import { headerBlocker } from "./prMergeState";
import { PrRemedyButton } from "./PrRemedyButton";
import {
  PrStatusPill,
  ToneIcon,
  type PrOverview,
  type StatusTone,
} from "./prOverviewMeta";

const BLOCKER_TONE_CLASS: Record<StatusTone, string> = {
  failure: "bg-destructive/15 text-destructive",
  pending: "bg-muted text-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

/**
 * The chrome above the review tabs: lifecycle, who owns the change, what is being
 * merged into what, how big it is, and whether anything is in the way.
 *
 * Deliberately above the tab row rather than inside Overview. All of this stays
 * true while the reader is in Diffs or Recap, and burying it in one tab meant the
 * other two gave no way to tell a mergeable pull request from a conflicted one.
 *
 * `onRefresh` is absent where the surface's own chrome carries a Refresh control,
 * so the two never both appear.
 */
export function ReviewHeader({
  overview,
  refreshing,
  onRefresh,
  title,
}: {
  overview: PrOverview;
  refreshing: boolean;
  onRefresh?: () => void;
  /** The surface's own block above this one — the standalone page's PR title. */
  title?: ReactNode;
}) {
  const blocker = headerBlocker(overview);
  const commits = overview.commitCount;

  return (
    <div className="shrink-0 space-y-2 px-3 pt-3">
      {title}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <PrStatusPill status={overview.status} draft={overview.draft} />

        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {overview.authorAvatarUrl ? (
            <img
              src={overview.authorAvatarUrl}
              alt=""
              className="size-4 shrink-0 rounded-full"
            />
          ) : null}
          <span className="truncate font-medium text-foreground">
            {overview.authorLogin ?? "Someone"}
          </span>
          <span className="shrink-0">
            · updated{" "}
            <RelativeDateTime at={new Date(overview.updatedAt).getTime()} />
          </span>
        </span>

        {onRefresh === undefined ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-auto shrink-0 text-muted-foreground"
          >
            {refreshing ? (
              <Spinner size="sm" />
            ) : (
              <IconRefresh size={14} aria-hidden />
            )}
            Refresh
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* Target on the left, as the arrow reads: this branch goes into that
            one. The sentence this replaced wrapped to three lines in a session
            pane and could not share a row with the change totals. */}
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
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

        <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconGitCommit size={13} aria-hidden />
            <span className="tabular-nums">{commits}</span>
            {commits === 1 ? "commit" : "commits"}
          </span>
          <span className="flex items-center gap-1">
            <IconFiles size={13} aria-hidden />
            <span className="tabular-nums">{overview.changedFiles}</span>
            {overview.changedFiles === 1 ? "file" : "files"}
          </span>
          <DiffCountBar
            additions={overview.additions}
            deletions={overview.deletions}
          />
        </span>
      </div>

      {blocker === null ? null : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              BLOCKER_TONE_CLASS[blocker.tone],
            )}
          >
            <ToneIcon tone={blocker.tone} size={13} />
            {blocker.label}
          </span>
          {blocker.remedy === null ? null : (
            <span className="ml-auto">
              <PrRemedyButton
                remedy={blocker.remedy}
                headRef={overview.headRef}
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
