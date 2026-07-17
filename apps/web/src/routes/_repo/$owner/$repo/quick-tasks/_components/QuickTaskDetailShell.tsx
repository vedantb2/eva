"use client";

import { type ReactNode } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { useQuickTaskNeighbors } from "../_utils/useQuickTaskNeighbors";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";
import {
  QuickTaskHeaderActionsSlot,
  QuickTaskHeaderActionsSlotProvider,
} from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";

interface QuickTaskDetailShellProps {
  taskId: string;
  detailTab: TaskDetailTab;
  navSurface: "detail" | "sandbox";
  sandboxTab?: TaskRouteSandboxTab;
  children: ReactNode;
}

/** Shared page chrome for quick task detail and sandbox routes. */
export function QuickTaskDetailShell({
  taskId,
  navSurface,
  sandboxTab,
  children,
}: QuickTaskDetailShellProps) {
  const { repo } = useRepo();
  const {
    tasks,
    selectedTask,
    prevTaskId,
    nextTaskId,
    handleNavigatePrev,
    handleNavigateNext,
    handleBack,
  } = useQuickTaskNeighbors({ taskId, navSurface, sandboxTab });

  if (tasks === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <QuickTaskHeaderActionsSlotProvider>
      <PageWrapper
        title={
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex shrink-0 items-center gap-1.5 text-base sm:text-lg md:text-xl">
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors font-semibold whitespace-nowrap"
              >
                Quick Tasks
              </button>
              <IconChevronRight
                size={14}
                className="text-muted-foreground/50 shrink-0"
              />
            </div>
            {selectedTask?.numId !== undefined ? (
              <span className="min-w-0 truncate font-semibold font-mono tabular-nums text-muted-foreground">
                #{selectedTask.numId}
              </span>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <EntityContextUsage repoId={repo._id} entityId={taskId} />
              <QuickTaskHeaderActionsSlot />
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleNavigatePrev}
                  disabled={!prevTaskId}
                  className="rounded p-1 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
                  title="Previous task"
                >
                  <IconChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNavigateNext}
                  disabled={!nextTaskId}
                  className="rounded p-1 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
                  title="Next task"
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        }
        fillHeight
        childPadding={false}
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </PageWrapper>
    </QuickTaskHeaderActionsSlotProvider>
  );
}
