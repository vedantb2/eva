import { formatTokens } from "@/lib/utils/logs";
import {
  formatCostCents,
  providerHeading,
  reportedWindows,
  type UsageSnapshot,
} from "./_utils";
import { UsageMetaRow } from "./UsageMetaRow";
import { UsageWindowRow } from "./UsageWindowRow";

interface UsageProviderSectionProps {
  snapshot: UsageSnapshot;
  /** Passed in so every row in one card measures against the same instant. */
  now: number;
}

/**
 * One provider's reading. Claude reports plan windows; Cursor has none, and
 * reports cumulative tokens and spend instead — so a section shows whichever
 * of the two its provider actually sent.
 */
export function UsageProviderSection({
  snapshot,
  now,
}: UsageProviderSectionProps) {
  const windows = reportedWindows(snapshot);
  const tokens = snapshot.tokens;
  const costCents = snapshot.costCents;

  return (
    <div className="space-y-2 p-3">
      <p className="font-medium text-xs">{providerHeading(snapshot)}</p>
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
      {tokens && (
        <div className="space-y-1">
          <UsageMetaRow label="Tokens" value={formatTokens(tokens.total)} />
          <UsageMetaRow label="Input" value={formatTokens(tokens.input)} />
          <UsageMetaRow label="Output" value={formatTokens(tokens.output)} />
        </div>
      )}
      {costCents !== undefined && (
        <UsageMetaRow label="Cost" value={formatCostCents(costCents)} />
      )}
    </div>
  );
}
