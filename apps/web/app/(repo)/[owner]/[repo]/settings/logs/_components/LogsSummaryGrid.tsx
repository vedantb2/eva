"use client";

import { Card, CardContent } from "@conductor/ui";
import {
  IconCurrencyPound,
  IconClock,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
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
  const stats = [
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
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="motion-emphasized bg-muted/40 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-muted/60"
        >
          <CardContent className="flex flex-row items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
            <div className="motion-base rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2">
              <stat.icon size={18} className="sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground sm:text-2xl">
                {stat.value}
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
                {stat.subtitle && (
                  <span className="text-xs text-muted-foreground/60">
                    {stat.subtitle}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
