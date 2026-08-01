import { Link } from "@tanstack/react-router";
import {
  IconLayoutDashboard,
  IconSparkles,
  IconStack2,
  IconUsers,
} from "@tabler/icons-react";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClassCompact,
} from "@/lib/components/sidebar/SharedLayoutNav";

/**
 * Home destinations. These used to be rail tiles; they live here so the
 * rail carries only Eva / Inbox / Sessions plus the repo tiles.
 */
const HOME_NAV = [
  { name: "Codebases", href: "/home", icon: IconStack2 },
  { name: "Teams", href: "/teams", icon: IconUsers },
  { name: "Artifacts", href: "/artifacts", icon: IconLayoutDashboard },
  { name: "Changelog", href: "/changelog", icon: IconSparkles },
];

interface HomeSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

/** Second sidebar column for the global home routes (see `HOME_ROOTS`). */
export function HomeSidebar({ pathname, onNavigate }: HomeSidebarProps) {
  return (
    <SharedLayoutNav layoutId="home-nav" className="space-y-1">
      {HOME_NAV.map((item) => {
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
