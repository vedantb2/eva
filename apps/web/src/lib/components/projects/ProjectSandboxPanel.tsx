"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
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
import { FilesPanel } from "@/routes/_repo/$owner/$repo/sessions/FilesPanel";

interface ProjectSandboxPanelProps {
  projectId: Id<"projects">;
  projectNumId?: number;
  sandboxId: string | undefined;
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

  const project = useQuery(api.projects.get, { id: projectId });
  const setPreviewPath = useMutation(api.projects.setPreviewPath);
  const setPreviewPort = useMutation(api.projects.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.projects.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(api.projects.releaseBrowserLock);

  const activeTab: SandboxTab = sandboxTab;

  // Stable identity: a fresh literal each render would re-run TerminalPanel's
  // connect effect, flashing the spinner and dropping the dev-server auto-start
  // (the reconnect sees an existing PTY, so isNewPty is false).
  const owner = useMemo(
    () => ({ kind: "project" as const, projectId }),
    [projectId],
  );

  const navigateToSandboxTab = (tab: SandboxTab) => {
    if (tab === "prd" || !projectPathSegment) return;
    if (tab === "review") {
      void navigate({
        to: `${basePath}/projects/${projectPathSegment}/sandbox/review/diffs/unified`,
        search: true,
      });
      return;
    }
    void navigate({
      to: `${basePath}/projects/${projectPathSegment}/sandbox/${tab}`,
      // Keep diffFile across sandbox tabs.
      search: true,
    });
  };

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    onPortPersist: (port) => {
      void setPreviewPort({ id: projectId, port });
    },
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
  const handleTabChange = (tab: string) => {
    if (!isSessionSandboxTab(tab) || tab === "prd") return;
    navigateToSandboxTab(tab);
  };

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

  const enabledTabs = withBrowserTab(panes.enabledTabs);

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
        agentBrowsingAt={project?.agentBrowsingAt}
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
          <FilesPanel
            sandboxId={sandboxId}
            repoId={repoId}
            isActive={isActive}
          />
        </div>
        <SandboxPaneSlots
          activeTab={activeTab}
          panes={panes}
          preview={preview}
          owner={owner}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={projectIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          agentBrowsingAt={project?.agentBrowsingAt}
          onReleaseBrowserLock={() =>
            void releaseBrowserLock({ id: projectId })
          }
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          stickyPreviewPath={project?.previewPath}
          onStickyPreviewPathChange={(path) => {
            void setPreviewPath({ id: projectId, path });
          }}
          stickyTerminalHistoryTail={
            project === undefined
              ? undefined
              : (project?.terminalHistoryTail ?? "")
          }
          onStickyTerminalHistoryTailChange={(tail) => {
            void setTerminalHistoryTail({ id: projectId, tail });
          }}
        />
      </div>
    </div>
  );
}
