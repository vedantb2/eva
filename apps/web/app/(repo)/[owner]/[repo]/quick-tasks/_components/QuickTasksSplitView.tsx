"use client";

import type { Id } from "@conductor/backend";
import type { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { QuickTasksStatusSummary } from "@/lib/components/quick-tasks/QuickTasksStatusSummary";

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
    <div className="flex min-w-0 flex-1 min-h-0">
      <div
        className={
          selectedTaskId
            ? "hidden md:flex md:w-[20%] min-w-0 min-h-0 flex-shrink-0 overflow-hidden flex-col"
            : "flex flex-col min-w-0 min-h-0 flex-1 md:flex-none md:w-[20%] md:flex-shrink-0 md:overflow-hidden"
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
        <div className="w-full md:w-[80%] min-w-0 flex-shrink-0 min-h-0 h-full overflow-hidden">
          <TaskDetailInline onClose={onCloseTask} taskId={selectedTaskId} />
        </div>
      ) : (
        <div className="hidden md:flex md:w-[80%] min-w-0 flex-shrink-0 min-h-0 h-full">
          <QuickTasksStatusSummary tasks={quickTasks} />
        </div>
      )}
    </div>
  );
}
