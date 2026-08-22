import { compactRelativeTime } from "@eva/shared/dates";
import { newestCapturedAt, type UsageSnapshot } from "./_utils";
import { UsageProviderSection } from "./UsageProviderSection";

interface UsageLimitsDetailsProps {
  rows: readonly UsageSnapshot[];
  /** One instant for the whole card, so its rows cannot disagree by a tick. */
  now: number;
}

/**
 * The expanded card: one section per provider that has reported, and a single
 * footer stamped with the freshest reading of the lot.
 */
export function UsageLimitsDetails({ rows, now }: UsageLimitsDetailsProps) {
  const capturedAt = newestCapturedAt(rows);

  return (
    <div className="divide-y">
      {rows.map((snapshot) => (
        <UsageProviderSection
          key={snapshot.provider}
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
