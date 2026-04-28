import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { IconDeviceDesktop } from "@tabler/icons-react";
import {
  SandboxIframeService,
  type StartResult,
} from "@/lib/components/sandbox/SandboxIframeService";

interface DesktopPanelProps {
  cacheKey: string;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
}

/**
 * NoVNC remote-desktop panel. Thin wrapper around `SandboxIframeService` —
 * port 6080, transforms the preview URL into a vnc_lite.html viewer URL, and
 * fires `launchChromeInDesktop` once the viewer is ready.
 */
function appendNoVncParams(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = url.pathname.replace(/\/?$/, "/vnc_lite.html");
  url.searchParams.set("autoconnect", "true");
  url.searchParams.set("resize", "scale");
  url.searchParams.set("quality", "6");
  url.searchParams.set("compression", "2");
  return url.toString();
}

export function DesktopPanel({
  cacheKey,
  sandboxId,
  isActive,
  repoId,
}: DesktopPanelProps) {
  const toggleDesktopServer = useAction(api.daytona.toggleDesktopServer);
  const launchChromeInDesktop = useAction(api.daytona.launchChromeInDesktop);

  const startAction = useCallback(async (): Promise<StartResult> => {
    if (!sandboxId) return { success: false, message: "No sandbox" };
    await toggleDesktopServer({ sandboxId, repoId, action: "start" });
    return { success: true };
  }, [sandboxId, repoId, toggleDesktopServer]);

  const stopAction = useCallback(async () => {
    if (!sandboxId) return;
    await toggleDesktopServer({ sandboxId, repoId, action: "stop" });
  }, [sandboxId, repoId, toggleDesktopServer]);

  const handleReady = useCallback(() => {
    if (!sandboxId) return;
    launchChromeInDesktop({ sandboxId, repoId }).catch(() => {});
  }, [sandboxId, repoId, launchChromeInDesktop]);

  return (
    <SandboxIframeService
      cacheNamespace="desktop"
      cacheKey={cacheKey}
      sandboxId={sandboxId}
      isActive={isActive}
      repoId={repoId}
      port={6080}
      startAction={startAction}
      stopAction={stopAction}
      transformUrl={appendNoVncParams}
      onReady={handleReady}
      maxAttempts={40}
      icon={IconDeviceDesktop}
      inactiveLabel="Start the sandbox to use the desktop"
      idleLabel="Desktop is not running"
      startLabel="Start Desktop"
      startingLabel="Starting desktop environment..."
      pollFailedError="Desktop environment failed to start. Check sandbox logs."
      startFailedError="Failed to start desktop"
      loadFailedError="Failed to load desktop"
      iframeAllow="clipboard-read; clipboard-write"
    />
  );
}
