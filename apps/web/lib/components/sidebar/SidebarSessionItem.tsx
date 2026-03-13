"use client";

import Link from "next/link";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";
import dayjs from "@conductor/shared/dates";

type SessionStatus = "active" | "starting" | "closed";

const STATUS_STYLES: Record<SessionStatus, { dot: string; label: string }> = {
  active: {
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    label: "Active",
  },
  starting: {
    dot: "bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.5)]",
    label: "Starting",
  },
  closed: {
    dot: "bg-muted-foreground/40",
    label: "Closed",
  },
};

interface SidebarSessionItemProps {
  href: string;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  updatedAt?: number;
  status: SessionStatus;
  isSelected: boolean;
  onNavigate?: () => void;
}

export function SidebarSessionItem({
  href,
  title,
  userId,
  createdAt,
  updatedAt,
  status,
  isSelected,
  onNavigate,
}: SidebarSessionItemProps) {
  const timestamp = updatedAt ?? createdAt;
  const statusStyle = STATUS_STYLES[status];

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
          title={statusStyle.label}
        />
        <h3
          className={cn(
            "truncate text-sm font-medium transition-colors duration-200",
            isSelected ? "text-sidebar-primary" : "text-sidebar-foreground",
          )}
        >
          {title}
        </h3>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex -space-x-1">
          <UserInitials userId={userId} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground/60">
          {dayjs(timestamp).fromNow()}
        </span>
      </div>
    </Link>
  );
}
