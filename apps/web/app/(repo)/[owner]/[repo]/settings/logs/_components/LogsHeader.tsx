"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { IconFilter } from "@tabler/icons-react";
import {
  TimeRangeFilter,
  type TimeRange,
} from "@/lib/components/analytics/TimeRangeFilter";
import { labelFor } from "../_utils";

interface LogsHeaderProps {
  visibleTypes: Set<string>;
  availableTypes: string[];
  onTypeToggle: (type: string, allTypes: string[]) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
}

export function LogsHeader({
  visibleTypes,
  availableTypes,
  onTypeToggle,
  timeRange,
  onTimeRangeChange,
}: LogsHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            <IconFilter size={14} />
            <span className="hidden sm:inline">
              {visibleTypes.size === 0
                ? "All Types"
                : `${visibleTypes.size} of ${availableTypes.length} Types`}
            </span>
            <span className="sm:hidden">
              {visibleTypes.size === 0
                ? "All"
                : `${visibleTypes.size}/${availableTypes.length}`}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {availableTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={visibleTypes.size === 0 || visibleTypes.has(type)}
              onCheckedChange={() => onTypeToggle(type, availableTypes)}
              onSelect={(e) => e.preventDefault()}
            >
              {labelFor(type)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <TimeRangeFilter value={timeRange} onChange={onTimeRangeChange} />
    </div>
  );
}
