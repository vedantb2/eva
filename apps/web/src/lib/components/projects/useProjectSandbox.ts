"use client";

import { useCallback, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { sandboxOpenParser } from "@/lib/search-params";

const PREVIEW_SANDBOX_ALLOWED_PHASES = ["active"];

export function useProjectSandbox(
  projectId: Id<"projects">,
  phase: string | undefined,
  sandboxId: string | undefined,
  reviewProjectSandboxStatus: string | undefined,
) {
  const startProjectSandboxMutation = useMutation(
    api.projects.startProjectSandbox,
  );
  const stopProjectSandboxMutation = useMutation(
    api.projects.stopProjectSandbox,
  );

  const [showSandbox, setShowSandbox] = useQueryState(
    "sandbox",
    sandboxOpenParser,
  );
  const [isStartingLocal, setIsStartingLocal] = useState(false);
  const [isStoppingLocal, setIsStoppingLocal] = useState(false);

  const canStartSandbox =
    phase !== undefined && PREVIEW_SANDBOX_ALLOWED_PHASES.includes(phase);
  const isSandboxActive = reviewProjectSandboxStatus === "active";
  const isSandboxStartingFromStatus = reviewProjectSandboxStatus === "starting";
  const isSandboxStoppingFromStatus = reviewProjectSandboxStatus === "stopping";

  const sandboxStartupStreaming = useQuery(
    api.streaming.get,
    isSandboxStartingFromStatus
      ? { entityId: `project-sandbox-startup-${projectId}` }
      : "skip",
  );

  const handleStartSandbox = useCallback(async () => {
    setIsStartingLocal(true);
    try {
      await startProjectSandboxMutation({ projectId });
      void setShowSandbox(true);
    } catch (err) {
      console.error("Failed to start project sandbox:", err);
    } finally {
      setIsStartingLocal(false);
    }
  }, [startProjectSandboxMutation, projectId, setShowSandbox]);

  const handleStopSandbox = useCallback(async () => {
    setIsStoppingLocal(true);
    try {
      await stopProjectSandboxMutation({ projectId });
    } catch (err) {
      console.error("Failed to stop project sandbox:", err);
    } finally {
      setIsStoppingLocal(false);
    }
  }, [stopProjectSandboxMutation, projectId]);

  const handleToggleSandboxView = useCallback(() => {
    void setShowSandbox((prev) => !prev);
  }, [setShowSandbox]);

  return {
    canStartSandbox,
    showSandbox,
    setShowSandbox,
    isSandboxActive,
    isSandboxStarting: isStartingLocal || isSandboxStartingFromStatus,
    isSandboxStopping: isStoppingLocal || isSandboxStoppingFromStatus,
    sandboxStartupActivity: sandboxStartupStreaming?.currentActivity,
    sandboxId,
    handleStartSandbox,
    handleStopSandbox,
    handleToggleSandboxView,
  };
}
