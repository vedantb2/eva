"use client";

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
} from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { useQueryStates } from "nuqs";
import { statusesParser } from "@/lib/search-params";

type QuickTaskView = "kanban" | "list";
type Project = FunctionReturnType<typeof api.projects.list>[number];

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
}

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
}: QuickTasksToolbarProps) {
  const filterLabel =
    projectFilter === "all"
      ? "All Tasks"
      : projectFilter === "none"
        ? "No Project"
        : (projects?.find((p) => p._id === projectFilter)?.title ?? "Project");

  const [{ statuses }, setStatusParams] = useQueryStates({
    statuses: statusesParser,
  });
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);

  const handleStatusToggle = (status: DisplayTaskStatus) => {
    const next = new Set(visibleStatuses);
    if (next.has(status)) {
      if (next.size === 1) return;
      next.delete(status);
    } else {
      next.add(status);
    }
    setStatusParams({ statuses: [...next] });
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="motion-press hover:scale-[1.01] active:scale-[0.99] max-w-[120px] sm:max-w-[180px]"
            >
              <IconFolder size={16} />
              <span className="truncate">{filterLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {hasQuickTasks && (
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="icon"
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
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
                className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => onViewChange("list")}
              >
                <IconList size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
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
                  className="motion-press hover:scale-[1.01] active:scale-[0.99]"
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
              className="motion-press hover:scale-[1.01] active:scale-[0.99]"
            >
              <IconSettings size={16} />
              <span className="hidden sm:inline">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onImport}>
              <IconFileImport size={16} className="mr-2" />
              Import from Linear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        size="sm"
        className="motion-press hover:scale-[1.01] active:scale-[0.99]"
        onClick={onCreateTask}
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">New Task</span>
      </Button>
    </div>
  );
}
