import { useEffect, useMemo } from "react";
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
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { DesignVariationsPanel } from "./_components/DesignVariationsPanel";
import { SandboxWorkspace } from "@/lib/components/sandbox/SandboxWorkspace";
import type { SharedTerminalPane } from "@/lib/components/sandbox/useSandboxPanes";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useSessionAnnotationSend } from "./_components/useSessionAnnotationSend";
import {
  getLatestVariations,
  type SessionDesignMessage,
} from "./_utils/designVariations";
import { isAssistantTurnInProgress } from "@/lib/components/chat/chatBodyUtils";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";

interface SandboxPanelProps {
  sessionId: Id<"sessions">;
  sandboxId: string | undefined;
  isActive: boolean;
  /** False while another kept-alive session shell is visible. */
  isRouteActive?: boolean;
  repoId: Id<"githubRepos">;
  prUrl?: string;
  devPort?: number;
  devCommand?: string;
  terminalPanes?: SharedTerminalPane[];
  planContent?: string;
  messages?: SessionDesignMessage[];
  lastMode?: SessionMode;
  selectedVariationIndex?: number;
  isArchived?: boolean;
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
  const isDesignExecuting = isAssistantTurnInProgress(messages);
  // Deliberate identity memo: cached session terminal effects key off this object.
  const owner = useMemo<SandboxOwner>(
    () => ({ kind: "session", sessionId }),
    [sessionId],
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
  const allCustomTabs = useQuery(api.appTabs.list, { repoId });
  const customTabs = (allCustomTabs ?? []).filter((tab) => tab.enabled);

  useEffect(() => {
    if (isSessionSandboxTab(activeTab)) return;
    if (allCustomTabs === undefined) return;
    if (!customTabs.some((tab) => slugifyAppTabName(tab.name) === activeTab)) {
      onTabChange("preview");
    }
  }, [activeTab, allCustomTabs, customTabs, onTabChange]);

  return (
    <SandboxWorkspace
      owner={owner}
      storageScope={`session:${sessionIdStr}`}
      cacheKey={sessionIdStr}
      sandboxId={sandboxId}
      isActive={isActive}
      isRouteActive={isRouteActive}
      repoId={repoId}
      prUrl={prUrl}
      devPort={devPort}
      devCommand={devCommand}
      terminalPanes={terminalPanes}
      activeTab={activeTab}
      onTabChange={onTabChange}
      agentBrowsingAt={agentBrowsingAt}
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
      onAnnotationSubmit={submitAnnotation}
      extensions={{
        plan: {
          hasContent:
            typeof planContent === "string" && planContent.trim().length > 0,
        },
        ...(showDesignsTab
          ? { designs: { hasContent: hasDesignsContent } }
          : {}),
        customTabs,
        renderPanes: (preview) => (
          <>
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
                      Switch the composer to Plan mode and describe what you
                      want to build; the plan will appear here once generated.
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
                previewUrl={preview.previewInfo?.url ?? null}
                sandboxRunning={isActive}
                isArchived={isArchived === true}
                isExecuting={isDesignExecuting}
                latestVariations={latestVariations}
                selectedVariationIndex={selectedVariationIndex}
                isSandboxStarting={isSandboxStarting === true}
                onStartSandbox={() => onStartSandbox?.()}
                onSelectVariation={(index) => {
                  void selectVariation({
                    id: sessionId,
                    variationIndex: index,
                  });
                }}
              />
            </div>
          </>
        ),
      }}
    />
  );
}
