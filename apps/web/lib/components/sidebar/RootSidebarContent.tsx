"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  IconHome,
  IconInbox,
  IconPalette,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@conductor/ui";

const ROOT_NAV_ITEMS = [
  { name: "Home", href: "/home", icon: IconHome },
  { name: "Teams", href: "/teams", icon: IconUsers },
  { name: "Inbox", href: "/inbox", icon: IconInbox },
  { name: "Theme", href: "/settings/theme", icon: IconPalette },
];

export function RootSidebarContent({
  collapsed,
  navItemClass,
  onNavigate,
}: {
  collapsed: boolean;
  navItemClass: (isActive: boolean) => string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="space-y-1">
      {ROOT_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/home"
            ? pathname === "/home" || pathname.startsWith("/setup")
            : pathname.startsWith(item.href);

        return (
          <div
            key={item.name}
            onClick={() => {
              router.push(item.href);
              onNavigate();
            }}
            title={collapsed ? item.name : undefined}
            className={cn(navItemClass(isActive), "cursor-pointer")}
          >
            <item.icon
              size={16}
              className={cn(
                "shrink-0",
                isActive ? "text-sidebar-primary" : "text-muted-foreground",
              )}
            />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </div>
        );
      })}
    </div>
  );
}
