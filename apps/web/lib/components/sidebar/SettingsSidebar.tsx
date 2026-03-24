"use client";

import { useRouter } from "next/navigation";
import {
  IconKey,
  IconCamera,
  IconFolders,
  IconPalette,
  IconSettings2,
  IconReceipt2,
  IconShieldCheck,
  IconPlug,
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
  const router = useRouter();
  const baseUrl = `${basePath}/settings`;

  const navigation = [
    { name: "Config", href: `${baseUrl}/config`, icon: IconSettings2 },
    { name: "Audits", href: `${baseUrl}/audits`, icon: IconShieldCheck },
    { name: "Env Variables", href: `${baseUrl}/env-variables`, icon: IconKey },
    { name: "Snapshots", href: `${baseUrl}/snapshots`, icon: IconCamera },
    { name: "Monorepo", href: `${baseUrl}/monorepo`, icon: IconFolders },
    { name: "Theme", href: `${baseUrl}/theme`, icon: IconPalette },
    { name: "MCP Config", href: `${baseUrl}/mcp-config`, icon: IconPlug },
    { name: "Logs", href: `${baseUrl}/logs`, icon: IconReceipt2 },
  ];

  return (
    <div className="space-y-1 px-1">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <div
            key={item.name}
            onClick={() => {
              router.push(item.href);
              onNavigate?.();
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
              isActive
                ? "bg-sidebar-accent font-medium text-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
            )}
          >
            <item.icon size={14} />
            <span>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}
