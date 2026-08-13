import { PROVIDER, opencodeExecBaseCmd, opencodePromptCmd } from "../config.js";
import {
  prepareClaudeSessionState,
  syncClaudeStateToPersist,
} from "../session/claudeSession.js";
import {
  prepareCodexSessionState,
  syncCodexStateToPersist,
} from "../session/codexSession.js";
import {
  prepareOpencodeSessionState,
  syncOpencodeStateToPersist,
} from "../session/opencodeSession.js";
import {
  prepareCursorSessionState,
  syncCursorStateToPersist,
} from "../session/cursorSession.js";
import { runClaudeSdkAttempt } from "./claudeSdk.js";
import { runCodexSdkAttempt } from "./codexSdk.js";
import { runCursorSdkAttempt } from "./cursorSdk.js";
import { runCliAttempt } from "../runtime/cliAttempt.js";
import type { SessionMode } from "../types.js";

export function prepareProviderSessionState(): SessionMode {
  if (PROVIDER === "codex") return prepareCodexSessionState();
  if (PROVIDER === "opencode") return prepareOpencodeSessionState();
  if (PROVIDER === "cursor") return prepareCursorSessionState();
  return prepareClaudeSessionState();
}

export function syncProviderStateToPersist(reason: string): void {
  if (PROVIDER === "codex") {
    syncCodexStateToPersist();
    return;
  }
  if (PROVIDER === "opencode") {
    syncOpencodeStateToPersist();
    return;
  }
  if (PROVIDER === "cursor") {
    syncCursorStateToPersist();
    return;
  }
  syncClaudeStateToPersist(reason);
}

/**
 * Claude always runs via the Agent SDK. Chat entities with CLAIM_MUTATION enter
 * the persistent daemon earlier in index.ts; job runs and daemon fallbacks land
 * here on the one-shot SDK runner.
 */
async function runClaudeAttempt(sessionMode: SessionMode) {
  return await runClaudeSdkAttempt(sessionMode);
}

async function runCodexAttempt(sessionMode: SessionMode) {
  return await runCodexSdkAttempt(sessionMode);
}

async function runOpencodeAttempt(sessionMode: SessionMode) {
  const sessionArg =
    sessionMode.mode === "resume" && sessionMode.sessionId
      ? " -s " + JSON.stringify(sessionMode.sessionId)
      : "";
  const cmd = opencodePromptCmd + " | " + opencodeExecBaseCmd + sessionArg;
  return await runCliAttempt({
    cmd,
    env: { ...process.env },
    processLabel: "opencode",
    attemptLabel: "runOpencodeAttempt",
    startupStep: {
      label: "Starting Opencode CLI...",
      detail:
        sessionMode.mode === "resume"
          ? "Restoring saved context..."
          : "Launching Opencode process...",
    },
  });
}

/** Cursor runs via the Cursor SDK (local agent in-process, one shot per turn). */
async function runCursorAttempt(sessionMode: SessionMode) {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment — the Cursor SDK cannot authenticate",
    );
  }
  return await runCursorSdkAttempt(sessionMode);
}

export async function runProviderAttempt(sessionMode: SessionMode) {
  if (PROVIDER === "codex") return await runCodexAttempt(sessionMode);
  if (PROVIDER === "opencode") return await runOpencodeAttempt(sessionMode);
  if (PROVIDER === "cursor") return await runCursorAttempt(sessionMode);
  return await runClaudeAttempt(sessionMode);
}
