"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { StatCard } from "@/lib/components/analytics/StatCard";
import { TaskStatusChart } from "@/lib/components/analytics/TaskStatusChart";
import { RunSuccessChart } from "@/lib/components/analytics/RunSuccessChart";
import { SessionActivityChart } from "@/lib/components/analytics/SessionActivityChart";
import { FeatureProgressChart } from "@/lib/components/analytics/FeatureProgressChart";
import {
  TimeRangeFilter,
  TimeRange,
  getStartTime,
  getBucketSize,
} from "@/lib/components/analytics/TimeRangeFilter";
import { Leaderboard } from "@/lib/components/analytics/Leaderboard";
import {
  IconChecklist,
  IconPercentage,
  IconTerminal2,
  IconGitPullRequest,
} from "@tabler/icons-react";

const DAY_MS = 24 * 60 * 60 * 1000;

export function AnalyticsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { startTime, bucketSize, timelineStart } = useMemo(() => {
    const now = Date.now();
    const start = getStartTime(timeRange);
    return {
      startTime: start,
      bucketSize: getBucketSize(timeRange),
      timelineStart: start ?? now - 90 * DAY_MS,
    };
  }, [timeRange]);

  const taskStats = useQuery(api.analytics.getTaskStats, {
    repoId: repo._id,
    startTime,
  });

  const runStats = useQuery(api.analytics.getRunStats, {
    repoId: repo._id,
    startTime,
  });

  const sessionStats = useQuery(api.analytics.getSessionStats, {
    repoId: repo._id,
    startTime,
  });

  const featureStats = useQuery(api.analytics.getFeatureStats, {
    repoId: repo._id,
    startTime,
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

  const isLoading =
    taskStats === undefined ||
    runStats === undefined ||
    sessionStats === undefined ||
    featureStats === undefined ||
    timeline === undefined ||
    leaderboard === undefined;

  return (
    <PageWrapper
      title="Analytics"
      headerRight={<TimeRangeFilter value={timeRange} onChange={setTimeRange} />}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={IconChecklist}
              label="Total Tasks"
              value={taskStats.total}
              color="pink"
            />
            <StatCard
              icon={IconPercentage}
              label="Run Success Rate"
              value={`${runStats.successRate}%`}
              color="green"
            />
            <StatCard
              icon={IconTerminal2}
              label="Active Sessions"
              value={sessionStats.active}
              color="yellow"
            />
            <StatCard
              icon={IconGitPullRequest}
              label="PRs Created"
              value={runStats.prsCreated}
              color="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TaskStatusChart data={taskStats.byStatus} />
            <RunSuccessChart
              timeline={timeline}
              successCount={runStats.byStatus.success}
              errorCount={runStats.byStatus.error}
            />
            <SessionActivityChart
              timeline={timeline}
              messagesByMode={sessionStats.messagesByMode}
            />
            <FeatureProgressChart features={featureStats.topFeatures} />
          </div>

          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </PageWrapper>
  );
}
