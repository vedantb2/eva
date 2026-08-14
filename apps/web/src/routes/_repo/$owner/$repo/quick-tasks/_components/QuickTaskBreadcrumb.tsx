"use client";

import { IconChevronRight } from "@tabler/icons-react";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

interface QuickTaskBreadcrumbProps {
  onBack: () => void;
  taskNumId?: number;
  taskTitle?: string;
}

/** Matches the Projects detail breadcrumb row in `ProjectDetailClient`. */
export function QuickTaskBreadcrumb({
  onBack,
  taskNumId,
  taskTitle,
}: QuickTaskBreadcrumbProps) {
  const taskLabel = (() => {
    if (taskTitle) {
      return taskNumId !== undefined
        ? `#${taskNumId} ${taskTitle}`
        : taskTitle;
    }
    if (taskNumId !== undefined) return `#${taskNumId}`;
    return null;
  })();

  return (
    <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
      <button
        type="button"
        onClick={onBack}
        className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        Quick Tasks
      </button>
      <IconChevronRight
        size={14}
        className="shrink-0 text-muted-foreground/50"
      />
      {taskLabel ? (
        <MarqueeOnHover className="min-w-0 font-semibold">
          {taskLabel}
        </MarqueeOnHover>
      ) : null}
    </div>
  );
}
