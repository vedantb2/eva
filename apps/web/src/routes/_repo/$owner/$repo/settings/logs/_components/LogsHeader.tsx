"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  Tabs,
  TabsList,
  TabsTrigger,
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

      <Tabs
        value={logView}
        onValueChange={(value) => {
          if (value === "type" || value === "project") onLogViewChange(value);
        }}
      >
        <TabsList className="tabs-segmented h-8">
          <TabsTrigger value="type" className="gap-1 px-2 py-1 text-xs">
            <IconList size={14} />
            <span className="hidden sm:inline">By Type</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-1 px-2 py-1 text-xs">
            <IconLayoutKanban size={14} />
            <span className="hidden sm:inline">By Project</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
                  className="ml-0.5 h-4 min-w-4 px-1 text-3xs"
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
