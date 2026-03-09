"use client";

import Link from "next/link";
import {
  IconKey,
  IconCamera,
  IconFolders,
  IconPalette,
  IconSettings2,
  IconReceipt2,
  IconShieldCheck,
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

  const navigation = [
    { name: "Config", href: `${baseUrl}/config`, icon: IconSettings2 },
    { name: "Audits", href: `${baseUrl}/audits`, icon: IconShieldCheck },
    { name: "Env Variables", href: `${baseUrl}/env-variables`, icon: IconKey },
    { name: "Snapshots", href: `${baseUrl}/snapshots`, icon: IconCamera },
    { name: "Monorepo", href: `${baseUrl}/monorepo`, icon: IconFolders },
    { name: "Theme", href: `${baseUrl}/theme`, icon: IconPalette },
    { name: "Logs", href: `${baseUrl}/logs`, icon: IconReceipt2 },
  ];

  return (
    <div className="space-y-1 px-1">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
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
  );
}
