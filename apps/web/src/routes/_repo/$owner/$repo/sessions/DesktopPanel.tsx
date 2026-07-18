import { useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { IconDeviceDesktop } from "@tabler/icons-react";
import {
  SandboxIframeService,
  type StartResult,
} from "@/lib/components/sandbox/SandboxIframeService";

const AGENT_BROWSING_LOCK_TTL_MS = 30 * 60 * 1000;

interface DesktopPanelProps {
  cacheKey: string;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  /** When set with a fresh agentBrowsingAt, shows the takeover overlay. */
  sessionId?: Id<"sessions">;
  agentBrowsingAt?: number;
}

/**
 * NoVNC remote-desktop panel. Thin wrapper around `SandboxIframeService` —
 * port 6080, transforms the preview URL into a vnc_lite.html viewer URL, and
 * fires `launchChromeInDesktop` once the viewer is ready.
 *
 * Forwards `__eva_grant` onto noVNC's websockify `path` so the auth proxy can
 * authorize the WebSocket upgrade even when the Partitioned session cookie is
 * missing in a cross-site iframe (Eva app → *.vercel.run).
 *
 * Shared by Browser (first-class) and Computer (`+` menu) tabs — same Chrome.
 */
function appendNoVncParams(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = url.pathname.replace(/\/?$/, "/vnc_lite.html");
  url.searchParams.set("autoconnect", "true");
  // vnc_lite.html reads `scale` (→ rfb.scaleViewport), not the full client's
  // `resize=scale`. Without this the 1920×1080 desktop renders 1:1 and looks
  // zoomed/cropped inside the panel; with it, aspect ratio is preserved.
  url.searchParams.set("scale", "true");
  url.searchParams.set("quality", "6");
  url.searchParams.set("compression", "2");
  const grant = url.searchParams.get("__eva_grant");
  if (grant) {
    // searchParams.set encodes once; do not pre-encode the grant.
    url.searchParams.set("path", "websockify?__eva_grant=" + grant);
  }
  return url.toString();
}

function isAgentBrowsingActive(agentBrowsingAt: number | undefined): boolean {
  if (agentBrowsingAt === undefined) return false;
  return Date.now() - agentBrowsingAt < AGENT_BROWSING_LOCK_TTL_MS;
}

export function DesktopPanel({
  cacheKey,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
  sessionId,
  agentBrowsingAt,
}: DesktopPanelProps) {
  const toggleDesktopServer = useAction(api.daytona.toggleDesktopServer);
  const launchChromeInDesktop = useAction(api.daytona.launchChromeInDesktop);
  const releaseBrowserLock = useMutation(api.sessions.releaseBrowserLock);

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

  const showLockOverlay =
    sessionId !== undefined && isAgentBrowsingActive(agentBrowsingAt);

  const handleTakeControl = useCallback(() => {
    if (!sessionId) return;
    void releaseBrowserLock({ sessionId });
  }, [sessionId, releaseBrowserLock]);

  return (
    <div className="relative h-full min-h-0">
      <SandboxIframeService
        cacheNamespace="desktop-scale"
        cacheKey={cacheKey}
        sandboxId={sandboxId}
        vercelSandboxId={vercelSandboxId}
        isActive={isActive}
        repoId={repoId}
        port={6080}
        startAction={startAction}
        stopAction={stopAction}
        transformUrl={appendNoVncParams}
        onReady={handleReady}
        ensureStartedBeforeReady
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
      {showLockOverlay ? (
        <button
          type="button"
          onClick={handleTakeControl}
          className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-2 bg-background/55 px-4 text-center backdrop-blur-[1px]"
        >
          <span className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
            Agent is browsing — click to take control
          </span>
        </button>
      ) : null}
    </div>
  );
}
