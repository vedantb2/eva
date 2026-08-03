"use client";

interface SummaryStatProps {
  label: string;
  value: string;
  subtitle?: string;
}

/** A single label/value stat tile, shared by the type and project summary grids. */
export function SummaryStat({ label, value, subtitle }: SummaryStatProps) {
  return (
    <div className="min-w-0">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-3xs tabular-nums text-muted-foreground/80">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
