"use client";

import { IconChecklist } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { QuickTaskHeaderActionsSlotProvider } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";
import { QuickTaskSplitDetailPane } from "./QuickTaskSplitDetailPane";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksListSplitProps {
  tasks: Task[];
  projectNames: Map<string, string>;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (task: { numId?: number }) => void;
  selectedTaskId?: string;
  detailTab?: TaskDetailTab;
  sandboxTab?: TaskRouteSandboxTab;
  navSurface: "detail" | "sandbox";
}

/**
 * List-view master/detail layout: the quick-task list on the left, the selected
 * task's detail on the right. Mirrors the projects task-list layout while
 * keeping the existing `/quick-tasks/$numId` routing. The action-slot provider
 * wraps both panes so `TaskDetailInline` can portal its action buttons into the
 * right pane's header.
 */
export function QuickTasksListSplit({
  tasks,
  projectNames,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
  selectedTaskId,
  detailTab,
  sandboxTab,
  navSurface,
}: QuickTasksListSplitProps) {
  return (
    <QuickTaskHeaderActionsSlotProvider>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row">
        <div className="flex h-1/2 w-full min-h-0 shrink-0 flex-col overflow-hidden md:h-full md:w-2/5 lg:w-1/3">
          <QuickTasksListView
            tasks={tasks}
            projectNames={projectNames}
            isSelecting={isSelecting}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onOpenTask={onOpenTask}
            selectedTaskId={selectedTaskId}
          />
        </div>
        <div className="ui-surface flex min-h-0 flex-1 flex-col overflow-hidden">
          {selectedTaskId ? (
            <QuickTaskSplitDetailPane
              key={selectedTaskId}
              taskId={selectedTaskId}
              detailTab={detailTab ?? "activity"}
              sandboxTab={sandboxTab}
              navSurface={navSurface}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <IconChecklist size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select a task to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </QuickTaskHeaderActionsSlotProvider>
  );
}
