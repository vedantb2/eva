import { compactRelativeTime } from "@eva/shared/dates";
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
  rows: readonly UsageSnapshot[];
  emptyAccountLabel?: string;
}

/**
 * The expanded card: one section per account that has reported — a provider
 * appears once per connected account, since plan limits are per account — and a
 * single footer stamped with the freshest reading of the lot.
 */
export function UsageLimitsDetails({
  rows,
  emptyAccountLabel,
}: UsageLimitsDetailsProps) {
  // One instant for the whole card, so its rows cannot disagree by a tick.
  // Taken here, not at the trigger: the card mounts on hover-open, so the
  // "resets in" countdown is fresh per open instead of frozen at first render.
  const now = Date.now();
  const visibleRows = rows.filter(
    (row) =>
      now - row.capturedAt <= USAGE_READING_MAX_AGE_MS &&
      (reportedWindows(row, now).length > 0 ||
        toneForStatus(activeUsageStatus(row, now)) !== "neutral"),
  );
  const capturedAt = newestCapturedAt(visibleRows);

  if (visibleRows.length === 0 && emptyAccountLabel) {
    return (
      <div className="space-y-1 p-3">
        <p className="font-medium text-xs">{emptyAccountLabel}</p>
        <p className="text-muted-foreground text-xs">
          No plan usage has been reported for this account yet.
        </p>
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
        <p className="bg-secondary p-3 text-muted-foreground text-xs">
          updated {compactRelativeTime(capturedAt)} ago
        </p>
      )}
    </div>
  );
}
