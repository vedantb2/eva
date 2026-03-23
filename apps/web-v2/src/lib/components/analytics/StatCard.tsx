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
    <Card className="bg-muted/40 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-muted/60">
      <CardContent className="flex flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2">
            <Icon size={18} className="sm:h-5 sm:w-5" />
          </div>
          {showTrend && (
            <TrendBadge current={currentValue} previous={previousValue} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {value}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
