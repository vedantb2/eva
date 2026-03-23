"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { api } from "@conductor/backend";
import { useQuery } from "convex/react";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import Image from "next/image";
import {
  repoStatsRangeOptions,
  isRepoStatsRange,
  getStatsStartTime,
  getTimelineWindow,
} from "./_utils";
import { StatCard } from "./_components/StatCard";

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
      <div className="w-full max-w-3xl space-y-4">
        <div className="ui-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 w-max">
                <Image
                  src="/icon.png"
                  alt="Eva"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
                <span className="text-xl tracking-tight font-semibold text-primary">
                  Eva's Stats
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {repo.owner}/{repo.name}
              </p>
            </div>
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
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
