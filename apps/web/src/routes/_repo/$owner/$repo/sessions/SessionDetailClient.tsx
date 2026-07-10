import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Spinner } from "@conductor/ui";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";

import type { SandboxTab } from "@/lib/search-params";

export function SessionDetailClient({
  sessionId,
  activeSandboxTab,
  onSandboxTabChange,
}: {
  sessionId: string;
  activeSandboxTab: SandboxTab;
  onSandboxTabChange: (tab: SandboxTab) => void;
}) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const messages = useQuery(api.messages.listByParent, {
    parentId: typedSessionId,
  });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: typedSessionId,
  });
  const streaming = useQuery(api.streaming.get, { entityId: typedSessionId });
  const summaryStreaming = useQuery(api.streaming.get, {
    entityId: `summary:${typedSessionId}`,
  });
  const startupStreaming = useQuery(api.streaming.get, {
    entityId: `session-startup-${typedSessionId}`,
  });
  const startSandboxMutation = useMutation(api.sessions.startSandbox);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);

  // Pre-warm the Claude daemon as soon as the session opens (once its sandbox is
  // known), so the user's first message is warm instead of paying a ~20s cold
  // respawn. Idempotent server-side (skips if a daemon is already alive), so
  // re-firing when the sandbox id resolves is cheap.
  const prewarmDaemon = useMutation(api.sessionWorkflow.prewarmDaemon);
  const sandboxId = session?.sandboxId;
  useEffect(() => {
    if (!sandboxId) return;
    void prewarmDaemon({ sessionId: typedSessionId });
  }, [typedSessionId, sandboxId, prewarmDaemon]);
  const isSandboxStarting = session?.status === "starting";
  // `stopping` is a transient backend state set synchronously by `stopSandbox`,
  // cleared once Daytona's stop call completes (~10s). Showing the spinner
  // (and disabling Start) for its full duration prevents the stop/start race
  // that previously orphaned sandboxes.
  const isSandboxStopping = session?.status === "stopping";
  const [isStopPending, setIsStopPending] = useState(false);
  const handleSandboxToggle = async (action: "start" | "stop") => {
    if (action === "start") {
      await startSandboxMutation({
        sessionId: typedSessionId,
      });
    } else {
      setIsStopPending(true);
      try {
        await stopSandboxMutation({ sessionId: typedSessionId });
      } finally {
        setIsStopPending(false);
      }
    }
  };

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">
            This session does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const isSandboxActive = session.status === "active";

  return (
    <ResizablePanelLayout
      leftPanel={({ rightPanelCollapsed, onToggleRightPanel }) => (
        <ChatPanel
          sessionId={typedSessionId}
          title={session.title}
          branchName={session.branchName}
          prUrl={session.prUrl}
          prState={session.prState}
          summary={session.summary}
          messages={messages ?? []}
          queuedMessages={queuedMessages ?? []}
          planContent={session.planContent}
          streamingActivity={streaming?.currentActivity}
          streamingContent={streaming?.currentContent}
          streamingPendingQuestion={streaming?.pendingQuestion}
          summaryStreamingActivity={summaryStreaming?.currentActivity}
          startupStreamingActivity={startupStreaming?.currentActivity}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={
            isSandboxStarting || isSandboxStopping || isStopPending
          }
          isSandboxStopping={isSandboxStopping || isStopPending}
          onSandboxToggle={handleSandboxToggle}
          isArchived={session.archived === true}
          deploymentStatus={session.deploymentStatus}
          sandboxCollapsed={rightPanelCollapsed}
          onToggleSandbox={onToggleRightPanel}
        />
      )}
      rightPanel={
        <SandboxPanel
          sessionId={typedSessionId}
          sandboxId={session.sandboxId}
          isActive={isSandboxActive}
          repoId={session.repoId}
          devPort={session.devPort}
          devCommand={session.devCommand}
          terminalPanes={session.terminalPanes}
          planContent={session.planContent}
          isArchived={session.archived === true}
          activeTab={activeSandboxTab}
          onTabChange={onSandboxTabChange}
        />
      }
      leftDefaultSize="30%"
      leftMinWidthPx={350}
      rightMinWidthPx={300}
      storageKey="sandbox-collapsed"
    />
  );
}
