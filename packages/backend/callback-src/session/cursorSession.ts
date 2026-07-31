import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import {
  CURSOR_LOCAL_STATE_FILE,
  CURSOR_PERSIST_DIR,
  CURSOR_PERSIST_STATE_FILE,
  CURSOR_RUNTIME_HOME_DIR,
  WORK_DIR,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { callbackState as S } from "../runtime/state.js";
import type { SessionMode } from "../types.js";
import { tryParseJson } from "../utils.js";
import { createSessionStore } from "./createSessionStore.js";

const store = createSessionStore({
  runtimeHomeDir: CURSOR_RUNTIME_HOME_DIR,
  persistDir: CURSOR_PERSIST_DIR,
  localStateFile: CURSOR_LOCAL_STATE_FILE,
  persistStateFile: CURSOR_PERSIST_STATE_FILE,
  resumeField: "resumeSessionId",
  getActiveId: () => S.activeCursorSessionId,
  setActiveId: (id) => {
    S.activeCursorSessionId = id;
  },
});

const readCursorSessionState = store.readSessionState;
export const writeCursorSessionState = store.writeSessionState;
export function syncCursorStateToPersist(): void {
  const providerState = readCursorProviderState();
  if (providerState?.transport === "acp-v1") {
    writeCursorAcpSessionState(providerState.sessionId);
    return;
  }
  store.syncStateToPersist("syncCursorStateToPersist");
}

export type CursorProviderState =
  | { schemaVersion: 1; transport: "stream-json"; sessionId: string }
  | { schemaVersion: 2; transport: "acp-v1"; sessionId: string };

function parseCursorProviderState(raw: string): CursorProviderState | null {
  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  if (
    parsed.schemaVersion === 2 &&
    parsed.transport === "acp-v1" &&
    typeof parsed.sessionId === "string" &&
    parsed.sessionId.trim()
  ) {
    return {
      schemaVersion: 2,
      transport: "acp-v1",
      sessionId: parsed.sessionId.trim(),
    };
  }
  if (
    typeof parsed.resumeSessionId === "string" &&
    parsed.resumeSessionId.trim()
  ) {
    return {
      schemaVersion: 1,
      transport: "stream-json",
      sessionId: parsed.resumeSessionId.trim(),
    };
  }
  return null;
}

export function readCursorProviderState(): CursorProviderState | null {
  for (const path of [CURSOR_LOCAL_STATE_FILE, CURSOR_PERSIST_STATE_FILE]) {
    if (!existsSync(path)) continue;
    try {
      const state = parseCursorProviderState(readFileSync(path, "utf8"));
      if (state) return state;
    } catch (error) {
      console.error("Failed to read Cursor provider state:", String(error));
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

function hydratePersistedCursorState(): void {
  store.hydratePersistedState("hydratePersistedCursorState");
  if (existsSync("/tmp/eva-mcp.json")) {
    try {
      const raw = readFileSync("/tmp/eva-mcp.json", "utf8");
      const evaMcp = tryParseJson(raw);
      const cursorDir = WORK_DIR + "/.cursor";
      mkdirSync(cursorDir, { recursive: true });
      const cursorMcp: {
        mcpServers: Record<
          string,
          { url?: string; headers?: Record<string, string> }
        >;
      } = { mcpServers: {} };
      if (
        evaMcp &&
        typeof evaMcp === "object" &&
        !Array.isArray(evaMcp) &&
        evaMcp.mcpServers &&
        typeof evaMcp.mcpServers === "object" &&
        !Array.isArray(evaMcp.mcpServers)
      ) {
        for (const [name, server] of Object.entries(evaMcp.mcpServers)) {
          if (!server || typeof server !== "object" || Array.isArray(server))
            continue;
          const entry: { url?: string; headers?: Record<string, string> } = {};
          if (typeof server.url === "string") entry.url = server.url;
          if (
            server.headers &&
            typeof server.headers === "object" &&
            !Array.isArray(server.headers)
          ) {
            const headers: Record<string, string> = {};
            for (const [hk, hv] of Object.entries(server.headers)) {
              if (typeof hv === "string") headers[hk] = hv;
            }
            if (Object.keys(headers).length > 0) entry.headers = headers;
          }
          if (Object.keys(entry).length > 0) {
            cursorMcp.mcpServers[name] = entry;
          }
        }
      }
      writeFileSync(
        cursorDir + "/mcp.json",
        JSON.stringify(cursorMcp, null, 2),
      );
    } catch (error) {
      console.error(
        "Failed to translate MCP config for Cursor:",
        String(error),
      );
    }
  }
}

export function prepareCursorSessionState(): SessionMode {
  updateThinkingStep(
    "Preparing Cursor session...",
    "Hydrating saved session...",
  );
  hydratePersistedCursorState();
  const providerState = readCursorProviderState();
  if (providerState?.transport === "acp-v1") {
    S.activeCursorSessionId = providerState.sessionId;
    return { mode: "resume", sessionId: providerState.sessionId };
  }
  const persistedState = readCursorSessionState();
  updateThinkingStep(
    "Preparing Cursor session...",
    persistedState
      ? "Saved session hydrated. Starting Cursor..."
      : "Preparing fresh Cursor session...",
  );
  if (persistedState && persistedState.resumeSessionId) {
    S.activeCursorSessionId = persistedState.resumeSessionId;
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  return { mode: "none", sessionId: null };
}
