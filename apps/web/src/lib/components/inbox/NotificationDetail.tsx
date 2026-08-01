import { IconArrowRight, IconCheck, IconMailOpened } from "@tabler/icons-react";
import { Badge, Button, Surface } from "@eva/ui";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import {
  getNotificationAppearance,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

/** Shown until a row is picked, and after the open notification is filtered out. */
export function NotificationDetailEmpty() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<IconMailOpened className="size-6" />}
        title="Nothing selected"
        description="Pick a notification to read it here."
        animate={false}
      />
    </div>
  );
}

interface NotificationDetailProps {
  notification: Notification;
  repo: RepoWithLogo | undefined;
  /** Route-form target, or undefined when the notification links nowhere. */
  href: string | undefined;
  onOpen: (href: string) => void;
  onMarkRead: () => void;
}

/**
 * The inbox detail pane. Reading a notification used to mean navigating away
 * from the inbox entirely; the body now renders here, and following the link is
 * a deliberate second action.
 */
export function NotificationDetail({
  notification,
  repo,
  href,
  onOpen,
  onMarkRead,
}: NotificationDetailProps) {
  const appearance = getNotificationAppearance(notification);
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start gap-3 border-b border-border p-5">
        <NotificationIcon notification={notification} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant={appearance.badgeVariant}>{appearance.label}</Badge>
            {sourceLabel ? (
              <span className="truncate text-2xs font-medium uppercase tracking-wide text-subtle-foreground">
                {sourceLabel}
              </span>
            ) : null}
            <RelativeDateTime
              at={notification.createdAt}
              className="ml-auto shrink-0 text-2xs tabular-nums text-subtle-foreground"
            />
          </div>
          <h2 className="text-pretty text-base font-semibold tracking-heading text-foreground">
            {notification.title}
          </h2>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto scrollbar p-5">
        {notification.message ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {notification.message}
          </p>
        ) : (
          <p className="text-sm text-subtle-foreground">
            This notification has no further detail.
          </p>
        )}
        {notification.contextLabel ? (
          <Surface density="tight" className="mt-4">
            <p className="text-2xs font-medium uppercase tracking-wide text-subtle-foreground">
              Context
            </p>
            <p className="mt-1 text-sm text-foreground">
              {notification.contextLabel}
            </p>
          </Surface>
        ) : null}
      </div>

      {href !== undefined || !notification.read ? (
        <footer className="flex items-center gap-2 border-t border-border p-4">
          {href !== undefined ? (
            <Button size="sm" onClick={() => onOpen(href)}>
              Open
              <IconArrowRight />
            </Button>
          ) : null}
          {!notification.read ? (
            <Button size="sm" variant="outline" onClick={onMarkRead}>
              <IconCheck />
              Mark as read
            </Button>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
