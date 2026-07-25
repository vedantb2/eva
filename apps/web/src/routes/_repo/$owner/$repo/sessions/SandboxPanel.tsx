import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api, normalizeAIModel, type Id } from "@eva/backend";
import { isSessionSandboxTab } from "@/lib/search-params";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { IconClipboardList } from "@tabler/icons-react";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { FilesPanel } from "./FilesPanel";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import {
  useSandboxPanes,
  type SharedTerminalPane,
} from "@/lib/components/sandbox/useSandboxPanes";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useEditorTab } from "@/lib/components/sandbox/useEditorTab";
import { withBrowserTab } from "@/lib/components/sandbox/withBrowserTab";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useSessionAnnotationSend } from "./_components/useSessionAnnotationSend";

interface SandboxPanelProps {
  sessionId: Id<"sessions">;
  sandboxId: string | undefined;
  isActive: boolean;
  /**
   * False while another session is shown but this shell stays mounted.
   * Preview freezes instead of clearing on shared URL search churn.
   */
  isRouteActive?: boolean;
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
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  isRouteActive = true,
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
  onStartSandbox,
  isSandboxStarting,
}: SandboxPanelProps) {
  const { repo } = useRepo();
  const sessionIdStr = String(sessionId);
  const { setMode } = useSessionModel(
    sessionId,
    normalizeAIModel(repo.defaultModel),
  );
  const submitAnnotation = useSessionAnnotationSend(sessionId);

  // Sticky Preview path/port + console tail (same sessions.get as the shell).
  const session = useQuery(api.sessions.get, { id: sessionId });
  const setPreviewPath = useMutation(api.sessions.setPreviewPath);
  const setPreviewPort = useMutation(api.sessions.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.sessions.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(api.sessions.releaseBrowserLock);

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
    isRouteActive,
    repoId,
    devPort,
    onPortPersist: (port) => {
      void setPreviewPort({ id: sessionId, port });
    },
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
  const { editorTabOpen, openEditor, closeEditor } = useEditorTab(
    `session:${sessionIdStr}`,
    activeTab,
    onTabChange,
  );

  // User-defined tabs for this app, in display order, enabled only.
  const allCustomTabs = useQuery(api.appTabs.list, { repoId });
  const customTabs = (allCustomTabs ?? []).filter((tab) => tab.enabled);

  // If the URL points at a custom tab that no longer exists (deleted / disabled /
  // renamed), fall back to preview. Wait for the query to load before deciding.
  useEffect(() => {
    if (isSessionSandboxTab(activeTab)) return;
    if (allCustomTabs === undefined) return;
    if (!customTabs.some((tab) => slugifyAppTabName(tab.name) === activeTab)) {
      onTabChange("preview");
    }
  }, [activeTab, allCustomTabs, customTabs, onTabChange]);

  const enabledTabs = withBrowserTab(panes.enabledTabs);

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
        hasPrdContent={
          typeof planContent === "string" && planContent.trim().length > 0
        }
        showFilesTab
        customTabs={customTabs}
        agentBrowsingAt={agentBrowsingAt}
        computerTabOpen={computerTabOpen}
        computerRunning={computerRunning}
        onOpenComputer={openComputer}
        onCloseComputer={closeComputer}
        editorTabOpen={editorTabOpen}
        onOpenEditor={openEditor}
        onCloseEditor={closeEditor}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div
          className={
            activeTab === "prd"
              ? "flex h-full min-h-0 flex-col overflow-hidden"
              : "hidden"
          }
        >
          {planContent ? (
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
                <p className="text-sm font-medium">No plan yet</p>
                <p className="text-sm text-muted-foreground">
                  Switch the composer to Plan mode and describe what you want to
                  build — the plan will appear here once generated.
                </p>
              </div>
            </div>
          )}
        </div>
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
          cacheKey={sessionIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          customTabs={customTabs}
          agentBrowsingAt={agentBrowsingAt}
          onReleaseBrowserLock={() => void releaseBrowserLock({ sessionId })}
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          onAnnotationSubmit={submitAnnotation}
          stickyPreviewPath={session?.previewPath}
          onStickyPreviewPathChange={(path) => {
            void setPreviewPath({ id: sessionId, path });
          }}
          stickyTerminalHistoryTail={
            session === undefined
              ? undefined
              : (session?.terminalHistoryTail ?? "")
          }
          onStickyTerminalHistoryTailChange={(tail) => {
            void setTerminalHistoryTail({ id: sessionId, tail });
          }}
        />
      </div>
    </div>
  );
}
