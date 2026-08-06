"use client";

import { Button, Spinner, cn } from "@eva/ui";
import {
  IconGitMerge,
  IconGitPullRequest,
  IconGitPullRequestClosed,
  IconRefresh,
} from "@tabler/icons-react";
import { statusMeta, type PrOverview } from "./prOverviewMeta";

function StatusIcon({ status }: { status: PrOverview["status"] }) {
  if (status === "merged") return <IconGitMerge size={13} aria-hidden />;
  if (status === "closed") {
    return <IconGitPullRequestClosed size={13} aria-hidden />;
  }
  return <IconGitPullRequest size={13} aria-hidden />;
}

/**
 * The line GitHub puts under a pull request title: lifecycle pill, then who is
 * merging what into where. The title itself is not here — both surfaces render
 * it in their own chrome above the tabs.
 *
 * `onRefresh` is absent on a surface whose chrome already carries a Refresh
 * control (the standalone Reviews page), so the tab does not repeat it.
 */
export function PrOverviewHeader({
  overview,
  refreshing,
  onRefresh,
}: {
  overview: PrOverview;
  refreshing: boolean;
  onRefresh?: () => void;
}) {
  const status = statusMeta(overview.status, overview.draft);
  const commits = overview.commitCount;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          status.className,
        )}
      >
        <StatusIcon status={overview.status} />
        {status.label}
      </span>

      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {overview.authorLogin ?? "Someone"}
        </span>{" "}
        wants to merge {commits} {commits === 1 ? "commit" : "commits"} into{" "}
        <BranchRef name={overview.baseRef} /> from{" "}
        <BranchRef name={overview.headRef} />
      </p>

      {onRefresh === undefined ? null : (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={refreshing}
          className="shrink-0 text-muted-foreground"
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
  );
}

function BranchRef({ name }: { name: string }) {
  return (
    <span className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[0.8125rem] text-foreground">
      {name}
    </span>
  );
}
