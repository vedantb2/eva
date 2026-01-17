"use client";

import { Tabs, Tab } from "@heroui/tabs";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getStartTime(range: TimeRange): number | undefined {
  if (range === "all") return undefined;
  const now = Date.now();
  switch (range) {
    case "7d":
      return now - 7 * DAY_MS;
    case "30d":
      return now - 30 * DAY_MS;
    case "90d":
      return now - 90 * DAY_MS;
  }
}

export function getBucketSize(range: TimeRange): number {
  switch (range) {
    case "7d":
      return DAY_MS;
    case "30d":
      return DAY_MS;
    case "90d":
      return 7 * DAY_MS;
    case "all":
      return 7 * DAY_MS;
  }
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
