"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/api";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button } from "@heroui/button";
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconRepeat,
  IconFileExport,
  IconInfoCircle,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import type { FunctionReturnType } from "convex/server";

type Notification = FunctionReturnType<typeof api.notifications.list>[number];

const typeIcons: Record<
  Notification["type"],
  React.ComponentType<{ className?: string; size?: number }>
> = {
  routine_complete: IconRepeat,
  export_ready: IconFileExport,
  task_complete: IconCheck,
  system: IconInfoCircle,
};

export function NotificationsClient() {
  const notifications = useQuery(api.notifications.list);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const router = useRouter();

  const hasUnread = notifications?.some((n) => !n.read);

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead({ id: notification._id });
    }
    if (notification.href) {
      router.push(notification.href);
    }
  };

  return (
    <PageWrapper
      title="Notifications"
      headerRight={
        hasUnread ? (
          <Button
            size="sm"
            variant="flat"
            startContent={<IconChecks size={16} />}
            onPress={() => markAllAsRead()}
          >
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      {!notifications ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={IconBell}
          title="No notifications"
          description="You're all caught up"
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type];
            return (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  n.read
                    ? "opacity-60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    : "bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg ${
                    n.read
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "bg-teal-100 dark:bg-teal-900/30"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      n.read
                        ? "text-neutral-500"
                        : "text-teal-700 dark:text-teal-300"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      n.read
                        ? "text-neutral-600 dark:text-neutral-400"
                        : "font-medium text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    {dayjs(n.createdAt).fromNow()}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-2 w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
