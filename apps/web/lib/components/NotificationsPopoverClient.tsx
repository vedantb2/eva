"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Spinner,
  Badge,
  Avatar,
  AvatarFallback,
} from "@conductor/ui";
import { IconBell, IconChecks, IconBellOff } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import Link from "next/link";
import {
  typeConfig,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";

export function NotificationsPopoverClient() {
  const popover = useDisclosure();
  const router = useRouter();
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.countUnread) ?? 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead({ id: notification._id }).catch(() => undefined);
    }
    popover.onClose();
    if (notification.href) {
      router.push(notification.href);
      return;
    }
    router.push("/inbox");
  };

  return (
    <Popover open={popover.isOpen} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" onClick={popover.onOpen}>
          {unreadCount > 0 ? (
            <div className="relative">
              <IconBell className="size-5" />
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </div>
          ) : (
            <IconBell className="size-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markAllAsRead()}
              className="h-7 text-xs text-muted-foreground"
            >
              <IconChecks size={14} />
              Mark all read
            </Button>
          )}
        </div>
        <div className="scrollbar max-h-[360px] overflow-y-auto">
          {!notifications ? (
            <div className="flex justify-center py-10">
              <Spinner size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Avatar className="mx-auto mb-3 h-10 w-10">
                <AvatarFallback>
                  <IconBellOff size={20} className="text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">All caught up</p>
            </div>
          ) : (
            <div role="listbox">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${notification.read ? "opacity-60" : ""}`}
                >
                  <NotificationIcon type={notification.type} />
                  <div className="mt-0.5 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={typeConfig[notification.type].badgeVariant}
                        className="h-4 px-1.5 py-0 text-[10px]"
                      >
                        {typeConfig[notification.type].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {dayjs(notification.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Link
            href="/inbox"
            onClick={() => popover.onClose()}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
