import {
  CLAUDE_ATTEMPT_MODE,
  CLAUDE_RUNTIME_CONFIG_DIR,
  CODEX_RUNTIME_HOME_DIR,
  CURSOR_RUNTIME_HOME_DIR,
  PROVIDER,
  SCRIPT_STARTED_AT,
  claudeBaseCmd,
  codexExecBaseCmd,
  codexPromptCmd,
  cursorExecBaseCmd,
  opencodeExecBaseCmd,
  opencodePromptCmd,
} from "../config.js";
import {
  buildClaudeStartupStep,
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
import { codexAdapter } from "./codex.js";
import { runClaudeSdkAttempt } from "./claudeSdk.js";
import { runCliAttempt } from "../runtime/cliAttempt.js";
import { callbackState as S } from "../runtime/state.js";
import { log } from "../utils.js";
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

export async function runClaudeAttempt(sessionMode: SessionMode) {
  // Flag-gated Agent SDK path. `sdk-daemon` non-session flows (and any daemon
  // fallback) also use the one-shot SDK runner here; the persistent daemon is
  // handled earlier in index.ts. Default stays on the `claude -p` CLI spawn.
  if (CLAUDE_ATTEMPT_MODE === "sdk" || CLAUDE_ATTEMPT_MODE === "sdk-daemon") {
    return await runClaudeSdkAttempt(sessionMode);
  }
  const sessionArg =
    sessionMode.mode === "session" && sessionMode.sessionId
      ? " --session-id " + JSON.stringify(sessionMode.sessionId)
      : sessionMode.mode === "resume" && sessionMode.sessionId
        ? " --resume " + JSON.stringify(sessionMode.sessionId)
        : "";
  const cmd = claudeBaseCmd + sessionArg;
  const startupStep = buildClaudeStartupStep();
  return await runCliAttempt({
    cmd,
    env: { ...process.env, CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR },
    processLabel: "claude",
    attemptLabel: "runClaudeAttempt",
    startupStep,
    onStart: () => {
      log(
        "runClaudeAttempt started (mode=" +
          sessionMode.mode +
          ", sessionArg=" +
          (sessionArg || "none") +
          ")",
      );
      log(
        "spawning claude after " +
          String(S.activeAttemptStartedAt - SCRIPT_STARTED_AT) +
          "ms since callback start",
      );
    },
  });
}

export async function runCodexAttempt(sessionMode: SessionMode) {
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

export async function runOpencodeAttempt(sessionMode: SessionMode) {
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

export async function runCursorAttempt(sessionMode: SessionMode) {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment — Cursor CLI cannot authenticate",
    );
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
