import { Skeleton } from "@eva/ui";

/** Master/detail split that list view renders via ResizablePanelLayout. */
export function QuickTasksListSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 overflow-hidden"
      aria-busy="true"
      aria-label="Loading quick tasks"
    >
      <div className="flex min-h-0 w-full flex-col gap-1 overflow-hidden md:w-[33%] md:min-w-[260px] md:border-r md:border-border md:pr-2">
        <Skeleton className="mx-3 mt-2 h-8 w-28" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="mx-3 mt-3 h-8 w-36" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="hidden min-h-0 min-w-0 flex-1 md:block" />
    </div>
  );
}

/** Full-page task chrome that kanban/table open instead of the split. */
export function QuickTaskDetailSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-0"
      aria-busy="true"
      aria-label="Loading task"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-2/3 max-w-lg" />
      <Skeleton className="min-h-0 flex-1" />
    </div>
  );
}
