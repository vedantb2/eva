"use client";

import { useEffect, useRef, useState } from "react";
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
  /**
   * False while this session shell is cached-but-hidden. Stops clearing the
   * iframe when a sibling session's `?port=` (or effect re-subscribe) churns.
   */
  isRouteActive?: boolean;
  repoId: Id<"githubRepos">;
  devPort?: number;
  /** Fired when the user changes Preview port (sessions → Convex sticky). */
  onPortPersist?: (port: number) => void;
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
  isRouteActive = true,
  repoId,
  devPort,
  onPortPersist,
}: UseSandboxPreviewArgs): SandboxPreviewApi {
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [port, setPortQuery] = useQueryState("port", previewPortParser);
  const effectivePort = port ?? devPort ?? 3000;

  const setPort = async (next: number | null) => {
    const params = await setPortQuery(next);
    if (next !== null) {
      onPortPersist?.(next);
    }
    return params;
  };

  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Poll generation. An in-flight getPreviewUrl continuation used to re-arm the
  // 3s timer AFTER the isActive-flip cleanup ran (stale closure with the old
  // isActive=true), so the poll chain kept hitting the backend forever after a
  // sandbox stop — which on Vercel resumed the stopped sandbox. Each config
  // change bumps the generation; stale continuations see the mismatch and bail.
  const generationRef = useRef(0);
  // Last URL painted into the iframe — skip iframeKey bumps when revalidation
  // returns the same signed URL (session switch keep-alive / effect re-run).
  const loadedUrlRef = useRef<string | null>(null);
  const configKey = `${sandboxId ?? ""}:${effectivePort}`;
  const prevConfigKeyRef = useRef(configKey);

  useEffect(() => {
    clearLegacyPreviewUrlCache();
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchPreview = async () => {
    if (!sandboxId || !isActive) return;
    const generation = generationRef.current;
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
      // Config changed (sandbox stopped / port switched) while the request was
      // in flight — drop the result and do NOT re-arm the poll timer.
      if (generation !== generationRef.current) return;
      if (data.ready) {
        await dismissDaytonaWarning(data.url);
        if (generation !== generationRef.current) return;
        if (loadedUrlRef.current !== data.url) {
          loadedUrlRef.current = data.url;
          setIframeKey((k) => k + 1);
        }
        setPreviewInfo(data);
        setIsLoading(false);
      } else {
        pollingRef.current = setTimeout(() => {
          void fetchPreview();
        }, 3000);
      }
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load preview");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cached-but-hidden session: keep the iframe, pause polling. Do not clear
    // previewInfo — returning to this session must not flash/reload.
    if (!isRouteActive) {
      stopPolling();
      return stopPolling;
    }

    const configChanged = prevConfigKeyRef.current !== configKey;
    prevConfigKeyRef.current = configKey;
    generationRef.current++;

    if (!isActive) {
      loadedUrlRef.current = null;
      setPreviewInfo(null);
      setIsLoading(false);
      return stopPolling;
    }
    if (!sandboxId) {
      return stopPolling;
    }

    // Sandbox/port identity changed → blank and reload. Same identity (e.g.
    // becoming route-active again after a sibling session) → revalidate in
    // place without wiping the cached iframe.
    if (configChanged) {
      loadedUrlRef.current = null;
      setPreviewInfo(null);
    }
    void fetchPreview();
    return stopPolling;
  }, [isRouteActive, isActive, sandboxId, configKey]);

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
