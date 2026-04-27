"use client";

import { useEffect, useCallback } from "react";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { useSandboxPanes } from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";

const TASK_ENABLED_TABS = ["preview", "terminal", "editor", "desktop"] as const;

interface TaskSandboxPanelProps {
  taskId: Id<"agentTasks">;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  /**
   * Resolved dev port for the current sandbox (taken from `agentTasks.devPort`,
   * which `taskSandboxReady` populates from `startSessionServices` — already
   * accounts for any per-app override on the repo).
   */
  devPort?: number;
  /**
   * Full dev command for the current sandbox. Wired into the first terminal
   * pane so it auto-starts the dev server with the resolved PORT.
   */
  devCommand?: string;
}

/**
 * Right-side sandbox panel for a quick task — mirrors the session sandbox
 * panel. Exposes Preview, Terminal, Editor, and Desktop tabs (PRD is omitted
 * since it's a session-only concept).
 *
 * All shared multi-pane / preview / PTY logic lives in the `sandbox/` module
 * so this file is just a thin orchestrator.
 */
export function TaskSandboxPanel({
  taskId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
}: TaskSandboxPanelProps) {
  const taskIdStr = String(taskId);
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    cacheScope: `task-preview:${taskIdStr}`,
  });

  const panes = useSandboxPanes({
    owner: { kind: "task", taskId },
    storageScope: `task:${taskIdStr}`,
    isActive,
    activeTab,
    setActiveTab,
  });

  // PRD is session-only; bounce back to preview if a stale URL points there.
  useEffect(() => {
    if (activeTab !== "prd") return;
    void setActiveTab("preview");
  }, [activeTab, setActiveTab]);

  const tabBarValue = activeTab === "prd" ? "preview" : activeTab;

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
      if (tab === "prd") return;
      void setActiveTab(tab);
    },
    [setActiveTab],
  );

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={tabBarValue}
        onTabChange={handleTabChange}
        onNewPreview={panes.handleNewPreview}
        onNewTerminal={panes.handleNewTerminal}
        newPreviewDisabled={panes.newPreviewDisabled}
        newTerminalDisabled={panes.newTerminalDisabled}
        enabledTabs={TASK_ENABLED_TABS}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <SandboxPaneSlots
          activeTab={tabBarValue}
          panes={panes}
          preview={preview}
          owner={{ kind: "task", taskId }}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={taskIdStr}
          devCommand={devCommand}
        />
      </div>
    </div>
  );
}
