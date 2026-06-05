"use client";

import { DynamicLink } from "@/lib/components/DynamicLink";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { cn } from "@conductor/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";

function prStateIconColor(
  state: "draft" | "open" | "merged" | "closed" | undefined,
): string {
  switch (state) {
    case "open":
      return "text-success";
    case "merged":
      return "text-status-code-review";
    case "closed":
      return "text-destructive";
    case "draft":
    default:
      return "text-muted-foreground";
  }
}

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

interface SidebarSessionItemProps {
  href: string;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  updatedAt?: number;
  status: SandboxStatus;
  isSelected: boolean;
  onNavigate?: () => void;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
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
  prUrl,
  prState,
}: SidebarSessionItemProps) {
  const timestamp = updatedAt ?? createdAt;
  const statusStyle = SANDBOX_STATUS_STYLES[status];

  return (
    <DynamicLink
      to={href}
      onClick={onNavigate}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            "truncate text-sm transition-colors duration-200",
            isSelected
              ? "font-medium text-sidebar-primary"
              : "text-sidebar-foreground",
          )}
        >
          {title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {prUrl && (
            <IconGitPullRequest
              size={14}
              className={cn("shrink-0", prStateIconColor(prState))}
              title={`PR: ${prState || "unknown"}`}
            />
          )}
          <span
            className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
            title={statusStyle.label}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex -space-x-1">
          <UserInitials userId={userId} />
        </div>
        <span
          className={cn(
            "shrink-0 text-xs text-muted-foreground/60 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {compactTimeAgo(timestamp)}
        </span>
      </div>
    </DynamicLink>
  );
}
