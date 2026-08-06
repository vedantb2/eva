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
import {
  SessionFolderAuthor,
  SessionHoverCardBody,
} from "@/lib/components/sidebar/SidebarListHoverCard";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { useSessionsSidebarSettings } from "@/lib/components/sidebar/useSessionsSidebarSettings";

function prStateLabel(
  state: "draft" | "open" | "merged" | "closed" | undefined,
): string {
  switch (state) {
    case "open":
      return "Open";
    case "merged":
      return "Merged";
    case "closed":
      return "Closed";
    case "draft":
      return "Draft";
    default:
      return "PR";
  }
}

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
  updatedAt?: number;
  status: SandboxStatus;
  isSelected: boolean;
  onNavigate?: () => void;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  firstMessagePreview?: string | null;
}

function SessionPrIcon({
  prUrl,
  prState,
}: {
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
}) {
  if (!prUrl) return null;
  return (
    <IconGitPullRequest
      size={12}
      className={cn("shrink-0", prStateIconColor(prState))}
      title={`PR: ${prStateLabel(prState)}`}
    />
  );
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
  const { settings } = useSessionsSidebarSettings();
  const isFolder = settings.layout === "folder";
  const statusStyle = SANDBOX_STATUS_STYLES[status];
  const activityAt = updatedAt ?? createdAt;

  const titleClass = cn(
    "min-w-0 flex-1 transition-colors duration-200",
    isSelected
      ? "font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
  );

  const link = (
    <DynamicLink
      to={href}
      onClick={onNavigate}
      className="block rounded-menu-item px-4 py-1.5 text-[13px] leading-[18px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
    >
      {isFolder ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
              title={statusStyle.label}
            />
            <MarqueeOnHover className={titleClass}>{title}</MarqueeOnHover>
          </div>
          <div className="flex min-w-0 items-center gap-2 pl-4 opacity-60">
            <div className="min-w-0 flex-1">
              <SessionFolderAuthor userId={userId} />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <SessionPrIcon prUrl={prUrl} prState={prState} />
              <RelativeDateTime
                at={activityAt}
                className="shrink-0 text-[11px] text-muted-foreground"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
            title={statusStyle.label}
          />
          <MarqueeOnHover className={titleClass}>{title}</MarqueeOnHover>
          <SessionPrIcon prUrl={prUrl} prState={prState} />
          <RelativeDateTime
            at={activityAt}
            className="shrink-0 text-[11px] text-muted-foreground"
          />
        </div>
      )}
    </DynamicLink>
  );

  if (isFolder) return link;

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
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
