"use client";

import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  cn,
} from "@eva/ui";
import {
  IconArchive,
  IconClipboard,
  IconCopy,
  IconGitPullRequest,
  IconLink,
  IconPencil,
} from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { entityPathSegment } from "@/lib/numId";

export interface ChromeTabSession {
  _id: string;
  numId?: number;
  title: string;
  status: SandboxStatus;
  userId: Id<"users">;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
}

interface SessionChromeTabProps {
  session: ChromeTabSession;
  baseUrl: string;
  pathname: string;
  accentBorderClass: string;
  onRenameRequest: () => void;
  onArchiveRequest: () => void;
  onDuplicate: () => Promise<string>;
  onDuplicateNavigate: (pathSegment: string) => void;
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

/** One Chrome-style session tab with rename / duplicate / archive context menu. */
export function SessionChromeTab({
  session,
  baseUrl,
  pathname,
  accentBorderClass,
  onRenameRequest,
  onArchiveRequest,
  onDuplicate,
  onDuplicateNavigate,
}: SessionChromeTabProps) {
  const pathSegment = entityPathSegment(session);
  const href = pathSegment ? `${baseUrl}/${pathSegment}` : baseUrl;
  const isSelected = pathname === href || pathname.startsWith(`${href}/`);
  const statusStyle = SANDBOX_STATUS_STYLES[session.status];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <DynamicLink
          to={href}
          title={session.title}
          className={cn(
            // Chrome-like tab: wide enough to read titles, rounded top, sits in group strip.
            "group flex h-9 min-w-[11rem] max-w-[18rem] shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3 text-sm transition-colors",
            isSelected
              ? cn(
                  "relative z-[1] bg-background text-foreground shadow-sm",
                  accentBorderClass,
                )
              : "border-transparent bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground",
          )}
        >
          <span
            className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)}
            title={statusStyle.label}
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            {session.title}
          </span>
          {session.prUrl ? (
            <IconGitPullRequest
              size={14}
              className={cn("shrink-0", prStateIconColor(session.prState))}
            />
          ) : null}
        </DynamicLink>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        <ContextMenuItem onSelect={onRenameRequest}>
          <IconPencil size={16} />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void onDuplicate().then((segment) => {
              onDuplicateNavigate(segment);
            });
          }}
        >
          <IconCopy size={16} />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(session.title);
          }}
        >
          <IconClipboard size={16} />
          Copy title
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(window.location.origin + href);
          }}
        >
          <IconLink size={16} />
          Copy link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-warning" onSelect={onArchiveRequest}>
          <IconArchive size={16} />
          Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
