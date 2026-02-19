import { nanoid } from "nanoid";
import { basename } from "path";
import type { Session, TerminalTab, ToolType } from "../../preload/types";
import {
  insertSession,
  selectSession,
  selectAllSessions,
  deleteSessionById,
  updateActiveTabId,
  updateLastOpened,
  insertTab,
  deleteTabById,
  sessionExists,
  selectTabPtyId,
  selectLastTabId,
  selectActiveTabId,
  tabExistsInSession,
} from "../db/queries";

const TOOL_LABELS: Record<ToolType, string> = {
  claude: "Claude Code",
  opencode: "OpenCode",
  codex: "Codex",
  shell: "Shell",
};

export function createSession(repoPath: string): Session {
  const sessionId = nanoid();
  const now = Date.now();
  const name = basename(repoPath);
  insertSession(sessionId, repoPath, name, now);

  return {
    sessionId,
    repoPath,
    name,
    createdAt: now,
    tabs: [],
    activeTabId: "",
  };
}

export function getSession(sessionId: string): Session | null {
  return selectSession(sessionId);
}

export function listSessions(): Session[] {
  return selectAllSessions();
}

export function deleteSession(sessionId: string): Session | null {
  const session = selectSession(sessionId);
  if (!session) return null;
  deleteSessionById(sessionId);
  return session;
}

export function addTab(sessionId: string, tool: ToolType): TerminalTab | null {
  if (!sessionExists(sessionId)) return null;

  const tabId = nanoid();
  const ptyId = `tab-pty-${tabId}`;
  const label = TOOL_LABELS[tool];
  const now = Date.now();

  insertTab(tabId, sessionId, ptyId, tool, label, now);
  updateActiveTabId(sessionId, tabId);

  return {
    tabId,
    sessionId,
    ptyId,
    tool,
    label,
    createdAt: now,
  };
}

export function removeTab(sessionId: string, tabId: string): string | null {
  const ptyId = selectTabPtyId(sessionId, tabId);
  if (ptyId === null) return null;

  const activeTabId = selectActiveTabId(sessionId);
  deleteTabById(tabId);

  if (activeTabId === tabId) {
    const lastTabId = selectLastTabId(sessionId);
    updateActiveTabId(sessionId, lastTabId ?? "");
  }

  return ptyId;
}

export function setActiveTab(sessionId: string, tabId: string): void {
  if (tabExistsInSession(sessionId, tabId)) {
    updateActiveTabId(sessionId, tabId);
  }
}

export function touchSession(sessionId: string): void {
  updateLastOpened(sessionId);
}
