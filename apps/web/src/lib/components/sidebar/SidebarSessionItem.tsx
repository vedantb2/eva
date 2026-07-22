"use client";

import { DynamicLink } from "@/lib/components/DynamicLink";
import type { Id } from "@conductor/backend";
import { compactRelativeTime } from "@conductor/shared/dates";
import {
  cn,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@conductor/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { HoverCardAuthor } from "@/lib/components/sidebar/SidebarListHoverCard";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

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

interface SidebarSessionItemProps {
  href: string;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  status: SandboxStatus;
  isSelected: boolean;
  onNavigate?: () => void;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  firstMessagePreview?: string | null;
}

export function SidebarSessionItem({
  href,
  title,
  userId,
  createdAt,
  status,
  isSelected,
  onNavigate,
  prUrl,
  prState,
  firstMessagePreview,
}: SidebarSessionItemProps) {
  const statusStyle = SANDBOX_STATUS_STYLES[status];

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <DynamicLink
          to={href}
          onClick={onNavigate}
          className="block rounded-menu-item px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
                title={statusStyle.label}
              />
              <MarqueeOnHover
                className={cn(
                  "min-w-0 text-sm transition-colors duration-200",
                  isSelected
                    ? "font-medium text-sidebar-primary"
                    : "text-sidebar-foreground",
                )}
              >
                {title}
              </MarqueeOnHover>
            </div>
            {prUrl ? (
              <IconGitPullRequest
                size={14}
                className={cn("shrink-0", prStateIconColor(prState))}
                title={`PR: ${prState || "unknown"}`}
              />
            ) : null}
          </div>
        </DynamicLink>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-64 p-3"
      >
        <p className="text-sm font-medium text-foreground">{title}</p>
        {firstMessagePreview ? (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
            {firstMessagePreview}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          <HoverCardAuthor userId={userId} />
          <span className="shrink-0 text-xs text-muted-foreground">
            {compactRelativeTime(createdAt)}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
