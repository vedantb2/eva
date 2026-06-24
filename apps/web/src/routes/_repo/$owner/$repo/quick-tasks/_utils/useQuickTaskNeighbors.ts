"use client";

import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useFilteredQuickTasks, useQuickTaskFilters } from "../_utils";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

interface UseQuickTaskNeighborsArgs {
  taskId: string;
  /** Whether the open surface is the detail tabs or the sandbox. */
  navSurface: "detail" | "sandbox";
  detailTab: TaskDetailTab;
  sandboxTab?: TaskRouteSandboxTab;
}

/**
 * Shared prev/next + back navigation for an open quick task. Walks the same
 * filtered+grouped task order the list/kanban renders, so stepping through
 * tasks matches their visual order. Used by both the full-page detail shell and
 * the list-view master/detail split, keeping the two surfaces in sync.
 */
export function useQuickTaskNeighbors({
  taskId,
  navSurface,
  detailTab,
  sandboxTab,
}: UseQuickTaskNeighborsArgs) {
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
    // Kanban and list both render tasks grouped by status, so prev/next must
    // walk that same order. Only the table view is a flat sorted list.
    groupByStatus: view === "kanban" || view === "list",
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

  const goToTask = (id: Id<"agentTasks">) => {
    if (navSurface === "sandbox" && sandboxTab) {
      navigate({ to: `${basePath}/quick-tasks/${id}/sandbox/${sandboxTab}` });
      return;
    }
    navigate({ to: `${basePath}/quick-tasks/${id}/${detailTab}` });
  };

  return {
    tasks,
    selectedTask,
    prevTaskId,
    nextTaskId,
    handleNavigatePrev: () => {
      if (prevTaskId) goToTask(prevTaskId);
    },
    handleNavigateNext: () => {
      if (nextTaskId) goToTask(nextTaskId);
    },
    handleBack: () => {
      navigate({ to: `${basePath}/quick-tasks` });
    },
  };
}
