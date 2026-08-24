import { Skeleton } from "@eva/ui";

/** Grouped collapsible list: phase headers with cards under each. */
export function ProjectsListSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {["mx-3 mt-2 h-8 w-28", "mx-3 mt-2 h-8 w-36", "mx-3 mt-2 h-8 w-32"].map(
        (headerClass, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className={headerClass} />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ),
      )}
    </div>
  );
}

/** Gantt: toolbar, issue list on the left, bars on the right. */
export function ProjectsTimelineSkeleton() {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-busy="true"
      aria-label="Loading projects"
    >
      <div className="flex justify-end">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden bg-muted/40">
        <div className="w-[min(300px,45%)] shrink-0 space-y-2 border-r border-border p-2">
          <Skeleton className="h-8" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-2 p-2">
          <Skeleton className="h-10" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-2/3" />
          ))}
        </div>
      </div>
    </div>
  );
}
