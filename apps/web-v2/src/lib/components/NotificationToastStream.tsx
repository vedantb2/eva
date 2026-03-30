"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, type Id } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import { Badge, Button, Card, CardContent } from "@conductor/ui";
import { IconX } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import {
  NotificationIcon,
  type Notification,
  typeConfig,
} from "@/lib/components/notifications/notification-config";

const TOAST_LIMIT = 4;
const TOAST_TTL_MS = 9000;

type ToastEntry = {
  notification: Notification;
  expiresAt: number;
};

export function NotificationToastStream() {
  const notifications = useQuery(api.notifications.list);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const navigate = useNavigate();
  const seenNotificationIdsRef = useRef<Set<Id<"notifications">> | null>(null);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    if (!notifications) {
      return;
    }
    const currentIds = new Set(
      notifications.map((notification) => notification._id),
    );
    const seenNotificationIds = seenNotificationIdsRef.current;
    if (!seenNotificationIds) {
      seenNotificationIdsRef.current = currentIds;
      return;
    }

    const newlyArrived = notifications.filter(
      (notification) => !seenNotificationIds.has(notification._id),
    );
    seenNotificationIdsRef.current = currentIds;

    if (newlyArrived.length === 0) {
      return;
    }

    setToasts((previous) => {
      const existingIds = new Set(
        previous.map((entry) => entry.notification._id),
      );
      const next = [...previous];
      const now = Date.now();
      for (const notification of [...newlyArrived].reverse()) {
        if (existingIds.has(notification._id)) {
          continue;
        }
        next.unshift({
          notification,
          expiresAt: now + TOAST_TTL_MS,
        });
        existingIds.add(notification._id);
      }
      return next.slice(0, TOAST_LIMIT);
    });
  }, [notifications]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setToasts((previous) =>
        previous.filter((entry) => entry.expiresAt > now),
      );
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [toasts.length]);

  const dismissToast = (id: Id<"notifications">) => {
    setToasts((previous) =>
      previous.filter((entry) => entry.notification._id !== id),
    );
  };

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      markAsRead({ id: notification._id }).catch(() => undefined);
    }
    dismissToast(notification._id);
    if (notification.href) {
      navigate({ to: notification.href });
      return;
    }
    navigate({ to: "/inbox" });
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-40 flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((entry) => {
        const notification = entry.notification;
        const config = typeConfig[notification.type];
        return (
          <Card
            key={notification._id}
            className="pointer-events-auto bg-background/95 shadow-lg"
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <NotificationIcon type={notification.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">
                      {notification.title}
                    </p>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => dismissToast(notification._id)}
                      aria-label="Dismiss notification"
                    >
                      <IconX size={14} />
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={config.badgeVariant}
                      className="h-4 px-1.5 py-0 text-[10px]"
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {dayjs(notification.createdAt).fromNow()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => openNotification(notification)}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
