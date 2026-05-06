"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { useSessionStorage } from "usehooks-ts";
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
   * `preview:<sessionId>` or `task-preview:<taskId>`. Final keys include the
   * sandbox ID, port, and preview-url behavior version.
   */
  cacheScope: string;
}

/**
 * Drives the WebPreview pane: resolves a sandbox+port to a live URL, polls
 * until the dev server is reachable, and caches the resolved URL in
 * sessionStorage (via `useSessionStorage`) so navigating back doesn't
 * re-fetch. Used by both the session and quick-task sandbox panels.
 */
export function useSandboxPreview({
  sandboxId,
  isActive,
  repoId,
  devPort,
  cacheScope,
}: UseSandboxPreviewArgs): SandboxPreviewApi {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPort] = useQueryState("port", previewPortParser);
  const effectivePort = port ?? devPort ?? 3000;

  // sessionStorage is both cache and live state — when port or sandboxId
  // changes useSessionStorage re-reads the new key automatically. sandboxId is
  // part of the key because Daytona signed preview URLs embed the sandbox ID
  // in the subdomain; reusing a cached URL after the sandbox is destroyed and
  // recreated would 400 with "Sandbox not found".
  const [previewInfo, setPreviewInfo] = useSessionStorage<PreviewInfo | null>(
    `conductor:${cacheScope}:nav-sync-v1:${sandboxId ?? "no-sandbox"}:${effectivePort}`,
    null,
  );

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
  }, [
    sandboxId,
    isActive,
    getPreviewUrl,
    stopPolling,
    repoId,
    effectivePort,
    setPreviewInfo,
  ]);

  useEffect(() => {
    if (isActive && sandboxId) {
      // useSessionStorage already hydrated `previewInfo` from cache; only
      // fetch if there isn't one yet for this port.
      if (previewInfo) return;
      fetchPreview();
    }
    if (!isActive) {
      setPreviewInfo(null);
    }
    return stopPolling;
    // We intentionally omit `previewInfo` from deps — re-running on every
    // cache write would cause a fetch loop. The cached value is only checked
    // on (isActive, sandboxId, port) transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
