import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { IconCode } from "@tabler/icons-react";
import {
  SandboxIframeService,
  type StartResult,
} from "@/lib/components/sandbox/SandboxIframeService";

interface EditorPanelProps {
  cacheKey: string;
  sandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
}

/**
 * Code-server (in-browser VS Code) panel. Thin wrapper around
 * `SandboxIframeService` — supplies the port (8080), the toggle action, and
 * editor-specific copy. State machine + UI live in the shared component.
 */
export function EditorPanel({
  cacheKey,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
}: EditorPanelProps) {
  const toggleCodeServer = useAction(api.daytona.toggleCodeServer);

  const startAction = useCallback(async (): Promise<StartResult> => {
    if (!sandboxId) return { success: false, message: "No sandbox" };
    return toggleCodeServer({ sandboxId, repoId, action: "start" });
  }, [sandboxId, repoId, toggleCodeServer]);

  const stopAction = useCallback(async () => {
    if (!sandboxId) return;
    await toggleCodeServer({ sandboxId, repoId, action: "stop" });
  }, [sandboxId, repoId, toggleCodeServer]);

  return (
    <SandboxIframeService
      cacheNamespace="editor"
      cacheKey={cacheKey}
      sandboxId={sandboxId}
      vercelSandboxId={vercelSandboxId}
      isActive={isActive}
      repoId={repoId}
      port={8080}
      startAction={startAction}
      stopAction={stopAction}
      maxAttempts={20}
      icon={IconCode}
      inactiveLabel="Start the sandbox to use the editor"
      idleLabel="Editor is not running"
      startLabel="Start Editor"
      startingLabel="Starting editor..."
      pollFailedError="Editor failed to start. Check sandbox logs."
      startFailedError="Failed to start editor"
      loadFailedError="Failed to load editor"
      iframeAllow="clipboard-read; clipboard-write"
    />
  );
}
