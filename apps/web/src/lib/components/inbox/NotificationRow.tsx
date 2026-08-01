import { Button, cn, ListRow, LIST_ROW_CONTROL_CLASS } from "@eva/ui";
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
        className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-md bg-card smooth-shadow-ring-sm"
        aria-hidden
      >
        <TypeIcon className={cn("size-3", appearance.iconColor)} />
      </span>
    </div>
  );
}

interface NotificationRowProps {
  notification: Notification;
  repo: RepoWithLogo | undefined;
  /** Row is the one open in the detail pane. */
  selected: boolean;
  onSelect: () => void;
  onMarkRead: () => void;
}

/**
 * One inbox row, on the shared `<ListRow>` contract so it is pixel-identical to
 * a project card and a quick-task card.
 *
 * ## Four type tiers
 *
 * The row previously stacked three lines at `text-xs`/`text-sm`/`text-xs` and
 * dropped the title of a read row to `text-muted-foreground` — which left four
 * elements at one colour and two at one size, flattening the row into a grey
 * slab where nothing led. It now runs four genuinely distinct tiers:
 *
 * 1. title — `text-sm`, semibold when unread
 * 2. context — `text-xs` muted
 * 3. source — `text-2xs` uppercase subtle
 * 4. timestamp — `text-2xs` tabular subtle
 *
 * Unread is carried by the leading accent stripe and the title's weight, so a
 * read row loses emphasis without every line of it going the same grey.
 */
export function NotificationRow({
  notification,
  repo,
  selected,
  onSelect,
  onMarkRead,
}: NotificationRowProps) {
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;
  const unread = !notification.read;
  const context = notification.contextLabel ?? notification.message;

  return (
    <ListRow
      selected={selected}
      onClick={onSelect}
      aria-label={notification.title}
      accentClassName={unread ? "bg-primary" : undefined}
      className={unread ? undefined : "bg-card/60"}
      contentClassName="p-3 pl-3.5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <NotificationSourceAvatar notification={notification} repo={repo} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            {sourceLabel ? (
              <span className="truncate text-2xs font-medium uppercase tracking-wide text-subtle-foreground">
                {sourceLabel}
              </span>
            ) : null}
            {/* Timestamp and Dismiss share the trailing slot: hovering an
                unread row swaps one for the other. */}
            <RelativeDateTime
              at={notification.createdAt}
              className={cn(
                "ml-auto shrink-0 text-2xs tabular-nums text-subtle-foreground",
                unread && "group-hover:invisible",
              )}
            />
          </div>
          <span
            className={cn(
              "truncate text-sm text-foreground",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {notification.title}
          </span>
          {context ? (
            <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {context}
            </span>
          ) : null}
        </div>
      </div>
      {unread ? (
        <Button
          size="xs"
          variant="ghost"
          onClick={onMarkRead}
          title="Mark as read"
          aria-label="Mark as read"
          // `absolute` overrides the control class's `relative` — both are
          // position utilities, so the later one wins the merge. The `z-[2]`
          // that lifts it above the row's click overlay still applies.
          className={cn(
            LIST_ROW_CONTROL_CLASS,
            "absolute right-2 top-2 gap-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100",
          )}
        >
          <IconCheck />
          Dismiss
        </Button>
      ) : null}
    </ListRow>
  );
}
