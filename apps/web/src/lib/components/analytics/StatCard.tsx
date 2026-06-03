"use client";

import { Card, CardContent } from "@conductor/ui";
import { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";

interface StatCardProps {
  icon: TablerIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  previousValue?: number;
  currentValue?: number;
}

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0 && current === 0) return null;

  const diff =
    previous > 0
      ? Math.round(((current - previous) / previous) * 100)
      : current > 0
        ? 100
        : 0;

  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        <IconMinus size={12} />
        0%
      </span>
    );
  }

  const isPositive = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        isPositive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {isPositive ? (
        <IconTrendingUp size={12} />
      ) : (
        <IconTrendingDown size={12} />
      )}
      {isPositive ? "+" : ""}
      {diff}%
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  previousValue,
  currentValue,
}: StatCardProps) {
  const showTrend = previousValue !== undefined && currentValue !== undefined;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Icon size={18} />
            </span>
            <span className="truncate text-sm font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          {showTrend && (
            <TrendBadge current={currentValue} previous={previousValue} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
