import { m } from "motion/react";
import { useQueryState } from "nuqs";
import { timeRangeParser } from "@/lib/search-params";
import { api } from "@eva/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { Skeleton } from "@eva/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Kpi, KpiGroup } from "@/lib/components/analytics/Kpi";
import { PRsOverTimeChart } from "@/lib/components/analytics/PRsOverTimeChart";
import { SessionFunnel } from "@/lib/components/analytics/SessionFunnel";
import { ActivityTimelineChart } from "@/lib/components/analytics/ActivityTimelineChart";
import { Leaderboard } from "@/lib/components/analytics/Leaderboard";
import { ActivityHeatmap } from "@/lib/components/analytics/ActivityHeatmap";
import { TimeRangeFilter } from "@/lib/components/analytics/TimeRangeFilter";
import {
  getStartTime,
  getPreviousStartTime,
  getBucketSize,
  DAY_MS,
} from "@/lib/components/analytics/timeRange";
import { useQuantizedNow } from "@/lib/hooks/useQuantizedNow";
import {
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";

export function StatsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);

  // Every window below is measured from one of these two clocks. The analytics
  // queries take the timestamp as an argument because they cannot read it
  // themselves — a Convex query is cached against its data, so a clock read
  // freezes at whatever time the result was first computed.
  const today = useQuantizedNow(DAY_MS);
  const nowByMinute = useQuantizedNow(60_000);

  const startTime = getStartTime(timeRange, today);
  const bucketSize = getBucketSize(timeRange);
  const timelineStart = startTime ?? today - 90 * DAY_MS;

  const impactStats = useQuery(api.analytics.getImpactStats, {
    repoId: repo._id,
    startTime,
    previousStartTime: getPreviousStartTime(timeRange, today),
  });
  const activeUsers = useQuery(api.analytics.getActiveUsers, {
    repoId: repo._id,
    now: nowByMinute,
  });
  const timeline = useQuery(api.analytics.getActivityTimeline, {
    repoId: repo._id,
    startTime: timelineStart,
    endTime: today,
    bucketSizeMs: bucketSize,
  });
  const leaderboard = useQuery(api.analytics.getLeaderboard, {
    repoId: repo._id,
    startTime,
  });
  const heatmap = useQuery(api.analytics.getActivityHeatmap, {
    repoId: repo._id,
    startTime: today - 365 * DAY_MS,
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
      comfortable
      headerRight={
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      }
    >
      {isLoading ? (
        <div
          className="min-h-[36rem] space-y-6"
          aria-busy="true"
          aria-label="Loading stats"
        >
          <Skeleton className="h-40 border border-border" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 border border-border" />
            ))}
          </div>
          <Skeleton className="h-56 border border-border" />
        </div>
      ) : (
        <div className="space-y-6">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ActivityHeatmap data={heatmap} />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <KpiGroup>
              <Kpi
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
              <Kpi
                icon={IconPercentage}
                label="Cook Rate"
                value={`${impactStats.shipRate}%`}
                subtitle={`${impactStats.tasksCompleted} of ${impactStats.tasksRan} settled tasks`}
                currentValue={impactStats.shipRate}
                previousValue={
                  "prevShipRate" in impactStats
                    ? impactStats.prevShipRate
                    : undefined
                }
              />
              <Kpi
                icon={IconUsers}
                label="Humans Prompting"
                value={activeUsers.count}
                subtitle="Last 5 minutes"
              />
              <Kpi
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
            </KpiGroup>
          </m.div>

          <m.div
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
            />
          </m.div>

          <m.div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <div className="lg:col-span-2">
              <ActivityTimelineChart timeline={timeline} />
            </div>
            <Leaderboard entries={leaderboard} />
          </m.div>
        </div>
      )}
    </PageWrapper>
  );
}
