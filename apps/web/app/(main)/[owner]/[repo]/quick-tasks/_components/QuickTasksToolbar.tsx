"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import {
  IconPlus,
  IconCheckbox,
  IconLayoutKanban,
  IconList,
  IconFileImport,
} from "@tabler/icons-react";

type QuickTaskView = "kanban" | "list";

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
}: QuickTasksToolbarProps) {
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
