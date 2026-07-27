"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@eva/ui";
import { IconCalendar } from "@tabler/icons-react";
import {
  TIME_RANGES,
  TIME_RANGE_LABELS,
  isTimeRange,
  type TimeRange,
} from "./timeRange";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
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
