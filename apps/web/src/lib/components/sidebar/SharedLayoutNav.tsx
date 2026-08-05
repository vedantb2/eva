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

/** Active surface for vertical rail tiles — matches sidebar nav pill. */
export const railTileActiveClass =
  "border-border bg-sidebar-accent text-sidebar-primary";

const sidebarNavPillClass =
  "pointer-events-none absolute inset-0 rounded-menu-item border border-border bg-sidebar-accent";

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
  // Resting active uses a static fill — `layoutId` inside AnimatePresence
  // parents (session rows) often fails to paint until hover remounts it.
  const showStaticActive = hoveredId === null && isActive;
  const showSlidingPill = hoveredId === itemId;

  return (
    <div
      {...rest}
      className={cn("relative", className)}
      onMouseEnter={() => setHoveredId(itemId)}
    >
      {showStaticActive ? <div className={sidebarNavPillClass} /> : null}
      {showSlidingPill ? (
        <m.div
          layoutId={layoutId}
          transition={sidebarSharedLayoutTransition}
          className={sidebarNavPillClass}
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
    "group motion-base flex w-full items-center gap-2 rounded-menu-item px-4 py-1.5 text-[13px] leading-[18px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    collapsed && "lg:justify-center lg:px-0",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

/**
 * Row geometry for a nav row that is a `Button` rather than a `Link`.
 *
 * Same shape as `sidebarNavLinkClass`, plus the button defaults a nav row does
 * not want: the fixed control height, the semibold label, the press scale, and
 * the ghost hover fill — hover is already drawn by the highlight pill in
 * `SharedLayoutNavSurface`, so a second fill would stack.
 */
export function sidebarNavButtonClass(
  isActive: boolean,
  collapsed?: boolean,
): string {
  return cn(
    "h-auto justify-start bg-transparent active:scale-100 hover:bg-transparent",
    !isActive && "font-normal",
    sidebarNavLinkClass(isActive, collapsed),
  );
}

/** Section group label above a cluster of sidebar nav rows (Build / Ship / …). */
export const sidebarSectionLabelClass =
  "px-4 py-1 text-[11px] font-medium tracking-[-0.01em] text-muted-foreground/55";

export function sidebarNavLinkClassCompact(isActive: boolean): string {
  return cn(
    "group flex w-full items-center gap-2.5 rounded-menu-item px-4 py-1.5 text-[13px] leading-[18px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}

export function sidebarNavListItemClass(isActive: boolean): string {
  return cn(
    "flex w-full items-center rounded-menu-item px-4 py-1.5 text-[13px] leading-[18px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
    isActive
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );
}
