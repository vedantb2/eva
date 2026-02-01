"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { Badge, Chip, type ChipProps, Divider, Spinner, useDisclosure } from "@heroui/react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
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

type Notification = FunctionReturnType<typeof api.notifications.list>[number];

const typeConfig: Record<
  Notification["type"],
  { icon: typeof IconBell; label: string; chipColor: ChipProps["color"] }
> = {
  routine_complete: {
    icon: IconRepeat,
    label: "Routine",
    chipColor: "secondary",
  },
  export_ready: { icon: IconFileExport, label: "Export", chipColor: "primary" },
  task_complete: { icon: IconCheck, label: "Task Done", chipColor: "success" },
  task_assigned: {
    icon: IconUserPlus,
    label: "Assigned",
    chipColor: "warning",
  },
  comment_added: { icon: IconMessage, label: "Comment", chipColor: "primary" },
  run_completed: {
    icon: IconPlayerPlay,
    label: "Run Done",
    chipColor: "success",
  },
  system: { icon: IconInfoCircle, label: "System", chipColor: "default" },
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

  const trigger = (
    <Button variant="light" isIconOnly onPress={popover.onOpen}>
      {unreadCount > 0 ? (
        <Badge color="primary" content={unreadCount > 99 ? "99+" : unreadCount}>
          <IconBell className="size-5" />
        </Badge>
      ) : (
        <IconBell className="size-5" />
      )}
    </Button>
  );

  return (
    <>
      <Popover isOpen={popover.isOpen} onOpenChange={popover.onOpenChange} placement="right-end" offset={12}>
        <PopoverTrigger>{trigger}</PopoverTrigger>
        <PopoverContent className="p-0">
          <div className="flex items-center justify-start px-3 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                startContent={<IconChecks size={14} />}
                onPress={() => markAllAsRead()}
              >
                Mark all read
              </Button>
            )}
          </div>
          <Divider />
          <div className="max-h-[360px] overflow-y-auto scrollbar">
            {!notifications ? (
              <div className="flex justify-center py-10">
                <Spinner size="sm" color="primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <IconBellOff
                  size={24}
                  className="mx-auto text-default-300 mb-2"
                />
                <p className="text-sm text-default-400">All caught up</p>
              </div>
            ) : (
              <Listbox
                aria-label="Notifications"
                onAction={(key) => {
                  const n = notifications.find((n) => n._id === key);
                  if (n) setSelectedId(n._id);
                }}
              >
                {notifications.map((n) => {
                  const config = typeConfig[n.type];
                  const Icon = config.icon;
                  return (
                    <ListboxItem
                      key={n._id}
                      startContent={
                        <Icon size={16} className="text-default-500" />
                      }
                      endContent={
                        !n.read ? (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        ) : null
                      }
                      description={dayjs(n.createdAt).fromNow()}
                      className={n.read ? "opacity-60" : ""}
                      onPress={popover.onClose}
                    >
                      {n.title}
                    </ListboxItem>
                  );
                })}
              </Listbox>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Modal isOpen={!!selected} onClose={() => setSelectedId(null)}>
        <ModalContent>
          {selected &&
            (() => {
              const config = typeConfig[selected.type];
              const Icon = config.icon;
              return (
                <>
                  <ModalHeader className="flex items-center gap-3">
                    <Icon size={20} className="text-default-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold">
                        {selected.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" variant="flat" color={config.chipColor}>
                          {config.label}
                        </Chip>
                        <span className="text-xs text-default-400">
                          {dayjs(selected.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody className="pb-6">
                    <p className="text-sm text-default-500">
                      {selected.message || "No additional details."}
                    </p>
                  </ModalBody>
                </>
              );
            })()}
        </ModalContent>
      </Modal>
    </>
  );
}
