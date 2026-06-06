"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  IconBell,
  IconHome,
  IconInbox,
  IconPalette,
  IconServerBolt,
  IconTestPipe,
  IconUsers,
} from "@tabler/icons-react";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@conductor/ui";
import { UnreadInboxBadge } from "@/lib/components/sidebar/UnreadInboxBadge";

const ROOT_NAV_ITEMS = [
  { name: "Home", href: "/home", icon: IconHome },
  { name: "Teams", href: "/teams", icon: IconUsers },
  { name: "Inbox", href: "/inbox", icon: IconInbox },
  { name: "Theme", href: "/settings/theme", icon: IconPalette },
  { name: "Notifications", href: "/settings/notifications", icon: IconBell },
  { name: "Sandboxes", href: "/settings/sandboxes", icon: IconServerBolt },
  {
    name: "Testing",
    href: "/testing",
    icon: IconTestPipe,
    devOnly: true,
  },
] as const;

export function RootSidebarContent({
  collapsed,
  navItemClass,
  onNavigate,
}: {
  collapsed: boolean;
  navItemClass: (isActive: boolean) => string;
  onNavigate: () => void;
}) {
  const { pathname } = useLocation();

  const navItems = import.meta.env.DEV
    ? ROOT_NAV_ITEMS
    : ROOT_NAV_ITEMS.filter((item) => !("devOnly" in item && item.devOnly));

  return (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/home"
            ? pathname === "/home" || pathname.startsWith("/setup")
            : pathname.startsWith(item.href);

        const linkElement = (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={navItemClass(isActive)}
          >
            <item.icon
              size={16}
              className={cn(
                "shrink-0",
                isActive ? "text-sidebar-primary" : "text-muted-foreground",
              )}
            />
            {!collapsed && <span className="truncate">{item.name}</span>}
            {!collapsed && item.name === "Inbox" && <UnreadInboxBadge />}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          );
        }

        return linkElement;
      })}
    </div>
  );
}
