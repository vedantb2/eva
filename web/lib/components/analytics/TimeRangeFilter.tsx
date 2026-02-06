"use client";

import { Tabs, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import dayjs from "@/lib/dates";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const DAY_MS = 86_400_000;

export function getStartTime(range: TimeRange): number | undefined {
  if (range === "all") return undefined;
  const days = { "7d": 7, "30d": 30, "90d": 90 } as const;
  return dayjs().subtract(days[range], "day").valueOf();
}

export function getBucketSize(range: TimeRange): number {
  return range === "7d" || range === "30d" ? DAY_MS : 7 * DAY_MS;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        <TabsTrigger value="7d">7 Days</TabsTrigger>
        <TabsTrigger value="30d">30 Days</TabsTrigger>
        <TabsTrigger value="90d">90 Days</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export type { TimeRange };
