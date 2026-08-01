"use client";

import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type Range,
} from "@eva/ui";
import {
  IconZoomIn,
  IconZoomOut,
  IconCalendarEvent,
} from "@tabler/icons-react";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "quarterly", label: "Quarter" },
  { value: "monthly", label: "Month" },
  { value: "daily", label: "Week" },
];

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

interface TimelineToolbarProps {
  range: Range;
  zoom: number;
  onRangeChange: (range: Range) => void;
  onZoomChange: (zoom: number) => void;
  onToday: () => void;
}

/** Linear-style controls above the roadmap: jump-to-today, axis granularity,
 *  and zoom. State is owned by the parent (persisted in project filters). */
export function TimelineToolbar({
  range,
  zoom,
  onRangeChange,
  onZoomChange,
  onToday,
}: TimelineToolbarProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onToday}
          >
            <IconCalendarEvent className="size-3.5" />
            <span className="hidden sm:inline">Today</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Jump to today</TooltipContent>
      </Tooltip>

      <div className="flex items-center overflow-hidden rounded-surface border border-border bg-muted/40">
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={range === opt.value ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-none px-3 text-xs"
            onClick={() => onRangeChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center overflow-hidden rounded-surface border border-border bg-muted/40">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={zoom <= ZOOM_MIN}
          onClick={() => onZoomChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
        >
          <IconZoomOut className="size-3.5" />
        </Button>
        <span className="w-10 text-center text-2xs tabular-nums text-muted-foreground">
          {zoom}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none"
          disabled={zoom >= ZOOM_MAX}
          onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
        >
          <IconZoomIn className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
