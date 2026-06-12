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
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";

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
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { pathname } = useLocation();

  const navItems = import.meta.env.DEV
    ? ROOT_NAV_ITEMS
    : ROOT_NAV_ITEMS.filter((item) => !("devOnly" in item && item.devOnly));

  return (
    <SharedLayoutNav layoutId="global-nav" className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/home"
            ? pathname === "/home" || pathname.startsWith("/setup")
            : pathname.startsWith(item.href);

        const linkElement = (
          <SharedLayoutNavSurface
            key={item.name}
            itemId={item.name}
            isActive={isActive}
          >
            <Link
              to={item.href}
              onClick={onNavigate}
              className={sidebarNavLinkClass(isActive, collapsed)}
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
          </SharedLayoutNavSurface>
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
    </SharedLayoutNav>
  );
}
