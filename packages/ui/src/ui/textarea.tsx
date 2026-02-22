import * as React from "react";
import { cn } from "../utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[84px] w-full rounded-xl border border-input/80 bg-background/72 px-3.5 py-2.5 text-sm shadow-xs transition-[border-color,box-shadow,background-color,transform] placeholder:text-muted-foreground/90 hover:border-input/95 focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
