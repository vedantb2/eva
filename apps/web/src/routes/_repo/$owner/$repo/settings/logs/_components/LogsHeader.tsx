"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@eva/ui";
import { IconFilter, IconList, IconLayoutKanban } from "@tabler/icons-react";
import {
  TimeRangeFilter,
  type TimeRange,
} from "@/lib/components/analytics/TimeRangeFilter";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import { labelFor } from "../_utils";

type LogView = "type" | "project";

interface LogsHeaderProps {
  visibleTypes: Set<string>;
  availableTypes: string[];
  onTypeToggle: (type: string, allTypes: string[]) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  searchQuery: string;
  onSearchChange: (value: string | null) => void;
  logView: LogView;
  onLogViewChange: (value: LogView) => void;
  showTypeFilter: boolean;
}

export function LogsHeader({
  visibleTypes,
  availableTypes,
  onTypeToggle,
  timeRange,
  onTimeRangeChange,
  searchQuery,
  onSearchChange,
  logView,
  onLogViewChange,
  showTypeFilter,
}: LogsHeaderProps) {
  const filterActive = visibleTypes.size > 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ToggleSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search logs..."
      />

      <div className="flex items-center rounded-lg border border-border p-0.5">
        <button
          type="button"
          onClick={() => onLogViewChange("type")}
          className={`motion-base rounded-md px-2 py-1 text-xs font-medium ${
            logView === "type"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconList size={14} className="inline-block" />
          <span className="ml-1 hidden sm:inline">By Type</span>
        </button>
        <button
          type="button"
          onClick={() => onLogViewChange("project")}
          className={`motion-base rounded-md px-2 py-1 text-xs font-medium ${
            logView === "project"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconLayoutKanban size={14} className="inline-block" />
          <span className="ml-1 hidden sm:inline">By Project</span>
        </button>
      </div>

      {showTypeFilter && (
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
