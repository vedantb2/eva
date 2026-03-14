"use client";

import {
  IconWorld,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
} from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "@conductor/ui";

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
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as SandboxTab)}
      >
        <TabsList className="h-auto gap-0 rounded-none border-0 bg-transparent p-0 shadow-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative flex items-center gap-1.5 rounded-none rounded-t-md border border-b-0 px-4 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
