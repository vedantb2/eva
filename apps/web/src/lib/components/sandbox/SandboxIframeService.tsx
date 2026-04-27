"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import {
  IconRefresh,
  IconMaximize,
  IconExternalLink,
  IconPlayerStop,
} from "@tabler/icons-react";
import { ensureHttps } from "@/lib/utils/ensureHttps";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { createSessionCache } from "@/lib/utils/sessionCache";

type ServiceState = "idle" | "starting" | "running" | "error";

/**
 * Result shape the start callback must return. Mirrors `toggleCodeServer` —
 * desktop's toggle has no useful return so its wrapper returns `{ success: true }`.
 */
export interface StartResult {
  success: boolean;
  message?: string;
  logs?: string;
}

interface SandboxIframeServiceProps {
  /** sessionStorage namespace for caching the resolved iframe URL. */
  cacheNamespace: string;
  cacheKey: string;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  port: number;
  /** Caller-bound Convex action to start the service. */
  startAction: () => Promise<StartResult>;
  /** Caller-bound Convex action to stop the service. */
  stopAction: () => Promise<unknown>;
  /** Optional URL transform applied after preview URL resolves. */
  transformUrl?: (url: string) => string;
  /** Optional side-effect when the service becomes ready (e.g. launch chrome). */
  onReady?: (url: string) => void;
  /** Maximum poll attempts before declaring failure. */
  maxAttempts: number;
  /** Tabler icon shown in the inactive / idle empty states. */
  icon: ComponentType<{ className?: string }>;
  /** Shown when the sandbox itself isn't running. */
  inactiveLabel: string;
  /** Shown when the service is idle (sandbox up, service stopped). */
  idleLabel: string;
  /** Label for the start button. */
  startLabel: string;
  /** Label shown beside the spinner during startup. */
  startingLabel: string;
  /** Error prefix used when polling exhausts max attempts. */
  pollFailedError: string;
  /** Generic error fallback when the start action throws. */
  startFailedError: string;
  /** Generic error fallback when polling throws. */
  loadFailedError: string;
  /** Optional `allow` attribute on the iframe (e.g. clipboard). */
  iframeAllow?: string;
}

/**
 * Generic sandbox-service iframe panel. Shared by `EditorPanel` (code-server,
 * port 8080) and `DesktopPanel` (NoVNC, port 6080) — their state machines,
 * polling, sessionStorage cache, fullscreen toggle, and header buttons are
 * identical; only the port, action, URL transform, and copy differ.
 */
export function SandboxIframeService({
  cacheNamespace,
  cacheKey,
  sandboxId,
  isActive,
  repoId,
  port,
  startAction,
  stopAction,
  transformUrl,
  onReady,
  maxAttempts,
  icon: Icon,
  inactiveLabel,
  idleLabel,
  startLabel,
  startingLabel,
  pollFailedError,
  startFailedError,
  loadFailedError,
  iframeAllow,
}: SandboxIframeServiceProps) {
  const cacheRef = useRef(createSessionCache(cacheNamespace));
  const cache = cacheRef.current;

  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<ServiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempts = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const stopPolling = useCallback(() => {
    clearTimeout(pollTimer.current);
    pollTimer.current = undefined;
  }, []);

  const acceptReady = useCallback(
    (rawUrl: string) => {
      const finalUrl = transformUrl ? transformUrl(rawUrl) : rawUrl;
      setUrl(finalUrl);
      setState("running");
      cache.set(cacheKey, finalUrl);
      onReady?.(finalUrl);
    },
    [cache, cacheKey, transformUrl, onReady],
  );

  const pollForReady = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    attempts.current = 0;

    const check = async () => {
      try {
        const data = await getPreviewUrl({
          sandboxId,
          port,
          checkReady: true,
          repoId,
        });
        if (data.ready) {
          await dismissDaytonaWarning(data.url);
          acceptReady(data.url);
          return;
        }
        attempts.current += 1;
        if (attempts.current >= maxAttempts) {
          setError(pollFailedError);
          setState("error");
          return;
        }
        pollTimer.current = setTimeout(check, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : loadFailedError);
        setState("error");
      }
    };

    check();
  }, [
    sandboxId,
    isActive,
    getPreviewUrl,
    port,
    repoId,
    maxAttempts,
    acceptReady,
    pollFailedError,
    loadFailedError,
  ]);

  const start = useCallback(async () => {
    if (!sandboxId) return;
    setState("starting");
    setError(null);
    setUrl(null);
    stopPolling();
    try {
      const existing = await getPreviewUrl({
        sandboxId,
        port,
        checkReady: true,
        repoId,
      });
      if (existing.ready) {
        await dismissDaytonaWarning(existing.url);
        acceptReady(existing.url);
        return;
      }
      const result = await startAction();
      if (!result.success) {
        const msg = result.logs
          ? `${result.message ?? startFailedError}\n\nLogs:\n${result.logs}`
          : (result.message ?? startFailedError);
        setError(msg);
        setState("error");
        return;
      }
      await pollForReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : startFailedError);
      setState("error");
    }
  }, [
    sandboxId,
    port,
    repoId,
    getPreviewUrl,
    stopPolling,
    acceptReady,
    startAction,
    pollForReady,
    startFailedError,
  ]);

  const stop = useCallback(async () => {
    if (!sandboxId) return;
    stopPolling();
    setState("idle");
    setUrl(null);
    setError(null);
    cache.clear(cacheKey);
    try {
      await stopAction();
    } catch {
      // best-effort stop
    }
  }, [sandboxId, stopPolling, cache, cacheKey, stopAction]);

  // Hydrate from sessionStorage cache when the sandbox is up; clear on stop.
  useEffect(() => {
    if (isActive && sandboxId && state === "idle") {
      const cached = cache.get(cacheKey);
      if (cached) {
        setUrl(cached);
        setState("running");
      }
    }
    if (!isActive) {
      cache.clear(cacheKey);
    }
    return stopPolling;
  }, [isActive, sandboxId, state, stopPolling, cache, cacheKey]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // `isFullscreen` is owned here for the API symmetry with the original
  // panels; we don't currently render anything different based on it, but it
  // could drive an icon swap in the future. Reading it keeps lint happy.
  void isFullscreen;

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Icon className="w-12 h-12 opacity-50" />
        <p className="text-sm">{inactiveLabel}</p>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Icon className="w-12 h-12 opacity-50" />
        <p className="text-sm">{idleLabel}</p>
        <Button size="sm" variant="secondary" onClick={start}>
          {startLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {url && state === "running" && (
        <div className="flex items-center justify-end gap-1 pb-1 mb-1 px-2 py-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={toggleFullscreen}
          >
            <IconMaximize className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={stop}
          >
            <IconPlayerStop className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {state === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">{startingLabel}</p>
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-4">
            <pre className="text-sm text-destructive whitespace-pre-wrap max-w-full max-h-48 overflow-auto bg-destructive/5 p-3 rounded-md">
              {error}
            </pre>
            <Button size="sm" variant="secondary" onClick={start}>
              <IconRefresh className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {url && state === "running" && (
          <iframe
            src={ensureHttps(url)}
            className="absolute inset-0 w-full h-full border-0"
            allow={iframeAllow}
          />
        )}
      </div>
    </div>
  );
}
