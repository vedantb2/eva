"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@eva/backend";
import type { Id, SandboxOwner } from "@eva/backend";
import {
  isSessionSandboxTab,
  type SandboxTab,
  type TaskRouteSandboxTab,
} from "@/lib/search-params";
import { useNavigate, useParams } from "@tanstack/react-router";
import { entityPathSegment } from "@/lib/numId";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { type SandboxPanesApi } from "@/lib/components/sandbox/useSandboxPanes";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useEditorTab } from "@/lib/components/sandbox/useEditorTab";
import { useSandboxFileList } from "@/lib/components/sandbox/useSandboxFileList";
import { withBrowserTab } from "@/lib/components/sandbox/withBrowserTab";
import { SandboxPanelFrame } from "@/lib/components/sandbox/SandboxPanelFrame";
import { FilesPanel } from "@/routes/_repo/$owner/$repo/sessions/FilesPanel";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
import { SimpleViewSandboxRedirect } from "@/lib/components/sandbox/SimpleViewSandboxRedirect";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

interface ProjectSandboxPanelProps {
  projectId: Id<"projects">;
  projectNumId?: number;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  prUrl?: string;
  devPort?: number;
  devCommand?: string;
  owner: SandboxOwner;
  panes: SandboxPanesApi;
  terminalPanel: TerminalPanelApi;
  sandboxTab: TaskRouteSandboxTab;
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
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
  owner,
  panes,
  terminalPanel,
  sandboxTab,
  onStartSandbox,
  isSandboxStarting,
  collapsed = false,
  onToggle,
}: ProjectSandboxPanelProps) {
  const simpleView = useSimpleView();
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const projectPathSegment = entityPathSegment({ numId: projectNumId });
  const projectIdStr = String(projectId);

  const viewState = useQuery(api.sandboxPanes.getViewState, { owner });
  const setPreviewPath = useMutation(api.sandboxPanes.setPreviewPath);
  const setPreviewPort = useMutation(api.sandboxPanes.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.sandboxPanes.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(api.sandboxPanes.releaseBrowserLock);

  const activeTab: SandboxTab = sandboxTab;

  const navigateToSandboxTab = (tab: SandboxTab) => {
    if (tab === "prd" || !projectPathSegment) return;
    if (tab === "review") {
      void navigate({
        to: toInternalRepoHref(
          `${basePath}/projects/${projectPathSegment}/sandbox/review/diffs/unified`,
        ),
        search: true,
      });
      return;
    }
    void navigate({
      to: toInternalRepoHref(
        `${basePath}/projects/${projectPathSegment}/sandbox/${tab}`,
      ),
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
      void setPreviewPort({ owner, port });
    },
  });

  const fileList = useSandboxFileList({ sandboxId, repoId, isActive });

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
  const { owner: ownerParam, repo: repoParam } = useParams({ strict: false });

  return (
    <>
      {projectPathSegment &&
      typeof ownerParam === "string" &&
      typeof repoParam === "string" ? (
        <SimpleViewSandboxRedirect
          activeTab={activeTab}
          to="/$owner/$repo/projects/$numId/sandbox/$sandboxTab"
          params={{
            owner: ownerParam,
            repo: repoParam,
            numId: projectPathSegment,
          }}
        />
      ) : null}
      <SandboxPanelFrame
        collapsed={collapsed}
        tabBar={
          <SandboxTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={collapsed}
            onToggle={onToggle}
            onNewPreview={() => {
              panes.handleNewPreview();
              navigateToSandboxTab("preview");
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
        }
      >
        <div className="h-full overflow-hidden">
          <div className={!simpleView && activeTab === "files" ? "h-full min-h-0" : "hidden"}>
            <FilesPanel
              sandboxId={sandboxId}
              repoId={repoId}
              isActive={isActive}
              fileList={fileList}
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
      </SandboxPanelFrame>
    </>
  );
}
