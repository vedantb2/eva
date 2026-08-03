"use client";

import { Badge, Button, Spinner } from "@eva/ui";
import {
  IconGitMerge,
  IconGitPullRequest,
  IconGitPullRequestClosed,
  IconRefresh,
} from "@tabler/icons-react";
import { statusMeta, type PrOverview } from "./prOverviewMeta";

function StatusIcon({
  status,
  className,
}: {
  status: PrOverview["status"];
  className: string;
}) {
  if (status === "merged") {
    return <IconGitMerge size={13} className={className} aria-hidden />;
  }
  if (status === "closed") {
    return (
      <IconGitPullRequestClosed size={13} className={className} aria-hidden />
    );
  }
  return <IconGitPullRequest size={13} className={className} aria-hidden />;
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
      {/* Quiet badge, coloured glyph: the lifecycle still reads at a glance
          without a filled pill shouting from the top of the page. */}
      <Badge variant="quiet" className="shrink-0 gap-1.5 font-medium">
        <StatusIcon
          status={overview.status}
          className={status.glyphClassName}
        />
        {status.label}
      </Badge>

      <p className="min-w-0 flex-1 text-2sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {overview.authorLogin ?? "Someone"}
        </span>{" "}
        wants to merge {commits} {commits === 1 ? "commit" : "commits"} into{" "}
        <BranchRef name={overview.baseRef} /> from{" "}
        <BranchRef name={overview.headRef} />
      </p>

      {onRefresh === undefined ? null : (
        <Button
          size="xs"
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
    <span className="rounded-control border border-border bg-muted/60 px-1 py-0.5 font-mono text-2sm text-foreground">
      {name}
    </span>
  );
}
