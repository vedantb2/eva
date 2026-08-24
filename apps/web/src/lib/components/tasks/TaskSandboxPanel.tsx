"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@eva/backend";
import type { Id, SandboxOwner } from "@eva/backend";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { type SandboxPanesApi } from "@/lib/components/sandbox/useSandboxPanes";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useEditorTab } from "@/lib/components/sandbox/useEditorTab";
import { useSandboxFileList } from "@/lib/components/sandbox/useSandboxFileList";
import { withBrowserTab } from "@/lib/components/sandbox/withBrowserTab";
import { FilesPanel } from "@/routes/_repo/$owner/$repo/sessions/FilesPanel";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

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
  owner: SandboxOwner;
  panes: SandboxPanesApi;
  terminalPanel: TerminalPanelApi;
  prUrl?: string;
  activeTab: SandboxTab;
  onTabChange: (tab: SandboxTab) => void;
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
}

/**
 * Right-side sandbox panel for a quick task — mirrors the session sandbox
 * panel (Preview, Browser, Diffs, Files, Editor/Computer via +).
 * PRD stays session-only.
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
  owner,
  panes,
  terminalPanel,
  prUrl,
  activeTab,
  onTabChange,
  onStartSandbox,
  isSandboxStarting,
}: TaskSandboxPanelProps) {
  const simpleView = useSimpleView();
  const taskIdStr = String(taskId);

  const viewState = useQuery(api.sandboxPanes.getViewState, { owner });
  const setPreviewPath = useMutation(api.sandboxPanes.setPreviewPath);
  const setPreviewPort = useMutation(api.sandboxPanes.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.sandboxPanes.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(api.sandboxPanes.releaseBrowserLock);

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    onPortPersist: (port) => {
      void setPreviewPort({ owner, port });
    },
  });

  const fileList = useSandboxFileList({ sandboxId, repoId, isActive });

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
        onNewPreview={() => {
          panes.handleNewPreview();
          onTabChange("preview");
        }}
        newPreviewDisabled={panes.newPreviewDisabled}
        enabledTabs={enabledTabs}
        showFilesTab
        agentBrowsingAt={viewState?.agentBrowsingAt}
        computerTabOpen={computerTabOpen}
        computerRunning={computerRunning}
        onOpenComputer={openComputer}
        onCloseComputer={closeComputer}
        editorTabOpen={editorTabOpen}
        onOpenEditor={openEditor}
        onCloseEditor={closeEditor}
        fileList={fileList}
        consoleDock={panes.consoleDock}
        terminalPanel={terminalPanel}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div className={!simpleView && tabBarValue === "files" ? "h-full min-h-0" : "hidden"}>
          <FilesPanel
            sandboxId={sandboxId}
            repoId={repoId}
            isActive={isActive}
            fileList={fileList}
          />
        </div>
        <SandboxPaneSlots
          activeTab={tabBarValue}
          panes={panes}
          preview={preview}
          owner={owner}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={taskIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          agentBrowsingAt={viewState?.agentBrowsingAt}
          onReleaseBrowserLock={() => void releaseBrowserLock({ owner })}
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          stickyPreviewPath={viewState?.previewPath}
          onStickyPreviewPathChange={(path) => {
            void setPreviewPath({ owner, path });
          }}
          stickyTerminalHistoryTail={
            viewState === undefined
              ? undefined
              : (viewState?.terminalHistoryTail ?? "")
          }
          onStickyTerminalHistoryTailChange={(tail) => {
            void setTerminalHistoryTail({ owner, tail });
          }}
        />
      </div>
    </div>
  );
}
