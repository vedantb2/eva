"use client";

import { Link } from "@tanstack/react-router";
import {
  IconLayoutDashboard,
  IconStack2,
  IconUsers,
} from "@tabler/icons-react";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClassCompact,
} from "@/lib/components/sidebar/SharedLayoutNav";

/**
 * Workspace destinations. These used to be rail tiles; they live here so the
 * rail carries only Eva / Inbox / Sessions plus the repo tiles.
 */
const WORKSPACE_NAV = [
  { name: "Codebases", href: "/home", icon: IconStack2 },
  { name: "Teams", href: "/teams", icon: IconUsers },
  { name: "Artifacts", href: "/artifacts", icon: IconLayoutDashboard },
];

interface HomeSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

/** Second sidebar column for the global workspace routes (/home, /teams, /artifacts). */
export function HomeSidebar({ pathname, onNavigate }: HomeSidebarProps) {
  return (
    <SharedLayoutNav layoutId="workspace-nav" className="space-y-1">
      {WORKSPACE_NAV.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SharedLayoutNavSurface
            key={item.name}
            itemId={item.name}
            isActive={isActive}
          >
            <Link
              to={item.href}
              onClick={onNavigate}
              className={sidebarNavLinkClassCompact(isActive)}
            >
              <item.icon size={14} />
              <span>{item.name}</span>
            </Link>
          </SharedLayoutNavSurface>
        );
      })}
    </SharedLayoutNav>
  );
}
