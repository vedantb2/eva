import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@conductor/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@conductor/ui";
import { IconPlus, IconX, IconTerminal2 } from "@tabler/icons-react";
import { TerminalView } from "../components/terminal/TerminalView";
import { useSessionContext } from "../contexts/SessionContext";
import type { Session, ToolType, TerminalTab } from "../../preload/types";

const TOOL_OPTIONS: { value: ToolType; label: string }[] = [
  { value: "claude", label: "Claude Code" },
  { value: "opencode", label: "OpenCode" },
  { value: "codex", label: "Codex" },
  { value: "shell", label: "Shell" },
];

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessions, setActiveSessionId, refreshSession } = useSessionContext();
  const [activeTabId, setActiveTabId] = useState<string>("");

  const session: Session | undefined = sessions.find(
    (s) => s.sessionId === sessionId,
  );

  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  }, [sessionId, setActiveSessionId]);

  useEffect(() => {
    if (session && session.tabs.length > 0) {
      const hasActiveTab = session.tabs.some((t) => t.tabId === activeTabId);
      if (!hasActiveTab) {
        setActiveTabId(session.activeTabId || session.tabs[0].tabId);
      }
    }
  }, [session, activeTabId]);

  const handleAddTab = useCallback(
    async (tool: ToolType) => {
      if (!sessionId) return;
      await window.electronAPI.tabCreate({ sessionId, tool });
      await refreshSession(sessionId);
    },
    [sessionId, refreshSession],
  );

  const handleCloseTab = useCallback(
    async (tabId: string) => {
      if (!sessionId || !session) return;
      if (session.tabs.length <= 1) return;
      await window.electronAPI.tabClose(sessionId, tabId);
      await refreshSession(sessionId);
    },
    [sessionId, session, refreshSession],
  );

  if (!sessionId) {
    navigate("/");
    return null;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Session not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-9 shrink-0 border-b border-border bg-background overflow-x-auto">
        {session.tabs.map((tab) => (
          <TabButton
            key={tab.tabId}
            tab={tab}
            isActive={tab.tabId === activeTabId}
            canClose={session.tabs.length > 1}
            onClick={() => setActiveTabId(tab.tabId)}
            onClose={() => handleCloseTab(tab.tabId)}
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 mx-1 shrink-0"
              title="Add tab"
            >
              <IconPlus size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TOOL_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleAddTab(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-h-0 relative">
        {session.tabs.map((tab) => (
          <TerminalView
            key={tab.ptyId}
            ptyId={tab.ptyId}
            visible={tab.tabId === activeTabId}
          />
        ))}
      </div>
    </div>
  );
}

interface TabButtonProps {
  tab: TerminalTab;
  isActive: boolean;
  canClose: boolean;
  onClick: () => void;
  onClose: () => void;
}

function TabButton({
  tab,
  isActive,
  canClose,
  onClick,
  onClose,
}: TabButtonProps) {
  return (
    <div
      className={`group flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-border text-xs select-none shrink-0 ${
        isActive
          ? "bg-card text-foreground border-b-2 border-b-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <IconTerminal2 size={12} />
      <span>{tab.label}</span>
      {canClose && (
        <button
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <IconX size={10} />
        </button>
      )}
    </div>
  );
}
