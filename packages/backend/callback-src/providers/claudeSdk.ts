import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import {
  ALLOWED_TOOLS,
  CLAUDE_RUNTIME_CONFIG_DIR,
  MAX_TOTAL_RUNTIME_MS,
  NO_OUTPUT_CHECK_INTERVAL_MS,
  NO_OUTPUT_TIMEOUT_MS,
  SYSTEM_PROMPT,
  WORK_DIR,
  normalizedClaudeModel,
  settingsJson,
} from "../config.js";
import { buildClaudeStartupStep } from "../session/claudeSession.js";
import { processRealtimeStdoutChunk } from "../parse/streamRouter.js";
import { updateThinkingStep } from "../parse/canonical.js";
import {
  appendToRawLogFile,
  appendToRawOutput,
  trimBufferHead,
} from "../runtime/buffers.js";
import { resetAttemptState } from "../runtime/cliAttempt.js";
import { callbackState as S } from "../runtime/state.js";
import type { CliAttemptResult, SessionMode } from "../types.js";
import { log } from "../utils.js";

const SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";
const SDK_VERSION = "0.3.201";
const MCP_CONFIG_PATH = "/tmp/eva-mcp.json";

/**
 * The subset of the Agent SDK `query()` surface this runner uses. The SDK is
 * dynamically imported from the sandbox's global npm root (it is installed in
 * the base Image alongside the claude CLI), so these local types stand in for
 * the SDK's own — kept intentionally narrow.
 */
export type SdkQueryHandle = AsyncIterable<Record<string, JsonLike>> & {
  interrupt?: () => Promise<void>;
};

export type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

export type SdkMessage = Record<string, JsonLike>;

export type SdkOptions = {
  cwd: string;
  model: string;
  pathToClaudeCodeExecutable: string;
  systemPrompt:
    | { type: "preset"; preset: "claude_code"; append?: string }
    | string;
  permissionMode: string;
  allowDangerouslySkipPermissions: boolean;
  allowedTools?: string[];
  env: Record<string, string | undefined>;
  sessionId?: string;
  resume?: string;
  extraArgs?: Record<string, string>;
  includePartialMessages?: boolean;
};

export type SdkUserMessage = {
  type: "user";
  message: { role: "user"; content: string };
  parent_tool_use_id: string | null;
  session_id: string;
};

export type SdkModule = {
  query: (args: {
    prompt: string | AsyncIterable<SdkUserMessage>;
    options: SdkOptions;
  }) => SdkQueryHandle;
};

/** Resolves the sandbox's global npm root once (e.g. /usr/lib/node_modules). */
function globalNpmRoot(): string {
  return execSync("npm root -g", { encoding: "utf8" }).trim();
}

/** User-writable fallback install location (persists in home across resumes). */
const SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk";

/**
 * Imports the Agent SDK, preferring the base Image's global install. Older
 * snapshots lack it, and the callback runs as the unprivileged `eva` user (a
 * global `npm i -g` fails with EACCES on the root-owned npm root), so the
 * fallback is a one-time user-local prefix install under the eva home.
 */
export async function loadSdk(): Promise<SdkModule> {
  const globalEntry = globalNpmRoot() + "/" + SDK_PACKAGE + "/sdk.mjs";
  const localEntry =
    SDK_LOCAL_PREFIX + "/node_modules/" + SDK_PACKAGE + "/sdk.mjs";
  if (existsSync(globalEntry)) {
    const mod: SdkModule = await import(globalEntry);
    return mod;
  }
  if (!existsSync(localEntry)) {
    log(
      "claude-agent-sdk not found in sandbox; installing " +
        SDK_PACKAGE +
        "@" +
        SDK_VERSION +
        " to " +
        SDK_LOCAL_PREFIX +
        " (one-time)",
    );
    execSync(
      "mkdir -p " +
        SDK_LOCAL_PREFIX +
        " && npm install --prefix " +
        SDK_LOCAL_PREFIX +
        " " +
        SDK_PACKAGE +
        "@" +
        SDK_VERSION,
      { encoding: "utf8", timeout: 180_000 },
    );
  }
  const mod: SdkModule = await import(localEntry);
  return mod;
}

