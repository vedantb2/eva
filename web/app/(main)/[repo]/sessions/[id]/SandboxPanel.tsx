"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { IconTerminal2, IconWorld } from "@tabler/icons-react";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";

interface SandboxPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
}: SandboxPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("terminal");

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-50 dark:border-neutral-800">
      <div className="p-3">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          classNames={{
            tabList: "gap-2",
          }}
        >
          <Tab
            key="preview"
            title={
              <div className="flex items-center gap-1.5">
                <IconWorld className="w-4 h-4" />
                <span>Preview</span>
              </div>
            }
          />
          <Tab
            key="terminal"
            title={
              <div className="flex items-center gap-1.5">
                <IconTerminal2 className="w-4 h-4" />
                <span>Terminal</span>
              </div>
            }
          />
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className={activeTab === "preview" ? "h-full" : "hidden"}>
          <WebPreviewPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
          />
        </div>
        <div className={activeTab === "terminal" ? "h-full" : "hidden"}>
          <TerminalPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
          />
        </div>
      </div>
    </div>
  );
}
