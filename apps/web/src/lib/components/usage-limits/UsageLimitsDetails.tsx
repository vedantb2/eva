import { compactRelativeTime } from "@eva/shared/dates";
import {
  newestCapturedAt,
  orderedSections,
  sectionKey,
  type UsageSnapshot,
} from "./_utils";
import { UsageProviderSection } from "./UsageProviderSection";

interface UsageLimitsDetailsProps {
  rows: readonly UsageSnapshot[];
}

/**
 * The expanded card: one section per account that has reported — a provider
 * appears once per connected account, since plan limits are per account — and a
 * single footer stamped with the freshest reading of the lot.
 */
export function UsageLimitsDetails({ rows }: UsageLimitsDetailsProps) {
  // One instant for the whole card, so its rows cannot disagree by a tick.
  // Taken here, not at the trigger: the card mounts on hover-open, so the
  // "resets in" countdown is fresh per open instead of frozen at first render.
  const now = Date.now();
  const capturedAt = newestCapturedAt(rows);

  return (
    <div className="divide-y">
      {orderedSections(rows).map((snapshot) => (
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