/** Locates the claude CLI binary the SDK should drive (already in the image). */
function claudeExecutablePath(): string {
  try {
    return execSync("command -v claude", { encoding: "utf8" }).trim();
  } catch {
    return "claude";
  }
}

function readPromptText(): string {
  return readFileSync("/tmp/design-prompt.txt", "utf8");
}

export function buildSdkOptions(sessionMode: SessionMode): SdkOptions {
  // Mirror the CLI flags claudeBaseCmd passes today:
  //   --append-system-prompt  -> preset claude_code + append
  //   --dangerously-skip-permissions -> bypassPermissions + allow flag
  //   --allowedTools           -> allowedTools[]
  //   --settings / --mcp-config -> extraArgs passthrough (verbatim CLI flags)
  //   --session-id / --resume  -> sessionId / resume
  const extraArgs: Record<string, string> = { settings: settingsJson };
  if (existsSync(MCP_CONFIG_PATH)) {
    extraArgs["mcp-config"] = MCP_CONFIG_PATH;
  }
  return buildSdkOptionsFromParts(sessionMode, extraArgs);
}

/** Fresh one-shot query for conversational turns: no resume, no tools, no MCP. */
export function buildConversationalSdkOptions(): SdkOptions {
  return {
    ...buildSdkOptionsFromParts(
      { mode: "session" },
      { settings: settingsJson },
      "none",
    ),
    // Always Haiku for simple Q&A — session model (e.g. Opus) is for agent turns only.
    model: "haiku",
    systemPrompt: "Reply briefly and directly. Do not use tools.",
  };
}

function buildSdkOptionsFromParts(
  sessionMode: SessionMode,
  extraArgs: Record<string, string>,
  tools: "agent" | "none" = "agent",
): SdkOptions {
  const allowedToolsOption =
    tools === "agent" && ALLOWED_TOOLS
      ? { allowedTools: ALLOWED_TOOLS.split(",") }
      : { allowedTools: [] as string[] };

  return {
    cwd: WORK_DIR,
    model: normalizedClaudeModel,
    pathToClaudeCodeExecutable: claudeExecutablePath(),
    systemPrompt: SYSTEM_PROMPT
      ? { type: "preset", preset: "claude_code", append: SYSTEM_PROMPT }
      : { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    // Emit token-level partial (`stream_event`) messages so claudeParseLine can
    // stream text deltas into the reply live (dedup guards the final message).
    includePartialMessages: true,
    ...allowedToolsOption,
    // Suppress the claude engine's per-turn NON-ESSENTIAL model calls (topic /
    // title / flavour-text side calls) — measured as a ~6s second API call
    // that delays turn completion after the visible reply.
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR,
      DISABLE_NON_ESSENTIAL_MODEL_CALLS: "1",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
      DISABLE_TELEMETRY: "1",
      DISABLE_AUTOUPDATER: "1",
      DISABLE_ERROR_REPORTING: "1",
    },
    ...(sessionMode.mode === "session" && sessionMode.sessionId
      ? { sessionId: sessionMode.sessionId }
      : {}),
    ...(sessionMode.mode === "resume" && sessionMode.sessionId
      ? { resume: sessionMode.sessionId }
      : {}),
    extraArgs,
  };
}

/**
 * Runs one Claude turn via the Agent SDK instead of spawning `claude -p`.
 *
 * Integration model: every SDKMessage the query yields is serialized to a JSON
 * line and pushed through the exact same realtime pipeline the CLI's stdout
 * used (`processRealtimeStdoutChunk` -> claudeParseLine -> canonical events ->
 * accumulated steps / session capture / result detection), so streaming,
 * activity, session persistence and completion behave identically to the CLI
 * path with zero parser changes.
 */
