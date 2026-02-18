import { nanoid } from "nanoid";
import type { Session, TerminalTab, ToolType } from "../../preload/types";
import { basename } from "path";

const sessions = new Map<string, Session>();

const TOOL_LABELS: Record<ToolType, string> = {
  claude: "Claude Code",
  opencode: "OpenCode",
  codex: "Codex",
  shell: "Shell",
};

export function createSession(repoPath: string): Session {
  const sessionId = nanoid();
  const session: Session = {
    sessionId,
    repoPath,
    name: basename(repoPath),
    createdAt: Date.now(),
    tabs: [],
    activeTabId: "",
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) ?? null;
}

export function listSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function deleteSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  sessions.delete(sessionId);
  return session;
}

export function addTab(sessionId: string, tool: ToolType): TerminalTab | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const tabId = nanoid();
  const tab: TerminalTab = {
    tabId,
    sessionId,
    ptyId: `tab-pty-${tabId}`,
    tool,
    label: TOOL_LABELS[tool],
    createdAt: Date.now(),
  };

  session.tabs.push(tab);
  session.activeTabId = tabId;
  return tab;
}

export function removeTab(sessionId: string, tabId: string): string | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const tab = session.tabs.find((t) => t.tabId === tabId);
  if (!tab) return null;

  session.tabs = session.tabs.filter((t) => t.tabId !== tabId);

  if (session.activeTabId === tabId && session.tabs.length > 0) {
    session.activeTabId = session.tabs[session.tabs.length - 1].tabId;
  }

  return tab.ptyId;
}

export function setActiveTab(sessionId: string, tabId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (session.tabs.some((t) => t.tabId === tabId)) {
    session.activeTabId = tabId;
  }
}
