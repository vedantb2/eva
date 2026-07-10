const MAX_TERMINAL_HISTORY_CHARS = 500_000;
const FLUSH_DELAY_MS = 250;
const IMMEDIATE_FLUSH_CHARS = 4096;

type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonObject {
  [key: string]: JsonValue;
}

type TerminalHistoryOwner =
  | { kind: "session"; sessionId: string }
  | { kind: "task"; taskId: string }
  | { kind: "project"; projectId: string };

export interface TerminalControlMessage {
  type: "control";
  status: string;
  error?: string;
}

export interface TerminalHistoryWriter {
  append: (chunk: string) => void;
  clear: () => void;
  dispose: () => void;
}

type TerminalHistorySetter = (
  value: string | ((current: string) => string),
) => void;

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonObject(raw: string): JsonObject | null {
  try {
    const parsed: JsonValue = JSON.parse(raw);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseVercelExitMessage(
  raw: string,
): { type: "exit"; code: number | undefined } | null {
  const parsed = parseJsonObject(raw);
  if (parsed?.type !== "exit") return null;
  return {
    type: "exit",
    code: typeof parsed.code === "number" ? parsed.code : undefined,
  };
}

export function parseTerminalControlMessage(
  raw: string,
): TerminalControlMessage | null {
  const parsed = parseJsonObject(raw);
  if (parsed?.type !== "control") return null;
  if (typeof parsed.status !== "string") return null;

  return {
    type: "control",
    status: parsed.status,
    error: typeof parsed.error === "string" ? parsed.error : undefined,
  };
}

export type PtyProtocol = "daytona" | "vercel";

type VercelPtyOutboundMessage =
  | {
      type: "start";
      command: string;
      args: string[];
      env: string[];
      cwd: string;
      cols: number;
      rows: number;
    }
  | {
      type: "resize";
      cols: number;
      rows: number;
    };

/** Vercel controller-hosted PTY uses JSON control frames on the WebSocket. */
export function sendVercelPtyControl(
  ws: WebSocket,
  message: VercelPtyOutboundMessage,
): void {
  ws.send(JSON.stringify(message));
}

const VERCEL_PTY_CWD = "/tmp/repo";

function safeVercelSessionName(sessionName: string | undefined): string {
  const source =
    sessionName !== undefined && sessionName.length > 0
      ? sessionName
      : "eva_terminal";
  const safe = source.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 96);
  return safe.length > 0 ? safe : "eva_terminal";
}

/** Matches Vercel sandbox CLI: token in URL, then a `start` frame launches the shell. */
export function startVercelPty(
  ws: WebSocket,
  opts: { cols: number; rows: number; cwd?: string; sessionName?: string },
): void {
  const cwd = opts.cwd ?? VERCEL_PTY_CWD;
  const sessionName = safeVercelSessionName(opts.sessionName);
  sendVercelPtyControl(ws, {
    type: "start",
    command: "bash",
    args: [
      "-lc",
      `cd ${cwd} 2>/dev/null || cd /vercel/sandbox; if command -v tmux >/dev/null 2>&1; then exec tmux new-session -A -s ${sessionName}; fi; exec bash -l`,
    ],
    env: ["TERM=xterm-256color"],
    cwd,
    cols: opts.cols,
    rows: opts.rows,
  });
}

function boundedTerminalHistory(value: string): string {
  return value.length > MAX_TERMINAL_HISTORY_CHARS
    ? value.slice(-MAX_TERMINAL_HISTORY_CHARS)
    : value;
}

export function buildTerminalHistoryKey(
  owner: TerminalHistoryOwner,
  sandboxId: string,
  ptyInstanceId: string,
): string {
  const ownerId =
    owner.kind === "session"
      ? owner.sessionId
      : owner.kind === "task"
        ? owner.taskId
        : owner.projectId;
  return `conductor:terminal-history:${owner.kind}:${ownerId}:${sandboxId}:${ptyInstanceId}`;
}

export function createTerminalHistoryWriter(
  setHistory: TerminalHistorySetter,
): TerminalHistoryWriter {
  let pending = "";
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function flush(): void {
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (pending.length === 0) return;

    const chunk = pending;
    pending = "";
    setHistory((current) => boundedTerminalHistory(current + chunk));
  }

  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);

  return {
    append(chunk: string): void {
      if (chunk.length === 0) return;
      pending += chunk;
      if (pending.length >= IMMEDIATE_FLUSH_CHARS) {
        flush();
        return;
      }
      if (flushTimer === null) {
        flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
      }
    },
    clear(): void {
      pending = "";
      setHistory("");
    },
    dispose(): void {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    },
  };
}
