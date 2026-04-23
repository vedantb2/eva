"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  IconHome,
  IconInbox,
  IconPalette,
  IconUsers,
} from "@tabler/icons-react";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@conductor/ui";
import { UnreadInboxBadge } from "@/lib/components/sidebar/UnreadInboxBadge";

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
  const { pathname } = useLocation();

  return (
    <div className="space-y-1">
      {ROOT_NAV_ITEMS.map((item) => {
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
