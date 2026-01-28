"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";

interface SessionDetailClientProps {
  sessionId: string;
}

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const [isSandboxToggling, setIsSandboxToggling] = useState(false);

  const handleSandboxToggle = async (action: "start" | "stop") => {
    setIsSandboxToggling(true);
    try {
      const response = await fetch("/api/sessions/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-neutral-500">
            This session does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const isSandboxActive = session.status === "active";

  return (
    <div className="flex h-full">
      <div className="w-3/5 shadow-small">
        <SandboxPanel
          sessionId={sessionId}
          sandboxId={session.sandboxId}
          isActive={isSandboxActive}
        />
      </div>
      <div className="w-2/5">
        <ChatPanel
          sessionId={sessionId}
          title={session.title}
          branchName={session.branchName}
          prUrl={session.prUrl}
          messages={session.messages}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={isSandboxToggling}
          onSandboxToggle={handleSandboxToggle}
        />
      </div>
    </div>
  );
}
