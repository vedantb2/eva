"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useEditorTab } from "@/lib/components/sandbox/useEditorTab";
import { withBrowserTab } from "@/lib/components/sandbox/withBrowserTab";
import { FileViewerPanel } from "@/routes/_repo/$owner/$repo/sessions/FileViewerPanel";

interface TaskSandboxPanelProps {
  taskId: Id<"agentTasks">;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
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
  terminalPanes?: SharedTerminalPane[];
  prUrl?: string;
  activeTab: SandboxTab;
  onTabChange: (tab: SandboxTab) => void;
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
}

/**
 * Right-side sandbox panel for a quick task — mirrors the session sandbox
 * panel (Preview, Browser, Terminal, Diffs, Files, Editor/Computer via +).
 * PRD stays session-only.
 *
 * All shared multi-pane / preview / PTY logic lives in the `sandbox/` module
 * so this file is just a thin orchestrator.
 */
export function TaskSandboxPanel({
  taskId,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
  terminalPanes,
  prUrl,
  activeTab,
  onTabChange,
  onStartSandbox,
  isSandboxStarting,
}: TaskSandboxPanelProps) {
  const taskIdStr = String(taskId);

  const task = useQuery(api.agentTasks.get, { id: taskId });
  const setPreviewPath = useMutation(api.agentTasks.setPreviewPath);
  const setPreviewPort = useMutation(api.agentTasks.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.agentTasks.setTerminalHistoryTail,
  );

  // Stable identity: a fresh literal each render would re-run TerminalPanel's
  // connect effect, flashing the spinner and dropping the dev-server auto-start
  // (the reconnect sees an existing PTY, so isNewPty is false).
  const owner = useMemo(() => ({ kind: "task" as const, taskId }), [taskId]);

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    onPortPersist: (port) => {
      void setPreviewPort({ id: taskId, port });
    },
  });

  const panes = useSandboxPanes({
    owner,
    storageScope: `task:${taskIdStr}`,
    isActive,
    activeTab,
    setActiveTab: onTabChange,
    terminalPanes,
  });

  useEffect(() => {
    if (activeTab !== "prd") return;
    onTabChange("preview");
  }, [activeTab, onTabChange]);

  const tabBarValue = activeTab === "prd" ? "preview" : activeTab;

  // This surface has no custom tabs, so the tab bar only emits builtin ids.
  const handleTabChange = (tab: string) => {
    if (!isSessionSandboxTab(tab) || tab === "prd") return;
    onTabChange(tab);
  };

  const {
    computerTabOpen,
    computerRunning,
    setComputerRunning,
    openComputer,
    closeComputer,
  } = useComputerTab(`task:${taskIdStr}`, tabBarValue, handleTabChange);
  const { editorTabOpen, openEditor, closeEditor } = useEditorTab(
    `task:${taskIdStr}`,
    tabBarValue,
    handleTabChange,
  );

  const enabledTabs = withBrowserTab(panes.enabledTabs);

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={tabBarValue}
        onTabChange={handleTabChange}
        onNewPreview={panes.handleNewPreview}
        onNewTerminal={panes.handleNewTerminal}
        newPreviewDisabled={panes.newPreviewDisabled}
        newTerminalDisabled={panes.newTerminalDisabled}
        enabledTabs={enabledTabs}
        showFilesTab
        computerTabOpen={computerTabOpen}
        computerRunning={computerRunning}
        onOpenComputer={openComputer}
        onCloseComputer={closeComputer}
        editorTabOpen={editorTabOpen}
        onOpenEditor={openEditor}
        onCloseEditor={closeEditor}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div className={tabBarValue === "files" ? "h-full min-h-0" : "hidden"}>
          <FileViewerPanel
            sandboxId={sandboxId}
            repoId={repoId}
            isActive={isActive}
          />
        </div>
        <SandboxPaneSlots
          activeTab={tabBarValue}
          panes={panes}
          preview={preview}
          owner={owner}
          sandboxId={sandboxId}
          vercelSandboxId={vercelSandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={taskIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          stickyPreviewPath={task?.previewPath}
          onStickyPreviewPathChange={(path) => {
            void setPreviewPath({ id: taskId, path });
          }}
          stickyTerminalHistoryTail={
            task === undefined ? undefined : (task?.terminalHistoryTail ?? "")
          }
          onStickyTerminalHistoryTailChange={(tail) => {
            void setTerminalHistoryTail({ id: taskId, tail });
          }}
        />
      </div>
    </div>
  );
}
