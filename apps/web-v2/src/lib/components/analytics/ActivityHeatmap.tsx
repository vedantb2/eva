"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@conductor/ui";
import { IconFlame } from "@tabler/icons-react";

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
  days?: number;
}

const DAYS_IN_WEEK = 7;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getIntensityClass(count: number, max: number): string {
  if (count === 0) return "bg-muted/50";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-emerald-300/60 dark:bg-emerald-800/60";
  if (ratio <= 0.5) return "bg-emerald-400/70 dark:bg-emerald-700/70";
  if (ratio <= 0.75) return "bg-emerald-500/80 dark:bg-emerald-600/80";
  return "bg-emerald-600 dark:bg-emerald-500";
}

interface DayCell {
  date: string;
  count: number;
  dayOfWeek: number;
}

function buildGrid(
  data: Array<{ date: string; count: number }>,
  numWeeks: number,
) {
  const countMap = new Map<string, number>();
  for (const entry of data) {
    countMap.set(entry.date, entry.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const totalDays = (numWeeks - 1) * DAYS_IN_WEEK + dayOfWeek + 1;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  const weeks: Array<Array<DayCell>> = [];
  let currentWeek: Array<DayCell> = [];

  const cursor = new Date(startDate);
  for (let i = 0; i < totalDays; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dow = cursor.getDay();

    if (dow === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
      dayOfWeek: dow,
    });

    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthHeaders(weeks: Array<Array<DayCell>>) {
  const headers: Array<{ label: string; colIndex: number }> = [];
  let lastMonth = -1;

  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w][0];
    if (!firstDay) continue;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      headers.push({ label: MONTH_LABELS[month], colIndex: w });
      lastMonth = month;
    }
  }

  return headers;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export function ActivityHeatmap({ data, days }: ActivityHeatmapProps) {
  const numWeeks = Math.max(2, Math.ceil((days ?? 365) / 7) + 1);

  const {
    weeks,
    maxCount,
    monthHeaders,
    totalCount,
    currentStreak,
    longestStreak,
  } = useMemo(() => {
    const weeks = buildGrid(data, numWeeks);
    let max = 0;
    let total = 0;
    for (const week of weeks) {
      for (const day of week) {
        if (day.count > max) max = day.count;
        total += day.count;
      }
    }
    const { currentStreak, longestStreak } = computeStreak(data);
    return {
      weeks,
      maxCount: max || 1,
      monthHeaders: getMonthHeaders(weeks),
      totalCount: total,
      currentStreak,
      longestStreak,
    };
  }, [data, numWeeks]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {totalCount}
          </p>
          <p className="text-sm text-muted-foreground">
            tasks completed
            {days ? ` in the last ${days} days` : " in the last year"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <IconFlame size={18} className="text-warning" />
              <div>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {currentStreak} day streak
                </p>
              </div>
            </div>
          )}
          {longestStreak > currentStreak && (
            <div>
              <p className="text-xs text-muted-foreground">
                Longest:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {longestStreak}d
                </span>
              </p>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="size-2.5 rounded-sm bg-muted/50" />
              <div className="size-2.5 rounded-sm bg-emerald-300/60 dark:bg-emerald-800/60" />
              <div className="size-2.5 rounded-sm bg-emerald-400/70 dark:bg-emerald-700/70" />
              <div className="size-2.5 rounded-sm bg-emerald-500/80 dark:bg-emerald-600/80" />
              <div className="size-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <div className="overflow-x-auto rounded-xl bg-muted/40 p-3 sm:p-4">
          <div
            className="inline-grid min-w-max"
            style={{
              gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)`,
            }}
          >
            <div className="h-4" />
            {monthHeaders.map((header, i) => {
              const nextCol =
                i + 1 < monthHeaders.length
                  ? monthHeaders[i + 1].colIndex
                  : weeks.length;
              const span = nextCol - header.colIndex;
              return (
                <div
                  key={header.label + header.colIndex}
                  className="text-xs text-muted-foreground px-0.5"
                  style={{
                    gridColumn: `${header.colIndex + 2} / span ${span}`,
                  }}
                >
                  {header.label}
                </div>
              );
            })}

            {Array.from({ length: DAYS_IN_WEEK }).map((_, dayIdx) => {
              const cells = weeks.map((week, weekIdx) => {
                const day = week.find((d) => d.dayOfWeek === dayIdx);
                if (!day) {
                  return (
                    <div key={weekIdx} className="size-[13px] m-[1.5px]" />
                  );
                }
                return (
                  <Tooltip key={weekIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`size-[13px] m-[1.5px] rounded-[3px] ${getIntensityClass(day.count, maxCount)} transition-colors hover:ring-1 hover:ring-foreground/20`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <span className="font-medium">
                        {day.count} {day.count === 1 ? "task" : "tasks"}
                      </span>{" "}
                      on {formatDate(day.date)}
                    </TooltipContent>
                  </Tooltip>
                );
              });

              return [
                <div
                  key={`label-${dayIdx}`}
                  className="text-xs text-muted-foreground pr-2 flex items-center justify-end h-[16px]"
                >
                  {DAY_LABELS[dayIdx]}
                </div>,
                ...cells,
              ];
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
