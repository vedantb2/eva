"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Button, Spinner } from "@conductor/ui";
import { IconLayoutSidebarRightExpand } from "@tabler/icons-react";

interface SessionDetailClientProps {
  sessionId: string;
}

const CHAT_DEFAULT_SIZE = "30%";
const CHAT_COLLAPSED_WIDTH_PX = 48;
const CHAT_MIN_EXPANDED_WIDTH_PX = 400;

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const streaming = useQuery(api.streaming.get, { entityId: sessionId });
  const [isSandboxToggling, setIsSandboxToggling] = useState(false);
  const chatPanelRef = usePanelRef();
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const lastExpandedChatSizeRef = useRef<number | string>(CHAT_DEFAULT_SIZE);

  useEffect(() => {
    if (chatCollapsed) return;
    chatPanelRef.current?.resize(lastExpandedChatSizeRef.current);
  }, [chatCollapsed, chatPanelRef]);

  const handleChatCollapse = () => {
    const currentSize = chatPanelRef.current?.getSize();
    if (currentSize && currentSize.inPixels > CHAT_COLLAPSED_WIDTH_PX) {
      lastExpandedChatSizeRef.current = `${currentSize.asPercentage}%`;
    }
    setChatCollapsed(true);
  };

  const handleChatExpand = () => {
    setChatCollapsed(false);
  };

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
    <AnimatePresence initial={false} mode="wait">
      {chatCollapsed ? (
        <motion.div
          key="collapsed-chat"
          className="flex h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-1 min-w-0">
            <SandboxPanel
              sessionId={sessionId}
              sandboxId={session.sandboxId}
              isActive={isSandboxActive}
              fileDiffs={session.fileDiffs}
            />
          </div>
          <div className="w-px bg-border" />
          <motion.div
            className="w-12 flex items-center justify-center p-1"
            initial={{ x: 8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="motion-press flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
              onClick={handleChatExpand}
            >
              <IconLayoutSidebarRightExpand size={16} />
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="expanded-chat"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize="60%" minSize={400}>
              <SandboxPanel
                sessionId={sessionId}
                sandboxId={session.sandboxId}
                isActive={isSandboxActive}
                fileDiffs={session.fileDiffs}
              />
            </Panel>
            <Separator className="w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors" />
            <Panel
              defaultSize={CHAT_DEFAULT_SIZE}
              minSize={CHAT_MIN_EXPANDED_WIDTH_PX}
              panelRef={chatPanelRef}
              onResize={(panelSize) => {
                lastExpandedChatSizeRef.current = `${panelSize.asPercentage}%`;
              }}
            >
              <motion.div
                className="h-full overflow-hidden"
                initial={{ x: 12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 12, opacity: 0 }}
                transition={{ duration: 0.22 }}
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
                  onCollapse={handleChatCollapse}
                />
              </motion.div>
            </Panel>
          </Group>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
