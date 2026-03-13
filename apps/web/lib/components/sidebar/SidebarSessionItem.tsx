"use client";

import Link from "next/link";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";
import dayjs from "@conductor/shared/dates";

interface SidebarSessionItemProps {
  href: string;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  updatedAt?: number;
  isSelected: boolean;
  onNavigate?: () => void;
}

export function SidebarSessionItem({
  href,
  title,
  userId,
  createdAt,
  updatedAt,
  isSelected,
  onNavigate,
}: SidebarSessionItemProps) {
  const timestamp = updatedAt ?? createdAt;
  const timestampLabel = updatedAt ? "Updated" : "Created";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
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
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex -space-x-1">
          <UserInitials userId={userId} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground/60">
          {timestampLabel} {dayjs(timestamp).fromNow()}
        </span>
      </div>
    </Link>
  );
}
