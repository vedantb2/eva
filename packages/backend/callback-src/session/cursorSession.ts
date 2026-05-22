import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  CURSOR_LOCAL_STATE_FILE,
  CURSOR_PERSIST_DIR,
  CURSOR_PERSIST_STATE_FILE,
  CURSOR_RUNTIME_HOME_DIR,
  WORK_DIR,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { callbackState as S } from "../runtime/state.js";
import type { JsonObject, SessionMode } from "../types.js";
import { copyFileIfPresent, tryParseJson } from "../utils.js";
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

export const readCursorSessionState = store.readSessionState;
export const writeCursorSessionState = store.writeSessionState;
export function syncCursorStateToPersist(): void {
  store.syncStateToPersist("syncCursorStateToPersist");
}

export function hydratePersistedCursorState(): void {
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
