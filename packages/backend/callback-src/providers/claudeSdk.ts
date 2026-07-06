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
type SdkQueryHandle = AsyncIterable<Record<string, JsonLike>> & {
  interrupt?: () => Promise<void>;
};

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

type SdkOptions = {
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
};

type SdkModule = {
  query: (args: { prompt: string; options: SdkOptions }) => SdkQueryHandle;
};

/** Resolves the sandbox's global npm root once (e.g. /usr/lib/node_modules). */
function globalNpmRoot(): string {
  return execSync("npm root -g", { encoding: "utf8" }).trim();
}

/**
 * Imports the Agent SDK from the sandbox's global install. Newer base Images
 * ship it preinstalled; on older snapshots fall back to a one-time global
 * install so the SDK path still works without an image rebuild.
 */
async function loadSdk(): Promise<SdkModule> {
  const entry = () => globalNpmRoot() + "/" + SDK_PACKAGE + "/sdk.mjs";
  if (!existsSync(entry())) {
    log(
      "claude-agent-sdk not found in sandbox; installing " +
        SDK_PACKAGE +
        "@" +
        SDK_VERSION +
        " (one-time)",
    );
    execSync("npm install -g " + SDK_PACKAGE + "@" + SDK_VERSION, {
      encoding: "utf8",
      timeout: 180_000,
    });
  }
  const mod: SdkModule = await import(entry());
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

function buildSdkOptions(sessionMode: SessionMode): SdkOptions {
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
  return {
    cwd: WORK_DIR,
    model: normalizedClaudeModel,
    pathToClaudeCodeExecutable: claudeExecutablePath(),
    systemPrompt: SYSTEM_PROMPT
      ? { type: "preset", preset: "claude_code", append: SYSTEM_PROMPT }
      : { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    ...(ALLOWED_TOOLS ? { allowedTools: ALLOWED_TOOLS.split(",") } : {}),
    env: { ...process.env, CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR },
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

  const sdk = await loadSdk();
  const q = sdk.query({
    prompt: readPromptText(),
    options: buildSdkOptions(sessionMode),
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

  try {
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
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
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
