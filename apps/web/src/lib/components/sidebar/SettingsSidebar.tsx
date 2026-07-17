"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  IconKey,
  IconCamera,
  IconFolders,
  IconSettings2,
  IconReceipt2,
  IconShieldCheck,
  IconPlug,
  IconTerminal2,
  IconSparkles,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { CollapsibleSidebarSection } from "@/lib/components/sidebar/CollapsibleSidebarSection";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClassCompact,
} from "@/lib/components/sidebar/SharedLayoutNav";

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    GENERAL: true,
    SANDBOX: true,
    REVIEW: true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? true),
    }));
  };

  const navigationGroups = [
    {
      label: "GENERAL",
      items: [
        { name: "Repository", href: `${baseUrl}/config`, icon: IconSettings2 },
        { name: "Skills", href: `${baseUrl}/skills`, icon: IconSparkles },
        { name: "Monorepo", href: `${baseUrl}/monorepo`, icon: IconFolders },
      ],
    },
    {
      label: "SANDBOX",
      items: [
        { name: "App", href: `${baseUrl}/app`, icon: IconTerminal2 },
        { name: "Tabs", href: `${baseUrl}/tabs`, icon: IconLayoutGrid },
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
      items: [
        { name: "Audits", href: `${baseUrl}/audits`, icon: IconShieldCheck },
        { name: "MCP Config", href: `${baseUrl}/mcp-config`, icon: IconPlug },
        { name: "Logs", href: `${baseUrl}/logs`, icon: IconReceipt2 },
      ],
    },
  ];

  return (
    <SharedLayoutNav layoutId="settings-nav" className="space-y-4">
      {navigationGroups.map((group) => (
        <CollapsibleSidebarSection
          key={group.label}
          label={group.label}
          open={openSections[group.label] ?? true}
          onToggle={() => toggleSection(group.label)}
        >
          {group.items.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
        </CollapsibleSidebarSection>
      ))}
    </SharedLayoutNav>
  );
}
