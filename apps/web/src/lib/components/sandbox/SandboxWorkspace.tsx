"use client";

import type { ReactNode } from "react";
import type { Doc, Id, SandboxOwner } from "@eva/backend";
import { isSessionSandboxTab } from "@/lib/search-params";
import { FilesPanel } from "@/routes/_repo/$owner/$repo/sessions/FilesPanel";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "./SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "./useSandboxPanes";
import {
  useSandboxPreview,
  type SandboxPreviewApi,
} from "./useSandboxPreview";
import { useComputerTab } from "./useComputerTab";
import { useEditorTab } from "./useEditorTab";
import { withBrowserTab } from "./withBrowserTab";

interface OptionalTabCapability {
  hasContent: boolean;
}

interface SandboxWorkspaceExtensions {
  plan?: OptionalTabCapability;
  designs?: OptionalTabCapability;
  customTabs?: ReadonlyArray<Doc<"appTabs">>;
  renderPanes?: (preview: SandboxPreviewApi) => ReactNode;
}

interface SandboxWorkspaceProps {
  owner: SandboxOwner;
  storageScope: string;
  cacheKey: string;
  sandboxId: string | undefined;
  isActive: boolean;
  isRouteActive?: boolean;
  repoId: Id<"githubRepos">;
  prUrl?: string;
  devPort?: number;
  devCommand?: string;
  terminalPanes?: SharedTerminalPane[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  agentBrowsingAt?: number;
  onReleaseBrowserLock?: () => void;
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
  stickyPreviewPath?: string;
  onStickyPreviewPathChange?: (path: string) => void;
  onPreviewPortPersist?: (port: number) => void;
  stickyTerminalHistoryTail?: string;
  onStickyTerminalHistoryTailChange?: (tail: string) => void;
  onAnnotationSubmit?: (display: string, full: string) => Promise<void>;
  extensions?: SandboxWorkspaceExtensions;
}

/**
 * The common sandbox workspace used by sessions, quick tasks, and projects.
 * Owner-specific surfaces provide lifecycle actions and optional tab panes;
 * preview, files, PTYs, browser/computer, editor, and review live here once.
 */
export function SandboxWorkspace({
  owner,
  storageScope,
  cacheKey,
  sandboxId,
  isActive,
  isRouteActive = true,
  repoId,
  prUrl,
  devPort,
  devCommand,
  terminalPanes,
  activeTab,
  onTabChange,
  agentBrowsingAt,
  onReleaseBrowserLock,
  onStartSandbox,
  isSandboxStarting,
  stickyPreviewPath,
  onStickyPreviewPathChange,
  onPreviewPortPersist,
  stickyTerminalHistoryTail,
  onStickyTerminalHistoryTailChange,
  onAnnotationSubmit,
  extensions,
}: SandboxWorkspaceProps) {
  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    isRouteActive,
    repoId,
    devPort,
    onPortPersist: onPreviewPortPersist,
  });
  const panes = useSandboxPanes({
    owner,
    storageScope,
    isActive,
    activeTab: isSessionSandboxTab(activeTab) ? activeTab : null,
    setActiveTab: onTabChange,
    terminalPanes,
  });
  const {
    computerTabOpen,
    computerRunning,
    setComputerRunning,
    openComputer,
    closeComputer,
  } = useComputerTab(storageScope, activeTab, onTabChange);
  const { editorTabOpen, openEditor, closeEditor } = useEditorTab(
    storageScope,
    activeTab,
    onTabChange,
  );
  const enabledTabs = withBrowserTab(panes.enabledTabs);

  return (
    <div className="flex h-full flex-col">
      <SandboxTabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNewPreview={panes.handleNewPreview}
        onNewTerminal={panes.handleNewTerminal}
        newPreviewDisabled={panes.newPreviewDisabled}
        newTerminalDisabled={panes.newTerminalDisabled}
        enabledTabs={enabledTabs}
        showPrdTab={extensions?.plan !== undefined}
        hasPrdContent={extensions?.plan?.hasContent}
        showDesignsTab={extensions?.designs !== undefined}
        hasDesignsContent={extensions?.designs?.hasContent}
        showFilesTab
        customTabs={extensions?.customTabs}
        agentBrowsingAt={agentBrowsingAt}
        computerTabOpen={computerTabOpen}
        computerRunning={computerRunning}
        onOpenComputer={openComputer}
        onCloseComputer={closeComputer}
        editorTabOpen={editorTabOpen}
        onOpenEditor={openEditor}
        onCloseEditor={closeEditor}
        hotkeysEnabled={isRouteActive}
      />
      <div className="flex-1 overflow-hidden bg-card">
        {extensions?.renderPanes?.(preview)}
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
          cacheKey={cacheKey}
          devCommand={devCommand}
          prUrl={prUrl}
          customTabs={extensions?.customTabs}
          agentBrowsingAt={agentBrowsingAt}
          onReleaseBrowserLock={onReleaseBrowserLock}
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          onAnnotationSubmit={onAnnotationSubmit}
          stickyPreviewPath={stickyPreviewPath}
          onStickyPreviewPathChange={onStickyPreviewPathChange}
          stickyTerminalHistoryTail={stickyTerminalHistoryTail}
          onStickyTerminalHistoryTailChange={
            onStickyTerminalHistoryTailChange
          }
          consoleHotkeyEnabled={isRouteActive}
        />
      </div>
    </div>
  );
}
