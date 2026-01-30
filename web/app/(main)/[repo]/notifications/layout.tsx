"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Button } from "@heroui/button";
import { IconBell, IconChecks } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import dayjs from "@/lib/dates";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName } = useRepo();
  const pathname = usePathname();
  const notifications = useQuery(api.notifications.list);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const baseUrl = "/" + encodeRepoSlug(fullName) + "/notifications";
  const currentId = pathname.startsWith(baseUrl + "/")
    ? pathname.slice(baseUrl.length + 1)
    : null;

  const hasUnread = notifications?.some((n) => !n.read);

  const sidebar = (
    <div className="flex-1 overflow-y-auto scrollbar">
      {hasUnread && (
        <div className="px-3 py-6">
          <Button
            size="sm"
            variant="flat"
            startContent={<IconChecks size={14} />}
            onPress={() => markAllAsRead()}
            className="w-full"
          >
            Mark all as read
          </Button>
        </div>
      )}
      {!notifications ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-center">
          <IconBell className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500">No notifications</p>
        </div>
      ) : (
        <div className="pt-2 py-1">
          {notifications.map((n) => {
            const isSelected = currentId === n._id;
            return (
              <Link
                key={n._id}
                href={baseUrl + "/" + n._id}
                className={`block w-full text-left px-4 py-2.5 transition-all ${
                  isSelected
                    ? "bg-teal-100 dark:bg-teal-900/20"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  )}
                  <h3
                    className={`text-sm truncate flex-1 ${
                      isSelected
                        ? "text-teal-600 dark:text-teal-400 font-medium"
                        : n.read
                          ? "text-neutral-600 dark:text-neutral-400"
                          : "text-neutral-900 dark:text-white font-medium"
                    }`}
                  >
                    {n.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 ml-3.5">
                  {dayjs(n.createdAt).fromNow()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <SidebarLayoutWrapper title="Notifications" sidebar={sidebar}>
      {children}
    </SidebarLayoutWrapper>
  );
}
