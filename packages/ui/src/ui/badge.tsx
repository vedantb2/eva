import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const badgeVariants = cva(
  // `rounded-full` here is deliberate: a badge is a compact single-line chip,
  // the same case surface-radius.ts calls out for "Full" theme pills.
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring/35 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/12 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/12 text-destructive",
        outline: "border-border text-foreground",
        success: "border-success/30 bg-success/12 text-success",
        warning: "border-warning/30 bg-warning/12 text-warning",
        // Linear-quiet: hairline only, no fill — pairs with a `StatusDot` for
        // status chips instead of a coloured background.
        quiet: "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
