import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import {
  IconGitPullRequest,
  IconPercentage,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger } from "@eva/ui";
import { OnlineTeamAvatars } from "@/lib/components/sidebar/TeamMembers";

type RepoDoc = FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>;

interface RepoStatsSummaryProps {
  repo: RepoDoc | null | undefined;
  repoBasePath: string;
  collapsed: boolean;
}

/**
 * Compact sidebar footer: online teammates above tasks ran + cook rate
 * (link to Stats).
 */
export function RepoStatsSummary({
  repo,
  repoBasePath,
  collapsed,
}: RepoStatsSummaryProps) {
  const impactStats = useQuery(
    api.analytics.getImpactStats,
    repo ? { repoId: repo._id } : "skip",
  );

  // Reserve footer height while stats load so the nav list does not jump (CLS).
  if (!repo) {
    return null;
  }
  if (impactStats === undefined) {
    return collapsed ? (
      <div
        className="flex min-h-[4.5rem] flex-col items-center gap-1.5"
        aria-busy="true"
        aria-label="Loading stats"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8" />
        <div
          className="min-h-[4.5rem] py-1"
          aria-busy="true"
          aria-label="Loading stats"
        >
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
      </div>
    );
  }

  const items: { icon: TablerIcon; label: string; value: string | number }[] = [
    {
      icon: IconGitPullRequest,
      label: "Tasks ran",
      value: impactStats.tasksRan,
    },
    {
      icon: IconPercentage,
      label: "Cook rate",
      value: `${impactStats.shipRate}%`,
    },
  ];

  const statsHref = `${repoBasePath}/stats`;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <OnlineTeamAvatars collapsed />
        {items.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link
                to={statsHref}
                className="flex flex-col items-center rounded-surface px-1 py-0.5 transition-colors hover:bg-muted/50"
              >
                <item.icon size={14} className="text-muted-foreground" />
                <span className="text-2xs font-semibold tabular-nums leading-tight text-sidebar-foreground">
                  {item.value}
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <OnlineTeamAvatars collapsed={false} />
      <Link
        to={statsHref}
        className="block rounded-md py-1 transition-colors hover:bg-muted/40"
      >
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <item.icon size={15} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none tabular-nums text-sidebar-foreground">
                  {item.value}
                </p>
                <p className="mt-0.5 truncate text-3xs text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
