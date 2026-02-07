"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Separator,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from "@conductor/ui";
import {
  IconBell,
  IconChecks,
  IconRepeat,
  IconFileExport,
  IconCheck,
  IconInfoCircle,
  IconUserPlus,
  IconMessage,
  IconPlayerPlay,
  IconBellOff,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import { GenericId as Id } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import type { BadgeProps } from "@conductor/ui";

type Notification = FunctionReturnType<typeof api.notifications.list>[number];

const typeConfig: Record<
  Notification["type"],
  { icon: typeof IconBell; label: string; badgeVariant: BadgeProps["variant"] }
> = {
  routine_complete: {
    icon: IconRepeat,
    label: "Routine",
    badgeVariant: "secondary",
  },
  export_ready: {
    icon: IconFileExport,
    label: "Export",
    badgeVariant: "default",
  },
  task_complete: {
    icon: IconCheck,
    label: "Task Done",
    badgeVariant: "success",
  },
  task_assigned: {
    icon: IconUserPlus,
    label: "Assigned",
    badgeVariant: "warning",
  },
  comment_added: {
    icon: IconMessage,
    label: "Comment",
    badgeVariant: "default",
  },
  run_completed: {
    icon: IconPlayerPlay,
    label: "Run Done",
    badgeVariant: "success",
  },
  system: { icon: IconInfoCircle, label: "System", badgeVariant: "outline" },
};

export function NotificationsPopoverClient() {
  const popover = useDisclosure();
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.countUnread) ?? 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [selectedId, setSelectedId] = useState<Id<"notifications"> | null>(
    null,
  );
  const selected = notifications?.find((n) => n._id === selectedId) ?? null;

  useEffect(() => {
    if (selected && !selected.read) {
      markAsRead({ id: selected._id });
    }
  }, [selected, markAsRead]);

  return (
    <>
      <Popover open={popover.isOpen} onOpenChange={popover.onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" onClick={popover.onOpen}>
            {unreadCount > 0 ? (
              <div className="relative">
                <IconBell className="size-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
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
          className="p-0 w-80"
        >
          <div className="flex items-center justify-start px-3 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllAsRead()}
                className="ml-auto"
              >
                <IconChecks size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <Separator />
          <div className="max-h-[360px] overflow-y-auto scrollbar">
            {!notifications ? (
              <div className="flex justify-center py-10">
                <Spinner size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <IconBellOff
                  size={24}
                  className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2"
                />
                <p className="text-sm text-muted-foreground">All caught up</p>
              </div>
            ) : (
              <div role="listbox">
                {notifications.map((n) => {
                  const config = typeConfig[n.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={n._id}
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setSelectedId(n._id);
                        popover.onClose();
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted transition-colors ${n.read ? "opacity-60" : ""}`}
                    >
                      <Icon
                        size={16}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(n.createdAt).fromNow()}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelectedId(null);
        }}
      >
        <DialogContent>
          {selected &&
            (() => {
              const config = typeConfig[selected.type];
              const Icon = config.icon;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <DialogTitle className="text-base font-semibold">
                          {selected.title}
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={config.badgeVariant}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {dayjs(selected.createdAt).fromNow()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground pb-2">
                    {selected.message || "No additional details."}
                  </p>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
