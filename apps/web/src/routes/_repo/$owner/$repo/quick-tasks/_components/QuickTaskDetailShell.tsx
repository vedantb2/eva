"use client";

import { type ReactNode } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Spinner } from "@eva/ui";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
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
          // `text-2sm` matches the size PageWrapper's own h1 renders, so the
          // crumb reads as the route title rather than as content inside it.
          <div className="flex min-w-0 flex-1 items-center gap-2 text-2sm sm:gap-3">
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-7 px-1.5 text-2sm font-medium"
              >
                Quick Tasks
              </Button>
              <IconChevronRight
                size={14}
                className="text-muted-foreground/50 shrink-0"
              />
            </div>
            {selectedTask?.numId !== undefined ? (
              <span className="shrink-0 font-mono text-2sm font-medium tabular-nums text-muted-foreground">
                #{selectedTask.numId}
              </span>
            ) : null}
            {navSurface === "sandbox" && selectedTask?.title ? (
              <MarqueeOnHover className="min-w-0 text-2sm font-medium">
                {selectedTask.title}
              </MarqueeOnHover>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <EntityContextUsage repoId={repo._id} entityId={taskId} />
              <QuickTaskHeaderActionsSlot />
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNavigatePrev}
                  disabled={!prevTaskId}
                  title="Previous task"
                >
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNavigateNext}
                  disabled={!nextTaskId}
                  title="Next task"
                >
                  <IconChevronRight />
                </Button>
              </div>
            </div>
          </div>
        }
        fillHeight
        childPadding={false}
      >
        {/* Detail keeps page gutters; sandbox is flush like sessions/projects. */}
        <div
          className={
            navSurface === "detail"
              ? "relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0"
              : "relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden"
          }
        >
          <div
            className={
              navSurface === "detail"
                ? "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden"
                : "flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            }
          >
            {children}
          </div>
        </div>
      </PageWrapper>
    </QuickTaskHeaderActionsSlotProvider>
  );
}
