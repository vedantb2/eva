"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn } from "../utils/cn";
import { ChevronDownIcon, FileIcon } from "lucide-react";

export type TaskProps = ComponentProps<typeof Collapsible> & {
  defaultOpen?: boolean;
};

export function Task({ className, ...props }: TaskProps) {
  return <Collapsible className={cn("group", className)} {...props} />;
}

export type TaskTriggerProps = Omit<
  ComponentProps<typeof CollapsibleTrigger>,
  "title"
> & {
  title?: ReactNode;
};

export function TaskTrigger({
  className,
  title,
  children,
  ...props
}: TaskTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-fit items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      {title ?? children}
      <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export function TaskContent({
  className,
  children,
  ...props
}: TaskContentProps) {
  return (
    <CollapsibleContent
      className={cn(
        "mt-2 ml-6 space-y-1 border-l border-border pl-3",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className,
      )}
      {...props}
    >
      {children}
    </CollapsibleContent>
  );
}

export type TaskItemProps = ComponentProps<"div">;

export function TaskItem({ className, ...props }: TaskItemProps) {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export type TaskItemFileProps = ComponentProps<"span">;

export function TaskItemFile({
  className,
  children,
  ...props
}: TaskItemFileProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground",
        className,
      )}
      {...props}
    >
      <FileIcon className="size-3 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}
