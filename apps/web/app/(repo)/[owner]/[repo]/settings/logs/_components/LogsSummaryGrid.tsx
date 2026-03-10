import { formatCost, formatTokens, GBP_TO_USD } from "../_utils";
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
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Total Cost
        </div>
        <div className="text-lg sm:text-2xl font-semibold">
          {formatCost(totalCost)}{" "}
          <span className="text-sm text-muted-foreground">
            ${formatCost(totalCost * GBP_TO_USD).slice(1)}
          </span>
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
