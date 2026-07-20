import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { api } from "@conductor/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRepo } from "@/lib/contexts/RepoContext";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { repoStatsRangeParser } from "@/lib/search-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@conductor/ui";
import {
  IconBrandGithub,
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import {
  repoStatsRangeOptions,
  isRepoStatsRange,
  getStatsStartTime,
  getTimelineWindow,
} from "./_utils";
import { StatCard } from "./_components/StatCard";
import { Widget } from "@/lib/components/Widget";
import { RepoLogo } from "@/lib/components/RepoLogo";

export function RepoHomeClient() {
  const { repo } = useRepo();
  const [statsRange, setStatsRange] = useQueryState(
    "statsRange",
    repoStatsRangeParser,
  );
  const startTime = useMemo(() => getStatsStartTime(statsRange), [statsRange]);
  const timelineWindow = useMemo(
    () => getTimelineWindow(statsRange),
    [statsRange],
  );

  const logoUrl = useQuery(api.githubRepos.getLogoUrl, { repoId: repo._id });
  const impactStats = useQuery(api.analytics.getImpactStats, {
    repoId: repo._id,
    startTime,
  });
  const activeUsers = useQuery(api.analytics.getActiveUsers, {
    repoId: repo._id,
  });
  const timeline = useQuery(api.analytics.getActivityTimeline, {
    repoId: repo._id,
    startTime: timelineWindow.startTime,
    bucketSizeMs: timelineWindow.bucketSizeMs,
  });

  const isLoading =
    impactStats === undefined ||
    activeUsers === undefined ||
    timeline === undefined;

  const prsTrend = timeline?.map((bucket) => bucket.prsShipped) ?? [];
  const shipRateTrend =
    timeline?.map((bucket) =>
      bucket.sessions > 0
        ? Math.round((bucket.sessionsWithPr / bucket.sessions) * 100)
        : 0,
    ) ?? [];
  const activeUsersTrend = timeline?.map((bucket) => bucket.activeUsers) ?? [];
  const tasksDoneTrend = timeline?.map((bucket) => bucket.tasksCompleted) ?? [];

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">
        <Widget
          title={
            <span className="flex min-w-0 items-center gap-2.5">
              <RepoLogo
                logoUrl={logoUrl}
                size={28}
                fallback={
                  <IconBrandGithub
                    size={28}
                    className="shrink-0 text-muted-foreground"
                  />
                }
              />
              <span className="truncate text-xl tracking-tight font-semibold text-primary">
                {repoDisplayLabel(repo)}
              </span>
            </span>
          }
          actions={
            <Select
              value={statsRange}
              onValueChange={(value) => {
                if (isRepoStatsRange(value)) {
                  setStatsRange(value);
                }
              }}
            >
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repoStatsRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          contentClassName="overflow-hidden p-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
              <StatCard
                icon={IconGitPullRequest}
                label="PRs Shipped"
                value={impactStats.prsShipped}
                trendValues={prsTrend}
                trendToneClassName="text-chart-1"
              />
              <StatCard
                icon={IconPercentage}
                label="Cook Rate"
                value={impactStats.shipRate + "%"}
                trendValues={shipRateTrend}
                trendToneClassName="text-chart-2"
              />
              <StatCard
                icon={IconUsers}
                label="Cookers Now"
                value={activeUsers.count}
                trendValues={activeUsersTrend}
                trendToneClassName="text-chart-3"
              />
              <StatCard
                icon={IconChecklist}
                label="Tasks Done"
                value={impactStats.tasksCompleted}
                trendValues={tasksDoneTrend}
                trendToneClassName="text-chart-4"
              />
            </div>
          )}
        </Widget>
      </div>
    </div>
  );
}
