"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useNavigate } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { m, AnimatePresence } from "motion/react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button, Skeleton } from "@eva/ui";
import { IconChecks, IconInbox } from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import { inboxFilterParser } from "@/lib/search-params";
import { type Notification } from "@/lib/components/notifications/notification-config";
import { InboxFilterTabs } from "@/lib/components/inbox/InboxFilterTabs";
import { NotificationRow } from "@/lib/components/inbox/NotificationRow";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const map = new Map<string, Notification[]>();

  for (const n of notifications) {
    const d = dayjs(n.createdAt);
    const now = dayjs();
    let label: string;
    if (d.isSame(now, "day")) label = "Today";
    else if (d.isSame(now.subtract(1, "day"), "day")) label = "Yesterday";
    else if (d.isSame(now, "week")) label = d.format("dddd");
    else label = d.format("MMMM D, YYYY");

    let items = map.get(label);
    if (!items) {
      items = [];
      map.set(label, items);
      groups.push({ label, items });
    }
    items.push(n);
  }
  return groups;
}

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

  const filtered =
    notifications === undefined
      ? undefined
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications;

  const groups = filtered === undefined ? undefined : groupByDate(filtered);

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead({ id: n._id });
    if (n.href) navigate({ to: toInternalRepoHref(n.href) });
  };

  const isEmpty = groups !== undefined && groups.length === 0;

  return (
    <PageWrapper
      title="Inbox"
      comfortable
      fillHeight={isEmpty}
      headerRight={
        unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllAsRead()}
            title="Mark all as read"
            aria-label="Mark all as read"
            className="h-7 text-xs text-muted-foreground"
          >
            <IconChecks size={14} />
            {/* The label is noise on narrow screens; the icon carries it. */}
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        ) : null
      }
      toolbar={
        <InboxFilterTabs
          filter={filter}
          unreadCount={unreadCount}
          onChange={setFilter}
        />
      }
    >
      {filtered === undefined ? (
        <div
          className="min-h-80 space-y-2 rounded-surface bg-card p-4"
          aria-busy="true"
          aria-label="Loading inbox"
        >
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : groups === undefined || groups.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
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
        </div>
      ) : (
        <div className="overflow-hidden rounded-surface bg-card">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <m.div
                key={group.label}
                // Later groups need the divider their header's border-b cannot draw.
                className="border-t border-border first:border-t-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="border-b border-border bg-muted px-4 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((n, index) => (
                    <m.div
                      key={n._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
