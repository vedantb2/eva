"use client";

import type { Id } from "@conductor/backend";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { QuickTaskHeaderActionsSlot } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";
import { QuickTaskTaskPageContent } from "./QuickTaskTaskPageContent";
import { useQuickTaskNeighbors } from "../_utils/useQuickTaskNeighbors";
import type { QuickTaskRouteState } from "../_utils/useQuickTaskRouteState";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

interface QuickTaskSplitDetailPaneProps {
  taskId: Id<"agentTasks">;
  detailTab: TaskDetailTab;
  sandboxTab?: TaskRouteSandboxTab;
  navSurface: "detail" | "sandbox";
}

/**
 * Right pane of the list-view master/detail split: a slim header carrying the
 * task label, context usage, the portaled action buttons, and prev/next
 * stepping, above the shared task detail body. Mirrors the chrome the full-page
 * `QuickTaskDetailShell` puts in the page header, relocated into the pane.
 */
export function QuickTaskSplitDetailPane({
  taskId,
  detailTab,
  sandboxTab,
  navSurface,
}: QuickTaskSplitDetailPaneProps) {
  const { repo } = useRepo();
  const reduceMotion = useReducedMotion();
  const {
    selectedTask,
    prevTaskId,
    nextTaskId,
    handleNavigatePrev,
    handleNavigateNext,
  } = useQuickTaskNeighbors({ taskId, navSurface, sandboxTab });

  const routeState: QuickTaskRouteState =
    navSurface === "sandbox" && sandboxTab
      ? { surface: "sandbox", sandboxTab, detailTab: "activity" }
      : { surface: "detail", detailTab };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        {selectedTask?.numId !== undefined ? (
          <span className="min-w-0 flex-1 truncate text-sm font-semibold font-mono tabular-nums text-muted-foreground">
            #{selectedTask.numId}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <EntityContextUsage repoId={repo._id} entityId={taskId} />
          <QuickTaskHeaderActionsSlot />
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNavigatePrev}
              disabled={!prevTaskId}
              className="hit-target motion-press rounded p-1 active:scale-[0.96] transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
              title="Previous task"
            >
              <IconChevronLeft size={16} />
            </button>
            <button
              onClick={handleNavigateNext}
              disabled={!nextTaskId}
              className="hit-target motion-press rounded p-1 active:scale-[0.96] transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
              title="Next task"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={taskId}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <QuickTaskTaskPageContent taskId={taskId} routeState={routeState} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}
