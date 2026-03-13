"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@conductor/ui";

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

const WEEKS = 53;
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
  if (count === 0) return "bg-muted";
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

function buildGrid(data: Array<{ date: string; count: number }>) {
  const countMap = new Map<string, number>();
  for (const entry of data) {
    countMap.set(entry.date, entry.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const totalDays = (WEEKS - 1) * DAYS_IN_WEEK + dayOfWeek + 1;
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

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { weeks, maxCount, monthHeaders, totalCount } = useMemo(() => {
    const weeks = buildGrid(data);
    let max = 0;
    let total = 0;
    for (const week of weeks) {
      for (const day of week) {
        if (day.count > max) max = day.count;
        total += day.count;
      }
    }
    return {
      weeks,
      maxCount: max || 1,
      monthHeaders: getMonthHeaders(weeks),
      totalCount: total,
    };
  }, [data]);

  return (
    <Card className="mx-auto w-fit max-w-full border border-border shadow-none">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            {totalCount} tasks completed in the last year
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="size-2.5 rounded-sm bg-muted" />
              <div className="size-2.5 rounded-sm bg-emerald-300/60 dark:bg-emerald-800/60" />
              <div className="size-2.5 rounded-sm bg-emerald-400/70 dark:bg-emerald-700/70" />
              <div className="size-2.5 rounded-sm bg-emerald-500/80 dark:bg-emerald-600/80" />
              <div className="size-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>

        <TooltipProvider delayDuration={0}>
          <div className="overflow-x-auto">
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
                      <div key={weekIdx} className="size-[11px] m-[1px]" />
                    );
                  }
                  return (
                    <Tooltip key={weekIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`size-[11px] m-[1px] rounded-sm ${getIntensityClass(day.count, maxCount)} transition-colors`}
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
                    className="text-xs text-muted-foreground pr-2 flex items-center justify-end h-[13px]"
                  >
                    {DAY_LABELS[dayIdx]}
                  </div>,
                  ...cells,
                ];
              })}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
