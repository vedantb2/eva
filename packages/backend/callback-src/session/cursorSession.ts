import {
  CURSOR_LOCAL_STATE_FILE,
  CURSOR_PERSIST_DIR,
  CURSOR_PERSIST_STATE_FILE,
  CURSOR_RUNTIME_HOME_DIR,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { callbackState as S } from "../runtime/state.js";
import type { SessionMode } from "../types.js";
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
  store.syncStateToPersist("syncCursorStateToPersist");
}

function hydratePersistedCursorState(): void {
  // MCP config is no longer written to WORK_DIR/.cursor/mcp.json — the SDK
  // runner passes /tmp/eva-mcp.json servers inline (readCursorSdkMcpServers).
  store.hydratePersistedState("hydratePersistedCursorState");
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
