"use client";

import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { QuickTaskDetailShell } from "./_components/QuickTaskDetailShell";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

interface QuickTaskDetailClientProps {
  taskId: string;
  detailTab: TaskDetailTab;
}

export function QuickTaskDetailClient({
  taskId,
  detailTab,
}: QuickTaskDetailClientProps) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const typedTaskId = taskId as Id<"agentTasks">;

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

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

  const routing = useMemo(
    () =>
      ({
        mode: "quick-detail",
        quick: {
          detailTab,
          onDetailTabChange: (tab: TaskDetailTab) => {
            navigate({
              to: `${basePath}/quick-tasks/${typedTaskId}/${tab}`,
            });
          },
          onOpenSandboxView: (sandboxTab: TaskRouteSandboxTab) => {
            navigate({
              to: `${basePath}/quick-tasks/${typedTaskId}/sandbox/${sandboxTab}`,
            });
          },
        },
      }) as const,
    [basePath, detailTab, navigate, typedTaskId],
  );

  return (
    <QuickTaskDetailShell taskId={taskId} detailTab={detailTab}>
      <TaskDetailInline
        key={typedTaskId}
        onClose={() => navigate({ to: `${basePath}/quick-tasks` })}
        taskId={typedTaskId}
        allTags={allTags}
        routing={routing}
      />
    </QuickTaskDetailShell>
  );
}
