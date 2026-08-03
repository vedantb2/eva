"use client";

import { Button, LIST_ROW_CONTROL_CLASS, ListRow, cn } from "@eva/ui";
import { IconCheck } from "@tabler/icons-react";
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
function NotificationSourceAvatar({
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
    <div className="relative size-6 shrink-0">
      <RepoLogo
        logoUrl={repo.logoUrl}
        size={24}
        fallback={
          <span className="flex size-6 shrink-0 items-center justify-center rounded-control border border-border bg-muted text-2xs font-semibold text-muted-foreground">
            {label.charAt(0).toUpperCase()}
          </span>
        }
      />
      <span
        className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full border border-border bg-card"
        aria-hidden
      >
        <TypeIcon size={9} className={appearance.iconColor} />
      </span>
    </div>
  );
}

interface NotificationRowProps {
  notification: Notification;
  repo: RepoWithLogo | undefined;
  onOpen: () => void;
  onMarkRead: () => void;
}

/**
 * One inbox row: title on the first line with the timestamp trailing it, source
 * and context folded onto a single muted second line. Two lines rather than
 * three, so a day's worth of notifications fits on one screen.
 */
export function NotificationRow({
  notification,
  repo,
  onOpen,
  onMarkRead,
}: NotificationRowProps) {
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;
  const unread = !notification.read;
  const context = notification.contextLabel;

  return (
    <ListRow
      density="compact"
      onClick={onOpen}
      aria-label={notification.title}
      contentClassName="flex items-start gap-2.5"
    >
      {/* Fixed-width dot slot so read and unread rows stay aligned. */}
      <span className="mt-2 flex w-1.5 shrink-0 justify-center" aria-hidden>
        {unread ? <span className="size-1.5 rounded-full bg-primary" /> : null}
      </span>

      <NotificationSourceAvatar notification={notification} repo={repo} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-baseline gap-2">
          {/* Read rows drop to the muted tone rather than fading the whole row,
              so logos and timestamps stay legible. */}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-2sm",
              unread ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {notification.title}
          </span>
          {/* Timestamp and Dismiss share the trailing slot: hovering an unread
              row swaps one for the other. */}
          <span className="relative flex shrink-0 items-center justify-end">
            <RelativeDateTime
              at={notification.createdAt}
              className={cn("text-2xs", unread && "group-hover:invisible")}
            />
            {unread ? (
              <Button
                size="xs"
                variant="ghost"
                onClick={onMarkRead}
                title="Mark as read"
                aria-label="Mark as read"
                className={cn(
                  LIST_ROW_CONTROL_CLASS,
                  "absolute right-0 h-6 gap-1 px-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100",
                )}
              >
                <IconCheck size={12} />
                Dismiss
              </Button>
            ) : null}
          </span>
        </div>

        {sourceLabel !== undefined || context ? (
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {sourceLabel}
            {sourceLabel !== undefined && context ? " · " : ""}
            {context}
          </p>
        ) : null}
      </div>
    </ListRow>
  );
}
