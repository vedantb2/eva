import { IconChecklist } from "@tabler/icons-react";
import type { Id, api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { Spinner } from "@eva/ui";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { QuickTaskHeaderActionsSlotProvider } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";
import { QuickTaskSplitDetailPane } from "./QuickTaskSplitDetailPane";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import type { EntityResolveStatus } from "@/lib/components/EntityNumIdGate";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  selectedTaskId?: Id<"agentTasks">;
  /** Resolve status of the numId in the URL; undefined when no task is selected. */
  selectedTaskStatus?: EntityResolveStatus;
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
 *
 * The left list stays mounted across all detail-pane states (loading,
 * not-found, resolved, no selection) so switching tasks never unmounts the
 * virtuoso list or loses its scroll position.
 *
 * Split mechanics come from `ResizablePanelLayout`, the same primitive the
 * project, session and task detail views use. This pane used to hand-roll its
 * own flex split at a fixed `md:w-1/3`, which meant the width was neither
 * draggable nor remembered — the only three-pane surface in the app where that
 * was true.
 */
export function QuickTasksListSplit({
  tasks,
  projectNames,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
  selectedTaskId,
  selectedTaskStatus,
  detailTab,
  sandboxTab,
  navSurface,
}: QuickTasksListSplitProps) {
  const { basePath } = useRepo();
  return (
    <QuickTaskHeaderActionsSlotProvider>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizablePanelLayout
          storageKey="quick-tasks-split"
          leftDefaultSize="33%"
          leftMinWidthPx={260}
          rightMinWidthPx={360}
          // The detail pane is the point of this view, so it starts open —
          // unlike the sidebar-style panels the other call sites use.
          defaultRightCollapsed={false}
          leftPanel={() => (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
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
          )}
          rightPanel={
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
              {selectedTaskStatus === "loading" ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : selectedTaskStatus === "not-found" ? (
                <EntityNotFound
                  entityLabel="task"
                  backTo={`${basePath}/quick-tasks`}
                  backLabel="Back to Quick Tasks"
                />
              ) : selectedTaskId ? (
                <QuickTaskSplitDetailPane
                  key={selectedTaskId}
                  taskId={selectedTaskId}
                  detailTab={detailTab ?? "activity"}
                  sandboxTab={sandboxTab}
                  navSurface={navSurface}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <IconChecklist className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a task to view details
                  </p>
                </div>
              )}
            </div>
          }
        />
      </div>
    </QuickTaskHeaderActionsSlotProvider>
  );
}
