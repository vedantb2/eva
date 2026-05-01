import { useEffect, useCallback } from "react";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { useSandboxPanes } from "@/lib/components/sandbox/useSandboxPanes";
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
}

export function ProjectSandboxPanel({
  projectId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
}: ProjectSandboxPanelProps) {
  const projectIdStr = String(projectId);
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    cacheScope: `project-preview:${projectIdStr}`,
  });

  const panes = useSandboxPanes({
    owner: { kind: "project", projectId },
    storageScope: `project:${projectIdStr}`,
    isActive,
    activeTab,
    setActiveTab,
  });

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
        enabledTabs={PROJECT_ENABLED_TABS}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <SandboxPaneSlots
          activeTab={tabBarValue}
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
