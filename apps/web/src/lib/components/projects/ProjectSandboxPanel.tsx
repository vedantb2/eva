"use client";

import { useCallback } from "react";
import type { Id } from "@conductor/backend";
import type { SandboxTab, TaskRouteSandboxTab } from "@/lib/search-params";
import { useNavigate } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";

const PROJECT_ENABLED_TABS = [
  "preview",
  "terminal",
  "editor",
  "desktop",
] as const;

interface ProjectSandboxPanelProps {
  projectId: Id<"projects">;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  devPort?: number;
  devCommand?: string;
  terminalPanes?: SharedTerminalPane[];
  sandboxTab: TaskRouteSandboxTab;
}

export function ProjectSandboxPanel({
  projectId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
  terminalPanes,
  sandboxTab,
}: ProjectSandboxPanelProps) {
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const projectIdStr = String(projectId);

  const activeTab: SandboxTab = sandboxTab;

  const navigateToSandboxTab = useCallback(
    (tab: SandboxTab) => {
      if (tab === "prd") return;
      navigate({
        to: `${basePath}/projects/${projectIdStr}/sandbox/${tab}`,
      });
    },
    [basePath, navigate, projectIdStr],
  );

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
  });

  const panes = useSandboxPanes({
    owner: { kind: "project", projectId },
    storageScope: `project:${projectIdStr}`,
    isActive,
    activeTab,
    setActiveTab: navigateToSandboxTab,
    terminalPanes,
  });

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
      if (tab === "prd") return;
      navigateToSandboxTab(tab);
    },
    [navigateToSandboxTab],
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
        enabledTabs={PROJECT_ENABLED_TABS}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <SandboxPaneSlots
          activeTab={activeTab}
          panes={panes}
          preview={preview}
          owner={{ kind: "project", projectId }}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={projectIdStr}
          devCommand={devCommand}
        />
      </div>
    </div>
  );
}
