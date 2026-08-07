import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  api,
  normalizeAIModel,
  type Id,
  type SandboxOwner,
} from "@eva/backend";
import { isSessionSandboxTab } from "@/lib/search-params";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { IconClipboardList } from "@tabler/icons-react";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { DesignVariationsPanel } from "./_components/DesignVariationsPanel";
import { FilesPanel } from "./FilesPanel";
import { SandboxPaneSlots } from "@/lib/components/sandbox/SandboxPaneSlots";
import { type SandboxPanesApi } from "@/lib/components/sandbox/useSandboxPanes";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";
import { useSandboxPreview } from "@/lib/components/sandbox/useSandboxPreview";
import { useComputerTab } from "@/lib/components/sandbox/useComputerTab";
import { useEditorTab } from "@/lib/components/sandbox/useEditorTab";
import { useSandboxFileList } from "@/lib/components/sandbox/useSandboxFileList";
import { withBrowserTab } from "@/lib/components/sandbox/withBrowserTab";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useSessionAnnotationSend } from "./_components/useSessionAnnotationSend";
import {
  getLatestVariations,
  type SessionDesignMessage,
} from "./_utils/designVariations";
import { useTurnInProgress } from "@/lib/components/chat/useTurnInProgress";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";
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
  owner: SandboxOwner;
  panes: SandboxPanesApi;
  terminalPanel: TerminalPanelApi;
  planContent?: string;
  messages?: SessionDesignMessage[];
  lastMode?: SessionMode;
  selectedVariationIndex?: number;
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
  owner,
  panes,
  terminalPanel,
  planContent,
  messages = [],
  lastMode,
  selectedVariationIndex,
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
  const selectVariation = useMutation(api.sessions.selectVariation);
  const latestVariations = getLatestVariations(messages);
  const showDesignsTab = lastMode === "design" || latestVariations.length > 0;
  const hasDesignsContent = latestVariations.length > 0;
  const isDesignExecuting = useTurnInProgress("session", sessionId);
  // Sticky Preview path/port + console tail, keyed by the sandbox owner so all
  // three surfaces read and write this state through the same functions.
  const viewState = useQuery(api.sandboxPanes.getViewState, { owner });
  const setPreviewPath = useMutation(api.sandboxPanes.setPreviewPath);
  const setPreviewPort = useMutation(api.sandboxPanes.setPreviewPort);
  const setTerminalHistoryTail = useMutation(
    api.sandboxPanes.setTerminalHistoryTail,
  );
  const releaseBrowserLock = useMutation(api.sandboxPanes.releaseBrowserLock);
  const preview = useSandboxPreview({
    sandboxId,
    isActive,
    isRouteActive,
    repoId,
    devPort,
    onPortPersist: (port) => {
      void setPreviewPort({ owner, port });
    },
  });
  const fileList = useSandboxFileList({ sandboxId, repoId, isActive });
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
    if (activeTab === "terminal") {
      onTabChange("preview");
      return;
    }
    if (isSessionSandboxTab(activeTab)) return;
    if (allCustomTabs === undefined) return;
    if (!customTabs.some((tab) => slugifyAppTabName(tab.name) === activeTab)) {
      onTabChange("preview");
    }
  }, [activeTab, allCustomTabs, customTabs, onTabChange]);
  const enabledTabs = withBrowserTab(panes.enabledTabs);
  const previewUrl = preview.previewInfo?.url ?? null;
  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        compact
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNewPreview={() => {
          panes.handleNewPreview();
          onTabChange("preview");
        }}
        newPreviewDisabled={panes.newPreviewDisabled}
        enabledTabs={enabledTabs}
        showPrdTab
        hasPrdContent={
          typeof planContent === "string" && planContent.trim().length > 0
        }
        showDesignsTab={showDesignsTab}
        hasDesignsContent={hasDesignsContent}
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
        hotkeysEnabled={isRouteActive}
        fileList={fileList}
        consoleDock={panes.consoleDock}
        terminalPanel={terminalPanel}
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
        <div
          className={
            activeTab === "designs"
              ? "flex h-full min-h-0 flex-col overflow-hidden"
              : "hidden"
          }
        >
          <DesignVariationsPanel
            previewUrl={previewUrl}
            sandboxRunning={isActive}
            isArchived={isArchived === true}
            isExecuting={isDesignExecuting}
            latestVariations={latestVariations}
            selectedVariationIndex={selectedVariationIndex}
            isSandboxStarting={isSandboxStarting === true}
            onStartSandbox={() => onStartSandbox?.()}
            onSelectVariation={(index) => {
              void selectVariation({ id: sessionId, variationIndex: index });
            }}
          />
        </div>
        <div className={activeTab === "files" ? "h-full min-h-0" : "hidden"}>
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
          cacheKey={sessionIdStr}
          devCommand={devCommand}
          prUrl={prUrl}
          customTabs={customTabs}
          agentBrowsingAt={agentBrowsingAt}
          onReleaseBrowserLock={() => void releaseBrowserLock({ owner })}
          // Backend starts the app in the Console tmux session after startup.
          runConsoleDevCommandOnConnect={false}
          onComputerRunningChange={setComputerRunning}
          onStartSandbox={onStartSandbox}
          isSandboxStarting={isSandboxStarting}
          onAnnotationSubmit={submitAnnotation}
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
    </div>
  );
}
