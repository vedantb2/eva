import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:-translate-y-[1px] hover:bg-primary/92 hover:shadow-md hover:shadow-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/25 hover:-translate-y-[1px] hover:bg-destructive/92 hover:shadow-md hover:shadow-destructive/30",
        outline:
          "border border-input/85 bg-card/72 text-foreground shadow-sm  hover:-translate-y-[1px] hover:border-primary/35 hover:bg-accent/82 hover:text-accent-foreground",
        secondary:
          "border border-border/75 bg-secondary/90 text-secondary-foreground shadow-xs hover:-translate-y-[1px] hover:bg-secondary",
        ghost:
          "text-muted-foreground hover:bg-accent/85 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-xs": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
