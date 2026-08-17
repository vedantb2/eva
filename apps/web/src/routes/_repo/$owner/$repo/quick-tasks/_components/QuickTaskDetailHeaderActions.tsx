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
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      <EntityContextUsage repoId={repoId} entityId={taskId} />
      <QuickTaskHeaderActionsSlot />
      {/* Grown to the 40px floor below `sm` rather than given `hit-target`:
          the two buttons sit flush, so an 8px bleed each would overlap and one
          would steal the other's taps. */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onNavigatePrev}
          disabled={!prevTaskId}
          className="flex size-10 items-center justify-center rounded transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30 sm:size-7"
          aria-label="Previous task"
          title="Previous task"
        >
          <IconChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onNavigateNext}
          disabled={!nextTaskId}
          className="flex size-10 items-center justify-center rounded transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30 sm:size-7"
          aria-label="Next task"
          title="Next task"
        >
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
