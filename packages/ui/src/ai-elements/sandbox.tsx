"use client";

import type { ComponentProps, HTMLAttributes } from "react";
import { createContext, useContext } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../utils/cn";

type SandboxState = "pending" | "running" | "completed" | "error";

interface SandboxContextValue {
  state: SandboxState;
}

const SandboxContext = createContext<SandboxContextValue | null>(null);

const stateBadgeConfig: Record<
  SandboxState,
  {
    label: string;
    variant: "warning" | "default" | "success" | "destructive";
    pulse?: boolean;
  }
> = {
  pending: { label: "Pending", variant: "warning" },
  running: { label: "Running", variant: "default", pulse: true },
  completed: { label: "Completed", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

export type SandboxProps = ComponentProps<typeof Collapsible> & {
  state: SandboxState;
};

export const Sandbox = ({
  state,
  className,
  children,
  ...props
}: SandboxProps) => (
  <SandboxContext.Provider value={{ state }}>
    <Collapsible
      className={cn("rounded-lg border bg-background", className)}
      {...props}
    >
      {children}
    </Collapsible>
  </SandboxContext.Provider>
);

export type SandboxHeaderProps = ComponentProps<typeof CollapsibleTrigger> & {
  title?: string;
};

export const SandboxHeader = ({
  title,
  className,
  children,
  ...props
}: SandboxHeaderProps) => {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("SandboxHeader must be used within Sandbox");
  }
  const { label, variant, pulse } = stateBadgeConfig[context.state];

  return (
    <CollapsibleTrigger
      className={cn(
        "group flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
        className,
      )}
      {...props}
    >
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      {children ?? (
        <>
          <span className="font-medium">{title ?? "Code"}</span>
          <Badge
            className={cn("ml-auto", pulse && "animate-pulse")}
            variant={variant}
          >
            {label}
          </Badge>
        </>
      )}
    </CollapsibleTrigger>
  );
};

export type SandboxContentProps = HTMLAttributes<HTMLDivElement>;

export const SandboxContent = ({
  className,
  ...props
}: SandboxContentProps) => (
  <CollapsibleContent>
    <div className={cn("border-t", className)} {...props} />
  </CollapsibleContent>
);

export type SandboxTabsProps = ComponentProps<typeof Tabs>;

export const SandboxTabs = (props: SandboxTabsProps) => <Tabs {...props} />;

export type SandboxTabsListProps = ComponentProps<typeof TabsList>;

export const SandboxTabsList = ({
  className,
  ...props
}: SandboxTabsListProps) => (
  <TabsList
    className={cn(
      "h-auto w-full justify-start rounded-none border-b bg-transparent p-0",
      className,
    )}
    {...props}
  />
);

export type SandboxTabsTriggerProps = ComponentProps<typeof TabsTrigger>;

export const SandboxTabsTrigger = ({
  className,
  ...props
}: SandboxTabsTriggerProps) => (
  <TabsTrigger
    className={cn(
      "rounded-none border-b-2 border-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      className,
    )}
    {...props}
  />
);

export type SandboxTabContentProps = ComponentProps<typeof TabsContent>;

export const SandboxTabContent = ({
  className,
  ...props
}: SandboxTabContentProps) => (
  <TabsContent className={cn("mt-0 p-3", className)} {...props} />
);
