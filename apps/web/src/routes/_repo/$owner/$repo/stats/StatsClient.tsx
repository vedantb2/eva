import { useMemo } from "react";
import { motion } from "motion/react";
import { useQueryState } from "nuqs";
import { timeRangeParser } from "@/lib/search-params";
import { api } from "@conductor/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { StatCard } from "@/lib/components/analytics/StatCard";
import { PRsOverTimeChart } from "@/lib/components/analytics/PRsOverTimeChart";
import { SessionFunnel } from "@/lib/components/analytics/SessionFunnel";
import { ActivityTimelineChart } from "@/lib/components/analytics/ActivityTimelineChart";
import { Leaderboard } from "@/lib/components/analytics/Leaderboard";
import { ActivityHeatmap } from "@/lib/components/analytics/ActivityHeatmap";
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
  const heatmap = useQuery(api.analytics.getActivityHeatmap, {
    repoId: repo._id,
  });

  const isLoading =
    impactStats === undefined ||
    activeUsers === undefined ||
    timeline === undefined ||
    leaderboard === undefined ||
    heatmap === undefined;

  return (
    <PageWrapper
      title="Stats"
      headerRight={
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ActivityHeatmap data={heatmap} />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatCard
              icon={IconGitPullRequest}
              label="PRs Shipped"
              value={impactStats.prsShipped}
              currentValue={impactStats.prsShipped}
              previousValue={
                "prevPrsShipped" in impactStats
                  ? impactStats.prevPrsShipped
                  : undefined
              }
            />
            <StatCard
              icon={IconPercentage}
              label="Ship Rate"
              value={`${impactStats.shipRate}%`}
              subtitle={`${impactStats.sessionsWithPr} of ${impactStats.totalSessions} sessions`}
              currentValue={impactStats.shipRate}
              previousValue={
                "prevShipRate" in impactStats
                  ? impactStats.prevShipRate
                  : undefined
              }
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
              currentValue={impactStats.tasksCompleted}
              previousValue={
                "prevTasksCompleted" in impactStats
                  ? impactStats.prevTasksCompleted
                  : undefined
              }
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="lg:col-span-2">
              <PRsOverTimeChart timeline={timeline} />
            </div>
            <SessionFunnel
              totalSessions={impactStats.totalSessions}
              sessionsWithPr={impactStats.sessionsWithPr}
              shipRate={impactStats.shipRate}
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <div className="lg:col-span-2">
              <ActivityTimelineChart timeline={timeline} />
            </div>
            <Leaderboard entries={leaderboard} />
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
