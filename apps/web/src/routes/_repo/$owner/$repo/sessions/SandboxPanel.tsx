import { useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { IconClipboardList } from "@tabler/icons-react";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { FileViewerPanel } from "./FileViewerPanel";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { useRepo } from "@/lib/contexts/RepoContext";

/** Inserts the sessions-only Browser tab after Preview in the enabled set. */
function withBrowserTab(
  tabs: ReadonlyArray<SandboxTab>,
): ReadonlyArray<SandboxTab> {
  const out: SandboxTab[] = [];
  for (const tab of tabs) {
    out.push(tab);
    if (tab === "preview") out.push("browser");
  }
  return out;
}

interface SandboxPanelProps {
  sessionId: Id<"sessions">;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  prUrl?: string;
  devPort?: number;
  devCommand?: string;
  terminalPanes?: SharedTerminalPane[];
  planContent?: string;
  isArchived?: boolean;
  /** Builtin tab id (SandboxTab) or a custom tab's name slug. */
  activeTab: string;
  onTabChange: (tab: string) => void;
  agentBrowsingAt?: number;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
  prUrl,
  devPort,
  devCommand,
  terminalPanes,
  planContent,
  isArchived,
  activeTab,
  onTabChange,
  agentBrowsingAt,
}: SandboxPanelProps) {
  const { repo } = useRepo();
  const sessionIdStr = String(sessionId);
  const { setMode } = useSessionSettings(sessionIdStr, {
    defaultModel: repo.defaultModel,
  });

  // Stable identity: a fresh literal each render would re-run TerminalPanel's
  // connect effect, flashing the spinner and dropping the dev-server auto-start
  // (the reconnect sees an existing PTY, so isNewPty is false).
  const owner = useMemo(
    () => ({ kind: "session" as const, sessionId }),
    [sessionId],
  );

  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    repoId,
    devPort,
  });

  const panes = useSandboxPanes({
    owner,
    storageScope: `session:${sessionIdStr}`,
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
  } = useComputerTab(`session:${sessionIdStr}`, activeTab, onTabChange);

  // User-defined tabs for this app, in display order, enabled only.
  const allCustomTabs = useQuery(api.appTabs.list, { repoId });
  const customTabs = useMemo(
    () => (allCustomTabs ?? []).filter((tab) => tab.enabled),
    [allCustomTabs],
  );

  // If the URL points at a custom tab that no longer exists (deleted / disabled /
  // renamed), fall back to preview. Wait for the query to load before deciding.
  useEffect(() => {
    if (isSessionSandboxTab(activeTab)) return;
    if (allCustomTabs === undefined) return;
    if (!customTabs.some((tab) => slugifyAppTabName(tab.name) === activeTab)) {
      onTabChange("preview");
    }
  }, [activeTab, allCustomTabs, customTabs, onTabChange]);

  const enabledTabs = useMemo(
    () => withBrowserTab(panes.enabledTabs),
    [panes.enabledTabs],
  );

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNewPreview={panes.handleNewPreview}
        onNewTerminal={panes.handleNewTerminal}
        newPreviewDisabled={panes.newPreviewDisabled}
        newTerminalDisabled={panes.newTerminalDisabled}
        enabledTabs={enabledTabs}
        showPrdTab
        showFilesTab
        customTabs={customTabs}
        agentBrowsingAt={agentBrowsingAt}
        computerTabOpen={computerTabOpen}
        computerRunning={computerRunning}
        onOpenComputer={openComputer}
        onCloseComputer={closeComputer}
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
          cacheKey={sessionIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          customTabs={customTabs}
          sessionId={sessionId}
          agentBrowsingAt={agentBrowsingAt}
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
        />
      </div>
    </div>
  );
}
