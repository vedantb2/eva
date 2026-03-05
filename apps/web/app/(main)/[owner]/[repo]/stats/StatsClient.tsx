"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { timeRangeParser } from "@/lib/search-params";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { StatCard } from "@/lib/components/analytics/StatCard";
import { PRsOverTimeChart } from "@/lib/components/analytics/PRsOverTimeChart";
import { SessionFunnel } from "@/lib/components/analytics/SessionFunnel";
import { ActivityTimelineChart } from "@/lib/components/analytics/ActivityTimelineChart";
import { Leaderboard } from "@/lib/components/analytics/Leaderboard";
import {
  TimeRangeFilter,
  TimeRange,
  getStartTime,
  getBucketSize,
} from "@/lib/components/analytics/TimeRangeFilter";
import { Spinner } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

export function StatsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);

  const { startTime, bucketSize, timelineStart } = useMemo(() => {
    const start = getStartTime(timeRange);
    return {
      startTime: start,
      bucketSize: getBucketSize(timeRange),
      timelineStart: start ?? dayjs().subtract(90, "day").valueOf(),
    };
  }, [timeRange]);

  const impactStats = useQuery(api.analytics.getImpactStats, {
    repoId: repo._id,
    startTime,
  });
  const activeUsers = useQuery(api.analytics.getActiveUsers, {
    repoId: repo._id,
  });
  const timeline = useQuery(api.analytics.getActivityTimeline, {
    repoId: repo._id,
    startTime: timelineStart,
    bucketSizeMs: bucketSize,
  });
  const leaderboard = useQuery(api.analytics.getLeaderboard, {
    repoId: repo._id,
    startTime,
  });

  const statsLoaded = impactStats !== undefined && activeUsers !== undefined;
  const chartsLoaded =
    impactStats !== undefined &&
    timeline !== undefined &&
    leaderboard !== undefined;

  return (
    <PageWrapper
      title="Stats"
      headerRight={
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoaded ? (
            <>
              <StatCard
                icon={IconGitPullRequest}
                label="PRs Shipped"
                value={impactStats.prsShipped}
              />
              <StatCard
                icon={IconPercentage}
                label="Ship Rate"
                value={`${impactStats.shipRate}%`}
                subtitle={`${impactStats.sessionsWithPr} of ${impactStats.totalSessions} sessions`}
              />
              <StatCard
                icon={IconUsers}
                label="Humans Prompting"
                value={activeUsers.count}
                subtitle="Last 5 minutes"
              />
              <StatCard
                icon={IconChecklist}
                label="Tasks Completed"
                value={impactStats.tasksCompleted}
              />
            </>
          ) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {chartsLoaded ? (
            <>
              <PRsOverTimeChart timeline={timeline} />
              <SessionFunnel
                totalSessions={impactStats.totalSessions}
                sessionsWithPr={impactStats.sessionsWithPr}
                shipRate={impactStats.shipRate}
              />
              <ActivityTimelineChart timeline={timeline} />
              <Leaderboard entries={leaderboard} />
            </>
          ) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
