"use client";

import type { Id } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { QuickTaskHeaderTitleSlot } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";
import { QuickTaskDetailHeaderActions } from "./QuickTaskDetailHeaderActions";
import { useQuickTaskNeighbors } from "../_utils/useQuickTaskNeighbors";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

interface QuickTaskSplitDetailHeaderProps {
  taskId: Id<"agentTasks">;
  navSurface: "detail" | "sandbox";
  sandboxTab?: TaskRouteSandboxTab;
}

/**
 * Chrome for the list view's detail pane: the task surface switcher on the left,
 * context usage / task actions / prev-next on the right.
 *
 * It sits at the top of the pane rather than in the page header. The page header
 * belongs to the list here (title, search, filters, view toggle, New Task), and
 * hoisting task chrome into it put a breadcrumb where the page title goes and
 * left the surface switcher centred over the list — `PageWrapper` centres
 * `titleAfter` on the header row, which only reads as "this task's tabs" when
 * the task is the whole page. Full-page detail (kanban/table) keeps that layout
 * via `QuickTaskDetailShell`; the split does not.
 */
export function QuickTaskSplitDetailHeader({
  taskId,
  navSurface,
  sandboxTab,
}: QuickTaskSplitDetailHeaderProps) {
  const { repo } = useRepo();
  const { prevTaskId, nextTaskId, handleNavigatePrev, handleNavigateNext } =
    useQuickTaskNeighbors({ taskId, navSurface, sandboxTab });

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
      <QuickTaskHeaderTitleSlot />
      <QuickTaskDetailHeaderActions
        repoId={repo._id}
        taskId={taskId}
        prevTaskId={prevTaskId ?? undefined}
        nextTaskId={nextTaskId ?? undefined}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
      />
    </div>
  );
}
