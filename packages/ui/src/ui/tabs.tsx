"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../utils/cn";
import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";
import { syncTabsPill } from "./tabsSliding";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<React.ComponentRef<
    typeof TabsPrimitive.List
  > | null>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);
  const pillReadyRef = React.useRef(false);

  const mergedRef = React.useCallback(
    (node: React.ComponentRef<typeof TabsPrimitive.List> | null) => {
      listRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  React.useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) {
      return;
    }

    const snap = () => syncTabsPill(list, pill, false);
    const animate = () => syncTabsPill(list, pill, true);

    snap();
    requestAnimationFrame(() => {
      pillReadyRef.current = true;
    });

    const onWindowResize = () => snap();
    window.addEventListener("resize", onWindowResize);

    const resizeObserver = new ResizeObserver(() => snap());
    resizeObserver.observe(list);

    const mutationObserver = new MutationObserver(() => {
      if (pillReadyRef.current) {
        animate();
      } else {
        snap();
      }
    });
    mutationObserver.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-selected"],
    });

    return () => {
      window.removeEventListener("resize", onWindowResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={mergedRef}
      className={cn(
        "relative inline-flex h-10 items-center justify-center border border-border bg-background p-1 text-muted-foreground",
        SURFACE_RADIUS_CLASS,
        className,
      )}
      {...props}
    >
      <span
        ref={pillRef}
        className="t-tabs-pill rounded-lg bg-card shadow-sm"
        aria-hidden="true"
      />
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "t-tab relative z-[1] inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-[color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
      "rounded-lg",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
