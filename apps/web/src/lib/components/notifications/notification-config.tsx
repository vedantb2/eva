"use client";

import {
  type IconBell,
  IconRepeat,
  IconFileExport,
  IconCheck,
  IconAlertTriangle,
  IconExclamationCircle,
  IconInfoCircle,
  IconUserPlus,
  IconMessage,
  IconMessageReply,
  IconAt,
  IconPlayerPlay,
  IconProgress,
  IconPencil,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@eva/ui";
import type { BadgeProps } from "@eva/ui";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";

export type Notification = FunctionReturnType<
  typeof api.notifications.list
>[number];

export type NotificationAppearance = {
  icon: typeof IconBell;
  label: string;
  badgeVariant: BadgeProps["variant"];
  iconBg: string;
  iconColor: string;
};

const typeConfig: Record<Notification["type"], NotificationAppearance> = {
  routine_complete: {
    icon: IconRepeat,
    label: "Routine",
    badgeVariant: "secondary",
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  export_ready: {
    icon: IconFileExport,
    label: "Export",
    badgeVariant: "default",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  task_complete: {
    icon: IconCheck,
    label: "Task Done",
    badgeVariant: "success",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  task_assigned: {
    icon: IconUserPlus,
    label: "Assigned",
    badgeVariant: "warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  status_changed: {
    icon: IconProgress,
    label: "Status",
    badgeVariant: "secondary",
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  comment_added: {
    icon: IconMessage,
    label: "Comment",
    badgeVariant: "default",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  changes_requested: {
    icon: IconPencil,
    label: "Changes",
    badgeVariant: "warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  comment_reply: {
    icon: IconMessageReply,
    label: "Reply",
    badgeVariant: "default",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  mention: {
    icon: IconAt,
    label: "Mention",
    badgeVariant: "default",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  run_completed: {
    icon: IconPlayerPlay,
    label: "Run Done",
    badgeVariant: "success",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  run_failed: {
    icon: IconExclamationCircle,
    label: "Run Failed",
    badgeVariant: "destructive",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  rate_limit: {
    icon: IconAlertTriangle,
    label: "Rate Limit",
    badgeVariant: "warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  system: {
    icon: IconInfoCircle,
    label: "System",
    badgeVariant: "outline",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
};

/**
 * Older failures were stored as `run_completed` with a "failed" title/message.
 * Map those to the danger appearance until they age out of inboxes.
 */
export function getNotificationAppearance(
  notification: Pick<Notification, "type" | "title" | "message">,
): NotificationAppearance {
  if (notification.type === "run_failed") {
    return typeConfig.run_failed;
  }
  if (notification.type === "run_completed") {
    const haystack =
      `${notification.title} ${notification.message ?? ""}`.toLowerCase();
    if (haystack.includes("failed")) {
      return typeConfig.run_failed;
    }
  }
  return typeConfig[notification.type];
}

export function NotificationIcon({
  notification,
  size = "sm",
}: {
  notification: Pick<Notification, "type" | "title" | "message">;
  size?: "sm" | "md";
}) {
  const config = getNotificationAppearance(notification);
  const Icon = config.icon;
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <Avatar className={`${dim} rounded-control flex-shrink-0`}>
      <AvatarFallback className={`rounded-control ${config.iconBg}`}>
        <Icon size={iconSize} className={config.iconColor} />
      </AvatarFallback>
    </Avatar>
  );
}
