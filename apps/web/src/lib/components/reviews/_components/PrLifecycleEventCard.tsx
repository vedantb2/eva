import { cn } from "@eva/ui";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { NOTICE_CLASS, type PrOverview } from "./prOverviewMeta";

/**
 * The two ends a pull request can reach. An open one has not had an event yet,
 * so it gets no row — which is why this is a separate type from
 * `PrOverview["status"]` rather than a filter at the call site.
 */
export type PrLifecycleStatus = "merged" | "closed";

/**
 * How the pull request ended, stated once at the head of the conversation.
 *
 * This is the first thing a reader wants to know and the last thing the rail
 * would tell them: chronologically the merge lands after every comment, so on a
 * long thread the answer to "did this ship?" was a scroll away. It leads instead.
 *
 * Only what the payload actually carries is stated. There is no merge commit sha
 * on the overview and no close timestamp, so the merged row names the merger, the
 * base branch, and the time, and the closed row names neither a person nor a date
 * rather than guessing at one.
 */
export function PrLifecycleEventCard({
  status,
  overview,
}: {
  status: PrLifecycleStatus;
  overview: PrOverview;
}) {
  const mergedAt = overview.mergedAt;

  return (
    // The same quiet tonal fill as every other notice on this surface: an event
    // is context for the thread, not another voice in it, so it gets a softer
    // card than the comment bubbles it sits above.
    <div
      className={cn(
        NOTICE_CLASS,
        "flex flex-wrap items-center gap-x-1.5 gap-y-1",
      )}
    >
      <span className="font-medium text-foreground">
        {status === "merged" ? "Merged" : "Closed"}
      </span>
      <span aria-hidden>—</span>

      {status === "merged" ? (
        <>
          {overview.mergedByLogin === null ? null : (
            <span className="font-medium text-foreground">
              {overview.mergedByLogin}
            </span>
          )}
          <span>
            {overview.mergedByLogin === null
              ? "merged into"
              : "merged this pull request into"}
          </span>
          <span className="min-w-0 truncate rounded bg-muted/60 px-1 py-0.5 font-mono">
            {overview.baseRef}
          </span>
        </>
      ) : (
        <span>without merging</span>
      )}

      {mergedAt === null ? null : (
        <RelativeDateTime
          at={new Date(mergedAt).getTime()}
          className="ml-auto shrink-0"
        />
      )}
    </div>
  );
}
