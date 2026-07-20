"use client";

import { useCallback, useMemo } from "react";
import type { Id } from "@conductor/backend";
import {
  isSessionSandboxTab,
  type SandboxTab,
  type TaskRouteSandboxTab,
} from "@/lib/search-params";
import { useNavigate } from "@tanstack/react-router";
import { entityPathSegment } from "@/lib/numId";
import { useRepo } from "@/lib/contexts/RepoContext";
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

interface ProjectSandboxPanelProps {
  projectId: Id<"projects">;
  projectNumId?: number;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  prUrl?: string;
  devPort?: number;
  devCommand?: string;
  terminalPanes?: SharedTerminalPane[];
  sandboxTab: TaskRouteSandboxTab;
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
}

export function ProjectSandboxPanel({
  projectId,
  projectNumId,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
  prUrl,
  devPort,
  devCommand,
  terminalPanes,
  sandboxTab,
  onStartSandbox,
  isSandboxStarting,
}: ProjectSandboxPanelProps) {
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const projectPathSegment = entityPathSegment({ numId: projectNumId });
  const projectIdStr = String(projectId);

  const activeTab: SandboxTab = sandboxTab;

  // Stable identity: a fresh literal each render would re-run TerminalPanel's
  // connect effect, flashing the spinner and dropping the dev-server auto-start
  // (the reconnect sees an existing PTY, so isNewPty is false).
  const owner = useMemo(
    () => ({ kind: "project" as const, projectId }),
    [projectId],
  );

  const navigateToSandboxTab = useCallback(
    (tab: SandboxTab) => {
      if (tab === "prd" || !projectPathSegment) return;
      navigate({
        to: `${basePath}/projects/${projectPathSegment}/sandbox/${tab}`,
        // Keep diffFile/diffView across sandbox tabs.
        search: true,
      });
    },
    [basePath, navigate, projectPathSegment],
  );

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
  });

  const panes = useSandboxPanes({
    owner,
    storageScope: `project:${projectIdStr}`,
    isActive,
    activeTab,
    setActiveTab: navigateToSandboxTab,
    terminalPanes,
  });

  // This surface has no custom tabs, so the tab bar only emits builtin ids.
  const handleTabChange = useCallback(
    (tab: string) => {
      if (!isSessionSandboxTab(tab) || tab === "prd") return;
      navigateToSandboxTab(tab);
    },
    [navigateToSandboxTab],
  );

  const {
    computerTabOpen,
    computerRunning,
    setComputerRunning,
    openComputer,
    closeComputer,
  } = useComputerTab(`project:${projectIdStr}`, activeTab, handleTabChange);
  const { editorTabOpen, openEditor, closeEditor } = useEditorTab(
    `project:${projectIdStr}`,
    activeTab,
    handleTabChange,
  );

  const enabledTabs = useMemo(
    () => withBrowserTab(panes.enabledTabs),
    [panes.enabledTabs],
  );

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={activeTab}
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
        <div className={activeTab === "files" ? "h-full min-h-0" : "hidden"}>
          {activeTab === "files" ? (
            <FileViewerPanel
              sandboxId={sandboxId}
              repoId={repoId}
              isActive={isActive}
            />
          ) : null}
        </div>
        <SandboxPaneSlots
          activeTab={activeTab}
          panes={panes}
          preview={preview}
          owner={owner}
          sandboxId={sandboxId}
          vercelSandboxId={vercelSandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={projectIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
        />
      </div>
    </div>
  );
}
