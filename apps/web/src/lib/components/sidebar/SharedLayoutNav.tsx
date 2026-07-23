"use client";

import { cn } from "@conductor/ui";
import { motion } from "motion/react";
import { createContext, use, useState, type ReactNode } from "react";

const sharedLayoutTransition = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
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

/** Per-item surface; highlight follows hover, else the active route. */
export function SharedLayoutNavSurface({
  itemId,
  isActive,
  children,
  className,
}: {
  itemId: string;
  isActive: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { layoutId, hoveredId, setHoveredId } = useSharedLayoutNav();
  const highlighted = hoveredId !== null ? hoveredId === itemId : isActive;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setHoveredId(itemId)}
    >
      {highlighted ? (
        <motion.div
          layoutId={layoutId}
          transition={sharedLayoutTransition}
          className="pointer-events-none absolute inset-0 rounded-lg bg-sidebar-accent"
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
    "group motion-base flex w-full items-center gap-3 rounded-lg border border-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    collapsed && "lg:justify-center lg:px-0",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

export function sidebarNavLinkClassCompact(isActive: boolean): string {
  return cn(
    "group flex w-full items-center gap-2.5 rounded-lg px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

export function sidebarNavListItemClass(isActive: boolean): string {
  return cn(
    "flex w-full items-center px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}
