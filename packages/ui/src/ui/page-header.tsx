import * as React from "react";
import { cn } from "../utils/cn";

/**
 * Compact functional toolbar for a page or panel: 48px tall, a hairline
 * bottom border, left slot for a title or breadcrumb, right slot for
 * actions. Not a marketing page header — keep the left slot's text small
 * and medium-weight (see `PageHeaderTitle`), not `text-2xl font-bold`.
 */
const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4",
      className,
    )}
    {...props}
  />
));
PageHeader.displayName = "PageHeader";

/**
 * Default left-slot content: a single truncating title. Swap this out for a
 * breadcrumb or other custom node when the page needs one — `PageHeader`
 * accepts any left-side child, this is just the common case.
 */
const PageHeaderTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "min-w-0 flex-1 truncate text-2sm font-medium text-foreground",
      className,
    )}
    {...props}
  />
));
PageHeaderTitle.displayName = "PageHeaderTitle";

const PageHeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex shrink-0 items-center gap-1.5", className)}
    {...props}
  />
));
PageHeaderActions.displayName = "PageHeaderActions";

export { PageHeader, PageHeaderTitle, PageHeaderActions };
