import {
  CURSOR_LOCAL_STATE_FILE,
  CURSOR_PERSIST_DIR,
  CURSOR_PERSIST_STATE_FILE,
  CURSOR_RUNTIME_HOME_DIR,
  CURSOR_SDK_STORE_DIR,
} from "../config.js";
import { pushNoticeStep, updateThinkingStep } from "../parse/canonical.js";
import { callbackState as S } from "../runtime/state.js";
import type { SessionMode } from "../types.js";
import { createSessionStore } from "./createSessionStore.js";
import {
  readCursorResumeStats,
  shouldRotateCursorSession,
} from "./cursorResumePolicy.js";

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
  // MCP configuration is supplied directly to the Cursor SDK; no workspace
  // file participates in session hydration.
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
    const resumeStats = readCursorResumeStats(
      CURSOR_SDK_STORE_DIR,
      persistedState.resumeSessionId,
    );
    if (shouldRotateCursorSession(resumeStats)) {
      // Rotation drops everything the agent remembered, so it must leave a
      // durable trace: users saw the fresh agent deny its own past work with a
      // transient thinking line as the only clue.
      const contextTokens = resumeStats ? resumeStats.contextTokens : 0;
      const approxThousands = Math.round(contextTokens / 1000);
      console.log(
        "prepareCursorSessionState: rotating saved Cursor agent (" +
          contextTokens +
          " context tokens)",
      );
      S.activeCursorSessionId = "";
      pushNoticeStep(
        "Started a fresh Cursor agent",
        `Saved context reached ~${approxThousands}k tokens; continuing with a summary handoff.`,
      );
      updateThinkingStep(
        "Preparing Cursor session...",
        "Saved context reached its safe limit. Starting fresh...",
      );
      return { mode: "none", sessionId: null };
    }
    S.activeCursorSessionId = persistedState.resumeSessionId;
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  return { mode: "none", sessionId: null };
}
