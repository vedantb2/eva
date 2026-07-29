"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  cn,
} from "@eva/ui";
import { IconSettings } from "@tabler/icons-react";
import {
  GLOBAL_SETTINGS_NAV,
  GLOBAL_SETTINGS_TESTING,
} from "@/lib/components/sidebar/globalSettingsNav";
import { isGlobalSettingsPath } from "@/lib/components/sidebar/homePaths";

/**
 * Compact settings gear under the rail avatar. Opens global settings routes
 * (theme, personalisation, notifications, sandboxes, sync) — user-level, not
 * per-repo. Testing is included in DEV only.
 */
export function RailSettingsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const showTesting = import.meta.env.DEV;
  const isActive =
    isGlobalSettingsPath(pathname) ||
    (showTesting &&
      (pathname === "/testing" || pathname.startsWith("/testing/")));

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
        {GLOBAL_SETTINGS_NAV.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link to={item.href} onClick={onNavigate}>
              <item.icon size={16} className="mr-2" />
              {item.name}
            </Link>
          </DropdownMenuItem>
        ))}
        {showTesting ? (
          <DropdownMenuItem asChild>
            <Link to={GLOBAL_SETTINGS_TESTING.href} onClick={onNavigate}>
              <GLOBAL_SETTINGS_TESTING.icon size={16} className="mr-2" />
              {GLOBAL_SETTINGS_TESTING.name}
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
