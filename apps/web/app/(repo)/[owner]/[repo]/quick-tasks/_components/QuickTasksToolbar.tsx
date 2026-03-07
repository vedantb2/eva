"use client";

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
} from "@conductor/ui";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import {
  IconPlus,
  IconCheckbox,
  IconLayoutKanban,
  IconList,
  IconFileImport,
  IconFolder,
} from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

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
              className="motion-press hover:scale-[1.01] active:scale-[0.99] max-w-[140px] sm:max-w-[180px]"
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="motion-press hover:scale-[1.01] active:scale-[0.99]"
            onClick={onImport}
          >
            <IconFileImport size={16} />
            <span className="hidden md:inline">Import from Linear</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="md:hidden">
          Import from Linear
        </TooltipContent>
      </Tooltip>
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
