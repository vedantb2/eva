import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@eva/ui";
import {
  IconLayoutKanban,
  IconPlus,
  IconFilter,
  IconTimeline,
  IconList,
  IconSettings,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import {
  PROJECT_PHASES,
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import {
  SORT_FIELDS,
  SORT_FIELD_LABELS,
  type ProjectFilters,
  type ProjectView,
} from "../_utils";

type SortField = ProjectFilters["sortField"];
type SortDir = ProjectFilters["sortDir"];

const VIEW_OPTIONS: {
  key: ProjectView;
  icon: typeof IconLayoutKanban;
  label: string;
}[] = [
  { key: "kanban", icon: IconLayoutKanban, label: "Kanban view" },
  { key: "timeline", icon: IconTimeline, label: "Timeline view" },
  { key: "list", icon: IconList, label: "List view" },
];

interface ProjectsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string | null) => void;
  hasProjects: boolean;
  view: ProjectView;
  onViewChange: (view: ProjectView) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortFieldChange: (field: SortField) => void;
  onSortDirChange: (dir: SortDir) => void;
  visiblePhases: Set<ProjectPhase>;
  onPhaseToggle: (phase: ProjectPhase) => void;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  onNewProject: () => void;
}

/**
 * The projects page's functional toolbar: search, view switcher, the
 * sort/filter options menu, and the new-project action. Lives in
 * `PageHeaderActions` on `ProjectsClient`.
 */
export function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  hasProjects,
  view,
  onViewChange,
  sortField,
  sortDir,
  onSortFieldChange,
  onSortDirChange,
  visiblePhases,
  onPhaseToggle,
  hasActiveFilters,
  onClearAllFilters,
  onNewProject,
}: ProjectsToolbarProps) {
  return (
    <>
      <ToggleSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search projects..."
        visible={hasProjects}
        variant="large"
      />
      {hasProjects && (
        <div className="flex items-center rounded-surface border border-border bg-muted/40 overflow-hidden">
          {VIEW_OPTIONS.map((opt) => (
            <Tooltip key={opt.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={view === opt.key ? "secondary" : "ghost"}
                  size="icon"
                  className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.96]"
                  onClick={() => onViewChange(opt.key)}
                >
                  <opt.icon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{opt.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
      {hasProjects && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="motion-press hover:scale-[1.01] active:scale-[0.96]"
            >
              <IconSettings size={16} />
              <span className="hidden sm:inline">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconSortDescending size={16} className="mr-2" />
                Sort: {SORT_FIELD_LABELS[sortField]}{" "}
                {sortDir === "asc" ? "↑" : "↓"}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={sortField}
                  onValueChange={(v) => {
                    if (v === "created" || v === "title" || v === "priority") {
                      onSortFieldChange(v);
                    }
                  }}
                >
                  {SORT_FIELDS.map((f) => (
                    <DropdownMenuRadioItem key={f} value={f}>
                      {SORT_FIELD_LABELS[f]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sortDir}
                  onValueChange={(v) => {
                    if (v === "asc" || v === "desc") {
                      onSortDirChange(v);
                    }
                  }}
                >
                  <DropdownMenuRadioItem value="desc">
                    Descending ↓
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="asc">
                    Ascending ↑
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconFilter size={16} className="mr-2" />
                {visiblePhases.size === PROJECT_PHASES.length
                  ? "All Phases"
                  : `${visiblePhases.size} Phases`}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
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
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onClearAllFilters}>
                  <IconX size={16} className="mr-2" />
                  Clear all filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        size="sm"
        className="motion-press hover:scale-[1.01] active:scale-[0.96]"
        onClick={onNewProject}
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">New Project</span>
      </Button>
    </>
  );
}
