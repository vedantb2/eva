import { useEffect, useCallback } from "react";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser } from "@/lib/search-params";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { useSandboxPanes } from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { useRepo } from "@/lib/contexts/RepoContext";

interface SandboxPanelProps {
  sessionId: Id<"sessions">;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  devPort?: number;
  devCommand?: string;
  planContent?: string;
  isArchived?: boolean;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
  planContent,
  isArchived,
}: SandboxPanelProps) {
  const { repo } = useRepo();
  const sessionIdStr = String(sessionId);
  const { mode, setMode } = useSessionSettings(sessionIdStr, {
    defaultModel: repo.defaultModel,
  });
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
    cacheScope: `preview:${sessionIdStr}`,
  });

  const panes = useSandboxPanes({
    owner: { kind: "session", sessionId },
    storageScope: `session:${sessionIdStr}`,
    isActive,
    activeTab,
    setActiveTab,
  });

  const showPrdTab = Boolean(planContent) && mode === "plan";
  const tabBarValue =
    activeTab === "prd" && !showPrdTab ? "preview" : activeTab;

  // Bounce PRD tab back to preview when plan mode is exited or there's no plan.
  useEffect(() => {
    if (activeTab !== "prd") return;
    if (showPrdTab) return;
    void setActiveTab("preview");
  }, [activeTab, showPrdTab, setActiveTab]);

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
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
        showPrdTab={showPrdTab}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div
          className={
            activeTab === "prd"
              ? "flex h-full min-h-0 flex-col overflow-hidden"
              : "hidden"
          }
        >
          {activeTab === "prd" && planContent ? (
            <SessionPrdPlanView
              sessionId={sessionId}
              planContent={planContent}
              onApprovePlan={() => setMode("edit")}
              variant="panel"
              isArchived={isArchived}
            />
          ) : null}
        </div>
        <SandboxPaneSlots
          activeTab={tabBarValue}
          panes={panes}
          preview={preview}
          owner={{ kind: "session", sessionId }}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
          cacheKey={sessionIdStr}
          devCommand={devCommand}
        />
      </div>
    </div>
  );
}
