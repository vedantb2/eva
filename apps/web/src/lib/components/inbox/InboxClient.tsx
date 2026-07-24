"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useNavigate } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { m, AnimatePresence } from "motion/react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button, Badge } from "@eva/ui";
import { IconCheck, IconChecks, IconInbox } from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { inboxFilterParser } from "@/lib/search-params";
import {
  getNotificationAppearance,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

const KNOWN_SUB_PAGES = new Set([
  "projects",
  "designs",
  "docs",
  "sessions",
  "quick-tasks",
  "settings",
  "testing-arena",
  "stats",
  "automations",
  "inbox",
]);

function transformNotificationHref(href: string): string {
  const segments = href.split("/").filter(Boolean);
  if (segments.length < 3) return href;
  if (KNOWN_SUB_PAGES.has(segments[2])) return href;
  const [owner, repo, appName, ...rest] = segments;
  return `/${owner}/${repo}--${appName}/${rest.join("/")}`;
}

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
    if (n.href) navigate({ to: transformNotificationHref(n.href) });
  };

  return (
    <PageWrapper
      title="Inbox"
      comfortable
      headerRight={
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={filter === "all" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "unread" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setFilter("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
          {unreadCount > 0 && (
            <>
              <div className="mx-1 h-4 w-px bg-muted-foreground/20 hidden sm:block" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllAsRead()}
                className="h-7 text-xs text-muted-foreground hidden sm:inline-flex"
              >
                <IconChecks size={14} />
                Mark all read
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => markAllAsRead()}
                className="h-7 w-7 text-muted-foreground sm:hidden"
                title="Mark all as read"
              >
                <IconChecks size={14} />
              </Button>
            </>
          )}
        </div>
      }
    >
      {filtered === undefined ? (
        <div
          className="min-h-[20rem] space-y-2 rounded-surface border border-border p-3"
          aria-busy="true"
          aria-label="Loading inbox"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-md bg-muted/60"
            />
          ))}
        </div>
      ) : groups === undefined || groups.length === 0 ? (
        <div className="flex items-center justify-center py-20">
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
        <div className="rounded-surface border border-border bg-muted/40 overflow-hidden">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <m.div
                key={group.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="bg-muted/60 px-3 sm:px-4 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                {group.items.map((n, index) => {
                  const repo = n.repoId ? repoById.get(n.repoId) : undefined;
                  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;
                  return (
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
                      <div className="group relative flex items-center transition-colors duration-100 hover:bg-muted/50">
                        <button
                          onClick={() => handleClick(n)}
                          className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left focus-visible:outline-none sm:gap-3 sm:px-4 ${n.read ? "opacity-60" : ""}`}
                        >
                          <div className="flex w-3 items-center justify-center flex-shrink-0">
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <NotificationSourceAvatar
                            notification={n}
                            repo={repo}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            {sourceLabel && (
                              <span className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
                                {sourceLabel}
                              </span>
                            )}
                            <span className="truncate text-xs font-medium sm:text-sm">
                              {n.title}
                            </span>
                            {n.contextLabel && (
                              <span className="truncate text-[10px] text-muted-foreground sm:text-xs">
                                {n.contextLabel}
                              </span>
                            )}
                          </div>
                          <RelativeDateTime
                            at={n.createdAt}
                            className={`text-[10px] text-muted-foreground tabular-nums flex-shrink-0 sm:text-xs ${n.read ? "" : "group-hover:opacity-0"}`}
                          />
                        </button>
                        {!n.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead({ id: n._id })}
                            title="Mark as read"
                            aria-label="Mark as read"
                            className="absolute right-2 h-6 gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-[opacity,background-color] duration-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:right-3"
                          >
                            <IconCheck size={14} />
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </m.div>
                  );
                })}
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
