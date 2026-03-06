"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button, Badge, Spinner } from "@conductor/ui";
import { IconChecks, IconInbox } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { inboxFilterParser } from "@/lib/search-params";
import {
  typeConfig,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { useMemo } from "react";

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
  const router = useRouter();
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
    if (n.href) router.push(n.href);
  };

  return (
    <PageWrapper
      title="Inbox"
      fillHeight
      childPadding={false}
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
              <div className="mx-1 h-4 w-px bg-border hidden sm:block" />
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
        <div className="flex flex-1 items-center justify-center">
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
        <div className="flex-1 overflow-auto scrollbar">
          <AnimatePresence initial={false}>
            {groups!.map((group) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="sticky top-0 z-10 border-b border-border/50 bg-card/90 px-3 py-1.5 sm:px-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                {group.items.map((n, index) => {
                  const config = typeConfig[n.type];
                  return (
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
                        className={`group flex w-full items-center gap-2 border-b border-border/40 px-3 py-2.5 text-left transition-colors duration-100 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 sm:gap-3 sm:px-4 ${n.read ? "opacity-60" : ""}`}
                      >
                        <div className="flex w-3 items-center justify-center flex-shrink-0">
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <NotificationIcon type={n.type} size="sm" />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {n.title}
                          </span>
                          {n.message && (
                            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                              {n.message}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant={config.badgeVariant}
                            className="text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex"
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {dayjs(n.createdAt).format(
                              dayjs(n.createdAt).isSame(dayjs(), "day")
                                ? "h:mm A"
                                : "MMM D",
                            )}
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
