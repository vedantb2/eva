"use client";

import { Spinner } from "@conductor/ui";
import { QuickTaskDetailShell } from "./QuickTaskDetailShell";
import { QuickTaskTaskPageContent } from "./QuickTaskTaskPageContent";
import { useQuickTaskRouteState } from "../_utils/-useQuickTaskRouteState";

export function QuickTaskTaskLayout({ taskId }: { taskId: string }) {
  const routeState = useQuickTaskRouteState();

  if (!routeState) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const detailTab = routeState.detailTab;

  return (
    <QuickTaskDetailShell
      taskId={taskId}
      detailTab={detailTab}
      navSurface={routeState.surface}
      sandboxTab={
        routeState.surface === "sandbox" ? routeState.sandboxTab : undefined
      }
    >
      <QuickTaskTaskPageContent taskId={taskId} routeState={routeState} />
    </QuickTaskDetailShell>
  );
}
