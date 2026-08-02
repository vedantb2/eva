import { Button, cn } from "@eva/ui";
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
        className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-md border border-border bg-card shadow-sm"
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
  onOpen: () => void;
  onMarkRead: () => void;
}

/** One inbox row. The parent list owns the border, so the row is padding only. */
export function NotificationRow({
  notification,
  repo,
  onOpen,
  onMarkRead,
}: NotificationRowProps) {
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;
  const unread = !notification.read;

  return (
    // Ring on the row rather than the open button so keyboard focus highlights
    // the whole row, matching what a click targets. Inset because the row is
    // full-bleed — an outset ring would be clipped by the scroll container.
    // Scoped to the control's data-slot so the trailing mark-read button, which
    // draws its own ring, does not also light up the row.
    <div className="group relative flex items-center gap-3 px-4 transition-colors hover:bg-muted/40 has-[[data-slot=row-control]:focus-visible]:bg-muted/40 has-[[data-slot=row-control]:focus-visible]:ring-2 has-[[data-slot=row-control]:focus-visible]:ring-inset has-[[data-slot=row-control]:focus-visible]:ring-ring/35">
      <button
        onClick={onOpen}
        data-slot="row-control"
        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left focus-visible:outline-none"
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
              unread ? "font-medium text-foreground" : "text-muted-foreground",
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
      {/* Timestamp and Dismiss share the trailing slot: hovering an unread row
          swaps one for the other. */}
      <RelativeDateTime
        at={notification.createdAt}
        className={cn(
          "shrink-0 text-xs tabular-nums text-muted-foreground",
          unread && "group-hover:invisible",
        )}
      />
      {unread ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onMarkRead}
          title="Mark as read"
          aria-label="Mark as read"
          className="absolute right-3 h-6 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <IconCheck className="size-3.5" />
          Dismiss
        </Button>
      ) : null}
    </div>
  );
}
