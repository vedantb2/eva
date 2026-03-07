"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner, Button } from "@conductor/ui";
import {
  IconDeviceDesktop,
  IconRefresh,
  IconMaximize,
  IconExternalLink,
} from "@tabler/icons-react";
import { ensureHttps } from "@/lib/utils/ensureHttps";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { createSessionCache } from "@/lib/utils/sessionCache";

type DesktopState = "idle" | "starting" | "running" | "error";

const desktopCache = createSessionCache("desktop");

function appendNoVncParams(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = url.pathname.replace(/\/?$/, "/vnc_lite.html");
  url.searchParams.set("autoconnect", "true");
  url.searchParams.set("resize", "scale");
  url.searchParams.set("quality", "6");
  url.searchParams.set("compression", "2");
  return url.toString();
}

interface DesktopPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  tabSwitcher: ReactNode;
  repoId: Id<"githubRepos">;
  enabled?: boolean;
}

export function DesktopPanel({
  sessionId,
  sandboxId,
  isActive,
  repoId,
  tabSwitcher,
  enabled = true,
}: DesktopPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [desktopState, setDesktopState] = useState<DesktopState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attempts = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);
  const toggleDesktopServer = useAction(api.daytona.toggleDesktopServer);
  const launchChromeInDesktop = useAction(api.daytona.launchChromeInDesktop);

  const stopPolling = useCallback(() => {
    clearTimeout(pollTimer.current);
    pollTimer.current = undefined;
  }, []);

  const pollForReady = useCallback(async () => {
    if (!sandboxId || !isActive) return;
    attempts.current = 0;

    const check = async () => {
      try {
        const data = await getPreviewUrl({
          sandboxId,
          port: 6080,
          checkReady: true,
          repoId,
        });
        if (data.ready) {
          await dismissDaytonaWarning(data.url);
          const noVncUrl = appendNoVncParams(data.url);
          setUrl(noVncUrl);
          setDesktopState("running");
          desktopCache.set(sessionId, noVncUrl);
          launchChromeInDesktop({ sandboxId, repoId }).catch(() => {});
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 40) {
          setError("Desktop environment failed to start. Check sandbox logs.");
          setDesktopState("error");
          return;
        }
        pollTimer.current = setTimeout(check, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load desktop");
        setDesktopState("error");
      }
    };

    check();
  }, [
    sandboxId,
    isActive,
    getPreviewUrl,
    repoId,
    sessionId,
    launchChromeInDesktop,
  ]);

  const startDesktop = useCallback(async () => {
    if (!sandboxId) return;
    setDesktopState("starting");
    setError(null);
    setUrl(null);
    stopPolling();
    try {
      const existing = await getPreviewUrl({
        sandboxId,
        port: 6080,
        checkReady: true,
        repoId,
      });
      if (existing.ready) {
        await dismissDaytonaWarning(existing.url);
        const noVncUrl = appendNoVncParams(existing.url);
        setUrl(noVncUrl);
        setDesktopState("running");
        desktopCache.set(sessionId, noVncUrl);
        launchChromeInDesktop({ sandboxId, repoId }).catch(() => {});
        return;
      }
      await toggleDesktopServer({ sandboxId, repoId, action: "start" });
      await pollForReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start desktop");
      setDesktopState("error");
    }
  }, [
    sandboxId,
    repoId,
    toggleDesktopServer,
    pollForReady,
    stopPolling,
    getPreviewUrl,
    sessionId,
    launchChromeInDesktop,
  ]);

  useEffect(() => {
    if (isActive && sandboxId && desktopState === "idle") {
      const cached = desktopCache.get(sessionId);
      if (cached) {
        setUrl(cached);
        setDesktopState("running");
        return;
      }
      startDesktop();
    }
    if (!isActive) {
      desktopCache.clear(sessionId);
    }
    return stopPolling;
  }, [isActive, sandboxId, desktopState, startDesktop, stopPolling, sessionId]);

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

  if (!enabled) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconDeviceDesktop className="w-12 h-12 opacity-50" />
          <p className="text-sm">Desktop (VNC) is disabled</p>
          <p className="text-xs text-muted-foreground/70">
            Enable it in repository settings under Config.
          </p>
        </div>
      </div>
    );
  }

  if (!isActive || !sandboxId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconDeviceDesktop className="w-12 h-12 opacity-50" />
          <p className="text-sm">Start the sandbox to use the desktop</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className="flex items-center gap-1 border-b p-2">
        {tabSwitcher}
        <div className="ml-auto flex items-center gap-1">
          {url && desktopState === "running" && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={toggleFullscreen}
              >
                <IconMaximize className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => window.open(url, "_blank")}
              >
                <IconExternalLink className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {desktopState === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">
              Starting desktop environment...
            </p>
          </div>
        )}
        {desktopState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="secondary" onClick={startDesktop}>
              <IconRefresh className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        )}
        {url && desktopState === "running" && (
          <iframe
            src={ensureHttps(url)}
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
