import { compactRelativeTime } from "@eva/shared/dates";
import type { Id } from "@eva/backend";
import {
  activeUsageStatus,
  emptyAccountUsageCopy,
  newestCapturedAt,
  orderedSections,
  reportedWindows,
  sectionKey,
  toneForStatus,
  USAGE_READING_MAX_AGE_MS,
  type UsageAccountScope,
  type UsageSnapshot,
} from "./_utils";
import { UsageProviderSection } from "./UsageProviderSection";
import {
  UsageRefreshButton,
  type UsageRefreshTarget,
} from "./UsageRefreshButton";

interface UsageLimitsDetailsProps {
  repoId: Id<"githubRepos">;
  rows: readonly UsageSnapshot[];
  /**
   * One instant for the whole card, shared with the chip that opens it — both
   * read the same minute clock, so they cannot disagree by a tick, and an open
   * card's countdown ticks along with it.
   */
  now: number;
  /**
   * The credential this card is scoped to. Absent on an unscoped surface, which
   * has no single account to refresh and so offers no refresh.
   */
  accountScope?: UsageAccountScope;
  /** The live daemon that should report. Required for the refresh control. */
  refreshTarget?: UsageRefreshTarget;
}

/**
 * The expanded card: one section per account that has reported — a provider
 * appears once per connected account, since plan limits are per account — and a
 * single footer stamped with the freshest reading of the lot.
 */
export function UsageLimitsDetails({
  repoId,
  rows,
  now,
  accountScope,
  refreshTarget,
}: UsageLimitsDetailsProps) {
  const visibleRows = rows.filter(
    (row) =>
      now - row.capturedAt <= USAGE_READING_MAX_AGE_MS &&
      (reportedWindows(row, now).length > 0 ||
        toneForStatus(activeUsageStatus(row, now)) !== "neutral"),
  );
  const capturedAt = newestCapturedAt(visibleRows);
  const refresh =
    accountScope && refreshTarget ? (
      <UsageRefreshButton
        repoId={repoId}
        scope={accountScope}
        target={refreshTarget}
      />
    ) : undefined;

  if (visibleRows.length === 0 && accountScope) {
    return (
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="space-y-1">
          <p className="font-medium text-xs">{accountScope.accountLabel}</p>
          <p className="text-muted-foreground text-xs">
            {emptyAccountUsageCopy(rows, now)}
          </p>
        </div>
        {refresh}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {orderedSections(visibleRows).map((snapshot) => (
        <UsageProviderSection
          key={sectionKey(snapshot)}
          snapshot={snapshot}
          now={now}
        />
      ))}
      {capturedAt !== undefined && (
        <div className="flex items-center justify-between gap-2 bg-secondary py-1.5 pr-1.5 pl-3">
          <p className="text-muted-foreground text-xs">
            updated {compactRelativeTime(capturedAt)} ago
          </p>
          {refresh}
        </div>
      )}
    </div>
  );
}
