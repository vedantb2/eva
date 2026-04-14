import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { cn } from "@conductor/ui";
import {
  sandboxTabParser,
  previewPortParser,
  sandboxTermIdsParser,
  sandboxTermActiveParser,
} from "@/lib/search-params";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";
import { EditorPanel } from "./EditorPanel";
import { DesktopPanel } from "./DesktopPanel";
import { SandboxTabBar } from "./_components/SandboxTabBar";
import { TerminalPaneTabs } from "./_components/TerminalPaneTabs";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { useRepo } from "@/lib/contexts/RepoContext";

const MAX_TERMINAL_PANES = 8;

interface PreviewInfo {
  url: string;
  port: number;
}

function getCachedPreview(sessionId: string, port: number): PreviewInfo | null {
  try {
    const raw = sessionStorage.getItem(
      `conductor:preview:${sessionId}:${port}`,
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { url: parsed.url, port: parsed.port };
  } catch {
    return null;
  }
}

function setCachedPreview(sessionId: string, info: PreviewInfo) {
  sessionStorage.setItem(
    `conductor:preview:${sessionId}:${info.port}`,
    JSON.stringify({ url: info.url, port: info.port }),
  );
}

function clearCachedPreview(sessionId: string, port: number) {
  sessionStorage.removeItem(`conductor:preview:${sessionId}:${port}`);
}

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
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [termIds, setTermIds] = useQueryState("termIds", sandboxTermIdsParser);
  const [termActive, setTermActive] = useQueryState(
    "termActive",
    sandboxTermActiveParser,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPort] = useQueryState("port", previewPortParser);
  const effectivePort = devPort ?? port;
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const disconnectPtyAction = useAction(api.pty.disconnectPty);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    setIsLoading(true);
    setError(null);
    stopPolling();
    try {
      const data = await getPreviewUrl({
        sandboxId,
        port: effectivePort,
        checkReady: true,
        repoId,
      });
      if (data.ready) {
        await dismissDaytonaWarning(data.url);
        setPreviewInfo(data);
        setCachedPreview(sessionId, data);
        setIframeKey((k) => k + 1);
        setIsLoading(false);
      } else {
        pollingRef.current = setTimeout(() => {
          fetchPreview();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
      setIsLoading(false);
    }
  }, [
    sandboxId,
    isActive,
    getPreviewUrl,
    stopPolling,
    repoId,
    effectivePort,
    sessionId,
    setPreviewInfo,
  ]);

  useEffect(() => {
    if (isActive && sandboxId) {
      const cached = getCachedPreview(sessionId, effectivePort);
      if (cached) {
        setPreviewInfo(cached);
        return;
      }
      fetchPreview();
    }
    if (!isActive) {
      clearCachedPreview(sessionId, effectivePort);
    }
    return stopPolling;
  }, [
    isActive,
    sandboxId,
    fetchPreview,
    stopPolling,
    sessionId,
    effectivePort,
    setPreviewInfo,
  ]);

  useEffect(() => {
    if (activeTab !== "terminal" || termIds.length > 0) return;
    const id = crypto.randomUUID();
    void setTermIds([id]);
    void setTermActive(id);
  }, [activeTab, termIds.length, setTermIds, setTermActive]);

  useEffect(() => {
    if (termIds.length === 0) return;
    if (termActive && termIds.includes(termActive)) return;
    void setTermActive(termIds[0]);
  }, [termIds, termActive, setTermActive]);

  const showPrdTab = Boolean(planContent) && mode === "plan";

  const tabBarValue =
    activeTab === "prd" && !showPrdTab ? "preview" : activeTab;

  useEffect(() => {
    if (activeTab !== "prd") return;
    if (showPrdTab) return;
    void setActiveTab("preview");
  }, [activeTab, showPrdTab, setActiveTab]);

  const resolvedTermActive =
    termIds.length > 0
      ? termActive && termIds.includes(termActive)
        ? termActive
        : termIds[0]
      : "";

  const handleNewTerminal = useCallback(() => {
    if (!isActive || termIds.length >= MAX_TERMINAL_PANES) return;
    const id = crypto.randomUUID();
    const next = termIds.length === 0 ? [id] : [...termIds, id];
    void setTermIds(next);
    void setTermActive(id);
    void setActiveTab("terminal");
  }, [isActive, termIds, setTermIds, setTermActive, setActiveTab]);

  const handleCloseTerminal = useCallback(
    async (ptyId: string) => {
      if (termIds[0] === ptyId) return;
      const removedIdx = termIds.indexOf(ptyId);
      if (removedIdx < 0) return;
      const next = termIds.filter((t) => t !== ptyId);
      try {
        await disconnectPtyAction({
          sessionId,
          ptyInstanceId: ptyId,
        });
      } catch {
        // still remove from UI
      }
      void setTermIds(next);
      if (termActive === ptyId) {
        const pick = next[removedIdx - 1] ?? next[0] ?? "";
        void setTermActive(pick);
      }
    },
    [
      termIds,
      termActive,
      disconnectPtyAction,
      sessionId,
      setTermIds,
      setTermActive,
    ],
  );

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  const newTerminalDisabled = !isActive || termIds.length >= MAX_TERMINAL_PANES;

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={tabBarValue}
        onTabChange={handleTabChange}
        onNewTerminal={handleNewTerminal}
        newTerminalDisabled={newTerminalDisabled}
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
        <div className={activeTab === "preview" ? "h-full" : "hidden"}>
          <WebPreviewPanel
            isActive={isActive}
            sandboxId={sandboxId}
            previewInfo={previewInfo}
            isLoading={isLoading}
            error={error}
            iframeKey={iframeKey}
            onRefresh={fetchPreview}
            port={effectivePort}
            onPortChange={setPort}
          />
        </div>
        <div className={activeTab === "editor" ? "h-full" : "hidden"}>
          <EditorPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
            repoId={repoId}
          />
        </div>
        <div
          className={
            activeTab === "terminal" ? "h-full flex flex-col" : "hidden"
          }
        >
          {activeTab === "terminal" ? (
            <TerminalPaneTabs
              termIds={termIds}
              activeId={resolvedTermActive}
              onSelect={(id) => void setTermActive(id)}
              onClose={handleCloseTerminal}
            />
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            {activeTab === "terminal" && termIds.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Preparing terminal…
              </div>
            ) : null}
            {termIds.map((id) => (
              <div
                key={id}
                className={cn(
                  resolvedTermActive === id
                    ? "flex min-h-0 flex-1 flex-col"
                    : "hidden",
                )}
              >
                <TerminalPanel
                  sessionId={sessionId}
                  sandboxId={sandboxId}
                  isActive={isActive}
                  ptyInstanceId={id}
                  isForeground={
                    resolvedTermActive === id && activeTab === "terminal"
                  }
                  runDevCommandOnConnect={id === termIds[0]}
                  devCommand={devCommand}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={activeTab === "desktop" ? "h-full" : "hidden"}>
          <DesktopPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
            repoId={repoId}
          />
        </div>
      </div>
    </div>
  );
}
