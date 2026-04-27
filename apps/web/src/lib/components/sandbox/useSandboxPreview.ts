"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { previewPortParser } from "@/lib/search-params";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";

export interface PreviewInfo {
  url: string;
  port: number;
}

export interface SandboxPreviewApi {
  previewInfo: PreviewInfo | null;
  isLoading: boolean;
  error: string | null;
  iframeKey: number;
  fetchPreview: () => Promise<void>;
  effectivePort: number;
  setPort: (next: number | null) => Promise<URLSearchParams>;
}

interface UseSandboxPreviewArgs {
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  devPort?: number;
  /**
   * Full sessionStorage namespace for cached preview URLs — e.g.
   * `preview:<sessionId>` or `task-preview:<taskId>`. Final keys take the
   * shape `conductor:<cacheScope>:<port>`.
   */
  cacheScope: string;
}

function readCache(cacheScope: string, port: number): PreviewInfo | null {
  try {
    const raw = sessionStorage.getItem(`conductor:${cacheScope}:${port}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url: string; port: number };
    return { url: parsed.url, port: parsed.port };
  } catch {
    return null;
  }
}

function writeCache(cacheScope: string, info: PreviewInfo) {
  sessionStorage.setItem(
    `conductor:${cacheScope}:${info.port}`,
    JSON.stringify({ url: info.url, port: info.port }),
  );
}

function clearCache(cacheScope: string, port: number) {
  sessionStorage.removeItem(`conductor:${cacheScope}:${port}`);
}

/**
 * Drives the WebPreview pane: resolves a sandbox+port to a live URL, polls
 * until the dev server is reachable, and caches the resolved URL in
 * sessionStorage so navigating back doesn't re-fetch. Used by both the
 * session and quick-task sandbox panels.
 */
export function useSandboxPreview({
  sandboxId,
  isActive,
  repoId,
  devPort,
  cacheScope,
}: UseSandboxPreviewArgs): SandboxPreviewApi {
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
        writeCache(cacheScope, data);
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
    cacheScope,
  ]);

  useEffect(() => {
    if (isActive && sandboxId) {
      const cached = readCache(cacheScope, effectivePort);
      if (cached) {
        setPreviewInfo(cached);
        return;
      }
      fetchPreview();
    }
    if (!isActive) {
      clearCache(cacheScope, effectivePort);
    }
    return stopPolling;
  }, [
    isActive,
    sandboxId,
    fetchPreview,
    stopPolling,
    cacheScope,
    effectivePort,
  ]);

  return {
    previewInfo,
    isLoading,
    error,
    iframeKey,
    fetchPreview,
    effectivePort,
    setPort,
  };
}
