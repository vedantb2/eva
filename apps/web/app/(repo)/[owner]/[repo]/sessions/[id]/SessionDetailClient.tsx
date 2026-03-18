"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";

export function SessionDetailClient({
  sessionId,
}: {
  sessionId: Id<"sessions">;
}) {
  const { installationId, repo } = useRepo();
  const session = useQuery(api.sessions.get, { id: sessionId });
  const messages = useQuery(api.messages.listByParent, {
    parentId: sessionId,
  });
  const streaming = useQuery(api.streaming.get, { entityId: sessionId });
  const summaryStreaming = useQuery(api.streaming.get, {
    entityId: `summary:${sessionId}`,
  });
  const startSandboxMutation = useMutation(api.sessions.startSandbox);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);
  const isSandboxStarting = session?.status === "starting";
  const [isStopPending, setIsStopPending] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<{
    url: string;
    port: number;
  } | null>(null);
  const handlePreviewInfoChange = useCallback(
    (info: { url: string; port: number } | null) => setPreviewInfo(info),
    [],
  );

  const handleSandboxToggle = async (action: "start" | "stop") => {
    if (action === "start") {
      await startSandboxMutation({
        sessionId,
        installationId,
      });
    } else {
      setIsStopPending(true);
      try {
        await stopSandboxMutation({ sessionId });
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
          sessionId={sessionId}
          title={session.title}
          branchName={session.branchName}
          prUrl={session.prUrl}
          summary={session.summary}
          messages={messages ?? []}
          planContent={session.planContent}
          streamingActivity={streaming?.currentActivity}
          summaryStreamingActivity={summaryStreaming?.currentActivity}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={isSandboxStarting || isStopPending}
          onSandboxToggle={handleSandboxToggle}
          isArchived={session.archived === true}
          previewUrl={previewInfo?.url}
          sandboxCollapsed={rightPanelCollapsed}
          onToggleSandbox={onToggleRightPanel}
        />
      )}
      rightPanel={
        <SandboxPanel
          sessionId={sessionId}
          sandboxId={session.sandboxId}
          isActive={isSandboxActive}
          repoId={session.repoId}
          devPort={session.devPort}
          devCommand={session.devCommand}
          previewInfo={previewInfo}
          onPreviewInfoChange={handlePreviewInfoChange}
        />
      }
      leftDefaultSize="30%"
      leftMinWidthPx={350}
      rightMinWidthPx={300}
      collapseCookieName="sandbox-collapsed"
    />
  );
}
