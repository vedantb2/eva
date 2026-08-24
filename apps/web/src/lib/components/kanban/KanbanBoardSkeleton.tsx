import { Skeleton } from "@eva/ui";
import { KANBAN_COLUMN_WIDTH_CLASS } from "./KanbanColumn";

/**
 * Loading stand-in for a status/phase board. Same column width class and
 * muted wash as {@link KanbanColumn}, so the real columns replace these
 * without a layout jump.
 */
export function KanbanBoardSkeleton({
  columns,
  "aria-label": ariaLabel,
}: {
  columns: number;
  "aria-label": string;
}) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 items-stretch gap-2 overflow-x-auto overflow-y-hidden scrollbar scroll-fade-x snap-x snap-mandatory sm:gap-3 sm:snap-none"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={`flex min-h-0 snap-center self-stretch ${KANBAN_COLUMN_WIDTH_CLASS}`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-muted/40">
            <div className="flex shrink-0 items-center p-2">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-1.5 pt-0">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
