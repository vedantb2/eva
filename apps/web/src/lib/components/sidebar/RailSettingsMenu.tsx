"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { IconSettings } from "@tabler/icons-react";
import { GLOBAL_SETTINGS_NAV } from "@/lib/components/sidebar/globalSettingsNav";
import { isGlobalSettingsPath } from "@/lib/components/sidebar/homePaths";
import {
  RAIL_TILE_CLASS,
  railTileActive,
} from "@/lib/components/sidebar/_utils/railTile";

/** First entry in the global Settings sidebar — rail gear lands here. */
const SETTINGS_LANDING_HREF = GLOBAL_SETTINGS_NAV[0].href;

/**
 * Compact settings gear under the rail avatar. Opens the global Settings panel
 * on the first nav route (Theme) — user-level, not per-repo.
 */
export function RailSettingsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const showTesting = import.meta.env.DEV;
  const isActive =
    isGlobalSettingsPath(pathname) ||
    (showTesting &&
      (pathname === "/testing" || pathname.startsWith("/testing/")));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={SETTINGS_LANDING_HREF}
          onClick={onNavigate}
          title="Settings"
          aria-label="Settings"
          className={cn(RAIL_TILE_CLASS, railTileActive(isActive))}
        >
          <IconSettings size={22} className="shrink-0" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">Settings</TooltipContent>
    </Tooltip>
  );
}
