"use client";

import { cn } from "@eva/ui";
import { m } from "motion/react";
import {
  createContext,
  use,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

// shared-layout pill slide between sidebar rows
const sidebarSharedLayoutTransition = {
  type: "tween" as const,
  duration: 0.08,
  ease: "easeOut" as const,
};

interface SharedLayoutNavContextValue {
  layoutId: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

const SharedLayoutNavContext =
  createContext<SharedLayoutNavContextValue | null>(null);

function useSharedLayoutNav() {
  const context = use(SharedLayoutNavContext);
  if (!context) {
    throw new Error(
      "SharedLayoutNavSurface must be used within SharedLayoutNav",
    );
  }
  return context;
}

/** Animated nav list — shared `layoutId` background slides between items on hover/active. */
export function SharedLayoutNav({
  layoutId,
  children,
  className,
}: {
  layoutId: string;
  children: ReactNode;
  className?: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <SharedLayoutNavContext value={{ layoutId, hoveredId, setHoveredId }}>
      <div className={className} onMouseLeave={() => setHoveredId(null)}>
        {children}
      </div>
    </SharedLayoutNavContext>
  );
}

/**
 * Per-item surface; highlight follows hover, else the active route.
 *
 * Remaining props land on the outer element so the surface can be the child of
 * an `asChild` trigger (context menus, tooltips) — those pass their handlers and
 * ref down as props, and a surface that swallowed them would never open.
 */
export function SharedLayoutNavSurface({
  itemId,
  isActive,
  children,
  className,
  ...rest
}: ComponentPropsWithRef<"div"> & {
  itemId: string;
  isActive: boolean;
}) {
  const { layoutId, hoveredId, setHoveredId } = useSharedLayoutNav();
  const highlighted = hoveredId !== null ? hoveredId === itemId : isActive;

  return (
    <div
      {...rest}
      className={cn("relative", className)}
      onMouseEnter={() => setHoveredId(itemId)}
    >
      {highlighted ? (
        <m.div
          layoutId={layoutId}
          transition={sidebarSharedLayoutTransition}
          className="pointer-events-none absolute inset-0 rounded-lg border border-border bg-sidebar-accent"
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function sidebarNavLinkClass(
  isActive: boolean,
  collapsed?: boolean,
): string {
  return cn(
    "group motion-base flex w-full items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    collapsed && "lg:justify-center lg:px-0",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

/** Section group label above a cluster of sidebar nav rows (Build / Ship / …). */
export const sidebarSectionLabelClass =
  "px-4 py-1 text-[11px] font-medium tracking-[-0.01em] text-muted-foreground/55";

export function sidebarNavLinkClassCompact(isActive: boolean): string {
  return cn(
    "group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

export function sidebarNavListItemClass(isActive: boolean): string {
  return cn(
    "flex w-full items-center rounded-lg border border-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}
