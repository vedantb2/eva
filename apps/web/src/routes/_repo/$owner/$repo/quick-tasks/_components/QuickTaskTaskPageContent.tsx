"use client";

import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { entityPathSegment } from "@/lib/numId";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";
import type { QuickTaskRouteState } from "../_utils/useQuickTaskRouteState";

interface QuickTaskTaskPageContentProps {
  taskId: string;
  routeState: QuickTaskRouteState;
}

export function QuickTaskTaskPageContent({
  taskId,
  routeState,
}: QuickTaskTaskPageContentProps) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const currentTask = useMemo(
    () => tasks?.find((t) => t._id === taskId),
    [tasks, taskId],
  );
  const taskPathSegment = currentTask ? entityPathSegment(currentTask) : null;

  const allTags = useMemo(() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  }, [tasks]);

  const routing = useMemo(() => {
    if (!taskPathSegment) return undefined;

    if (routeState.surface === "sandbox") {
      const sandboxTab = routeState.sandboxTab;
      return {
        mode: "quick-sandbox" as const,
        quick: {
          sandboxTab,
          onSandboxTabChange: (tab: TaskRouteSandboxTab) => {
            navigate({
              to: `${basePath}/quick-tasks/${taskPathSegment}/sandbox/${tab}`,
            });
          },
          onExitSandboxView: () => {
            navigate({
              to: `${basePath}/quick-tasks/${taskPathSegment}/activity`,
            });
          },
        },
      };
    }

    const detailTab: TaskDetailTab = routeState.detailTab;
    return {
      mode: "quick-detail" as const,
      quick: {
        detailTab,
        onDetailTabChange: (tab: TaskDetailTab) => {
          navigate({
            to: `${basePath}/quick-tasks/${taskPathSegment}/${tab}`,
          });
        },
        onOpenSandboxView: (sandboxTab: TaskRouteSandboxTab) => {
          navigate({
            to: `${basePath}/quick-tasks/${taskPathSegment}/sandbox/${sandboxTab}`,
          });
        },
      },
    };
  }, [basePath, navigate, routeState, taskPathSegment]);

  const typedTaskId = currentTask?._id;
  if (!typedTaskId || !routing) {
    return null;
  }

  return (
    <TaskDetailInline
      onClose={() => navigate({ to: `${basePath}/quick-tasks` })}
      taskId={typedTaskId}
      allTags={allTags}
      routing={routing}
    />
  );
}
