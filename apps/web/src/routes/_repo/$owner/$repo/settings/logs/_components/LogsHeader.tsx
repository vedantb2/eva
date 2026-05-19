"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import {
  IconFilter,
  IconCategory,
  IconLayoutKanban,
} from "@tabler/icons-react";
import {
  TimeRangeFilter,
  type TimeRange,
} from "@/lib/components/analytics/TimeRangeFilter";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import { labelFor } from "../_utils";

type GroupByMode = "type" | "project";

interface LogsHeaderProps {
  visibleTypes: Set<string>;
  availableTypes: string[];
  onTypeToggle: (type: string, allTypes: string[]) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  searchQuery: string;
  onSearchChange: (value: string | null) => void;
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
}

export function LogsHeader({
  visibleTypes,
  availableTypes,
  onTypeToggle,
  timeRange,
  onTimeRangeChange,
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
}: LogsHeaderProps) {
  const filterActive = visibleTypes.size > 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ToggleSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search logs..."
        tooltipLabel="Search logs"
      />
      <div className="flex items-center rounded-md bg-muted/60 p-0.5">
        <button
          onClick={() => onGroupByChange("type")}
          className={`motion-base flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-[background-color,color] ${
            groupBy === "type"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconCategory size={13} />
          <span className="hidden sm:inline">Type</span>
        </button>
        <button
          onClick={() => onGroupByChange("project")}
          className={`motion-base flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-[background-color,color] ${
            groupBy === "project"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconLayoutKanban size={13} />
          <span className="hidden sm:inline">Project</span>
        </button>
      </div>
      {groupBy === "type" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="motion-press">
              <IconFilter size={14} />
              <span className="hidden sm:inline">
                {filterActive
                  ? `${visibleTypes.size} of ${availableTypes.length} Types`
                  : "All Types"}
              </span>
              <span className="sm:hidden">
                {filterActive
                  ? `${visibleTypes.size}/${availableTypes.length}`
                  : "All"}
              </span>
              {filterActive && (
                <Badge
                  variant="default"
                  className="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
                >
                  {visibleTypes.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      )}
      <TimeRangeFilter value={timeRange} onChange={onTimeRangeChange} />
    </div>
  );
}
