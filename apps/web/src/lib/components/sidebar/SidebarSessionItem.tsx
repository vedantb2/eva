"use client";

import { DynamicLink } from "@/lib/components/DynamicLink";
import type { Id } from "@eva/backend";
import { cn, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { SessionHoverCardBody } from "@/lib/components/sidebar/SidebarListHoverCard";
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
          className="block rounded-menu-item px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
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
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                )}
              >
                {title}
              </MarqueeOnHover>
            </div>
            {prUrl ? (
              <IconGitPullRequest
                className={cn(
                  "size-3.5",
                  "shrink-0",
                  prStateIconColor(prState),
                )}
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
        <SessionHoverCardBody
          title={title}
          preview={firstMessagePreview}
          createdAt={createdAt}
          userId={userId}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
