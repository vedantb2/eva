"use client";

import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import {
  IconChevronRight,
  IconGitPullRequest,
  IconPercentage,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { StatsIcon } from "@/lib/components/sidebar/icons/AnimatedNavIcons";
import { OnlineTeamAvatars } from "@/lib/components/sidebar/TeamMembers";

type RepoDoc = FunctionReturnType<typeof api.githubRepos.getByOwnerAndName>;

interface RepoStatsSummaryProps {
  repo: RepoDoc | null | undefined;
  repoBasePath: string;
  collapsed: boolean;
}

/**
 * Compact sidebar footer: PRs + cook rate (link to Stats) with online teammates
 * in the space that used to show cookers/tasks counts.
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

  if (!repo || impactStats === undefined) {
    return null;
  }

  const items: { icon: TablerIcon; label: string; value: string | number }[] = [
    {
      icon: IconGitPullRequest,
      label: "PRs shipped",
      value: impactStats.prsShipped,
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
        {items.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link
                to={statsHref}
                className="flex flex-col items-center rounded-surface px-1 py-0.5 transition-colors hover:bg-muted/50"
              >
                <item.icon size={14} className="text-muted-foreground" />
                <span className="text-[11px] font-semibold tabular-nums leading-tight text-sidebar-foreground">
                  {item.value}
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
        <OnlineTeamAvatars collapsed />
      </div>
    );
  }

  return (
    <div className={cn("ui-surface p-2.5")}>
      <Link
        to={statsHref}
        className="block rounded-md transition-colors hover:bg-muted/40 -m-1 p-1"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <StatsIcon size={14} className="text-primary" />
          <span className="text-xs font-medium text-sidebar-foreground">
            Stats
          </span>
          <IconChevronRight
            size={14}
            className="ml-auto shrink-0 text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <item.icon size={15} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none tabular-nums text-sidebar-foreground">
                  {item.value}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Link>
      <OnlineTeamAvatars collapsed={false} />
    </div>
  );
}
