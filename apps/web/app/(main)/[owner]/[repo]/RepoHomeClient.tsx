"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useQueryState } from "nuqs";
import { api } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import { useRepo } from "@/lib/contexts/RepoContext";
import { repoStatsRangeParser } from "@/lib/search-params";
import {
  Card,
  CardContent,
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
import { Icon as TablerIcon } from "@tabler/icons-react";
import Image from "next/image";

type RepoStatsRange = "1d" | "3d" | "1w" | "1m" | "3m" | "6m" | "1y" | "all";

const repoStatsRangeOptions: { value: RepoStatsRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "3d", label: "3D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

function isRepoStatsRange(value: string): value is RepoStatsRange {
  return repoStatsRangeOptions.some((option) => option.value === value);
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function getStatsStartTime(range: RepoStatsRange): number | undefined {
  if (range === "all") return undefined;
  if (range === "1d") return dayjs().subtract(1, "day").valueOf();
  if (range === "3d") return dayjs().subtract(3, "day").valueOf();
  if (range === "1w") return dayjs().subtract(1, "week").valueOf();
  if (range === "1m") return dayjs().subtract(1, "month").valueOf();
  if (range === "3m") return dayjs().subtract(3, "month").valueOf();
  if (range === "6m") return dayjs().subtract(6, "month").valueOf();
  return dayjs().subtract(1, "year").valueOf();
}

function getTimelineWindow(range: RepoStatsRange): {
  startTime: number;
  bucketSizeMs: number;
} {
  if (range === "all") {
    return {
      startTime: 0,
      bucketSizeMs: 30 * DAY_MS,
    };
  }
  if (range === "1d") {
    return {
      startTime: dayjs().subtract(1, "day").valueOf(),
      bucketSizeMs: 2 * HOUR_MS,
    };
  }
  if (range === "3d") {
    return {
      startTime: dayjs().subtract(3, "day").valueOf(),
      bucketSizeMs: 6 * HOUR_MS,
    };
  }
  if (range === "1w") {
    return {
      startTime: dayjs().subtract(1, "week").valueOf(),
      bucketSizeMs: DAY_MS,
    };
  }
  if (range === "1m") {
    return {
      startTime: dayjs().subtract(1, "month").valueOf(),
      bucketSizeMs: 3 * DAY_MS,
    };
  }
  if (range === "3m") {
    return {
      startTime: dayjs().subtract(3, "month").valueOf(),
      bucketSizeMs: 7 * DAY_MS,
    };
  }
  if (range === "6m") {
    return {
      startTime: dayjs().subtract(6, "month").valueOf(),
      bucketSizeMs: 14 * DAY_MS,
    };
  }
  return {
    startTime: dayjs().subtract(1, "year").valueOf(),
    bucketSizeMs: 30 * DAY_MS,
  };
}

function Sparkline({
  values,
  toneClassName,
}: {
  values: number[];
  toneClassName: string;
}) {
  const points =
    values.length === 0
      ? [0, 0]
      : values.length === 1
        ? [values[0], values[0]]
        : values;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min;
  const width = 96;
  const height = 34;
  const padding = 2;
  const linePoints = points
    .map((value, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`;

  return (
    <div className={`h-[34px] w-24 ${toneClassName}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <polyline
          points={areaPoints}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="none"
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.9}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trendValues,
  trendToneClassName,
}: {
  icon: TablerIcon;
  label: string;
  value: string | number;
  trendValues: number[];
  trendToneClassName: string;
}) {
  return (
    <Card className="ui-surface-interactive h-full">
      <CardContent className="flex h-full items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-primary" />
          <div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
        <Sparkline values={trendValues} toneClassName={trendToneClassName} />
      </CardContent>
    </Card>
  );
}

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

  if (
    impactStats === undefined ||
    activeUsers === undefined ||
    timeline === undefined
  ) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Spinner />
      </div>
    );
  }

  const prsTrend = timeline.map((bucket) => bucket.prsShipped);
  const shipRateTrend = timeline.map((bucket) =>
    bucket.sessions > 0
      ? Math.round((bucket.sessionsWithPr / bucket.sessions) * 100)
      : 0,
  );
  const activeUsersTrend = timeline.map((bucket) => bucket.activeUsers);
  const tasksDoneTrend = timeline.map((bucket) => bucket.tasksCompleted);

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
      </div>
    </div>
  );
}
