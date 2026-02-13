"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Avatar,
  AvatarFallback,
} from "@conductor/ui";
import { IconBell, IconChecks, IconBellOff } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import type { Id } from "@conductor/backend";
import Link from "next/link";
import {
  typeConfig,
  NotificationIcon,
  type Notification,
} from "@/lib/components/notifications/notification-config";

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
          className="p-0 w-80"
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
          <div className="max-h-[360px] overflow-y-auto scrollbar">
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
                {notifications.map((n) => (
                  <button
                    key={n._id}
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setSelectedId(n._id);
                      popover.onClose();
                    }}
                    className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${n.read ? "opacity-50" : ""}`}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="flex-1 min-w-0 mt-0.5">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={typeConfig[n.type].badgeVariant}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {typeConfig[n.type].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(n.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
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
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <NotificationIcon type={selected.type} size="md" />
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
