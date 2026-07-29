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
  IconX,
} from "@tabler/icons-react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { RepoLogo } from "@/lib/components/RepoLogo";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";

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
  /** App logo — Chrome's favicon slot. */
  appLogoUrl?: string | null;
  appLabel: string;
  href: string;
  isSelected: boolean;
  /** Chrome draws a hairline only between two adjacent unselected tabs. */
  showSeparator: boolean;
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

/**
 * One Chrome-style session tab.
 *
 * Anatomy copied from Chrome: unselected tabs are chromeless (no fill, no
 * border) and butt up against each other with a hairline separator between
 * them; the selected tab is the only filled surface — an elevated card, rounded
 * at the top, whose open bottom edge is closed by the strip's own divider.
 * Close (= archive) appears on hover, and is always visible on the selected tab.
 */
export function SessionChromeTab({
  session,
  appLogoUrl,
  appLabel,
  href,
  isSelected,
  showSeparator,
  onRenameRequest,
  onArchiveRequest,
  onDuplicate,
  onDuplicateNavigate,
}: SessionChromeTabProps) {
  const statusStyle = SANDBOX_STATUS_STYLES[session.status];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            // Fixed width: Chrome gives every tab the same width and truncates.
            "group relative flex h-9 w-56 shrink-0 items-center rounded-t-[0.625rem] transition-colors",
            isSelected
              ? "z-10 border border-b-0 border-border bg-card text-foreground shadow-sm"
              : "border border-transparent text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          {showSeparator ? (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-border transition-opacity group-hover:opacity-0"
            />
          ) : null}
          <DynamicLink
            to={href}
            title={session.title}
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-3 pr-1 text-[0.8125rem]"
          >
            <RepoLogo
              logoUrl={appLogoUrl}
              size={16}
              fallback={
                <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-semibold text-muted-foreground">
                  {appLabel.charAt(0).toUpperCase()}
                </span>
              }
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {session.title}
            </span>
            {/* Sandbox state rides on the right, like Chrome's per-tab indicators. */}
            <span
              className={cn("size-1.5 shrink-0 rounded-full", statusStyle.dot)}
              title={statusStyle.label}
            />
            {session.prUrl ? (
              <IconGitPullRequest
                size={14}
                className={cn("shrink-0", prStateIconColor(session.prState))}
              />
            ) : null}
          </DynamicLink>
          <button
            type="button"
            aria-label={`Archive ${session.title}`}
            title="Archive session"
            className={cn(
              "mr-2 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,opacity] hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onArchiveRequest();
            }}
          >
            <IconX size={14} />
          </button>
        </div>
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