export async function runClaudeSdkAttempt(
  sessionMode: SessionMode,
): Promise<CliAttemptResult> {
  resetAttemptState();
  S.activeAttemptStartedAt = Date.now();
  const startupStep = buildClaudeStartupStep();
  updateThinkingStep(startupStep.label, startupStep.detail);
  log(
    "runClaudeSdkAttempt started (mode=" +
      sessionMode.mode +
      ", sessionId=" +
      (sessionMode.sessionId || "none") +
      ")",
  );

  let attemptOutput = "";
  let lastMessageAt = Date.now();
  let timedOutForNoOutput = false;
  let timedOutForMaxRuntime = false;
  let sawResult = false;
  let resultIsError = false;
  let queryErrorMessage = "";

  const sdk = await loadSdk();
  let effectiveMode = sessionMode;
  let q = sdk.query({
    prompt: readPromptText(),
    options: buildSdkOptions(effectiveMode),
  });

  const interrupt = async (): Promise<void> => {
    try {
      if (q.interrupt) await q.interrupt();
    } catch {
      /* already finished */
    }
  };
  const healthTimer = setInterval(() => {
    const now = Date.now();
    if (now - S.activeAttemptStartedAt > MAX_TOTAL_RUNTIME_MS) {
      timedOutForMaxRuntime = true;
      log("runClaudeSdkAttempt: max runtime exceeded — interrupting");
      void interrupt();
      return;
    }
    // Idle only counts before the result event; after it the turn is done.
    if (!sawResult && now - lastMessageAt > NO_OUTPUT_TIMEOUT_MS * 5) {
      timedOutForNoOutput = true;
      log("runClaudeSdkAttempt: no SDK messages — interrupting");
      void interrupt();
    }
  }, NO_OUTPUT_CHECK_INTERVAL_MS);

  const consumeQuery = async (): Promise<void> => {
    for await (const message of q) {
      lastMessageAt = Date.now();
      const line = JSON.stringify(message) + "\n";
      appendToRawLogFile(line);
      attemptOutput = trimBufferHead(attemptOutput + line);
      appendToRawOutput(line);
      processRealtimeStdoutChunk(line);
      if (message.type === "result") {
        sawResult = true;
        resultIsError = message.is_error === true;
      }
      if (timedOutForMaxRuntime || timedOutForNoOutput) break;
    }
  };

  try {
    try {
      await consumeQuery();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      // Self-heal a stale persisted session id: a prior attempt that died
      // before Claude ran can persist a session id whose conversation was
      // never created, making `resume` fail. Retry once as a fresh
      // conversation with the same id so persistence stays consistent.
      if (
        effectiveMode.mode === "resume" &&
        effectiveMode.sessionId &&
        messageText.includes("No conversation found with session ID")
      ) {
        log(
          "runClaudeSdkAttempt: resume target missing — retrying as a new session with the same id",
        );
        appendToRawLogFile("[sdk-retry] " + messageText + "\n");
        sawResult = false;
        resultIsError = false;
        effectiveMode = { mode: "session", sessionId: effectiveMode.sessionId };
        q = sdk.query({
          prompt: readPromptText(),
          options: buildSdkOptions(effectiveMode),
        });
        await consumeQuery();
      } else {
        throw error;
      }
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    queryErrorMessage = messageText;
    log("runClaudeSdkAttempt: query failed — " + messageText);
    appendToRawLogFile("[sdk-error] " + messageText + "\n");
    S.stderrOutput = trimBufferHead(S.stderrOutput + messageText + "\n");
  } finally {
    clearInterval(healthTimer);
  }

  const code =
    sawResult &&
    !resultIsError &&
    !timedOutForMaxRuntime &&
    !timedOutForNoOutput
      ? 0
      : 1;
  log(
    "runClaudeSdkAttempt finished in " +
      String(Date.now() - S.activeAttemptStartedAt) +
      "ms (code=" +
      code +
      ", sawResult=" +
      sawResult +
      ", resultIsError=" +
      resultIsError +
      ", timedOutForNoOutput=" +
      timedOutForNoOutput +
      ", timedOutForMaxRuntime=" +
      timedOutForMaxRuntime +
      ", outputBytes=" +
      attemptOutput.length +
      (queryErrorMessage ? ", queryError=" + queryErrorMessage : "") +
      ")",
  );
  return {
    code,
    output: attemptOutput,
    timedOutForNoOutput,
    timedOutForMaxRuntime,
    timedOutForFirstEvent: false,
    timedOutForFirstAssistant: false,
    timedOutAfterFirstText: false,
    timedOutForZombie: false,
    toolStallErrorMessage: "",
  };
}
