"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Button, Spinner } from "@conductor/ui";
import { IconLayoutSidebarRightExpand } from "@tabler/icons-react";

interface SessionDetailClientProps {
  sessionId: string;
}

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const streaming = useQuery(api.streaming.get, { entityId: sessionId });
  const [isSandboxToggling, setIsSandboxToggling] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const handleSandboxToggle = async (action: "start" | "stop") => {
    setIsSandboxToggling(true);
    try {
      const eventName =
        action === "start" ? "session/sandbox.start" : "session/sandbox.stop";
      const response = await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: eventName, data: { sessionId } }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle sandbox");
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
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-hidden">
        <SandboxPanel
          sessionId={sessionId}
          sandboxId={session.sandboxId}
          isActive={isSandboxActive}
          fileDiffs={session.fileDiffs}
        />
      </div>
      <div
        className={`${chatCollapsed ? "w-12" : "w-2/5"} flex flex-col transition-all duration-200`}
      >
        {chatCollapsed ? (
          <div className="flex items-center justify-center p-1">
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => setChatCollapsed(false)}
            >
              <IconLayoutSidebarRightExpand size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
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
              onCollapse={() => setChatCollapsed(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
