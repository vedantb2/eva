"use client";

import {
  IconWorld,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
} from "@tabler/icons-react";
import { cn } from "@conductor/ui";

type SandboxTab = "preview" | "desktop" | "editor" | "terminal";

const tabs: Array<{
  value: SandboxTab;
  label: string;
  icon: typeof IconWorld;
}> = [
  { value: "preview", label: "Preview", icon: IconWorld },
  { value: "desktop", label: "Computer", icon: IconDeviceDesktop },
  { value: "editor", label: "Editor", icon: IconCode },
  { value: "terminal", label: "Terminal", icon: IconTerminal2 },
];

interface SandboxTabBarProps {
  activeTab: SandboxTab;
  onTabChange: (tab: SandboxTab) => void;
}

export function SandboxTabBar({ activeTab, onTabChange }: SandboxTabBarProps) {
  return (
    <div className="relative flex items-end px-2 pt-1.5 bg-secondary/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors rounded-t-md border border-b-0",
              isActive
                ? "bg-card text-foreground border-border z-10"
                : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
