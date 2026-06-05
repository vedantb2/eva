import type { ReactNode } from "react";
import { cn } from "@conductor/ui";

interface WidgetProps {
  /** Header title (left side). Omit for a header-less widget. */
  title?: ReactNode;
  /** Supporting text shown under the title. */
  subtitle?: ReactNode;
  /** Header content aligned to the right (filters, legends, menus). */
  actions?: ReactNode;
  children: ReactNode;
  /** Classes for the outer muted shell. */
  className?: string;
  /** Classes for the elevated inner content area. */
  contentClassName?: string;
}

/**
 * Dashboard container modelled on the HeroUI Widget: a muted outer shell
 * (surface-secondary) holding an optional title/actions header above an
 * elevated inner content area (the card surface). Use it to give charts,
 * tables, and KPI groups a consistent layered treatment.
 *
 * Pass `contentClassName="border-0 bg-transparent p-0 shadow-none"` when the
 * children already provide their own surfaces (e.g. a grid of cards) so they
 * sit directly on the shell instead of double-stacking surfaces.
 */
export function Widget({
  title,
  subtitle,
  actions,
  children,
  className,
  contentClassName,
}: WidgetProps) {
  const hasHeader = title !== undefined || actions !== undefined;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-muted/40 p-2.5 sm:p-3",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-2 px-1.5 pb-2 pt-1">
          <div className="min-w-0">
            {title !== undefined && (
              <div className="text-sm font-semibold text-foreground">
                {title}
              </div>
            )}
            {subtitle !== undefined && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions !== undefined && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div
        className={cn(
          "min-h-0 flex-1 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
