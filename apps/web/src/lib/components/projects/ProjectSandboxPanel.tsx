"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@eva/backend";
import type { Id, SandboxOwner } from "@eva/backend";
import {
  isSessionSandboxTab,
  type SandboxTab,
  type TaskRouteSandboxTab,
} from "@/lib/search-params";
import { useNavigate } from "@tanstack/react-router";
import { entityPathSegment } from "@/lib/numId";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SandboxWorkspace } from "@/lib/components/sandbox/SandboxWorkspace";
import type { SharedTerminalPane } from "@/lib/components/sandbox/useSandboxPanes";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

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

  // Deliberate identity memo: terminal connection effects key off this object.
  const owner = useMemo<SandboxOwner>(
    () => ({ kind: "project", projectId }),
    [projectId],
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

  // This surface has no custom tabs, so the tab bar only emits builtin ids.
  const handleTabChange = (tab: string) => {
    if (!isSessionSandboxTab(tab) || tab === "prd") return;
    navigateToSandboxTab(tab);
  };

  return (
    <SandboxWorkspace
      owner={owner}
      storageScope={`project:${projectIdStr}`}
      cacheKey={projectIdStr}
      sandboxId={sandboxId}
      isActive={isActive}
      repoId={repoId}
      prUrl={prUrl}
      devPort={devPort}
      devCommand={devCommand}
      terminalPanes={terminalPanes}
      activeTab={activeTab}
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
