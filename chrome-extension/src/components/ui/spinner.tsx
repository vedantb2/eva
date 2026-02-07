import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

function Spinner({
  size = "md",
  className,
  ...props
}: React.ComponentProps<"svg"> & {
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  );
}

export { Spinner };
