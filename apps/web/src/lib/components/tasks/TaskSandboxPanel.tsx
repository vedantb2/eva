"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@conductor/ui";
import { sandboxTabParser, previewPortParser } from "@/lib/search-params";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { TerminalPanel } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import { WebPreviewPanel } from "@/routes/_repo/$owner/$repo/sessions/WebPreviewPanel";
import { EditorPanel } from "@/routes/_repo/$owner/$repo/sessions/EditorPanel";
import { DesktopPanel } from "@/routes/_repo/$owner/$repo/sessions/DesktopPanel";
import { SandboxTabBar } from "@/routes/_repo/$owner/$repo/sessions/_components/SandboxTabBar";
import { TerminalPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/TerminalPaneTabs";
import { PreviewPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/PreviewPaneTabs";

const MAX_TERMINAL_PANES = 8;
const MAX_PREVIEW_PANES = 8;

const TASK_ENABLED_TABS = ["preview", "terminal", "editor", "desktop"] as const;

interface PreviewInfo {
  url: string;
  port: number;
}

interface TerminalStorageState {
  ids: string[];
  activeId: string;
}

interface PreviewStorageState {
  ids: string[];
  activeId: string;
}

function getCachedPreview(taskId: string, port: number): PreviewInfo | null {
  try {
    const raw = sessionStorage.getItem(
      `conductor:task-preview:${taskId}:${port}`,
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url: string; port: number };
    return { url: parsed.url, port: parsed.port };
  } catch {
    return null;
  }
}

function setCachedPreview(taskId: string, info: PreviewInfo) {
  sessionStorage.setItem(
    `conductor:task-preview:${taskId}:${info.port}`,
    JSON.stringify({ url: info.url, port: info.port }),
  );
}

function clearCachedPreview(taskId: string, port: number) {
  sessionStorage.removeItem(`conductor:task-preview:${taskId}:${port}`);
}

interface TaskSandboxPanelProps {
  taskId: Id<"agentTasks">;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  devPort?: number;
  devCommand?: string;
}

/**
 * Right-side sandbox panel for a quick task — mirrors the session sandbox
 * panel. Exposes Preview, Terminal, Editor, and Desktop tabs (PRD is omitted
 * since it's a session-only concept).
 *
 * Multi-pane preview/terminal state is persisted in localStorage so navigating
 * away and back restores the same set of panes. The single shared `previewInfo`
 * is reused across all preview panes, just like sessions.
 */
export function TaskSandboxPanel({
  taskId,
  sandboxId,
  isActive,
  repoId,
  devPort,
  devCommand,
}: TaskSandboxPanelProps) {
  const taskIdStr = String(taskId);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [previewState, setPreviewState] = useLocalStorage<PreviewStorageState>(
    `conductor:task:${taskIdStr}:previews`,
    { ids: [], activeId: "" },
  );
  const previewIds = previewState.ids;
  const previewActive = previewState.activeId;
  const setPreviewIds = useCallback(
    (ids: string[]) => {
      setPreviewState((current) => ({ ...current, ids }));
    },
    [setPreviewState],
  );
  const setPreviewActive = useCallback(
    (activeId: string) => {
      setPreviewState((current) => ({ ...current, activeId }));
    },
    [setPreviewState],
  );
  const [terminalState, setTerminalState] =
    useLocalStorage<TerminalStorageState>(
      `conductor:task:${taskIdStr}:terminals`,
      { ids: [], activeId: "" },
    );
  const termIds = terminalState.ids;
  const termActive = terminalState.activeId;
  const setTermIds = useCallback(
    (ids: string[]) => {
      setTerminalState((current) => ({ ...current, ids }));
    },
    [setTerminalState],
  );
  const setTermActive = useCallback(
    (activeId: string) => {
      setTerminalState((current) => ({ ...current, activeId }));
    },
    [setTerminalState],
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
        setCachedPreview(taskIdStr, data);
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
    taskIdStr,
  ]);

  useEffect(() => {
    if (isActive && sandboxId) {
      const cached = getCachedPreview(taskIdStr, effectivePort);
      if (cached) {
        setPreviewInfo(cached);
        return;
      }
      fetchPreview();
    }
    if (!isActive) {
      clearCachedPreview(taskIdStr, effectivePort);
    }
    return stopPolling;
  }, [
    isActive,
    sandboxId,
    fetchPreview,
    stopPolling,
    taskIdStr,
    effectivePort,
  ]);

  // Auto-create the first terminal/preview pane when its tab is opened.
  useEffect(() => {
    if (activeTab !== "terminal" || termIds.length > 0) return;
    const id = crypto.randomUUID();
    setTermIds([id]);
    setTermActive(id);
  }, [activeTab, termIds.length, setTermIds, setTermActive]);

  useEffect(() => {
    if (activeTab !== "preview" || previewIds.length > 0) return;
    const id = crypto.randomUUID();
    setPreviewIds([id]);
    setPreviewActive(id);
  }, [activeTab, previewIds.length, setPreviewIds, setPreviewActive]);

  // Reconcile active id if it points at a removed pane.
  useEffect(() => {
    if (termIds.length === 0) return;
    if (termActive && termIds.includes(termActive)) return;
    setTermActive(termIds[0]);
  }, [termIds, termActive, setTermActive]);

  useEffect(() => {
    if (previewIds.length === 0) return;
    if (previewActive && previewIds.includes(previewActive)) return;
    setPreviewActive(previewIds[0]);
  }, [previewIds, previewActive, setPreviewActive]);

  // PRD is session-only; bounce back to preview if a stale URL points there.
  useEffect(() => {
    if (activeTab !== "prd") return;
    void setActiveTab("preview");
  }, [activeTab, setActiveTab]);

  const tabBarValue = activeTab === "prd" ? "preview" : activeTab;

  const resolvedTermActive =
    termIds.length > 0
      ? termActive && termIds.includes(termActive)
        ? termActive
        : termIds[0]
      : "";
  const resolvedPreviewActive =
    previewIds.length > 0
      ? previewActive && previewIds.includes(previewActive)
        ? previewActive
        : previewIds[0]
      : "";

  const handleNewPreview = useCallback(() => {
    if (!isActive || previewIds.length >= MAX_PREVIEW_PANES) return;
    const id = crypto.randomUUID();
    const next = previewIds.length === 0 ? [id] : [...previewIds, id];
    setPreviewIds(next);
    setPreviewActive(id);
    void setActiveTab("preview");
  }, [isActive, previewIds, setPreviewIds, setPreviewActive, setActiveTab]);

  const handleNewTerminal = useCallback(() => {
    if (!isActive || termIds.length >= MAX_TERMINAL_PANES) return;
    const id = crypto.randomUUID();
    const next = termIds.length === 0 ? [id] : [...termIds, id];
    setTermIds(next);
    setTermActive(id);
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
          owner: { kind: "task", taskId },
          ptyInstanceId: ptyId,
        });
      } catch {
        // still remove from UI
      }
      setTermIds(next);
      if (termActive === ptyId) {
        const pick = next[removedIdx - 1] ?? next[0] ?? "";
        setTermActive(pick);
      }
    },
    [
      termIds,
      termActive,
      disconnectPtyAction,
      taskId,
      setTermIds,
      setTermActive,
    ],
  );

  const handleClosePreview = useCallback(
    (previewId: string) => {
      if (previewIds[0] === previewId) return;
      const removedIdx = previewIds.indexOf(previewId);
      if (removedIdx < 0) return;
      const next = previewIds.filter((id) => id !== previewId);
      setPreviewIds(next);
      if (previewActive === previewId) {
        const pick = next[removedIdx - 1] ?? next[0] ?? "";
        setPreviewActive(pick);
      }
    },
    [previewIds, previewActive, setPreviewIds, setPreviewActive],
  );

  const handleTabChange = useCallback(
    (tab: "preview" | "desktop" | "editor" | "terminal" | "prd") => {
      if (tab === "prd") return;
      void setActiveTab(tab);
    },
    [setActiveTab],
  );

  const newTerminalDisabled = !isActive || termIds.length >= MAX_TERMINAL_PANES;
  const newPreviewDisabled =
    !isActive || previewIds.length >= MAX_PREVIEW_PANES;

  return (
    <div className="h-full flex flex-col">
      <SandboxTabBar
        activeTab={tabBarValue}
        onTabChange={handleTabChange}
        onNewPreview={handleNewPreview}
        onNewTerminal={handleNewTerminal}
        newPreviewDisabled={newPreviewDisabled}
        newTerminalDisabled={newTerminalDisabled}
        enabledTabs={TASK_ENABLED_TABS}
      />
      <div className="flex-1 overflow-hidden bg-card">
        <div
          className={
            tabBarValue === "preview" ? "h-full flex flex-col" : "hidden"
          }
        >
          {tabBarValue === "preview" ? (
            <PreviewPaneTabs
              previewIds={previewIds}
              activeId={resolvedPreviewActive}
              onSelect={setPreviewActive}
              onClose={handleClosePreview}
            />
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            {tabBarValue === "preview" && previewIds.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Preparing preview...
              </div>
            ) : null}
            {previewIds.map((id) => (
              <div
                key={id}
                className={cn(
                  resolvedPreviewActive === id
                    ? "flex min-h-0 flex-1 flex-col"
                    : "hidden",
                )}
              >
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
            ))}
          </div>
        </div>
        <div
          className={
            tabBarValue === "terminal" ? "h-full flex flex-col" : "hidden"
          }
        >
          {tabBarValue === "terminal" ? (
            <TerminalPaneTabs
              termIds={termIds}
              activeId={resolvedTermActive}
              onSelect={setTermActive}
              onClose={handleCloseTerminal}
            />
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            {tabBarValue === "terminal" && termIds.length === 0 ? (
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
                  owner={{ kind: "task", taskId }}
                  sandboxId={sandboxId}
                  isActive={isActive}
                  ptyInstanceId={id}
                  isForeground={
                    resolvedTermActive === id && tabBarValue === "terminal"
                  }
                  runDevCommandOnConnect={id === termIds[0]}
                  devCommand={devCommand}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={tabBarValue === "editor" ? "h-full" : "hidden"}>
          <EditorPanel
            cacheKey={taskIdStr}
            sandboxId={sandboxId}
            isActive={isActive}
            repoId={repoId}
          />
        </div>
        <div className={tabBarValue === "desktop" ? "h-full" : "hidden"}>
          <DesktopPanel
            cacheKey={taskIdStr}
            sandboxId={sandboxId}
            isActive={isActive}
            repoId={repoId}
          />
        </div>
      </div>
    </div>
  );
}
