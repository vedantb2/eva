import { formatCost, formatTokens, USD_TO_GBP } from "../_utils";
import { formatDurationMs } from "@/lib/utils/formatDuration";

interface LogsSummaryGridProps {
  totalCost: number;
  totalDuration: number;
  totalInput: number;
  totalOutput: number;
}

export function LogsSummaryGrid({
  totalCost,
  totalDuration,
  totalInput,
  totalOutput,
}: LogsSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Total Cost
        </div>
        <div className="text-lg sm:text-2xl font-semibold">
          {formatCost(totalCost)}
        </div>
        <div className="text-xs text-muted-foreground">
          ~£{(totalCost * USD_TO_GBP).toFixed(4)}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground">Ran For</div>
        <div className="text-lg sm:text-2xl font-semibold">
          {formatDurationMs(totalDuration)}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Input Tokens
        </div>
        <div className="text-lg sm:text-2xl font-semibold">
          {formatTokens(totalInput)}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Output Tokens
        </div>
        <div className="text-lg sm:text-2xl font-semibold">
          {formatTokens(totalOutput)}
        </div>
      </div>
    </div>
  );
}
