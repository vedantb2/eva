import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import {
  IconPlus,
  IconCheckbox,
  IconLayoutKanban,
  IconList,
  IconFileImport,
  IconFolder,
  IconSettings,
  IconFilter,
  IconTable,
  IconUser,
  IconTag,
  IconUserCheck,
  IconSortDescending,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { useQuickTaskFilters } from "../_utils";

type QuickTaskView = "kanban" | "list" | "table";
type Project = FunctionReturnType<typeof api.projects.list>[number];
type User = FunctionReturnType<typeof api.users.listAll>[number];
type SortField = "lastRun" | "updated" | "created" | "title";
type SortDir = "asc" | "desc";
type TimeRange = "7d" | "30d" | "90d" | "all";

interface QuickTasksToolbarProps {
  view: QuickTaskView;
  onViewChange: (v: QuickTaskView) => void;
  searchQuery: string;
  onSearchChange: (v: string | null) => void;
  hasQuickTasks: boolean;
  isSelecting: boolean;
  onStartSelecting: () => void;
  onCreateTask: () => void;
  onImport: () => void;
  projects: Project[] | undefined;
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
  users: User[] | undefined;
  userFilter: string;
  onUserFilterChange: (v: string) => void;
  allTags: string[];
}

const SORT_FIELD_LABELS: Record<SortField, string> = {
  lastRun: "Last Run",
  updated: "Updated",
  created: "Created",
  title: "Title",
};

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

export function QuickTasksToolbar({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  hasQuickTasks,
  isSelecting,
  onStartSelecting,
  onCreateTask,
  onImport,
  projects,
  projectFilter,
  onProjectFilterChange,
  users,
  userFilter,
  onUserFilterChange,
  allTags,
}: QuickTasksToolbarProps) {
  const filterLabel =
    projectFilter === "all"
      ? "All Tasks"
      : projectFilter === "none"
        ? "No Project"
        : (projects?.find((p) => p._id === projectFilter)?.title ?? "Project");

  const userFilterLabel =
    userFilter === "all"
      ? "All Users"
      : (users?.find((u) => u._id === userFilter)?.fullName ??
        users?.find((u) => u._id === userFilter)?.firstName ??
        "User");

  const [
    { statuses, assignee, tags, sortField, sortDir, timeRange },
    setParams,
  ] = useQuickTaskFilters();
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);
  const selectedTags = useMemo(() => new Set(tags), [tags]);

  const assigneeLabel =
    assignee === "all"
      ? "All Assignees"
      : assignee === "unassigned"
        ? "Unassigned"
        : (users?.find((u) => u._id === assignee)?.fullName ??
          users?.find((u) => u._id === assignee)?.firstName ??
          "Assignee");

  const handleStatusToggle = (status: DisplayTaskStatus) => {
    const next = new Set(visibleStatuses);
    if (next.has(status)) {
      if (next.size === 1) return;
      next.delete(status);
    } else {
      next.add(status);
    }
    setParams({ statuses: [...next] });
  };

  const handleTagToggle = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setParams({ tags: [...next] });
  };

  const hasActiveFilters =
    projectFilter !== "all" ||
    userFilter !== "all" ||
    assignee !== "all" ||
    visibleStatuses.size !== TASK_STATUSES.length ||
    selectedTags.size > 0 ||
    timeRange !== "all";

  const clearAllFilters = () => {
    onProjectFilterChange("all");
    onUserFilterChange("all");
    setParams({
      assignee: "all",
      tags: [],
      statuses: [...TASK_STATUSES],
      timeRange: "all",
    });
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ToggleSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search tasks..."
        tooltipLabel="Search tasks"
        visible={hasQuickTasks}
      />
      {hasQuickTasks && (
        <div className="flex items-center rounded-lg bg-muted/40 overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="icon"
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.96]"
                onClick={() => onViewChange("kanban")}
              >
                <IconLayoutKanban size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kanban view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.96]"
                onClick={() => onViewChange("list")}
              >
                <IconList size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon"
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.96]"
                onClick={() => onViewChange("table")}
              >
                <IconTable size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table view</TooltipContent>
          </Tooltip>
        </div>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        {hasQuickTasks && !isSelecting ? (
          <motion.div
            key="quick-task-select-action"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="motion-press hover:scale-[1.01] active:scale-[0.96]"
                  onClick={onStartSelecting}
                >
                  <IconCheckbox size={16} />
                  <span className="hidden sm:inline">Select</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Select</TooltipContent>
            </Tooltip>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {hasQuickTasks && (
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
            <DropdownMenuItem onSelect={onImport}>
              <IconFileImport size={16} className="mr-2" />
              Import from Linear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconSortDescending size={16} className="mr-2" />
                Sort: {SORT_FIELD_LABELS[sortField]}{" "}
                {sortDir === "asc" ? "↑" : "↓"}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={sortField}
                  onValueChange={(v) =>
                    setParams({ sortField: v as SortField })
                  }
                >
                  {(Object.keys(SORT_FIELD_LABELS) as SortField[]).map((f) => (
                    <DropdownMenuRadioItem key={f} value={f}>
                      {SORT_FIELD_LABELS[f]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sortDir}
                  onValueChange={(v) => setParams({ sortDir: v as SortDir })}
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
                <IconFolder size={16} className="mr-2" />
                {filterLabel}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={projectFilter}
                  onValueChange={onProjectFilterChange}
                >
                  <DropdownMenuRadioItem value="all">
                    All Tasks
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="none">
                    No Project
                  </DropdownMenuRadioItem>
                  {projects && projects.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {projects.map((p) => (
                        <DropdownMenuRadioItem key={p._id} value={p._id}>
                          {p.title}
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconUser size={16} className="mr-2" />
                {userFilterLabel}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={userFilter}
                  onValueChange={onUserFilterChange}
                >
                  <DropdownMenuRadioItem value="all">
                    All Users
                  </DropdownMenuRadioItem>
                  {users && users.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {users.map((u) => (
                        <DropdownMenuRadioItem key={u._id} value={u._id}>
                          {u.fullName ?? u.firstName ?? "Unknown"}
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconUserCheck size={16} className="mr-2" />
                {assigneeLabel}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={assignee}
                  onValueChange={(v) => setParams({ assignee: v })}
                >
                  <DropdownMenuRadioItem value="all">
                    All Assignees
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unassigned">
                    Unassigned
                  </DropdownMenuRadioItem>
                  {users && users.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {users.map((u) => (
                        <DropdownMenuRadioItem key={u._id} value={u._id}>
                          {u.fullName ?? u.firstName ?? "Unknown"}
                        </DropdownMenuRadioItem>
                      ))}
                    </>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconFilter size={16} className="mr-2" />
                {visibleStatuses.size === TASK_STATUSES.length
                  ? "All Statuses"
                  : `${visibleStatuses.size} Statuses`}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {TASK_STATUSES.map((s) => {
                  const cfg = statusConfig[s];
                  return (
                    <DropdownMenuCheckboxItem
                      key={s}
                      checked={visibleStatuses.has(s)}
                      onCheckedChange={() => handleStatusToggle(s)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <cfg.icon size={16} className={cfg.text + " mr-2"} />
                      <span className={cfg.text}>{cfg.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {allTags.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconTag size={16} className="mr-2" />
                  {selectedTags.size === 0
                    ? "All Tags"
                    : `${selectedTags.size} Tag${selectedTags.size > 1 ? "s" : ""}`}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.has(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconClock size={16} className="mr-2" />
                {TIME_RANGE_LABELS[timeRange]}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={timeRange}
                  onValueChange={(v) =>
                    setParams({ timeRange: v as TimeRange })
                  }
                >
                  {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r}>
                      {TIME_RANGE_LABELS[r]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={clearAllFilters}>
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
        onClick={onCreateTask}
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">New Task</span>
      </Button>
    </div>
  );
}
