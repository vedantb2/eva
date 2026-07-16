"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  cn,
} from "@conductor/ui";
import {
  IconBell,
  IconPalette,
  IconServerBolt,
  IconSettings,
  IconUserCog,
} from "@tabler/icons-react";

const SETTINGS_ITEMS = [
  {
    name: "Theme",
    href: "/settings/theme",
    icon: IconPalette,
  },
  {
    name: "Personalisation",
    href: "/settings/personalisation",
    icon: IconUserCog,
  },
  {
    name: "Notifications",
    href: "/settings/notifications",
    icon: IconBell,
  },
  {
    name: "Sandboxes",
    href: "/settings/sandboxes",
    icon: IconServerBolt,
  },
] as const;

/**
 * Compact settings gear under the rail avatar. Opens global settings routes
 * (theme, personalisation, notifications, sandboxes) — user-level, not per-repo.
 */
export function RailSettingsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const isActive = SETTINGS_ITEMS.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          className={cn(
            "relative flex size-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
            isActive
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:opacity-100 hover:text-sidebar-foreground",
          )}
        >
          <IconSettings size={22} className="shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="right"
        sideOffset={8}
        className="w-48"
      >
        {SETTINGS_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link to={item.href} onClick={onNavigate}>
              <item.icon size={16} className="mr-2" />
              {item.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
