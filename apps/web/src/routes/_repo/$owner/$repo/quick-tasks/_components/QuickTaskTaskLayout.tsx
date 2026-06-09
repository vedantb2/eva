"use client";

import { Spinner } from "@conductor/ui";
import { QuickTaskDetailShell } from "./QuickTaskDetailShell";
import { QuickTaskTaskPageContent } from "./QuickTaskTaskPageContent";
import { QuickTasksClient } from "../QuickTasksClient";
import { useQuickTaskRouteState } from "../_utils/useQuickTaskRouteState";
import { useQuickTaskFilters } from "../_utils";

export function QuickTaskTaskLayout({ taskId }: { taskId: string }) {
  const routeState = useQuickTaskRouteState();
  const [{ view }] = useQuickTaskFilters();

  if (!routeState) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const detailTab = routeState.detailTab;
  const sandboxTab =
    routeState.surface === "sandbox" ? routeState.sandboxTab : undefined;

  // List view renders a master/detail split (list left, this task right) that
  // reuses the full QuickTasksClient page chrome, so the toolbar and list stay
  // available. Kanban/table keep the dedicated full-page detail.
  if (view === "list") {
    return (
      <QuickTasksClient
        selectedTaskId={taskId}
        detailTab={detailTab}
        navSurface={routeState.surface}
        sandboxTab={sandboxTab}
      />
    );
  }

  return (
    <QuickTaskDetailShell
      taskId={taskId}
      detailTab={detailTab}
      navSurface={routeState.surface}
      sandboxTab={sandboxTab}
    >
      <QuickTaskTaskPageContent taskId={taskId} routeState={routeState} />
    </QuickTaskDetailShell>
  );
}
