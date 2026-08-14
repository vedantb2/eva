"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { QuickTaskHeaderActionsSlot } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";

interface QuickTaskDetailHeaderActionsProps {
  repoId: Id<"githubRepos">;
  taskId: string;
  prevTaskId?: Id<"agentTasks">;
  nextTaskId?: Id<"agentTasks">;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
}

export function QuickTaskDetailHeaderActions({
  repoId,
  taskId,
  prevTaskId,
  nextTaskId,
  onNavigatePrev,
  onNavigateNext,
}: QuickTaskDetailHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <EntityContextUsage repoId={repoId} entityId={taskId} />
      <QuickTaskHeaderActionsSlot />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onNavigatePrev}
          disabled={!prevTaskId}
          className="rounded p-1 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
          title="Previous task"
        >
          <IconChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNavigateNext}
          disabled={!nextTaskId}
          className="rounded p-1 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
          title="Next task"
        >
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
