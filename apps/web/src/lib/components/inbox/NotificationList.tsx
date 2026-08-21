"use client";

import { m, AnimatePresence } from "motion/react";
import { motionFast, motionStagger } from "@eva/ui";
import dayjs from "@eva/shared/dates";
import { type Notification } from "@/lib/components/notifications/notification-config";
import { NotificationRow } from "@/lib/components/inbox/NotificationRow";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";
import type { Id } from "@eva/backend";

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const map = new Map<string, Notification[]>();

  for (const n of notifications) {
    const d = dayjs(n.createdAt);
    const now = dayjs();
    let label: string;
    if (d.isSame(now, "day")) label = "Today";
    else if (d.isSame(now.subtract(1, "day"), "day")) label = "Yesterday";
    else if (d.isSame(now, "week")) label = d.format("dddd");
    else label = d.format("MMMM D, YYYY");

    let items = map.get(label);
    if (!items) {
      items = [];
      map.set(label, items);
      groups.push({ label, items });
    }
    items.push(n);
  }
  return groups;
}

interface NotificationListProps {
  notifications: Notification[];
  repoById: Map<Id<"githubRepos">, RepoWithLogo>;
  selectedId: string | null;
  onSelect: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
}

/**
 * The left column of the two-pane inbox: notifications grouped by day with
 * sticky date headers, scrolling as one list. Selection is owned by the
 * parent so the detail pane and keyboard stepping share it.
 */
export function NotificationList({
  notifications,
  repoById,
  selectedId,
  onSelect,
  onMarkRead,
}: NotificationListProps) {
  const groups = groupByDate(notifications);

  return (
    <AnimatePresence initial={false}>
      {groups.map((group) => (
        <m.div
          key={group.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionFast}
        >
          {/* Sticky so the day label stays readable while its rows scroll by. */}
          <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {group.label}
            </span>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((n, index) => (
              <m.div
                key={n._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  ...motionFast,
                  delay: motionStagger(index, 0.02, 0.1),
                }}
              >
                <NotificationRow
                  notification={n}
                  repo={n.repoId ? repoById.get(n.repoId) : undefined}
                  selected={n._id === selectedId}
                  onSelect={() => onSelect(n)}
                  onMarkRead={() => onMarkRead(n)}
                />
              </m.div>
            ))}
          </div>
        </m.div>
      ))}
    </AnimatePresence>
  );
}
