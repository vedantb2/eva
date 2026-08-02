import { cn } from "@eva/ui";
import type { ReactNode } from "react";

/**
 * Hairline surface used by every Overview section. Denser than the shared
 * `Card` primitive, which is tuned for page-level content rather than a
 * sidebar stack.
 */
export function OverviewCard({
  title,
  count,
  action,
  footer,
  className,
  children,
}: {
  title?: string;
  /** Rendered next to the title, e.g. the number of checks. */
  count?: number;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
            {count !== undefined ? (
              <span className="tabular-nums text-subtle-foreground">
                {count}
              </span>
            ) : null}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="p-3">{children}</div>
      {footer ? (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
