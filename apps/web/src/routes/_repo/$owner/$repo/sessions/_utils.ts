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
  | { kind: "task"; taskId: string };

export interface TerminalControlMessage {
  type: "control";
  status: string;
  error?: string;
}

export interface TerminalHistoryWriter {
  append: (chunk: string) => void;
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
  const ownerId = owner.kind === "session" ? owner.sessionId : owner.taskId;
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
    dispose(): void {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    },
  };
}
