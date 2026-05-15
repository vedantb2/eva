"use client";

import { Card, CardContent } from "@conductor/ui";
import {
  IconCurrencyPound,
  IconClock,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
import { formatCost, formatTokens, GBP_TO_USD } from "../_utils";
import { formatDurationMs } from "@conductor/shared/duration";

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
          <SummaryCard key={stat.label} stat={stat} large />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tokenStats.map((stat) => (
          <SummaryCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  stat: {
    icon: typeof IconCurrencyPound;
    label: string;
    value: string;
    subtitle: string | undefined;
  };
  large?: boolean;
}

function SummaryCard({ stat, large = false }: SummaryCardProps) {
  return (
    <Card className="motion-emphasized bg-muted/40 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-muted/60">
      <CardContent className="flex flex-row items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="motion-base rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2">
          <stat.icon size={18} className="sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={
              large
                ? "text-xl font-bold text-foreground sm:text-3xl"
                : "text-lg font-bold text-foreground sm:text-2xl"
            }
          >
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
  );
}
