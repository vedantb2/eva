"use client";

import { Link } from "@tanstack/react-router";
import {
  IconKey,
  IconCamera,
  IconFolders,
  IconPalette,
  IconSettings2,
  IconReceipt2,
  IconShieldCheck,
  IconPlug,
  IconUserCog,
  IconTerminal2,
  IconAdjustmentsHorizontal,
  IconBox,
  IconClipboardCheck,
  IconUser,
  IconSparkles,
} from "@tabler/icons-react";
import { cn } from "@conductor/ui";

interface SettingsSidebarProps {
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
}

export function SettingsSidebar({
  basePath,
  pathname,
  onNavigate,
}: SettingsSidebarProps) {
  const baseUrl = `${basePath}/settings`;

  const navigationGroups = [
    {
      label: "GENERAL",
      groupIcon: IconAdjustmentsHorizontal,
      items: [
        { name: "Config", href: `${baseUrl}/config`, icon: IconSettings2 },
        { name: "Skills", href: `${baseUrl}/skills`, icon: IconSparkles },
        { name: "Monorepo", href: `${baseUrl}/monorepo`, icon: IconFolders },
      ],
    },
    {
      label: "SANDBOX",
      groupIcon: IconBox,
      items: [
        { name: "App", href: `${baseUrl}/app`, icon: IconTerminal2 },
        {
          name: "Env Variables",
          href: `${baseUrl}/env-variables/repo`,
          icon: IconKey,
        },
        { name: "Snapshots", href: `${baseUrl}/snapshots`, icon: IconCamera },
      ],
    },
    {
      label: "REVIEW",
      groupIcon: IconClipboardCheck,
      items: [
        { name: "Audits", href: `${baseUrl}/audits`, icon: IconShieldCheck },
        { name: "MCP Config", href: `${baseUrl}/mcp-config`, icon: IconPlug },
        { name: "Logs", href: `${baseUrl}/logs`, icon: IconReceipt2 },
      ],
    },
    {
      label: "PREFERENCES",
      groupIcon: IconUser,
      items: [
        { name: "Theme", href: `${baseUrl}/theme`, icon: IconPalette },
        {
          name: "Personalisation",
          href: `${baseUrl}/personalisation`,
          icon: IconUserCog,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <group.groupIcon size={12} />
            <span>{group.label}</span>
            <span
              aria-hidden
              className="ml-1 h-px flex-1 bg-sidebar-border/60"
            />
          </div>
          <div className="space-y-1 pl-2">
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon size={14} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
