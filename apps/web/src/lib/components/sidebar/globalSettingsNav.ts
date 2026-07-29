import {
  IconBell,
  IconCode,
  IconGitBranch,
  IconKey,
  IconPalette,
  IconServerBolt,
  IconUserCog,
} from "@tabler/icons-react";

/** Shared nav for the rail settings menu and the global Settings sidebar. */
export const GLOBAL_SETTINGS_NAV = [
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
    name: "Accounts",
    href: "/settings/accounts",
    icon: IconKey,
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
  {
    name: "Sync",
    href: "/settings/sync",
    icon: IconGitBranch,
  },
] as const;

/** Dev-only entry shown under Settings. */
export const GLOBAL_SETTINGS_TESTING = {
  name: "Testing",
  href: "/testing",
  icon: IconCode,
} as const;
