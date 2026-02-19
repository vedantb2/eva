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
    .prepare("SELECT * FROM sessions ORDER BY last_opened_at DESC")
    .all();

  const result: Session[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const tabRows = db
      .prepare(
        "SELECT * FROM tabs WHERE session_id = ? ORDER BY created_at ASC",
      )
      .all(String(row["session_id"]));

    const session = parseSessionWithTabs(row, tabRows);
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
