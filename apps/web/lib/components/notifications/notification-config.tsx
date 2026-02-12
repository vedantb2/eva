"use client";

import {
  IconBell,
  IconRepeat,
  IconFileExport,
  IconCheck,
  IconInfoCircle,
  IconUserPlus,
  IconMessage,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@conductor/ui";
import type { BadgeProps } from "@conductor/ui";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

export type Notification = FunctionReturnType<
  typeof api.notifications.list
>[number];

export const typeConfig: Record<
  Notification["type"],
  {
    icon: typeof IconBell;
    label: string;
    badgeVariant: BadgeProps["variant"];
    iconBg: string;
    iconColor: string;
  }
> = {
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
  comment_added: {
    icon: IconMessage,
    label: "Comment",
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
  system: {
    icon: IconInfoCircle,
    label: "System",
    badgeVariant: "outline",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
};

export function NotificationIcon({
  type,
  size = "sm",
}: {
  type: Notification["type"];
  size?: "sm" | "md";
}) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <Avatar className={`${dim} rounded-lg flex-shrink-0`}>
      <AvatarFallback className={`rounded-lg ${config.iconBg}`}>
        <Icon size={iconSize} className={config.iconColor} />
      </AvatarFallback>
    </Avatar>
  );
}
