"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@eva/backend";
import type { Id, SandboxOwner } from "@eva/backend";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";
import { SandboxWorkspace } from "@/lib/components/sandbox/SandboxWorkspace";
import type { SharedTerminalPane } from "@/lib/components/sandbox/useSandboxPanes";

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

  // Deliberate identity memo: terminal connection effects key off this object.
  const owner = useMemo<SandboxOwner>(
    () => ({ kind: "task", taskId }),
    [taskId],
  );
  const viewState = useQuery(api.sandboxPanes.getViewState, { owner });
  const setPreviewPath = useMutation(api.sandboxPanes.setPreviewPath);
  const setPreviewPort = useMutation(api.sandboxPanes.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.sandboxPanes.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(
    api.sandboxPanes.releaseBrowserLock,
  );

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

  return (
    <SandboxWorkspace
      owner={owner}
      storageScope={`task:${taskIdStr}`}
      cacheKey={taskIdStr}
      sandboxId={sandboxId}
      isActive={isActive}
      repoId={repoId}
      devPort={devPort}
      devCommand={devCommand}
      terminalPanes={terminalPanes}
      prUrl={prUrl}
      activeTab={tabBarValue}
      onTabChange={handleTabChange}
      agentBrowsingAt={viewState?.agentBrowsingAt}
      onReleaseBrowserLock={() => void releaseBrowserLock({ owner })}
      onStartSandbox={onStartSandbox}
      isSandboxStarting={isSandboxStarting}
      stickyPreviewPath={viewState?.previewPath}
      onStickyPreviewPathChange={(path) => {
        void setPreviewPath({ owner, path });
      }}
      onPreviewPortPersist={(port) => {
        void setPreviewPort({ owner, port });
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
  );
}
