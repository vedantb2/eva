import * as React from "react";
import { cn } from "../utils/cn";
import { CONTROL_RADIUS_CLASS } from "../utils/surface-radius";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[84px] w-full border border-input bg-card px-3.5 py-2.5 text-sm transition-[border-color,box-shadow,background-color,transform] placeholder:text-muted-foreground/90 focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50",
        CONTROL_RADIUS_CLASS,
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
