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
}

function clearLegacyPreviewUrlCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("conductor:") && key.includes(":nav-sync-")) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

/**
 * Drives the WebPreview pane: resolves a sandbox+port to a live URL and polls
 * until the dev server is reachable. Signed Daytona preview URLs are kept in
 * memory only because persisting them can resurrect stale iframe targets.
 */
export function useSandboxPreview({
  sandboxId,
  isActive,
  repoId,
  devPort,
}: UseSandboxPreviewArgs): SandboxPreviewApi {
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPort] = useQueryState("port", previewPortParser);
  const effectivePort = port ?? devPort ?? 3000;

  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clearLegacyPreviewUrlCache();
  }, []);

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
        navigationSync: true,
        repoId,
      });
      if (data.ready) {
        await dismissDaytonaWarning(data.url);
        setPreviewInfo(data);
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
  }, [sandboxId, isActive, getPreviewUrl, stopPolling, repoId, effectivePort]);

  useEffect(() => {
    if (isActive && sandboxId) {
      setPreviewInfo(null);
      fetchPreview();
    }
    if (!isActive) {
      setPreviewInfo(null);
      setIsLoading(false);
    }
    return stopPolling;
  }, [isActive, sandboxId, effectivePort, fetchPreview, stopPolling]);

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
