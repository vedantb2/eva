"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/api";
import {
  IconBell,
  IconRepeat,
  IconFileExport,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import type { FunctionReturnType } from "convex/server";
import { GenericId as Id } from "convex/values";
import { useEffect } from "react";

type Notification = NonNullable<
  FunctionReturnType<typeof api.notifications.get>
>;

const typeIcons: Record<
  Notification["type"],
  React.ComponentType<{ className?: string; size?: number }>
> = {
  routine_complete: IconRepeat,
  export_ready: IconFileExport,
  task_complete: IconCheck,
  system: IconInfoCircle,
};

const typeLabels: Record<Notification["type"], string> = {
  routine_complete: "Routine Complete",
  export_ready: "Export Ready",
  task_complete: "Task Complete",
  system: "System",
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notification = useQuery(
    api.notifications.get,
    id ? { id: id as Id<"notifications"> } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);

  useEffect(() => {
    if (notification && !notification.read) {
      markAsRead({ id: notification._id });
    }
  }, [notification, markAsRead]);

  if (notification === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <IconBell
          size={32}
          className="text-neutral-300 dark:text-neutral-600 mb-2"
        />
        <p className="text-sm text-neutral-500">Notification not found</p>
      </div>
    );
  }

  const Icon = typeIcons[notification.type];

  return (
    <div className="p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
          <Icon size={20} className="text-teal-700 dark:text-teal-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {notification.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
            <span>{typeLabels[notification.type]}</span>
            <span>&middot;</span>
            <span>{dayjs(notification.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>
      {notification.message && (
        <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {notification.message}
        </p>
      )}
    </div>
  );
}
