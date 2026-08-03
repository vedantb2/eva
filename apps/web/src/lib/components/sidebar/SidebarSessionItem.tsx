"use client";

import { DynamicLink } from "@/lib/components/DynamicLink";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import type { Id } from "@eva/backend";
import { cn, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { SessionHoverCardBody } from "@/lib/components/sidebar/SidebarListHoverCard";
import {
  prStateIconColor,
  prStateLabel,
} from "@/lib/components/sidebar/_utils/prState";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

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
  firstMessagePreview?: string | null;
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
  firstMessagePreview,
}: SidebarSessionItemProps) {
  const statusStyle = SANDBOX_STATUS_STYLES[status];
  const activityAt = updatedAt ?? createdAt;

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <DynamicLink
          to={href}
          onClick={onNavigate}
          className="block rounded-menu-item px-4 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
              title={statusStyle.label}
            />
            <MarqueeOnHover
              className={cn(
                "min-w-0 flex-1 text-2sm transition-colors duration-200",
                isSelected
                  ? "font-medium text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
              )}
            >
              {title}
            </MarqueeOnHover>
            {prUrl ? (
              <IconGitPullRequest
                size={12}
                className={cn("shrink-0", prStateIconColor(prState))}
                title={`PR: ${prStateLabel(prState)}`}
              />
            ) : null}
            <RelativeDateTime
              at={activityAt}
              className="shrink-0 text-2xs text-muted-foreground"
            />
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
