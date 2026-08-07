import * as React from "react";
import { cn } from "../utils/cn";

/**
 * Loading placeholder.
 *
 * Every skeleton in the app was an inline div before this existed, and the
 * thirty of them had drifted across three radii and three fills — so two lists
 * loading side by side pulsed at different shapes and tones. One component
 * settles it: `bg-muted`, `rounded-md`, and the shared pulse.
 *
 * Size is the caller's job (`h-4 w-32`), because only the caller knows the
 * shape of the content being waited on. A skeleton that does not match its
 * content's dimensions causes a layout jump the moment data arrives, which is
 * worse than no skeleton at all.
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
