"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useNavigate } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { m, AnimatePresence } from "motion/react";
import {
  Button,
  EmptyState,
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
  Skeleton,
} from "@eva/ui";
import { IconChecks, IconInbox } from "@tabler/icons-react";
import { inboxFilterParser } from "@/lib/search-params";
import { useRoutePageTitle } from "@/lib/contexts/PageTitleContext";
import { type Notification } from "@/lib/components/notifications/notification-config";
import { InboxFilterTabs } from "@/lib/components/inbox/InboxFilterTabs";
import { NotificationRow } from "@/lib/components/inbox/NotificationRow";
import { groupNotificationsByDate } from "@/lib/components/inbox/inboxGroups";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

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

  // The page header lives in this pane, but the mobile top bar renders the
  // route title from context — so it still has to be published from here.
  useRoutePageTitle("Inbox");

  const filtered =
    notifications === undefined
      ? undefined
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications;

  const groups =
    filtered === undefined ? undefined : groupNotificationsByDate(filtered);

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead({ id: n._id });
    if (n.href) navigate({ to: toInternalRepoHref(n.href) });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader>
        <PageHeaderTitle>Inbox</PageHeaderTitle>
        <PageHeaderActions>
          <InboxFilterTabs
            filter={filter}
            unreadCount={unreadCount}
            onChange={setFilter}
          />
          {unreadCount > 0 ? (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => markAllAsRead()}
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <IconChecks size={14} />
              {/* The label is noise on narrow screens; the icon carries it. */}
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          ) : null}
        </PageHeaderActions>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar">
        <div className="mx-auto w-full max-w-4xl px-2 py-2 sm:px-3">
          {groups === undefined ? (
            <div
              className="space-y-1"
              aria-busy="true"
              aria-label="Loading inbox"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-surface" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={<IconInbox size={24} className="text-muted-foreground" />}
              title={
                filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"
              }
              description="You're all caught up"
              animate={filter !== "unread"}
            />
          ) : (
            <AnimatePresence initial={false}>
              {groups.map((group) => (
                <m.section
                  key={group.label}
                  className="pt-3 first:pt-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="px-1 pb-1.5 text-2xs font-medium text-muted-foreground">
                    {group.label}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((n, index) => (
                      <m.div
                        key={n._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: 0.15,
                          delay: Math.min(index * 0.02, 0.1),
                        }}
                      >
                        <NotificationRow
                          notification={n}
                          repo={n.repoId ? repoById.get(n.repoId) : undefined}
                          onOpen={() => handleClick(n)}
                          onMarkRead={() => markAsRead({ id: n._id })}
                        />
                      </m.div>
                    ))}
                  </div>
                </m.section>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
