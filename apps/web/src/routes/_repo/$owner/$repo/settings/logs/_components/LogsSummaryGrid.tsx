"use client";

import { formatCost, formatTokens, GBP_TO_USD } from "../_utils";
import { formatDurationMs } from "@eva/shared/duration";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SummaryStat } from "./SummaryStat";

interface LogsSummaryGridProps {
  totalCost: number;
  totalDuration: number;
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
}

export function LogsSummaryGrid({
  totalCost,
  totalDuration,
  totalInput,
  totalOutput,
  totalCacheRead,
  totalCacheWrite,
}: LogsSummaryGridProps) {
  return (
    <SettingsSection title="Summary" bodyVariant="compact">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryStat
          label="Cost"
          value={formatCost(totalCost)}
          subtitle={`$${formatCost(totalCost * GBP_TO_USD).slice(1)}`}
        />
        <SummaryStat
          label="Ran for"
          value={formatDurationMs(totalDuration)}
        />
        <SummaryStat label="Input" value={formatTokens(totalInput)} />
        <SummaryStat label="Output" value={formatTokens(totalOutput)} />
        <SummaryStat label="Cache read" value={formatTokens(totalCacheRead)} />
        <SummaryStat
          label="Cache write"
          value={formatTokens(totalCacheWrite)}
        />
      </div>
    </SettingsSection>
  );
}
