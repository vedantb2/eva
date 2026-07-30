"use client";

import type { Id } from "@eva/backend";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
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
import { SessionHoverCardBody } from "@/lib/components/sidebar/SidebarListHoverCard";

/**
 * Width a tab asks for before the strip starts squeezing, in rem. The tab row
 * multiplies it by its tab count (see SessionChromeTabGroup) so every tab in the
 * strip shrinks from the same preferred size and ends up the same width.
 */
export const TAB_PREFERRED_WIDTH_REM = 14;

export interface ChromeTabSession {
  _id: string;
  _creationTime: number;
  numId?: number;
  title: string;
  status: SandboxStatus;
  userId: Id<"users">;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  firstMessagePreview?: string | null;
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
 * Anatomy copied from Chrome. Unselected tabs are chromeless and butt up
 * against each other with a hairline separator between them. The selected tab is
 * the only filled surface: it is painted in the page's own colour, flares out at
 * the bottom corners and covers the strip's divider, so it reads as the top edge
 * of the content below rather than a card floating on the strip.
 *
 * Width is never scrolled — tabs share the strip and shrink as more open, down
 * to a favicon. Each tab is its own container query so it can shed detail as it
 * narrows (PR icon, then sandbox dot, then close, then the title), the same
 * order Chrome sheds its own.
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
    <HoverCard openDelay={400} closeDelay={100}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <HoverCardTrigger asChild>
            <div
              style={{ flexBasis: `${TAB_PREFERRED_WIDTH_REM}rem` }}
              className={cn(
                // Tabs shrink from the shared preferred width down to min-w-8,
                // which is a favicon and nothing else. container-type makes the
                // tab a query container for the detail ladder below, and drops its
                // intrinsic width, so a long title cannot resist shrinking.
                "group relative flex h-9 min-w-8 items-center rounded-t-[0.625rem] transition-colors [container-type:inline-size]",
                isSelected
                  ? "z-10 bg-background text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              {showSeparator ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-border transition-opacity group-hover:opacity-0"
                />
              ) : null}
              {isSelected ? (
                // Chrome's flared shoulders: a quarter disc either side of the
                // tab, masked so the curve sweeps away from it and into the
                // strip. Same fill as the tab, so the merge is seamless.
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-2 bottom-0 size-2 bg-background [mask-image:radial-gradient(circle_at_top_left,transparent_7.5px,black_8px)]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-2 bottom-0 size-2 bg-background [mask-image:radial-gradient(circle_at_top_right,transparent_7.5px,black_8px)]"
                  />
                </>
              ) : null}
              <DynamicLink
                to={href}
                className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-3 pr-1 text-[0.8125rem] [@container(max-width:4.5rem)]:justify-center [@container(max-width:4.5rem)]:px-0"
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
                <span className="min-w-0 flex-1 truncate font-medium [@container(max-width:4.5rem)]:hidden">
                  {session.title}
                </span>
                {/* Sandbox state rides on the right, like Chrome's per-tab indicators. */}
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full [@container(max-width:9rem)]:hidden",
                    statusStyle.dot,
                  )}
                  title={statusStyle.label}
                />
                {session.prUrl ? (
                  <IconGitPullRequest
                    size={14}
                    className={cn(
                      "shrink-0 [@container(max-width:11rem)]:hidden",
                      prStateIconColor(session.prState),
                    )}
                  />
                ) : null}
              </DynamicLink>
              <button
                type="button"
                aria-label={`Archive ${session.title}`}
                title="Archive session"
                className={cn(
                  "mr-2 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,opacity] hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 [@container(max-width:7.5rem)]:hidden",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
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
          </HoverCardTrigger>
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
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-64 p-3"
      >
        <SessionHoverCardBody
          title={session.title}
          preview={session.firstMessagePreview}
          createdAt={session._creationTime}
          userId={session.userId}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
