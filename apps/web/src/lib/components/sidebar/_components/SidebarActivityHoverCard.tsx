"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { Badge, StatusDot, cn } from "@eva/ui";
import { IconLoader2 } from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";

/**
 * Shared shell for the "something is running right now" hover cards that hang
 * off a sidebar nav row (active quick tasks, building projects).
 *
 * Both callers show the same two-part story — N things busy, N sandboxes live —
 * so the trigger badge, the grouped section and the row all live here; the
 * callers supply only their own queries, labels and links.
 */

/** Spinner glyph for the "busy" half of a trigger or section header. */
export function SidebarActivityBusyGlyph() {
  return (
    <IconLoader2 size={11} className="animate-spin text-muted-foreground" />
  );
}

/** Live-sandbox glyph. */
export function SidebarActivitySandboxGlyph() {
  return <StatusDot tone="active" size="md" />;
}

/**
 * Quiet trailing badge on the nav row: spinner + count, dot + count.
 *
 * Remaining props land on the badge so it can be the child of an `asChild`
 * hover-card trigger — Radix clones the child with its own handlers and ref,
 * and a badge that swallowed them would never open the card.
 */
export function SidebarActivityBadge({
  busyCount,
  sandboxCount,
  className,
  ...rest
}: ComponentPropsWithRef<"div"> & {
  /** Count of in-flight work; omitted from the badge when zero. */
  busyCount: number;
  /** Count of live sandboxes; omitted from the badge when zero. */
  sandboxCount: number;
}) {
  return (
    <Badge
      {...rest}
      variant="secondary"
      className={cn(
        "ml-auto cursor-default items-center gap-2 border-none bg-sidebar-accent/50 px-1.5 py-0.5",
        className,
      )}
    >
      {busyCount > 0 && (
        <span className="flex items-center gap-1.5">
          <SidebarActivityBusyGlyph />
          <span className="text-2xs font-medium text-muted-foreground tabular-nums">
            {busyCount}
          </span>
        </span>
      )}
      {sandboxCount > 0 && (
        <span className="flex items-center gap-1.5">
          <SidebarActivitySandboxGlyph />
          <span className="text-2xs font-medium text-muted-foreground tabular-nums">
            {sandboxCount}
          </span>
        </span>
      )}
    </Badge>
  );
}

interface SidebarActivityHeaderProps {
  icon: ReactNode;
  title: string;
  /** Pre-formatted summary fragments, e.g. ["2 running", "1 active"]. */
  summaryParts: string[];
}

/** Hover-card title row: one icon, the title, a muted count summary. */
export function SidebarActivityHeader({
  icon,
  title,
  summaryParts,
}: SidebarActivityHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-2sm font-medium tracking-tight text-foreground">
        {title}
      </h3>
      <span className="ml-auto flex items-center gap-1.5 text-2xs text-muted-foreground tabular-nums">
        {summaryParts.map((part, index) => (
          <span key={part} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
            )}
            <span>{part}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

interface SidebarActivitySectionProps {
  label: string;
  count: number;
  glyph: ReactNode;
  children: ReactNode;
}

/** One tonal group inside the hover card (Running / Building / Sandbox). */
export function SidebarActivitySection({
  label,
  count,
  glyph,
  children,
}: SidebarActivitySectionProps) {
  return (
    <div className="rounded-surface border border-border bg-muted/40 p-1">
      <div className="flex items-center gap-2 px-2 pb-1 pt-1.5">
        <span className="flex size-3 items-center justify-center">{glyph}</span>
        <span className="text-3xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className="ml-auto text-3xs text-muted-foreground/70 tabular-nums">
          {count}
        </span>
      </div>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

interface SidebarActivityRowProps {
  title: string;
  to: string;
  /** Optional trailing meta, e.g. a task number. */
  trailing?: ReactNode;
}

/** A single linked row inside a section. */
export function SidebarActivityRow({
  title,
  to,
  trailing,
}: SidebarActivityRowProps) {
  return (
    <DynamicLink
      to={to}
      className="block rounded-menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="group flex items-center gap-2 rounded-menu-item px-2 py-1.5 transition-[background-color,transform] hover:translate-x-0.5 hover:bg-background">
        <p className="min-w-0 flex-1 truncate text-2sm leading-tight text-foreground">
          {title}
        </p>
        {trailing}
      </div>
    </DynamicLink>
  );
}
