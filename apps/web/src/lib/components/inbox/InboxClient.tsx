import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useNavigate } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@eva/ui";
import { IconChecks } from "@tabler/icons-react";
import {
  inboxFilterParser,
  inboxNotificationParser,
} from "@/lib/search-params";
import { type Notification } from "@/lib/components/notifications/notification-config";
import { InboxFilterTabs } from "@/lib/components/inbox/InboxFilterTabs";
import { InboxList } from "@/lib/components/inbox/InboxList";
import {
  NotificationDetail,
  NotificationDetailEmpty,
} from "@/lib/components/inbox/NotificationDetail";
import { transformNotificationHref } from "@/lib/components/inbox/notificationHref";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";

/**
 * The inbox: list on the left, notification body on the right, on the same
 * `ResizablePanelLayout` the project, session and quick-task views use. The
 * app's nav sidebar is the third pane — there is no reason for the inbox to
 * grow a rail of its own.
 *
 * Selecting a row used to navigate straight to the notification's target, which
 * emptied the inbox on every read and made working through a backlog
 * impossible. Selection now opens the body here, and following the link is a
 * separate, deliberate action.
 */
export function InboxClient() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.list);
  const repos = useQuery(api.githubRepos.list, {});
  const unreadCount = useQuery(api.notifications.countUnread) ?? 0;
  const repoById = new Map((repos ?? []).map((repo) => [repo._id, repo]));
  const markAsRead = useMutation(
    api.notifications.markAsRead,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.notifications.list, {});
    if (current !== undefined) {
      localStore.setQuery(
        api.notifications.list,
        {},
        current.map((n) => (n._id === args.id ? { ...n, read: true } : n)),
      );
    }
    const count = localStore.getQuery(api.notifications.countUnread, {});
    if (count !== undefined) {
      localStore.setQuery(
        api.notifications.countUnread,
        {},
        Math.max(0, count - 1),
      );
    }
  });
  const markAllAsRead = useMutation(
    api.notifications.markAllAsRead,
  ).withOptimisticUpdate((localStore) => {
    const current = localStore.getQuery(api.notifications.list, {});
    if (current !== undefined) {
      localStore.setQuery(
        api.notifications.list,
        {},
        current.map((n) => ({ ...n, read: true })),
      );
    }
    localStore.setQuery(api.notifications.countUnread, {}, 0);
  });
  const [filter, setFilter] = useQueryState("filter", inboxFilterParser);
  const [selectedId, setSelectedId] = useQueryState(
    "notification",
    inboxNotificationParser,
  );

  const filtered =
    notifications === undefined
      ? undefined
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications;

  // Resolved against the full list rather than the filtered one: reading a
  // notification under the Unread filter drops it out of the list, and the pane
  // should keep showing what is being read rather than blanking underneath.
  const selected = notifications?.find((n) => n._id === selectedId);

  const repoFor = (n: Notification) =>
    n.repoId === undefined ? undefined : repoById.get(n.repoId);

  const handleSelect = (n: Notification) => {
    setSelectedId(n._id);
    if (!n.read) markAsRead({ id: n._id });
  };

  return (
    <PageWrapper
      title="Inbox"
      fillHeight
      childPadding={false}
      headerRight={
        <div className="flex items-center gap-2">
          <InboxFilterTabs
            filter={filter}
            unreadCount={unreadCount}
            onChange={setFilter}
          />
          {unreadCount > 0 ? (
            <Button
              size="xs"
              variant="outline"
              onClick={() => markAllAsRead()}
              title="Mark all as read"
              aria-label="Mark all as read"
              className="text-muted-foreground"
            >
              <IconChecks />
              {/* The label is noise on narrow screens; the icon carries it. */}
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden border-t border-border">
        <ResizablePanelLayout
          storageKey="inbox-split"
          leftDefaultSize="38%"
          leftMinWidthPx={300}
          rightMinWidthPx={360}
          // Reading the body is the point of this view, so the pane starts open.
          defaultRightCollapsed={false}
          leftPanel={() => (
            <div className="h-full min-h-0 overflow-auto scrollbar">
              <InboxList
                notifications={filtered}
                repoFor={repoFor}
                filter={filter}
                selectedId={selectedId}
                onSelect={handleSelect}
                onMarkRead={(n) => markAsRead({ id: n._id })}
              />
            </div>
          )}
          rightPanel={
            <div className="h-full min-h-0 bg-background">
              {selected === undefined ? (
                <NotificationDetailEmpty />
              ) : (
                <NotificationDetail
                  key={selected._id}
                  notification={selected}
                  repo={repoFor(selected)}
                  href={
                    selected.href === undefined
                      ? undefined
                      : transformNotificationHref(selected.href)
                  }
                  onOpen={(to) => navigate({ to })}
                  onMarkRead={() => markAsRead({ id: selected._id })}
                />
              )}
            </div>
          }
        />
      </div>
    </PageWrapper>
  );
}
