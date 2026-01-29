"use client";

import { Tabs, Tab } from "@heroui/tabs";
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
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as TimeRange)}
      size="sm"
      variant="solid"
      classNames={{
        tabList: "bg-neutral-100 dark:bg-neutral-800",
        cursor: "bg-white dark:bg-neutral-700",
      }}
    >
      <Tab key="7d" title="7 Days" />
      <Tab key="30d" title="30 Days" />
      <Tab key="90d" title="90 Days" />
      <Tab key="all" title="All Time" />
    </Tabs>
  );
}

export type { TimeRange };
