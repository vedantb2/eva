"use client";

import type { ReactNode } from "react";
import { Card, CardContent, cn } from "@conductor/ui";
import {
  Icon as TablerIcon,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";

interface KpiProps {
  /** Optional leading icon shown in a rounded pill next to the label. */
  icon?: TablerIcon;
  label: string;
  value: string | number;
  /** Small supporting line under the value (e.g. "3 of 12 sessions"). */
  subtitle?: string;
  /** Provide both current and previous to render a trend chip. */
  previousValue?: number;
  currentValue?: number;
}

/**
 * Trend chip rendered to the right of the label: green for a rise, red for a
 * fall, muted for no change. Mirrors the HeroUI KPI.Trend look.
 */
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
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <IconMinus size={12} />
        0%
      </span>
    );
  }

  const isPositive = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
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

/**
 * A single key-performance-indicator card: label + optional icon in the header,
 * an optional trend chip, then a large value with an optional subtitle.
 * Modelled on the HeroUI KPI component, styled with our design tokens.
 */
export function Kpi({
  icon: Icon,
  label,
  value,
  subtitle,
  previousValue,
  currentValue,
}: KpiProps) {
  const showTrend = previousValue !== undefined && currentValue !== undefined;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Icon size={18} />
              </span>
            )}
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

/**
 * Responsive grid wrapper for a row of {@link Kpi} cards. Defaults to 1 column
 * on mobile, 2 on small screens, 4 on large; override with `className`.
 */
export function KpiGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
