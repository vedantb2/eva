"use client";

import { useRouter } from "next/navigation";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";

function compactTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${String(days)}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${String(months)}mo`;
  return `${String(Math.floor(months / 12))}y`;
}

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
  const router = useRouter();
  const timestamp = updatedAt ?? createdAt;
  const statusStyle = STATUS_STYLES[status];

  return (
    <div
      onClick={() => {
        router.push(href);
        onNavigate?.();
      }}
      className="block rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            "truncate text-sm font-medium transition-colors duration-200",
            isSelected ? "text-sidebar-primary" : "text-sidebar-foreground",
          )}
        >
          {title}
        </h3>
        <span
          className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
          title={statusStyle.label}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex -space-x-1">
          <UserInitials userId={userId} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground/60">
          {compactTimeAgo(timestamp)}
        </span>
      </div>
    </div>
  );
}
