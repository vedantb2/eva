import {
  IconWorld,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
  IconPlus,
} from "@tabler/icons-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";

type SandboxTab = "preview" | "desktop" | "editor" | "terminal";

const SANDBOX_TABS: Set<string> = new Set([
  "preview",
  "desktop",
  "editor",
  "terminal",
]);

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
  onNewTerminal: () => void;
  newTerminalDisabled?: boolean;
}

function isSandboxTab(value: string): value is SandboxTab {
  return SANDBOX_TABS.has(value);
}

export function SandboxTabBar({
  activeTab,
  onTabChange,
  onNewTerminal,
  newTerminalDisabled = false,
}: SandboxTabBarProps) {
  return (
    <div className="relative flex items-end gap-1 px-2 pt-1.5 bg-secondary/50">
      <Tabs
        className="min-w-0 flex-1"
        value={activeTab}
        onValueChange={(v) => {
          if (isSandboxTab(v)) {
            onTabChange(v);
          }
        }}
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={newTerminalDisabled}
            className="mb-px flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[transform,background-color] hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Open tab menu"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuItem
            onClick={onNewTerminal}
            disabled={newTerminalDisabled}
          >
            New Terminal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
