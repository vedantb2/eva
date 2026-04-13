"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button, Badge, Spinner } from "@conductor/ui";
import { IconChecks, IconInbox } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { inboxFilterParser } from "@/lib/search-params";
import {
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { useMemo } from "react";

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

    if (!map.has(label)) {
      const items: Notification[] = [];
      map.set(label, items);
      groups.push({ label, items });
    }
    map.get(label)!.push(n);
  }
  return groups;
}

export function InboxClient() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.countUnread) ?? 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [filter, setFilter] = useQueryState("filter", inboxFilterParser);

  const filtered = useMemo(() => {
    if (!notifications) return undefined;
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const groups = useMemo(() => {
    if (!filtered) return undefined;
    return groupByDate(filtered);
  }, [filtered]);

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
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <EmptyState
            icon={<IconInbox size={24} className="text-muted-foreground" />}
            title={
              filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"
            }
            description="You're all caught up"
          />
        </div>
      ) : (
        <div className="rounded-lg bg-muted/40 overflow-hidden">
          <AnimatePresence initial={false}>
            {groups!.map((group) => (
              <motion.div
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
                {group.items.map((n, index) => (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: Math.min(index * 0.02, 0.1),
                    }}
                  >
                    <button
                      onClick={() => handleClick(n)}
                      className={`group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-100 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 sm:gap-3 sm:px-4 ${n.read ? "opacity-60" : ""}`}
                    >
                      <div className="flex w-3 items-center justify-center flex-shrink-0">
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <NotificationIcon type={n.type} size="sm" />
                      <span className="flex-1 min-w-0 text-xs font-medium truncate sm:text-sm">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0 sm:text-xs">
                        {dayjs(n.createdAt).fromNow()}
                      </span>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
