"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { cn, Spinner } from "@conductor/ui";
import { previewPortParser } from "@/lib/search-params";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import {
  IconBrowser,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";

interface PreviewInfo {
  url: string;
  port: number;
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

export function TaskSandboxPanel({
  taskId,
  sandboxId,
  isActive,
  repoId,
  devPort,
}: TaskSandboxPanelProps) {
  const taskIdStr = String(taskId);
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

  const handleRefresh = useCallback(() => {
    clearCachedPreview(taskIdStr, effectivePort);
    setPreviewInfo(null);
    fetchPreview();
  }, [taskIdStr, effectivePort, fetchPreview]);

  const handleOpenExternal = useCallback(() => {
    if (previewInfo?.url) {
      window.open(previewInfo.url, "_blank");
    }
  }, [previewInfo]);

  const handlePortChange = useCallback(
    (newPort: number) => {
      clearCachedPreview(taskIdStr, effectivePort);
      setPreviewInfo(null);
      void setPort(newPort);
    },
    [taskIdStr, effectivePort, setPort],
  );

  if (!isActive || !sandboxId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <IconBrowser className="h-12 w-12 opacity-50" />
        <p className="text-sm">Sandbox not active</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header bar with controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 shrink-0">
        <IconBrowser size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">Preview</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Port:</label>
          <input
            type="number"
            value={effectivePort}
            onChange={(e) => handlePortChange(Number(e.target.value))}
            className="w-16 px-1.5 py-0.5 text-xs rounded bg-background"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh preview"
        >
          <IconRefresh size={14} className={cn(isLoading && "animate-spin")} />
        </button>
        <button
          onClick={handleOpenExternal}
          disabled={!previewInfo?.url}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
          title="Open in new tab"
        >
          <IconExternalLink size={14} />
        </button>
      </div>

      {/* Preview content */}
      <div className="flex-1 min-h-0 relative">
        {isLoading && !previewInfo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Spinner size="lg" />
              <p className="text-sm">Starting dev server...</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {previewInfo ? (
          <iframe
            key={iframeKey}
            src={previewInfo.url}
            className="w-full h-full"
            title="Task Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        ) : null}
      </div>
    </div>
  );
}
