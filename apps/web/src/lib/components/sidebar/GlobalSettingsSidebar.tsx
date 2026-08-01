import { Link } from "@tanstack/react-router";
import {
  GLOBAL_SETTINGS_NAV,
  GLOBAL_SETTINGS_TESTING,
} from "@/lib/components/sidebar/globalSettingsNav";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClassCompact,
} from "@/lib/components/sidebar/SharedLayoutNav";

interface GlobalSettingsSidebarProps {
  pathname: string;
  onNavigate?: () => void;
}

/** Second sidebar column for root `/settings/*` (and `/testing` in DEV). */
export function GlobalSettingsSidebar({
  pathname,
  onNavigate,
}: GlobalSettingsSidebarProps) {
  const showTesting = import.meta.env.DEV;
  const items = showTesting
    ? [...GLOBAL_SETTINGS_NAV, GLOBAL_SETTINGS_TESTING]
    : [...GLOBAL_SETTINGS_NAV];

  return (
    <SharedLayoutNav layoutId="global-settings-nav" className="space-y-1">
      {items.map((item) => {
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
