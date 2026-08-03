import dayjs from "@eva/shared/dates";
import { type Notification } from "@/lib/components/notifications/notification-config";

export interface InboxGroup {
  label: string;
  items: Notification[];
}

/**
 * Buckets notifications under a date heading, newest bucket first — the list
 * arrives already sorted, so insertion order is the display order and no
 * second sort is needed.
 */
export function groupNotificationsByDate(
  notifications: Notification[],
): InboxGroup[] {
  const groups: InboxGroup[] = [];
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
