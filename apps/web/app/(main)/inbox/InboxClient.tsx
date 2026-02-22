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

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead({ id: n._id });
    if (n.href) router.push(n.href);
  };

  return (
    <PageWrapper
      title="Inbox"
      headerRight={
        unreadCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markAllAsRead()}
            className="text-muted-foreground"
          >
            <IconChecks size={16} />
            Mark all read
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-1 mb-2">
        <Button
          size="sm"
          variant={filter === "all" ? "secondary" : "ghost"}
          className="motion-press hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === "unread" ? "secondary" : "ghost"}
          className="motion-press hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => setFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {filtered === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconInbox size={24} className="text-muted-foreground" />}
          title={
            filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"
          }
          description="You're all caught up"
        />
      ) : (
        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {filtered.map((n, index) => {
              const config = typeConfig[n.type];
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.18,
                    delay: Math.min(index * 0.02, 0.14),
                  }}
                >
                  <button
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-4 rounded-md px-2.5 py-2 text-left transition-all duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${n.read ? "opacity-50" : ""}`}
                  >
                    <NotificationIcon type={n.type} size="md" />
                    <div className="flex-1 min-w-0 mt-0.5">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={config.badgeVariant}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(n.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <span className="mt-3 h-2 w-2 flex-shrink-0 rounded-full bg-primary animate-in zoom-in-50 duration-200" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
