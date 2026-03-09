"use client";

import type { Id } from "@conductor/backend";
import type { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { IssuesListView } from "@/lib/components/issues/IssuesListView";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { IssuesStatusSummary } from "@/lib/components/issues/IssuesStatusSummary";
import { Button } from "@conductor/ui";
import { IconArrowLeft } from "@tabler/icons-react";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface IssuesSplitViewProps {
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
  selectedTaskId: Id<"agentTasks"> | null;
  onCloseTask: () => void;
  issues: Task[];
  projectNames: Map<string, string>;
}

export function IssuesSplitView({
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
  selectedTaskId,
  onCloseTask,
  issues,
  projectNames,
}: IssuesSplitViewProps) {
  return (
    <div className="flex min-w-0 flex-1 min-h-0 flex-col sm:flex-row">
      <div
        className={
          selectedTaskId
            ? "hidden sm:flex sm:w-[20%] min-w-0 min-h-0 flex-shrink-0 overflow-hidden flex-col"
            : "flex flex-col min-w-0 min-h-0 flex-1 sm:flex-none sm:w-[20%] sm:flex-shrink-0 sm:overflow-hidden"
        }
      >
        <IssuesListView
          tasks={issues}
          projectNames={projectNames}
          isSelecting={isSelecting}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onOpenTask={onOpenTask}
          selectedTaskId={selectedTaskId}
        />
      </div>
      {selectedTaskId ? (
        <div className="w-full sm:w-[80%] min-w-0 flex-shrink-0 min-h-0 h-full overflow-hidden flex flex-col">
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
        <div className="hidden sm:flex sm:w-[80%] min-w-0 flex-shrink-0 min-h-0 h-full">
          <IssuesStatusSummary tasks={issues} />
        </div>
      )}
    </div>
  );
}
