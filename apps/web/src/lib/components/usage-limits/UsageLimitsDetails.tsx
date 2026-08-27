import { compactRelativeTime } from "@eva/shared/dates";
import type { Id } from "@eva/backend";
import {
  activeUsageStatus,
  newestCapturedAt,
  orderedSections,
  reportedWindows,
  sectionKey,
  toneForStatus,
  USAGE_READING_MAX_AGE_MS,
  type UsageSnapshot,
} from "./_utils";
import { UsageProviderSection } from "./UsageProviderSection";

interface UsageLimitsDetailsProps {
  repoId: Id<"githubRepos">;
  rows: readonly UsageSnapshot[];
  /**
   * One instant for the whole card, shared with the chip that opens it — both
   * read the same minute clock, so they cannot disagree by a tick, and an open
   * card's countdown ticks along with it.
   */
  now: number;
}

/**
 * The expanded card: one section per Claude account that has reported, each
 * with its own refresh — plan limits are per account, so refreshing is too.
 */
export function UsageLimitsDetails({
  repoId,
  rows,
  now,
}: UsageLimitsDetailsProps) {
  const visibleRows = rows.filter(
    (row) =>
      now - row.capturedAt <= USAGE_READING_MAX_AGE_MS &&
      (reportedWindows(row, now).length > 0 ||
        toneForStatus(activeUsageStatus(row, now)) !== "neutral"),
  );
  const capturedAt = newestCapturedAt(visibleRows);

  if (visibleRows.length === 0) {
    return (
      <div className="space-y-1 p-3">
        <p className="font-medium text-xs">Plan usage</p>
        <p className="text-muted-foreground text-xs">
          No Claude plan readings yet. Numbers appear after a Claude turn or a
          refresh on a connected account.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {orderedSections(visibleRows).map((snapshot) => (
        <UsageProviderSection
          key={sectionKey(snapshot)}
          repoId={repoId}
          snapshot={snapshot}
          now={now}
        />
      ))}
      {capturedAt !== undefined && (
        <div className="bg-secondary py-1.5 pr-1.5 pl-3">
          <p className="text-muted-foreground text-xs">
            updated {compactRelativeTime(capturedAt)} ago
          </p>
        </div>
      )}
    </div>
  );
}
