import * as React from "react";
import { cn } from "../utils/cn";
import { CONTROL_RADIUS_CLASS } from "../utils/surface-radius";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border border-input bg-card px-3.5 py-2 text-sm transition-[border-color,box-shadow,background-color,transform] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50",
          CONTROL_RADIUS_CLASS,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
