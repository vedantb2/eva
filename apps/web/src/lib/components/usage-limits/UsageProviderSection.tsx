import { providerHeading, reportedWindows, type UsageSnapshot } from "./_utils";
import { UsageWindowRow } from "./UsageWindowRow";

interface UsageProviderSectionProps {
  snapshot: UsageSnapshot;
  /** Passed in so every row in one card measures against the same instant. */
  now: number;
}

/**
 * One account's reading: the plan windows the provider reported, if any.
 *
 * The account's name trails the heading, muted: the plan is what the numbers
 * measure, and the account is only there to tell two of the same plan apart. A
 * run on the shared team credential belongs to no account and shows none.
 */
export function UsageProviderSection({
  snapshot,
  now,
}: UsageProviderSectionProps) {
  const windows = reportedWindows(snapshot, now);

  return (
    <div className="space-y-2 p-3">
      <p className="font-medium text-xs">
        {providerHeading(snapshot)}
        {snapshot.accountLabel !== undefined && (
          <span className="font-normal text-muted-foreground">
            {` · ${snapshot.accountLabel}`}
          </span>
        )}
      </p>
      {windows.length > 0 && (
        <div className="space-y-2.5">
          {windows.map((usageWindow) => (
            <UsageWindowRow
              key={usageWindow.key}
              usageWindow={usageWindow}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  );
}
