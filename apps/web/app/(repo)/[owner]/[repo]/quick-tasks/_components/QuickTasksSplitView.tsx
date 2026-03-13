"use client";

import type { Id } from "@conductor/backend";
import type { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { QuickTasksStatusSummary } from "@/lib/components/quick-tasks/QuickTasksStatusSummary";
import { Button } from "@conductor/ui";
import { IconArrowLeft } from "@tabler/icons-react";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksSplitViewProps {
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
  selectedTaskId: Id<"agentTasks"> | null;
  onCloseTask: () => void;
  quickTasks: Task[];
  projectNames: Map<string, string>;
}

export function QuickTasksSplitView({
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
  selectedTaskId,
  onCloseTask,
  quickTasks,
  projectNames,
}: QuickTasksSplitViewProps) {
  return (
    <div className="flex min-w-0 flex-1 min-h-0 flex-col sm:flex-row">
      <div
        className={
          selectedTaskId
            ? "hidden sm:flex sm:w-[280px] md:w-[20%] min-w-0 min-h-0 flex-shrink-0 overflow-hidden flex-col border-r border-border/40"
            : "flex flex-col min-w-0 min-h-0 flex-1 sm:flex-none sm:w-[280px] md:w-[20%] sm:flex-shrink-0 sm:overflow-hidden"
        }
      >
        <QuickTasksListView
          tasks={quickTasks}
          projectNames={projectNames}
          isSelecting={isSelecting}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onOpenTask={onOpenTask}
          selectedTaskId={selectedTaskId}
        />
      </div>
      {selectedTaskId ? (
        <div className="w-full sm:flex-1 min-w-0 min-h-0 h-full overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 sm:hidden">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onCloseTask}
              className="h-8 w-8"
            >
              <IconArrowLeft size={16} />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Back to tasks
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <TaskDetailInline onClose={onCloseTask} taskId={selectedTaskId} />
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex sm:flex-1 min-w-0 min-h-0 h-full">
          <QuickTasksStatusSummary tasks={quickTasks} />
        </div>
      )}
    </div>
  );
}
