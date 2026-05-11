import { useCallback } from "react";
import type { Id } from "@conductor/backend";
import type { SandboxTab } from "@/lib/search-params";
import { IconClipboardList } from "@tabler/icons-react";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "@/lib/components/sandbox/useSandboxPanes";
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
  terminalPanes?: SharedTerminalPane[];
  planContent?: string;
  isArchived?: boolean;
  activeTab: SandboxTab;
  onTabChange: (tab: SandboxTab) => void;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
  terminalPanes,
  planContent,
  isArchived,
  activeTab,
  onTabChange,
}: SandboxPanelProps) {
  const { repo } = useRepo();
  const sessionIdStr = String(sessionId);
  const { setMode } = useSessionSettings(sessionIdStr, {
    defaultModel: repo.defaultModel,
  });

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
  });

  const panes = useSandboxPanes({
    owner: { kind: "session", sessionId },
    storageScope: `session:${sessionIdStr}`,
    isActive,
    activeTab,
    setActiveTab: onTabChange,
    terminalPanes,
  });

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
      onTabChange(tab);
    },
    [onTabChange],
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
        showPrdTab
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div
          className={
            activeTab === "prd"
              ? "flex h-full min-h-0 flex-col overflow-hidden"
              : "hidden"
          }
        >
          {activeTab === "prd" ? (
            planContent ? (
              <SessionPrdPlanView
                sessionId={sessionId}
                planContent={planContent}
                onApprovePlan={() => setMode("edit")}
                variant="panel"
                isArchived={isArchived}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <IconClipboardList className="h-10 w-10 text-muted-foreground/60" />
                <div className="max-w-md space-y-1">
                  <p className="text-sm font-medium">No PRD or plan yet</p>
                  <p className="text-sm text-muted-foreground">
                    Ask Eva to create a PRD or plan for a feature, and it will
                    appear here once generated.
                  </p>
                </div>
              </div>
            )
          ) : null}
        </div>
        <SandboxPaneSlots
          activeTab={activeTab}
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
