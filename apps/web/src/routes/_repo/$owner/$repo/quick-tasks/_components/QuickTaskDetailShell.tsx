"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { useFilteredQuickTasks, useQuickTaskFilters } from "../_utils";
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
  detailTab,
  navSurface,
  sandboxTab,
  children,
}: QuickTaskDetailShellProps) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const [{ view }] = useQuickTaskFilters();
  const typedTaskId = taskId as Id<"agentTasks">;

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  const selectedTask = useMemo(() => {
    if (!tasks) return undefined;
    return tasks.find((t) => t._id === typedTaskId);
  }, [typedTaskId, tasks]);

  const orderedTasks = useFilteredQuickTasks(tasks, {
    groupByStatus: view === "kanban",
  });

  const { prevTaskId, nextTaskId } = useMemo(() => {
    if (orderedTasks.length === 0) {
      return { prevTaskId: null, nextTaskId: null };
    }
    const idx = orderedTasks.findIndex((t) => t._id === typedTaskId);
    if (idx === -1) return { prevTaskId: null, nextTaskId: null };
    return {
      prevTaskId: idx > 0 ? orderedTasks[idx - 1]._id : null,
      nextTaskId:
        idx < orderedTasks.length - 1 ? orderedTasks[idx + 1]._id : null,
    };
  }, [typedTaskId, orderedTasks]);

  const handleBack = () => {
    navigate({ to: `${basePath}/quick-tasks` });
  };

  const handleNavigatePrev = () => {
    if (!prevTaskId) {
      return;
    }
    if (navSurface === "sandbox" && sandboxTab) {
      navigate({
        to: `${basePath}/quick-tasks/${prevTaskId}/sandbox/${sandboxTab}`,
      });
      return;
    }
    navigate({
      to: `${basePath}/quick-tasks/${prevTaskId}/${detailTab}`,
    });
  };

  const handleNavigateNext = () => {
    if (!nextTaskId) {
      return;
    }
    if (navSurface === "sandbox" && sandboxTab) {
      navigate({
        to: `${basePath}/quick-tasks/${nextTaskId}/sandbox/${sandboxTab}`,
      });
      return;
    }
    navigate({
      to: `${basePath}/quick-tasks/${nextTaskId}/${detailTab}`,
    });
  };

  if (tasks === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const taskLabel = [
    selectedTask?.taskNumber ? `#${selectedTask.taskNumber}` : null,
    selectedTask?.title ?? null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");

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
            {taskLabel ? (
              <span className="min-w-0 truncate font-semibold">
                {taskLabel}
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
