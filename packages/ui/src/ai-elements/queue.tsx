"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  CircleCheckIcon,
  CircleDotIcon,
  ChevronDownIcon,
  Clock3Icon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn } from "../utils/cn";

export const Queue = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("rounded-2xl bg-secondary/60 p-2 sm:p-3", className)}
    {...props}
  />
);

export const QueueSection = ({
  className,
  ...props
}: ComponentProps<typeof Collapsible>) => (
  <Collapsible className={cn("w-full", className)} {...props} />
);

export const QueueSectionTrigger = ({
  className,
  children,
  ...props
}: ComponentProps<"button">) => (
  <CollapsibleTrigger asChild>
    <button
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm text-foreground transition-[background-color,transform] hover:bg-accent",
        className,
      )}
      type="button"
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  </CollapsibleTrigger>
);

export const QueueSectionLabel = ({
  className,
  label,
  count,
  icon,
  ...props
}: ComponentProps<"span"> & {
  label?: string;
  count?: number;
  icon?: ReactNode;
}) => (
  <span className={cn("flex items-center gap-2", className)} {...props}>
    <span className="flex size-6 items-center justify-center rounded-full bg-background/70 text-muted-foreground">
      {icon ?? <Clock3Icon className="size-3.5" />}
    </span>
    <span className="flex min-w-0 items-baseline gap-2">
      <span className="truncate font-medium">{label}</span>
      {typeof count === "number" ? (
        <span className="text-xs text-muted-foreground">{count}</span>
      ) : null}
    </span>
  </span>
);

export const QueueSectionContent = ({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent className={cn("pt-2", className)} {...props} />
);

export const QueueList = ({ className, ...props }: ComponentProps<"ul">) => (
  <ul className={cn("space-y-1.5", className)} {...props} />
);

export const QueueItem = ({ className, ...props }: ComponentProps<"li">) => (
  <li
    className={cn(
      "flex items-start gap-3 rounded-xl bg-background/70 px-3 py-2 text-sm text-foreground",
      className,
    )}
    {...props}
  />
);

export const QueueItemIndicator = ({
  className,
  completed = false,
  ...props
}: ComponentProps<"span"> & {
  completed?: boolean;
}) => (
  <span
    className={cn(
      "mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground",
      className,
    )}
    {...props}
  >
    {completed ? (
      <CircleCheckIcon className="size-4 text-success" />
    ) : (
      <CircleDotIcon className="size-4" />
    )}
  </span>
);

export const QueueItemContent = ({
  className,
  completed = false,
  ...props
}: ComponentProps<"div"> & {
  completed?: boolean;
}) => (
  <div
    className={cn(
      "min-w-0 flex-1",
      completed ? "text-muted-foreground line-through" : "text-foreground",
      className,
    )}
    {...props}
  />
);

export const QueueItemDescription = ({
  className,
  completed = false,
  ...props
}: ComponentProps<"div"> & {
  completed?: boolean;
}) => (
  <div
    className={cn(
      "mt-1 text-xs",
      completed ? "text-muted-foreground/70" : "text-muted-foreground",
      className,
    )}
    {...props}
  />
);

export const QueueItemActions = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn("flex shrink-0 items-center gap-1", className)}
    {...props}
  />
);

export const QueueItemAction = ({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant" | "size">) => (
  <Button
    className={cn(className)}
    size="icon-sm"
    type="button"
    variant="ghost"
    {...props}
  >
    {children}
  </Button>
);
