"use client";

import {
  IconCurrencyPound,
  IconClock,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
import { Kpi } from "@/lib/components/analytics/Kpi";
import { formatCost, formatTokens, GBP_TO_USD } from "../_utils";
import { formatDurationMs } from "@eva/shared/duration";

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
  const primaryStats = [
    {
      icon: IconCurrencyPound,
      label: "Total Cost",
      value: formatCost(totalCost),
      subtitle: `$${formatCost(totalCost * GBP_TO_USD).slice(1)}`,
    },
    {
      icon: IconClock,
      label: "Ran For",
      value: formatDurationMs(totalDuration),
      subtitle: undefined,
    },
  ];

  const tokenStats = [
    {
      icon: IconArrowDown,
      label: "Input Tokens",
      value: formatTokens(totalInput),
      subtitle: undefined,
    },
    {
      icon: IconArrowUp,
      label: "Output Tokens",
      value: formatTokens(totalOutput),
      subtitle: undefined,
    },
    {
      icon: IconArrowDown,
      label: "Cache Read",
      value: formatTokens(totalCacheRead),
      subtitle: undefined,
    },
    {
      icon: IconArrowUp,
      label: "Cache Write",
      value: formatTokens(totalCacheWrite),
      subtitle: undefined,
    },
  ];

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {primaryStats.map((stat) => (
          <Kpi
            key={stat.label}
            layout="row"
            size="lg"
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tokenStats.map((stat) => (
          <Kpi
            key={stat.label}
            layout="row"
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
          />
        ))}
      </div>
    </div>
  );
}
