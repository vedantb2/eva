"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxTabParser, previewPortParser } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger, Button } from "@conductor/ui";
import {
  IconWorld,
  IconCode,
  IconTerminal2,
  IconDeviceDesktop,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { TerminalPanel } from "./TerminalPanel";
import { WebPreviewPanel } from "./WebPreviewPanel";
import { EditorPanel } from "./EditorPanel";
import { DesktopPanel } from "./DesktopPanel";

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
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  chatVisible?: boolean;
  onToggleChat?: () => void;
  repoId: Id<"githubRepos">;
  devPort?: number;
  devCommand?: string;
}

export function SandboxPanel({
  sessionId,
  sandboxId,
  isActive,
  chatVisible,
  onToggleChat,
  repoId,
  devPort,
  devCommand,
}: SandboxPanelProps) {
  const [activeTab, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPort] = useQueryState("port", previewPortParser);
  const effectivePort = devPort ?? port;
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
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
  ]);

  const terminal = useMemo(
    () => (
      <TerminalPanel
        sessionId={sessionId}
        sandboxId={sandboxId}
        isActive={isActive}
        devCommand={devCommand}
      />
    ),
    [sessionId, sandboxId, isActive, devCommand],
  );

  const tabSwitcher = (
    <div className="flex items-center gap-2">
      {onToggleChat && (
        <Button
          size="icon"
          variant="ghost"
          className="size-10 motion-press hover:scale-[1.03] active:scale-[0.97]"
          onClick={onToggleChat}
        >
          {chatVisible ? (
            <IconLayoutSidebarLeftCollapse className="size-4" />
          ) : (
            <IconLayoutSidebarLeftExpand className="size-4" />
          )}
        </Button>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (
            v === "preview" ||
            v === "editor" ||
            v === "terminal" ||
            v === "desktop"
          ) {
            setActiveTab(v);
          }
        }}
      >
        <TabsList className="gap-1">
          <TabsTrigger value="preview">
            <IconWorld className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="desktop">
            <IconDeviceDesktop className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="editor">
            <IconCode className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="terminal">
            <IconTerminal2 className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "preview" ? "h-full" : "hidden"}>
          <WebPreviewPanel
            isActive={isActive}
            sandboxId={sandboxId}
            previewInfo={previewInfo}
            isLoading={isLoading}
            error={error}
            iframeKey={iframeKey}
            onRefresh={fetchPreview}
            tabSwitcher={tabSwitcher}
            port={effectivePort}
            onPortChange={setPort}
          />
        </div>
        <div className={activeTab === "editor" ? "h-full" : "hidden"}>
          <EditorPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
            tabSwitcher={tabSwitcher}
            repoId={repoId}
          />
        </div>
        <div className={activeTab === "terminal" ? "h-full" : "hidden"}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-1 border-b p-2">
              {tabSwitcher}
            </div>
            <div className="flex-1 min-h-0">{terminal}</div>
          </div>
        </div>
        <div className={activeTab === "desktop" ? "h-full" : "hidden"}>
          <DesktopPanel
            sessionId={sessionId}
            sandboxId={sandboxId}
            isActive={isActive}
            tabSwitcher={tabSwitcher}
            repoId={repoId}
          />
        </div>
      </div>
    </div>
  );
}
