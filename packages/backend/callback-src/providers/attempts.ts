import {
  CODEX_RUNTIME_HOME_DIR,
  CURSOR_RUNTIME_HOME_DIR,
  PROVIDER,
  codexExecBaseCmd,
  codexPromptCmd,
  cursorExecBaseCmd,
  opencodeExecBaseCmd,
  opencodePromptCmd,
} from "../config.js";
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
  readCursorProviderState,
  syncCursorStateToPersist,
} from "../session/cursorSession.js";
import { codexAdapter } from "./codex.js";
import { runClaudeSdkAttempt } from "./claudeSdk.js";
import { runCliAttempt } from "../runtime/cliAttempt.js";
import type { SessionMode } from "../types.js";
import {
  readCursorAcpMcpServers,
  readCursorPromptFile,
  runCursorAcpAttempt,
} from "./cursorAcpRuntime.js";

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
  const sessionArg =
    sessionMode.mode === "resume" && sessionMode.sessionId
      ? " resume " + JSON.stringify(sessionMode.sessionId)
      : "";
  const cmd = codexPromptCmd + " | " + codexExecBaseCmd + sessionArg + " -";
  return await runCliAttempt({
    cmd,
    env: { ...process.env, CODEX_HOME: CODEX_RUNTIME_HOME_DIR },
    processLabel: "codex",
    attemptLabel: "runCodexAttempt",
    startupStep: {
      label: "Starting Codex CLI...",
      detail:
        sessionMode.mode === "resume"
          ? "Restoring saved context..."
          : "Launching Codex process...",
    },
    onStdoutText: codexAdapter.onStdoutText,
  });
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

async function runCursorAttempt(sessionMode: SessionMode) {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment — Cursor CLI cannot authenticate",
    );
  }
  const providerState = readCursorProviderState();
  if (providerState?.transport !== "stream-json") {
    return await runCursorAcpAttempt({
      sessionMode,
      prompt: readCursorPromptFile(),
      mcpServers: readCursorAcpMcpServers(),
    });
  }
  const sessionArg =
    sessionMode.mode === "resume" && sessionMode.sessionId
      ? " --resume " + JSON.stringify(sessionMode.sessionId)
      : "";
  const cmd = cursorExecBaseCmd + sessionArg;
  return await runCliAttempt({
    cmd,
    env: { ...process.env, HOME: CURSOR_RUNTIME_HOME_DIR },
    processLabel: "cursor",
    attemptLabel: "runCursorAttempt",
    startupStep: {
      label: "Starting Cursor CLI...",
      detail:
        sessionMode.mode === "resume"
          ? "Restoring saved context..."
          : "Launching Cursor process...",
    },
  });
}

export async function runProviderAttempt(sessionMode: SessionMode) {
  if (PROVIDER === "codex") return await runCodexAttempt(sessionMode);
  if (PROVIDER === "opencode") return await runOpencodeAttempt(sessionMode);
  if (PROVIDER === "cursor") return await runCursorAttempt(sessionMode);
  return await runClaudeAttempt(sessionMode);
}
