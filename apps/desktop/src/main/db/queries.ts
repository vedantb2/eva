import { getDatabase } from "./database";
import type { Session, TerminalTab, ToolType } from "../../preload/types";

const VALID_TOOLS: Record<string, ToolType> = {
  claude: "claude",
  opencode: "opencode",
  codex: "codex",
  shell: "shell",
};

function toToolType(raw: string): ToolType {
  const tool = VALID_TOOLS[raw];
  if (tool) return tool;
  return "shell";
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function parseTabRow(raw: unknown): TerminalTab | null {
  if (!isRecord(raw)) return null;
  return {
    tabId: String(raw["tab_id"]),
    sessionId: String(raw["session_id"]),
    ptyId: String(raw["pty_id"]),
    tool: toToolType(String(raw["tool"])),
    label: String(raw["label"]),
    createdAt: Number(raw["created_at"]),
  };
}

function parseTabRows(rows: unknown[]): TerminalTab[] {
  const result: TerminalTab[] = [];
  for (const row of rows) {
    const tab = parseTabRow(row);
    if (tab) result.push(tab);
  }
  return result;
}

function parseSessionWithTabs(
  raw: unknown,
  tabRows: unknown[],
): Session | null {
  if (!isRecord(raw)) return null;
  return {
    sessionId: String(raw["session_id"]),
    repoPath: String(raw["repo_path"]),
    name: String(raw["name"]),
    createdAt: Number(raw["created_at"]),
    tabs: parseTabRows(tabRows),
    activeTabId: String(raw["active_tab_id"]),
  };
}

export function insertSession(
  sessionId: string,
  repoPath: string,
  name: string,
  createdAt: number,
): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO sessions (session_id, repo_path, name, created_at, active_tab_id, last_opened_at, pinned)
     VALUES (?, ?, ?, ?, '', ?, 0)`,
  ).run(sessionId, repoPath, name, createdAt, createdAt);
}

export function selectSession(sessionId: string): Session | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM sessions WHERE session_id = ?")
    .get(sessionId);
  if (!row) return null;

  const tabRows = db
    .prepare("SELECT * FROM tabs WHERE session_id = ? ORDER BY created_at ASC")
    .all(sessionId);

  return parseSessionWithTabs(row, tabRows);
}

export function selectAllSessions(): Session[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT
         s.session_id, s.repo_path, s.name, s.created_at, s.active_tab_id,
         t.tab_id, t.pty_id, t.tool, t.label, t.created_at AS tab_created_at
       FROM sessions s
       LEFT JOIN tabs t ON s.session_id = t.session_id
       ORDER BY s.last_opened_at DESC, t.created_at ASC`,
    )
    .all();

  const sessionMap = new Map<string, Session>();
  const sessionOrder: string[] = [];

  for (const raw of rows) {
    if (!isRecord(raw)) continue;
    const sid = String(raw["session_id"]);

    if (!sessionMap.has(sid)) {
      sessionOrder.push(sid);
      sessionMap.set(sid, {
        sessionId: sid,
        repoPath: String(raw["repo_path"]),
        name: String(raw["name"]),
        createdAt: Number(raw["created_at"]),
        tabs: [],
        activeTabId: String(raw["active_tab_id"]),
      });
    }

    if (raw["tab_id"] !== null && raw["tab_id"] !== undefined) {
      const session = sessionMap.get(sid);
      if (session) {
        session.tabs.push({
          tabId: String(raw["tab_id"]),
          sessionId: sid,
          ptyId: String(raw["pty_id"]),
          tool: toToolType(String(raw["tool"])),
          label: String(raw["label"]),
          createdAt: Number(raw["tab_created_at"]),
        });
      }
    }
  }

  const result: Session[] = [];
  for (const sid of sessionOrder) {
    const session = sessionMap.get(sid);
    if (session) result.push(session);
  }
  return result;
}

export function deleteSessionById(sessionId: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE session_id = ?").run(sessionId);
}

export function updateActiveTabId(sessionId: string, tabId: string): void {
  const db = getDatabase();
  db.prepare("UPDATE sessions SET active_tab_id = ? WHERE session_id = ?").run(
    tabId,
    sessionId,
  );
}

export function updateLastOpened(sessionId: string): void {
  const db = getDatabase();
  db.prepare("UPDATE sessions SET last_opened_at = ? WHERE session_id = ?").run(
    Date.now(),
    sessionId,
  );
}

export function insertTab(
  tabId: string,
  sessionId: string,
  ptyId: string,
  tool: string,
  label: string,
  createdAt: number,
): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO tabs (tab_id, session_id, pty_id, tool, label, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(tabId, sessionId, ptyId, tool, label, createdAt);
}

export function deleteTabById(tabId: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM tabs WHERE tab_id = ?").run(tabId);
}

export function selectTabsForSession(sessionId: string): TerminalTab[] {
  const db = getDatabase();
  const rows = db
    .prepare("SELECT * FROM tabs WHERE session_id = ? ORDER BY created_at ASC")
    .all(sessionId);
  return parseTabRows(rows);
}

export function getPreference(key: string): string | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT value FROM preferences WHERE key = ?")
    .get(key);
  if (!isRecord(row)) return null;
  return String(row["value"]);
}

export function setPreference(key: string, value: string): void {
  const db = getDatabase();
  db.prepare(
    "INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)",
  ).run(key, value);
}

export function selectRecentRepos(limit: number): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT DISTINCT repo_path FROM sessions
       ORDER BY last_opened_at DESC
       LIMIT ?`,
    )
    .all(limit);

  const result: string[] = [];
  for (const row of rows) {
    if (isRecord(row)) {
      result.push(String(row["repo_path"]));
    }
  }
  return result;
}

export function sessionExists(sessionId: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare("SELECT 1 FROM sessions WHERE session_id = ? LIMIT 1")
    .get(sessionId);
  return row !== undefined;
}

export function selectTabPtyId(
  sessionId: string,
  tabId: string,
): string | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT pty_id FROM tabs WHERE tab_id = ? AND session_id = ? LIMIT 1",
    )
    .get(tabId, sessionId);
  if (!isRecord(row)) return null;
  return String(row["pty_id"]);
}

export function selectLastTabId(sessionId: string): string | null {
  const db = getDatabase();
  const row = db
    .prepare(
      "SELECT tab_id FROM tabs WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(sessionId);
  if (!isRecord(row)) return null;
  return String(row["tab_id"]);
}

export function tabExistsInSession(sessionId: string, tabId: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare("SELECT 1 FROM tabs WHERE tab_id = ? AND session_id = ? LIMIT 1")
    .get(tabId, sessionId);
  return row !== undefined;
}

export function selectActiveTabId(sessionId: string): string {
  const db = getDatabase();
  const row = db
    .prepare("SELECT active_tab_id FROM sessions WHERE session_id = ? LIMIT 1")
    .get(sessionId);
  if (!isRecord(row)) return "";
  return String(row["active_tab_id"]);
}

export function selectSessionRepoPath(sessionId: string): string | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT repo_path FROM sessions WHERE session_id = ? LIMIT 1")
    .get(sessionId);
  if (!isRecord(row)) return null;
  return String(row["repo_path"]);
}
