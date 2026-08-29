"use client";

import { useEffect, useRef } from "react";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  cn,
} from "@eva/ui";
import { IconCheck, IconMail, IconMailOpened } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { RepoLogo } from "@/lib/components/RepoLogo";
import {
  getNotificationAppearance,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

/**
 * Repo logo with the notification type badged onto its corner. Falls back to
 * the plain type icon when the notification is not tied to a repo.
 */
export function NotificationSourceAvatar({
  notification,
  repo,
}: {
  notification: Notification;
  repo: RepoWithLogo | undefined;
}) {
  if (!repo) {
    return <NotificationIcon notification={notification} size="sm" />;
  }

  const label = repoDisplayLabel(repo);
  const appearance = getNotificationAppearance(notification);
  const TypeIcon = appearance.icon;

  return (
    <div className="relative size-7 shrink-0">
      <RepoLogo
        logoUrl={repo.logoUrl}
        size={28}
        fallback={
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground">
            {label.charAt(0).toUpperCase()}
          </span>
        }
      />
      <span
        className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-md border border-border bg-card"
        aria-hidden
      >
        <TypeIcon size={11} className={appearance.iconColor} />
      </span>
    </div>
  );
}

interface NotificationRowProps {
  notification: Notification;
  repo: RepoWithLogo | undefined;
  selected: boolean;
  onSelect: () => void;
  onMarkRead: () => void;
  /** Right-click menu action: flips this row between read and unread. */
  onToggleRead: () => void;
}

/** One inbox row. The parent list owns the border, so the row is padding only. */
export function NotificationRow({
  notification,
  repo,
  selected,
  onSelect,
  onMarkRead,
  onToggleRead,
}: NotificationRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;
  const unread = !notification.read;

  // Keyboard stepping (arrow keys in the inbox) must keep the selected row in
  // view; nearest-block scrolling is a no-op when it is already visible.
  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  // Right-click opens the menu instead of selecting: `contextmenu` does not
  // fire the row button's `onClick`, so the notification is neither opened nor
  // marked read on the way in. Hover affordances (Dismiss) are untouched — the
  // trigger only clones the row shell.
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={rowRef}
          className={cn(
            "group relative flex items-center gap-3 px-4 transition-colors",
            selected ? "bg-muted" : "hover:bg-muted/40",
          )}
        >
          {/* Matches `ListRow`, which every comparable row in the app is built on
          and which presses at 0.99 — the inbox row was hand-rolled and so never
          picked it up. */}
          <button
            onClick={onSelect}
            aria-current={selected ? "true" : undefined}
            className="motion-press flex min-w-0 flex-1 items-center gap-3 py-3 text-left active:scale-[0.99] focus-visible:outline-hidden"
          >
            {/* Fixed-width dot slot so read and unread rows stay aligned. */}
            <span className="flex w-1.5 shrink-0 justify-center" aria-hidden>
              {unread ? (
                <span className="size-1.5 rounded-full bg-primary" />
              ) : null}
            </span>
            <NotificationSourceAvatar notification={notification} repo={repo} />
            <div className="flex min-w-0 flex-1 flex-col">
              {sourceLabel ? (
                <span className="truncate text-xs text-muted-foreground">
                  {sourceLabel}
                </span>
              ) : null}
              {/* Read rows drop to the muted tone rather than fading the whole row,
              so logos and timestamps stay legible. */}
              <span
                className={cn(
                  "truncate text-sm",
                  unread
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {notification.title}
              </span>
              {notification.contextLabel ? (
                <span className="truncate text-xs leading-relaxed text-muted-foreground">
                  {notification.contextLabel}
                </span>
              ) : null}
            </div>
          </button>
          {/* At `sm` and up this is exactly as it was: timestamp and Dismiss share
          the trailing slot, and hovering an unread row swaps one for the other.
          Below `sm` that swap is unusable — touch has no hover, so Dismiss was
          unreachable — so there the button leaves the overlay, sits in flow next
          to the timestamp as a 40px icon-only target, and the timestamp keeps its
          place. Both halves are `max-sm:`-scoped so the desktop row is untouched. */}
          <RelativeDateTime
            at={notification.createdAt}
            className={cn(
              "shrink-0 text-xs tabular-nums text-muted-foreground",
              unread && "sm:group-hover:invisible",
            )}
          />
          {unread ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkRead}
              title="Mark as read"
              aria-label="Mark as read"
              className="absolute right-3 h-6 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 max-sm:static max-sm:size-10 max-sm:shrink-0 max-sm:gap-0 max-sm:p-0 max-sm:opacity-100"
            >
              <IconCheck size={14} />
              <span className="max-sm:hidden">Dismiss</span>
            </Button>
          ) : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={onToggleRead}>
          {unread ? <IconMailOpened size={16} /> : <IconMail size={16} />}
          {unread ? "Mark as read" : "Mark as unread"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
