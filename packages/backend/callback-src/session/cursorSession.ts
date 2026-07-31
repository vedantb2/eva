import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import {
  CURSOR_LOCAL_STATE_FILE,
  CURSOR_PERSIST_STATE_FILE,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { callbackState as S } from "../runtime/state.js";
import type { SessionMode } from "../types.js";
import { tryParseJson } from "../utils.js";

export type CursorProviderState = {
  schemaVersion: 2;
  transport: "acp-v1";
  sessionId: string;
};

function parseCursorProviderState(raw: string): CursorProviderState | null {
  const parsed = tryParseJson(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    parsed.schemaVersion !== 2 ||
    parsed.transport !== "acp-v1" ||
    typeof parsed.sessionId !== "string" ||
    !parsed.sessionId.trim()
  ) {
    return null;
  }
  return {
    schemaVersion: 2,
    transport: "acp-v1",
    sessionId: parsed.sessionId.trim(),
  };
}

export function readCursorProviderState(): CursorProviderState | null {
  for (const path of [CURSOR_LOCAL_STATE_FILE, CURSOR_PERSIST_STATE_FILE]) {
    if (!existsSync(path)) continue;
    try {
      const state = parseCursorProviderState(readFileSync(path, "utf8"));
      if (state) return state;
    } catch (error) {
      console.error("Failed to read Cursor ACP state:", String(error));
    }
  }
  return null;
}

function writeJsonAtomically(path: string, value: string): void {
  const directory = path.slice(0, path.lastIndexOf("/"));
  if (directory) mkdirSync(directory, { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, value, { mode: 0o600 });
  renameSync(temporaryPath, path);
}

export function writeCursorAcpSessionState(sessionId: string): void {
  const value = JSON.stringify({
    schemaVersion: 2,
    transport: "acp-v1",
    sessionId,
  });
  writeJsonAtomically(CURSOR_LOCAL_STATE_FILE, value);
  writeJsonAtomically(CURSOR_PERSIST_STATE_FILE, value);
  S.activeCursorSessionId = sessionId;
}

export function syncCursorStateToPersist(): void {
  const sessionId = S.activeCursorSessionId;
  if (sessionId) writeCursorAcpSessionState(sessionId);
}

export function prepareCursorSessionState(): SessionMode {
  updateThinkingStep(
    "Preparing Cursor session...",
    "Hydrating saved ACP session...",
  );
  const providerState = readCursorProviderState();
  if (providerState) {
    S.activeCursorSessionId = providerState.sessionId;
    return { mode: "resume", sessionId: providerState.sessionId };
  }
  return { mode: "none", sessionId: null };
}
