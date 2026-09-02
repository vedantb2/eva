import { Skeleton } from "@eva/ui";

/** Rail + article cards used by Today and What's New. */
export function TimelineEntriesSkeleton({
  "aria-label": ariaLabel,
}: {
  "aria-label": string;
}) {
  return (
    <ol
      className="relative space-y-4 border-l border-border pl-6 sm:pl-8"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {[0, 1, 2].map((i) => (
        <li key={i} className="relative">
          <span
            className="absolute -left-6 top-4 size-2 rounded-full bg-border ring-4 ring-background sm:-left-8"
            aria-hidden
          />
          <div className="rounded-surface bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-2 px-4 py-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
