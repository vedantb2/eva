"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import {
  IconLayoutKanban,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconTimeline,
  IconList,
} from "@tabler/icons-react";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";

export const SORT_FIELDS = [
  { key: "created" as const, label: "Date Created" },
  { key: "title" as const, label: "Title" },
];
export type SortField = (typeof SORT_FIELDS)[number]["key"];

type ProjectView = "kanban" | "timeline" | "list";
type SortDirection = "asc" | "desc";

interface ProjectsToolbarProps {
  view: ProjectView;
  onViewChange: (view: ProjectView) => void;
  visiblePhases: Set<ProjectPhase>;
  onPhaseToggle: (phase: ProjectPhase) => void;
  sortField: SortField;
  onSortChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onSortDirectionToggle: () => void;
}

const VIEW_OPTIONS: {
  key: ProjectView;
  icon: typeof IconLayoutKanban;
  label: string;
}[] = [
  { key: "kanban", icon: IconLayoutKanban, label: "Kanban view" },
  { key: "timeline", icon: IconTimeline, label: "Timeline view" },
  { key: "list", icon: IconList, label: "List view" },
];

function isSortField(value: string): value is SortField {
  return SORT_FIELDS.some((f) => f.key === value);
}

export function ProjectsToolbar({
  view,
  onViewChange,
  visiblePhases,
  onPhaseToggle,
  sortField,
  onSortChange,
  sortDirection,
  onSortDirectionToggle,
}: ProjectsToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
      <div className="flex items-center rounded-lg bg-muted/40 overflow-hidden">
        {VIEW_OPTIONS.map((opt) => (
          <Tooltip key={opt.key}>
            <TooltipTrigger asChild>
              <Button
                variant={view === opt.key ? "secondary" : "ghost"}
                size="icon"
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => onViewChange(opt.key)}
              >
                <opt.icon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{opt.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            <IconFilter size={16} />
            {visiblePhases.size === PROJECT_PHASES.length
              ? "All Phases"
              : `${visiblePhases.size} Phases`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PROJECT_PHASES.map((p) => {
            const cfg = phaseConfig[p];
            return (
              <DropdownMenuCheckboxItem
                key={p}
                checked={visiblePhases.has(p)}
                onCheckedChange={() => onPhaseToggle(p)}
                onSelect={(e) => e.preventDefault()}
              >
                <cfg.icon size={16} className={cfg.text + " mr-2"} />
                <span className={cfg.text}>{cfg.label}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            {sortField === "created" ? "Date" : "Title"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={sortField}
            onValueChange={(v) => {
              if (isSortField(v)) onSortChange(v);
            }}
          >
            {SORT_FIELDS.map((item) => (
              <DropdownMenuRadioItem key={item.key} value={item.key}>
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onSortDirectionToggle}
          >
            {sortDirection === "asc" ? (
              <IconSortAscending size={16} />
            ) : (
              <IconSortDescending size={16} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {sortDirection === "asc"
            ? "Ascending - click to reverse"
            : "Descending - click to reverse"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
