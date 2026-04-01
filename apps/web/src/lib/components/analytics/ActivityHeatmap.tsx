"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
} from "@conductor/ui";
import type { Activity } from "@conductor/ui";
import { IconFlame } from "@tabler/icons-react";

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

const MAX_LEVEL = 4;

function toActivities(data: Array<{ date: string; count: number }>): {
  activities: Activity[];
  totalCount: number;
} {
  let max = 0;
  let totalCount = 0;
  for (const entry of data) {
    if (entry.count > max) max = entry.count;
    totalCount += entry.count;
  }

  const safeMax = max || 1;
  const activities: Activity[] = data.map((entry) => ({
    date: entry.date,
    count: entry.count,
    level:
      entry.count === 0
        ? 0
        : Math.min(MAX_LEVEL, Math.ceil((entry.count / safeMax) * MAX_LEVEL)),
  }));

  return { activities, totalCount };
}

function computeStreak(data: Array<{ date: string; count: number }>): {
  currentStreak: number;
  longestStreak: number;
} {
  const countMap = new Map<string, number>();
  for (const entry of data) {
    countMap.set(entry.date, entry.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  const cursor = new Date(today);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const count = countMap.get(dateStr) ?? 0;
    if (count === 0) break;
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longestStreak = 0;
  let streak = 0;
  const sorted = [...countMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  let prevDate: Date | undefined;
  for (const [dateStr, count] of sorted) {
    const d = new Date(dateStr + "T00:00:00");
    if (count > 0) {
      if (prevDate && d.getTime() - prevDate.getTime() === 86_400_000) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
    prevDate = d;
  }

  return { currentStreak, longestStreak };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { activities, totalCount, currentStreak, longestStreak } =
    useMemo(() => {
      const { activities, totalCount } = toActivities(data);
      const { currentStreak, longestStreak } = computeStreak(data);
      return { activities, totalCount, currentStreak, longestStreak };
    }, [data]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {totalCount}
          </p>
          <p className="text-sm text-muted-foreground">
            tasks completed in the last year
          </p>
        </div>
        <div className="flex items-center gap-4">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <IconFlame size={18} className="text-warning" />
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {currentStreak} day streak
              </p>
            </div>
          )}
          {longestStreak > currentStreak && (
            <p className="text-xs text-muted-foreground">
              Longest:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {longestStreak}d
              </span>
            </p>
          )}
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <ContributionGraph
          data={activities}
          totalCount={totalCount}
          className="w-full max-w-full"
        >
          <ContributionGraphCalendar className="rounded-xl bg-muted/40 p-3 sm:p-4">
            {({ activity, dayIndex, weekIndex }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <g>
                    <ContributionGraphBlock
                      activity={activity}
                      dayIndex={dayIndex}
                      weekIndex={weekIndex}
                      className="cursor-pointer"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <span className="font-medium">
                    {activity.count} {activity.count === 1 ? "task" : "tasks"}
                  </span>{" "}
                  on {formatDate(activity.date)}
                </TooltipContent>
              </Tooltip>
            )}
          </ContributionGraphCalendar>
          <ContributionGraphFooter>
            <ContributionGraphLegend />
          </ContributionGraphFooter>
        </ContributionGraph>
      </TooltipProvider>
    </div>
  );
}
