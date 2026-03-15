"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback, useEffect, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Spinner } from "@conductor/ui";
import { IconGripVertical } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const CHAT_DEFAULT_SIZE = "30%";
const CHAT_MIN_EXPANDED_WIDTH_PX = 320;
const SANDBOX_MIN_WIDTH_PX = 300;

const SANDBOX_COLLAPSED_COOKIE = "sandbox-collapsed";
const ONE_YEAR = 60 * 60 * 24 * 365;

function readSandboxCollapsed(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${SANDBOX_COLLAPSED_COOKIE}=true`);
}

function writeSandboxCollapsed(collapsed: boolean) {
  document.cookie = `${SANDBOX_COLLAPSED_COOKIE}=${collapsed}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

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
  const sandboxPanelRef = usePanelRef();
  const [sandboxCollapsed, setSandboxCollapsed] =
    useState(readSandboxCollapsed);
  const [previewInfo, setPreviewInfo] = useState<{
    url: string;
    port: number;
  } | null>(null);
  const handlePreviewInfoChange = useCallback(
    (info: { url: string; port: number } | null) => setPreviewInfo(info),
    [],
  );
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (sandboxCollapsed) {
      sandboxPanelRef.current?.collapse();
    }
  }, [sandboxCollapsed, sandboxPanelRef]);

  const handleSandboxPanelToggle = () => {
    const next = !sandboxCollapsed;
    if (next) {
      sandboxPanelRef.current?.collapse();
    } else {
      sandboxPanelRef.current?.expand();
    }
    setSandboxCollapsed(next);
    writeSandboxCollapsed(next);
  };

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

  const chatPanel = (
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
      sandboxCollapsed={sandboxCollapsed}
      onToggleSandbox={handleSandboxPanelToggle}
    />
  );

  const sandboxPanel = (
    <SandboxPanel
      sessionId={sessionId}
      sandboxId={session.sandboxId}
      isActive={isSandboxActive}
      repoId={session.repoId}
      devPort={session.devPort}
      devCommand={session.devCommand}
      previewInfo={previewInfo}
      onPreviewInfoChange={handlePreviewInfoChange}
      vncEnabled={repo.sessionsVncEnabled !== false}
      vscodeEnabled={repo.sessionsVscodeEnabled !== false}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <div className={sandboxCollapsed ? "flex-1 min-h-0" : "h-1/2 min-h-0"}>
          {chatPanel}
        </div>
        {!sandboxCollapsed && (
          <>
            <div className="h-px bg-border shrink-0" />
            <div className="h-1/2 min-h-0">{sandboxPanel}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel
        defaultSize={CHAT_DEFAULT_SIZE}
        minSize={CHAT_MIN_EXPANDED_WIDTH_PX}
      >
        {chatPanel}
      </Panel>
      <Separator
        className={`w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors ${sandboxCollapsed ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-center w-3 h-full -mx-1.5 relative z-10">
          <IconGripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </Separator>
      <Panel
        collapsible
        collapsedSize={0}
        defaultSize="60%"
        minSize={SANDBOX_MIN_WIDTH_PX}
        panelRef={sandboxPanelRef}
      >
        {sandboxPanel}
      </Panel>
    </Group>
  );
}
