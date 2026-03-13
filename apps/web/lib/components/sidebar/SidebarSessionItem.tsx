"use client";

import Link from "next/link";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";

interface SidebarSessionItemProps {
  href: string;
  title: string;
  userId: Id<"users">;
  isSelected: boolean;
  onNavigate?: () => void;
}

export function SidebarSessionItem({
  href,
  title,
  userId,
  isSelected,
  onNavigate,
}: SidebarSessionItemProps) {
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
      <div className="mt-2 flex items-center">
        <div className="flex -space-x-1">
          <UserInitials userId={userId} />
        </div>
      </div>
    </Link>
  );
}
