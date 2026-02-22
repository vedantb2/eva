"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Spinner } from "@conductor/ui";
import { IconGripVertical } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { getWorkflowTokens } from "@/app/(main)/[repo]/actions";

interface SessionDetailClientProps {
  sessionId: string;
}

const CHAT_DEFAULT_SIZE = "30%";
const CHAT_MIN_EXPANDED_WIDTH_PX = 400;

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const { installationId } = useRepo();
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const streaming = useQuery(api.streaming.get, { entityId: sessionId });
  const startSandboxMutation = useMutation(api.sessions.startSandbox);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);
  const [isSandboxToggling, setIsSandboxToggling] = useState(false);
  const chatPanelRef = usePanelRef();
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const handleChatToggle = () => {
    if (chatCollapsed) {
      chatPanelRef.current?.expand();
      setChatCollapsed(false);
    } else {
      chatPanelRef.current?.collapse();
      setChatCollapsed(true);
    }
  };

  const handleSandboxToggle = async (action: "start" | "stop") => {
    setIsSandboxToggling(true);
    try {
      if (action === "start") {
        const { githubToken } = await getWorkflowTokens(installationId);
        await startSandboxMutation({ sessionId: typedSessionId, githubToken });
      } else {
        await stopSandboxMutation({ sessionId: typedSessionId });
      }
    } finally {
      setIsSandboxToggling(false);
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
    <Group orientation="horizontal" className="h-full">
      <Panel
        collapsible
        collapsedSize={0}
        defaultSize={CHAT_DEFAULT_SIZE}
        minSize={CHAT_MIN_EXPANDED_WIDTH_PX}
        panelRef={chatPanelRef}
      >
        <ChatPanel
          sessionId={sessionId}
          title={session.title}
          branchName={session.branchName}
          prUrl={session.prUrl}
          summary={session.summary}
          messages={session.messages}
          planContent={session.planContent}
          streamingActivity={streaming?.currentActivity}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={isSandboxToggling}
          onSandboxToggle={handleSandboxToggle}
        />
      </Panel>
      <Separator
        className={`w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors ${chatCollapsed ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-center w-3 h-full -mx-1.5 relative z-10">
          <IconGripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </Separator>
      <Panel defaultSize="60%" minSize={400}>
        <SandboxPanel
          sessionId={sessionId}
          sandboxId={session.sandboxId}
          isActive={isSandboxActive}
          fileDiffs={session.fileDiffs}
          chatVisible={!chatCollapsed}
          onToggleChat={handleChatToggle}
        />
      </Panel>
    </Group>
  );
}
