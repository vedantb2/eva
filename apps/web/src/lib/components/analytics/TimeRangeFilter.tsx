"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@conductor/ui";
import { IconCalendar } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const DAY_MS = 86_400_000;

const TIME_RANGES = ["7d", "30d", "90d", "all"] as const;

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function isTimeRange(v: string): v is TimeRange {
  const ranges: ReadonlyArray<string> = TIME_RANGES;
  return ranges.includes(v);
}

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="max-w-[160px] sm:max-w-none"
        >
          <IconCalendar size={14} />
          <span className="truncate">{TIME_RANGE_LABELS[value]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => {
            if (isTimeRange(v)) {
              onChange(v);
            }
          }}
        >
          {TIME_RANGES.map((range) => (
            <DropdownMenuRadioItem key={range} value={range}>
              {TIME_RANGE_LABELS[range]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { TimeRange };
