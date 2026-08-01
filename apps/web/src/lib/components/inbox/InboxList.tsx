import { m, AnimatePresence } from "motion/react";
import { IconInbox } from "@tabler/icons-react";
import { Skeleton } from "@eva/ui";
import dayjs from "@eva/shared/dates";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { NotificationRow } from "@/lib/components/inbox/NotificationRow";
import type { Notification } from "@/lib/components/notifications/notification-config";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";
import type { InboxFilter } from "@/lib/search-params";

/**
 * Buckets notifications under Today / Yesterday / weekday / full date, keeping
 * the source order so the groups come out newest-first.
 */
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

interface InboxListProps {
  /** `undefined` while the query is in flight — renders skeletons, not empty. */
  notifications: Notification[] | undefined;
  /**
   * Resolves a row's repo. A lookup rather than the `Map` itself because `Map`
   * is invariant in both parameters, so the caller's `Map<Id<"githubRepos">,
   * Doc<"githubRepos">>` would not satisfy a `Map<string, RepoWithLogo>`.
   */
  repoFor: (notification: Notification) => RepoWithLogo | undefined;
  filter: InboxFilter;
  selectedId: string | null;
  onSelect: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
}

/** The inbox list pane: date-grouped rows with sticky group headers. */
export function InboxList({
  notifications,
  repoFor,
  filter,
  selectedId,
  onSelect,
  onMarkRead,
}: InboxListProps) {
  if (notifications === undefined) {
    return (
      <div
        className="flex flex-col gap-1.5 p-2"
        aria-busy="true"
        aria-label="Loading inbox"
      >
        <Skeleton className="mb-1 h-3 w-16" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-surface" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <EmptyState
          icon={<IconInbox className="size-6" />}
          title={
            filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"
          }
          description="You're all caught up"
          animate={filter !== "unread"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-2">
      <AnimatePresence initial={false}>
        {groupByDate(notifications).map((group) => (
          <m.section
            key={group.label}
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Above the rows' click overlay so scrolled rows pass underneath. */}
            <h2 className="sticky top-0 z-[3] bg-background/90 px-1 py-1.5 text-2xs font-medium uppercase tracking-wide text-subtle-foreground backdrop-blur">
              {group.label}
            </h2>
            {group.items.map((n) => (
              <m.div
                key={n._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <NotificationRow
                  notification={n}
                  repo={repoFor(n)}
                  selected={n._id === selectedId}
                  onSelect={() => onSelect(n)}
                  onMarkRead={() => onMarkRead(n)}
                />
              </m.div>
            ))}
          </m.section>
        ))}
      </AnimatePresence>
    </div>
  );
}
