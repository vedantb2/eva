"use node";

export const CALLBACK_SCRIPT = `var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// callback-src/index.ts
import {
  existsSync as existsSync9,
  mkdirSync as mkdirSync7,
  readdirSync as readdirSync3,
  unlinkSync as unlinkSync4,
  writeFileSync as writeFileSync13
} from "fs";

// callback-src/config.ts
import { existsSync } from "fs";

// shared/chatTurnProtocol.ts
var CHAT_TURN_PROTOCOL_VERSION = 2;

// callback-src/config.ts
var CHAT_TURN_PROTOCOL_VERSION2 = CHAT_TURN_PROTOCOL_VERSION;
var CONVEX_URL = process.env.CONVEX_URL;
var CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || CONVEX_URL;
var CONVEX_TOKEN = process.env.CONVEX_TOKEN;
var STREAMING_HMAC = process.env.STREAMING_HMAC || "";
var ENTITY_ID = process.env.ENTITY_ID;
var STREAMING_ENTITY_ID = process.env.STREAMING_ENTITY_ID || ENTITY_ID;
var RUN_ID = process.env.RUN_ID || null;
var ENTITY_ID_FIELD = process.env.ENTITY_ID_FIELD;
var TURN_ID = process.env.CHAT_TURN_ID || "";
var ASSISTANT_MESSAGE_ID = process.env.CHAT_ASSISTANT_MESSAGE_ID || "";
var TURN_ATTEMPT = Number(process.env.CHAT_TURN_ATTEMPT || "0");
var CALLBACK_TURN_PROTOCOL_VERSION = Number(
  process.env.CHAT_TURN_PROTOCOL_VERSION || "0"
);
var supportsExactTurnIdentity = CALLBACK_TURN_PROTOCOL_VERSION === CHAT_TURN_PROTOCOL_VERSION2 && TURN_ID.length > 0 && ASSISTANT_MESSAGE_ID.length > 0 && Number.isSafeInteger(TURN_ATTEMPT) && TURN_ATTEMPT > 0;
var TASK_PROOF_CAPTURE_ENABLED = process.env.TASK_PROOF_CAPTURE_ENABLED !== "false";
var ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || "";
var COMPLETION_MUTATION = process.env.COMPLETION_MUTATION;
var CLAIM_MUTATION = process.env.CLAIM_MUTATION;
var OPEN_SYNTHETIC_TURN_MUTATION = process.env.OPEN_SYNTHETIC_TURN_MUTATION;
var COMPLETE_SYNTHETIC_TURN_MUTATION = process.env.COMPLETE_SYNTHETIC_TURN_MUTATION;
var UPDATE_BACKGROUND_AGENTS_MUTATION = process.env.UPDATE_BACKGROUND_AGENTS_MUTATION;
function isProofCompletionMutation(mutation = COMPLETION_MUTATION) {
  return (mutation ?? "").includes("handleProofCompletion");
}
var REQUIRE_TASK_COMMIT = process.env.REQUIRE_TASK_COMMIT === "true";
var PROVIDER = process.env.AI_PROVIDER || "claude";
var MODEL = process.env.AI_MODEL || process.env.CLAUDE_MODEL || "claude:sonnet";
var ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep";
var BLOCKING_QUESTIONS_ENABLED = process.env.ENTITY_ID_FIELD === "sessionId";
var CALLBACK_SCRIPT_FP = process.env.CALLBACK_SCRIPT_FP || "";
var DAEMON_OPTS_SIG = process.env.EVA_DAEMON_OPTS || "";
var SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
var WORK_DIR = existsSync("/tmp/repo") ? "/tmp/repo" : existsSync("/workspace/repo") ? "/workspace/repo" : "/tmp/repo";
var NO_OUTPUT_TIMEOUT_MS = Number(
  process.env.CLAUDE_NO_OUTPUT_TIMEOUT_MS || "60000"
);
var FIRST_EVENT_TIMEOUT_MS = Number(
  process.env.CLAUDE_FIRST_EVENT_TIMEOUT_MS || "90000"
);
var POST_TEXT_STALL_TIMEOUT_MS = Number(
  process.env.CLAUDE_POST_TEXT_STALL_TIMEOUT_MS || "90000"
);
var FIRST_ASSISTANT_EVENT_TIMEOUT_MS = Number(
  process.env.CLAUDE_FIRST_ASSISTANT_EVENT_TIMEOUT_MS || "120000"
);
var NO_OUTPUT_CHECK_INTERVAL_MS = 5e3;
var MAX_TOTAL_RUNTIME_MS = Number(
  process.env.CLAUDE_MAX_TOTAL_RUNTIME_MS || "5400000"
);
var SCRIPT_STARTED_AT = Date.now();
var CALLBACK_HTTP_TIMEOUT_MS = Number(
  process.env.CALLBACK_HTTP_TIMEOUT_MS || "18000"
);
var CALLBACK_HTTP_MAX_RETRIES = Number(
  process.env.CALLBACK_HTTP_MAX_RETRIES || "4"
);
var CALLBACK_HTTP_RETRY_BASE_MS = 1e3;
var STREAMING_HEARTBEAT_MAX_RETRIES = Number(
  process.env.CALLBACK_STREAMING_HEARTBEAT_MAX_RETRIES || "4"
);
var HEARTBEAT_FATAL_BURST = Number(
  process.env.CALLBACK_HEARTBEAT_FATAL_BURST || "10"
);
var HEARTBEAT_FATAL_SLOW_COUNT = Number(
  process.env.CALLBACK_HEARTBEAT_FATAL_SLOW_COUNT || "8"
);
var HEARTBEAT_FATAL_SLOW_WINDOW_MS = Number(
  process.env.CALLBACK_HEARTBEAT_FATAL_SLOW_WINDOW_MS || "180000"
);
var HEARTBEAT_ABSOLUTE_MAX_FAILURES = Number(
  process.env.CALLBACK_HEARTBEAT_ABSOLUTE_MAX_FAILURES || "28"
);
var OUTPUT_BUFFER_MAX_BYTES = Number(
  process.env.CALLBACK_OUTPUT_BUFFER_MAX_BYTES || "2000000"
);
var READY_FILE = "/tmp/run-design.ready";
var RAW_LOG_FILE = "/tmp/run-design.raw.jsonl";
var DONE_FILE = "/tmp/run-design.done";
var CLAUDE_BASE_CONFIG_DIR = process.env.CLAUDE_BASE_CONFIG_DIR || "/home/eva/.claude";
var CLAUDE_RUNTIME_CONFIG_DIR = process.env.CLAUDE_RUNTIME_CONFIG_DIR || "/tmp/claude-config";
var CLAUDE_PERSIST_DIR = process.env.CLAUDE_PERSIST_DIR || "/home/eva/.claude-persist";
var CODEX_RUNTIME_HOME_DIR = process.env.CODEX_RUNTIME_HOME_DIR || "/tmp/codex-home";
var CODEX_PERSIST_DIR = process.env.CODEX_PERSIST_DIR || "/home/eva/.codex-persist";
var CODEX_BIN_PATH = process.env.CODEX_BIN_PATH || "/tmp/codex-cli/bin/codex";
var CODEX_STATE_FILE = "session-state.json";
var CODEX_LOCAL_STATE_FILE = CODEX_RUNTIME_HOME_DIR + "/" + CODEX_STATE_FILE;
var CODEX_PERSIST_STATE_FILE = CODEX_PERSIST_DIR + "/" + CODEX_STATE_FILE;
var CODEX_AUTH_FILE = CODEX_RUNTIME_HOME_DIR + "/auth.json";
var CODEX_PERSIST_AUTH_FILE = CODEX_PERSIST_DIR + "/auth.json";
var CODEX_AUTH_JSON = process.env.CODEX_AUTH_JSON || "";
var CODEX_AUTH_JSON_BASE64 = process.env.CODEX_AUTH_JSON_BASE64 || "";
var CODEX_CONFIG_TOML = process.env.CODEX_CONFIG_TOML || "";
var CODEX_CONFIG_TOML_BASE64 = process.env.CODEX_CONFIG_TOML_BASE64 || "";
var OPENCODE_RUNTIME_HOME_DIR = process.env.OPENCODE_RUNTIME_HOME_DIR || "/tmp/opencode-home";
var OPENCODE_PERSIST_DIR = process.env.OPENCODE_PERSIST_DIR || "/home/eva/.opencode-persist";
var OPENCODE_BIN_PATH = process.env.EVA_OPENCODE_BIN_PATH || "/tmp/opencode-cli/bin/opencode";
var OPENCODE_STATE_FILE = "session-state.json";
var OPENCODE_LOCAL_STATE_FILE = OPENCODE_RUNTIME_HOME_DIR + "/" + OPENCODE_STATE_FILE;
var OPENCODE_PERSIST_STATE_FILE = OPENCODE_PERSIST_DIR + "/" + OPENCODE_STATE_FILE;
var OPENCODE_CONFIG_JSON = process.env.OPENCODE_CONFIG_JSON || "";
var OPENCODE_CONFIG_JSON_BASE64 = process.env.OPENCODE_CONFIG_JSON_BASE64 || "";
var OPENCODE_AUTH_DIR = "/home/eva/.local/share/opencode";
var OPENCODE_AUTH_FILE = OPENCODE_AUTH_DIR + "/auth.json";
var OPENCODE_PERSIST_AUTH_FILE = OPENCODE_PERSIST_DIR + "/auth.json";
var OPENCODE_AUTH_JSON = process.env.OPENCODE_AUTH_JSON || "";
var OPENCODE_AUTH_JSON_BASE64 = process.env.OPENCODE_AUTH_JSON_BASE64 || "";
var CURSOR_RUNTIME_HOME_DIR = process.env.CURSOR_RUNTIME_HOME_DIR || "/tmp/cursor-home";
var CURSOR_PERSIST_DIR = process.env.CURSOR_PERSIST_DIR || "/home/eva/.cursor-persist";
var CURSOR_BIN_PATH = process.env.CURSOR_BIN_PATH || "/home/eva/.local/bin/cursor-agent";
var CURSOR_STATE_FILE = "session-state.json";
var CURSOR_LOCAL_STATE_FILE = CURSOR_RUNTIME_HOME_DIR + "/" + CURSOR_STATE_FILE;
var CURSOR_PERSIST_STATE_FILE = CURSOR_PERSIST_DIR + "/" + CURSOR_STATE_FILE;
var CLAUDE_SESSION_PROJECT_DIR = WORK_DIR.replace(/\\//g, "-");
var CLAUDE_LOCAL_PROJECT_DIR = CLAUDE_RUNTIME_CONFIG_DIR + "/projects/" + CLAUDE_SESSION_PROJECT_DIR;
var CLAUDE_PERSIST_PROJECT_DIR = CLAUDE_PERSIST_DIR + "/projects/" + CLAUDE_SESSION_PROJECT_DIR;
var CLAUDE_STATE_FILE_NAME = "session-state.json";
var CLAUDE_LOCAL_STATE_FILE = CLAUDE_RUNTIME_CONFIG_DIR + "/" + CLAUDE_STATE_FILE_NAME;
var CLAUDE_PERSIST_STATE_FILE = CLAUDE_PERSIST_DIR + "/" + CLAUDE_STATE_FILE_NAME;
var CLAUDE_SYNC_TIMEOUT_MS = Number(
  process.env.CLAUDE_SYNC_TIMEOUT_MS || "10000"
);
var CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS = Number(
  process.env.CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS || "5"
);
var GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
if (GH_TOKEN) {
  process.env.GH_TOKEN = GH_TOKEN;
  process.env.GITHUB_TOKEN = GH_TOKEN;
}
process.env.GH_PROMPT_DISABLED = "1";
process.env.GH_NO_UPDATE_NOTIFIER = "1";
var REPO_ID = process.env.REPO_ID;
var REASONING_EFFORT = process.env.AI_REASONING_EFFORT || "";
var AI_THINKING_ENABLED = process.env.AI_THINKING_ENABLED || "";
var AI_CONTEXT_1M = process.env.AI_CONTEXT_1M || "";
var CLAUDE_EFFORT_LEVELS = /* @__PURE__ */ new Set(["low", "medium", "high", "xhigh", "max"]);
var claudeEffort = PROVIDER === "claude" && CLAUDE_EFFORT_LEVELS.has(REASONING_EFFORT) ? REASONING_EFFORT : "";
var CODEX_REASONING_EFFORT = {
  // GPT-5.5 uses none/low/medium/high/xhigh; "minimal" kept for older CLIs.
  off: "none",
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh",
  max: "xhigh"
};
var codexReasoningEffort = PROVIDER === "codex" ? CODEX_REASONING_EFFORT[REASONING_EFFORT] ?? "" : "";
function buildSettingsJson() {
  const settings = {
    attribution: { commit: "", pr: "" }
  };
  const thinkingDisabled = AI_THINKING_ENABLED === "0" || PROVIDER === "claude" && REASONING_EFFORT === "off";
  if (thinkingDisabled) {
    settings.alwaysThinkingEnabled = false;
  }
  return JSON.stringify(settings);
}
var settingsJson = buildSettingsJson();
var hasMcpConfig = existsSync("/tmp/eva-mcp.json");
var claudeModelBase = MODEL.startsWith("claude:") ? MODEL.slice("claude:".length) : MODEL;
var normalizedClaudeModel = PROVIDER === "claude" && AI_CONTEXT_1M === "1" ? \`\${claudeModelBase}[1m]\` : claudeModelBase;
var normalizedCodexModel = MODEL.startsWith("codex:") ? MODEL.slice("codex:".length) : MODEL;
var normalizedOpencodeModel = MODEL.startsWith("opencode:") ? MODEL.slice("opencode:".length) : MODEL;
var CURSOR_CLI_MODEL_IDS = {
  "grok-4.5-low": "cursor-grok-4.5-low",
  "grok-4.5-medium": "cursor-grok-4.5-medium",
  "grok-4.5-high": "cursor-grok-4.5-high",
  "cursor-grok-4.5-low": "cursor-grok-4.5-low",
  "cursor-grok-4.5-medium": "cursor-grok-4.5-medium",
  "cursor-grok-4.5-high": "cursor-grok-4.5-high"
};
var cursorModelRaw = MODEL.startsWith("cursor:") ? MODEL.slice("cursor:".length) : MODEL;
var normalizedCursorModel = CURSOR_CLI_MODEL_IDS[cursorModelRaw] ?? cursorModelRaw;
var codexCommand = existsSync(CODEX_BIN_PATH) ? JSON.stringify(CODEX_BIN_PATH) : "codex";
var opencodeCommand = existsSync(OPENCODE_BIN_PATH) ? JSON.stringify(OPENCODE_BIN_PATH) : "opencode";
var cursorCommand = existsSync(CURSOR_BIN_PATH) ? JSON.stringify(CURSOR_BIN_PATH) : "cursor-agent";
var codexPromptCmd = SYSTEM_PROMPT ? "(printf %s\\\\n\\\\n " + JSON.stringify(SYSTEM_PROMPT) + "; cat /tmp/design-prompt.txt)" : "cat /tmp/design-prompt.txt";
var opencodePromptCmd = codexPromptCmd;
var codexExecBaseCmd = codexCommand + " exec --skip-git-repo-check --full-auto --json --model " + JSON.stringify(normalizedCodexModel);
var opencodeExecBaseCmd = opencodeCommand + " run --format json --model " + JSON.stringify(normalizedOpencodeModel);
var cursorPromptExpr = SYSTEM_PROMPT ? '"\$(printf %s\\\\n\\\\n ' + JSON.stringify(SYSTEM_PROMPT) + '; cat /tmp/design-prompt.txt)"' : '"\$(cat /tmp/design-prompt.txt)"';
var cursorExecBaseCmd = cursorCommand + " -p " + cursorPromptExpr + " --force --trust --workspace " + JSON.stringify(WORK_DIR) + " --model " + JSON.stringify(normalizedCursorModel) + " --output-format stream-json --approve-mcps";
var TOOL_STEP_TYPES = /* @__PURE__ */ new Set([
  "read",
  "search_files",
  "search_code",
  "write",
  "edit",
  "bash",
  "tool",
  "web_fetch",
  "web_search",
  "notebook",
  "subtask",
  "question",
  "todos"
]);
var CODEX_PRICING_PER_MILLION = {
  // OpenAI API list prices (per 1M tokens).
  "gpt-5.5": { input: 5, cached: 0.5, output: 30 },
  // Legacy — kept so in-flight sandboxes still cost-account correctly.
  "gpt-5.5-pro": { input: 30, cached: 30, output: 180 },
  "gpt-5.4": { input: 1.25, cached: 0.125, output: 10 },
  "gpt-5.4-mini": { input: 0.25, cached: 0.025, output: 2 },
  "gpt-5.3-codex": { input: 1.25, cached: 0.125, output: 10 },
  "gpt-5.2-codex": { input: 1.25, cached: 0.125, output: 10 },
  "gpt-5-codex": { input: 1.25, cached: 0.125, output: 10 }
};
var completedLabels = {
  "Preparing Claude session...": "Prepared Claude session",
  "Preparing Codex session...": "Prepared Codex session",
  "Preparing Opencode session...": "Prepared Opencode session",
  "Preparing Cursor session...": "Prepared Cursor session",
  "Starting Claude CLI...": "Started Claude CLI",
  "Starting Codex CLI...": "Started Codex CLI",
  "Starting Opencode CLI...": "Started Opencode CLI",
  "Starting Cursor CLI...": "Started Cursor CLI",
  "Restoring Claude session...": "Restored Claude session",
  "Thinking...": "Thought",
  "Generating response...": "Generated response",
  "Streaming response...": "Streamed response",
  "Finalizing response...": "Finalized response",
  "Reading file...": "Read file",
  "Searching files...": "Searched files",
  "Searching code...": "Searched code",
  "Creating file...": "Created file",
  "Editing file...": "Edited file",
  "Running command...": "Ran command",
  "Running in background...": "Started background process",
  "Stopping background process...": "Stopped background process",
  "Using Skill...": "Used Skill",
  "Fetching URL...": "Fetched URL",
  "Searching web...": "Searched web",
  "Editing notebook...": "Edited notebook",
  "Running agent...": "Ran agent",
  "Updating tasks...": "Updated tasks",
  "Reading tasks...": "Read tasks",
  "Asking a question...": "Asked a question"
};

// callback-src/providers/claudeSdkDaemon.ts
import { unlinkSync as unlinkSync2, writeFileSync as writeFileSync11, readFileSync as readFileSync7 } from "fs";

// callback-src/providers/daemonPaths.ts
var LEGACY_DAEMON_PID = "/tmp/eva-daemon.pid";
var LEGACY_DAEMON_ENTITY = "/tmp/eva-daemon.entity";
var LEGACY_DAEMON_OPTS = "/tmp/eva-daemon.opts";
function resolveDaemonPaths(entityIdField = ENTITY_ID_FIELD, entityId = ENTITY_ID) {
  const field = entityIdField ?? "sessionId";
  const id = entityId ?? "";
  const suffix = \`\${field}-\${id}\`;
  return {
    pid: \`/tmp/eva-daemon.\${suffix}.pid\`,
    entity: \`/tmp/eva-daemon.\${suffix}.entity\`,
    opts: \`/tmp/eva-daemon.\${suffix}.opts\`
  };
}
function resolveLegacySessionDaemonPaths() {
  return {
    pid: LEGACY_DAEMON_PID,
    entity: LEGACY_DAEMON_ENTITY,
    opts: LEGACY_DAEMON_OPTS
  };
}

// callback-src/utils.ts
import { spawnSync } from "child_process";
import {
  cpSync,
  existsSync as existsSync2,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "fs";

// callback-src/runtime/state.ts
function parsePriorStep(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const label = value.label;
  const type = value.type;
  if (typeof label !== "string" || typeof type !== "string") {
    return null;
  }
  if (type === "thinking" || type === "reasoning" || type === "response") {
    return null;
  }
  const detail = value.detail;
  const path = value.path;
  const step = {
    type,
    label,
    detail: typeof detail === "string" ? detail : void 0,
    path: typeof path === "string" ? path : void 0,
    status: "complete"
  };
  if (typeof value.toolUseId === "string" && value.toolUseId.trim()) {
    step.toolUseId = value.toolUseId.trim();
  }
  if (typeof value.parentToolUseId === "string" && value.parentToolUseId.trim()) {
    step.parentToolUseId = value.parentToolUseId.trim();
  }
  if (typeof value.command === "string" && value.command) {
    step.command = value.command;
  }
  if (typeof value.contentPreview === "string" && value.contentPreview) {
    step.contentPreview = value.contentPreview;
  }
  if (value.isError === true) {
    step.isError = true;
  }
  if (typeof value.durationMs === "number" && Number.isFinite(value.durationMs)) {
    step.durationMs = value.durationMs;
  }
  if (value.output && typeof value.output === "object" && !Array.isArray(value.output) && typeof value.output.text === "string") {
    step.output = {
      text: value.output.text,
      exitCode: typeof value.output.exitCode === "number" ? value.output.exitCode : void 0,
      truncated: value.output.truncated === true ? true : void 0
    };
  }
  if (Array.isArray(value.edits)) {
    const edits = [];
    for (const edit of value.edits) {
      if (!edit || typeof edit !== "object" || Array.isArray(edit)) continue;
      if (typeof edit.oldText !== "string" || typeof edit.newText !== "string") {
        continue;
      }
      edits.push({ oldText: edit.oldText, newText: edit.newText });
    }
    if (edits.length > 0) {
      step.edits = edits;
    }
  }
  if (Array.isArray(value.files)) {
    const files = [];
    for (const file2 of value.files) {
      if (typeof file2 === "string" && file2.trim()) {
        files.push(file2.trim());
      }
    }
    if (files.length > 0) {
      step.files = files;
    }
  }
  if (Array.isArray(value.todos)) {
    const todos = [];
    for (const item of value.todos) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      if (typeof item.content !== "string" || !item.content) continue;
      const status = item.status === "in_progress" || item.status === "completed" ? item.status : "pending";
      todos.push({ content: item.content, status });
    }
    if (todos.length > 0) {
      step.todos = todos;
    }
  }
  return step;
}
var callbackState = {
  accumulatedSteps: [],
  pendingQuestionData: "",
  lastStepType: "",
  rawOutput: "",
  rawLogStream: null,
  rawLogStreamFailed: false,
  rawLogBytesWritten: 0,
  lastProcessed: 0,
  lastStreamingSentAt: Date.now(),
  lastSentPayload: "",
  lastSentContent: "",
  parsedStreamEventCount: 0,
  realtimeOutputBuffer: "",
  activeClaudeSessionId: process.env.CLAUDE_SESSION_ID || "",
  activeCodexThreadId: "",
  activeOpencodeSessionId: "",
  opencodeFinalMessageId: "",
  activeCursorSessionId: "",
  resultEventSeen: false,
  activeClaudeSessionMode: "none",
  waitingForFirstAssistantEvent: false,
  claudeInitAt: 0,
  activeAttemptStartedAt: 0,
  firstAssistantEventAt: 0,
  firstTextBlockAt: 0,
  currentStreamedContent: "",
  streamedAssistantTextThisMessage: false,
  pendingParagraphBreak: false,
  activeAttemptChild: null,
  fatalHeartbeatErrorMessage: "",
  consecutiveHeartbeatFailures: 0,
  heartbeatFailureStreakStartedAt: 0,
  inFlightToolUses: 0,
  codexToolItemIds: /* @__PURE__ */ new Set(),
  todoState: [],
  awaitingQuestionAnswer: false,
  doneFileWritten: false,
  flushInProgress: false,
  pingInProgress: false,
  pingStartedAt: 0,
  callbackReady: false,
  streamingLoopsStopped: false,
  stderrOutput: ""
};
try {
  const priorRaw = process.env.PRIOR_STEPS;
  if (priorRaw) {
    const prior = JSON.parse(priorRaw);
    if (Array.isArray(prior)) {
      for (const s of prior) {
        const step = parsePriorStep(s);
        if (step) callbackState.accumulatedSteps.push(step);
      }
    }
  }
} catch {
}
function shiftLastProcessed(trimAmount) {
  callbackState.lastProcessed = Math.max(
    0,
    callbackState.lastProcessed - trimAmount
  );
}
function appendRawOutputChunk(text) {
  callbackState.rawOutput += text;
}
function trimRawOutputHead(maxBytes) {
  if (callbackState.rawOutput.length <= maxBytes) return 0;
  const trimAmount = callbackState.rawOutput.length - maxBytes;
  callbackState.rawOutput = callbackState.rawOutput.slice(trimAmount);
  return trimAmount;
}
function incrementRawLogBytesWritten(n) {
  callbackState.rawLogBytesWritten += n;
}
function setRawLogStreamFailed(value) {
  callbackState.rawLogStreamFailed = value;
}
function assignRawLogStream(stream) {
  callbackState.rawLogStream = stream;
}

// callback-src/utils.ts
function narrowJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const items = [];
    for (const item of value) {
      if (typeof item !== "object" && typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean" && item !== null) {
        return null;
      }
      const narrowed = narrowJsonValue(item);
      if (narrowed === null && item !== null) return null;
      items.push(narrowed);
    }
    return items;
  }
  const obj = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "object" && typeof entry !== "string" && typeof entry !== "number" && typeof entry !== "boolean" && entry !== null) {
      return null;
    }
    const narrowed = narrowJsonValue(entry);
    if (narrowed === null && entry !== null) return null;
    obj[key] = narrowed;
  }
  return obj;
}
function log(msg) {
  const line = "[callback " + (/* @__PURE__ */ new Date()).toISOString() + "] " + msg + "\\n";
  console.error(line.trim());
  try {
    writeFileSync("/tmp/callback-debug.log", line, { flag: "a" });
  } catch {
  }
}
function tryParseJson(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean" || typeof parsed === "object") {
      return narrowJsonValue(parsed);
    }
    return null;
  } catch {
    return null;
  }
}
async function readResponseJson(res) {
  const parsed = await res.json();
  if (parsed === null || typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean" || typeof parsed === "object") {
    return narrowJsonValue(parsed);
  }
  return null;
}
function shortenPath(p) {
  const parts = p.replace(/\\\\/g, "/").split("/");
  if (parts.length <= 4) return parts.join("/");
  return ".../" + parts.slice(-3).join("/");
}
function copyFileIfPresent(sourcePath, targetPath, label) {
  const copyScript = "if [ -f " + JSON.stringify(sourcePath) + " ]; then timeout " + String(CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS) + " cp -f " + JSON.stringify(sourcePath) + " " + JSON.stringify(targetPath) + " || true; fi";
  runTimedBashSync(copyScript, label);
}
function decodeBase64(value) {
  return Buffer.from(value, "base64").toString("utf8");
}
function runTimedBashSync(script, label) {
  const result = spawnSync("bash", ["-lc", script], {
    encoding: "utf8",
    env: { ...process.env },
    timeout: CLAUDE_SYNC_TIMEOUT_MS
  });
  const timedOut = result.signal === "SIGTERM" || result.signal === "SIGKILL";
  if (result.error || timedOut || result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    log(
      label + " failed (status=" + String(result.status) + ", signal=" + String(result.signal || "none") + "): " + (result.error ? String(result.error) : stderr || stdout || "unknown error")
    );
    return false;
  }
  return true;
}
function readGitHeadSha() {
  const result = spawnSync("git", ["-C", WORK_DIR, "rev-parse", "HEAD"], {
    encoding: "utf8",
    timeout: CLAUDE_SYNC_TIMEOUT_MS
  });
  if (result.status !== 0) {
    return "";
  }
  return (result.stdout || "").trim();
}
function hasNewTaskCommitSince(baselineHead) {
  if (!baselineHead) {
    return false;
  }
  const currentHead = readGitHeadSha();
  if (!currentHead || currentHead === baselineHead) {
    return false;
  }
  const countResult = spawnSync(
    "git",
    ["-C", WORK_DIR, "rev-list", "--count", baselineHead + ".." + currentHead],
    { encoding: "utf8", timeout: CLAUDE_SYNC_TIMEOUT_MS }
  );
  if (countResult.status !== 0) {
    return true;
  }
  const count = Number((countResult.stdout || "").trim());
  return Number.isFinite(count) && count > 0;
}
function copyBaseClaudeConfig() {
  const startedAt = Date.now();
  if (!existsSync2(CLAUDE_BASE_CONFIG_DIR)) {
    log("copyBaseClaudeConfig skipped: base config dir missing");
    return;
  }
  mkdirSync(CLAUDE_RUNTIME_CONFIG_DIR, { recursive: true });
  for (const entry of readdirSync(CLAUDE_BASE_CONFIG_DIR, {
    withFileTypes: true
  })) {
    if (entry.name === "projects") {
      continue;
    }
    const sourcePath = CLAUDE_BASE_CONFIG_DIR + "/" + entry.name;
    const targetPath = CLAUDE_RUNTIME_CONFIG_DIR + "/" + entry.name;
    try {
      cpSync(sourcePath, targetPath, { force: true, recursive: true });
    } catch (error40) {
      log("copyBaseClaudeConfig skipped " + entry.name + ": " + String(error40));
    }
  }
  log(
    "copyBaseClaudeConfig finished in " + String(Date.now() - startedAt) + "ms"
  );
}
function logTranscriptStats(sessionId, label) {
  if (!sessionId) {
    log(label + ": no session id");
    return;
  }
  const transcriptPath = buildClaudeTranscriptPath(
    CLAUDE_LOCAL_PROJECT_DIR,
    sessionId
  );
  if (!existsSync2(transcriptPath)) {
    log(label + ": transcript missing (" + transcriptPath + ")");
    return;
  }
  try {
    const content = readFileSync(transcriptPath, "utf8");
    const lineCount = content.length === 0 ? 0 : content.split("\\n").length;
    const byteSize = statSync(transcriptPath).size;
    log(
      label + ": sessionId=" + sessionId + " bytes=" + String(byteSize) + " lines=" + String(lineCount)
    );
  } catch (error40) {
    log(label + ": failed to inspect transcript: " + String(error40));
  }
}
function buildClaudeTranscriptPath(projectDir, sessionId) {
  return projectDir + "/" + sessionId + ".jsonl";
}
function attemptElapsedMs() {
  return callbackState.activeAttemptStartedAt > 0 ? Date.now() - callbackState.activeAttemptStartedAt : 0;
}
function elapsedAttemptMs() {
  return attemptElapsedMs();
}

// callback-src/runtime/turnIdentity.ts
var activeTurnIdentity = supportsExactTurnIdentity ? {
  turnId: TURN_ID,
  assistantMessageId: ASSISTANT_MESSAGE_ID,
  attempt: TURN_ATTEMPT
} : null;
function setActiveTurnIdentity(identity) {
  activeTurnIdentity = identity;
}
function activeTurnIdentityArgs() {
  if (activeTurnIdentity === null) return {};
  return {
    turnId: activeTurnIdentity.turnId,
    assistantMessageId: activeTurnIdentity.assistantMessageId,
    attempt: activeTurnIdentity.attempt
  };
}

// callback-src/http/convexClient.ts
function appendActiveTurnIdentity(body) {
  const identity = activeTurnIdentityArgs();
  if (identity.turnId !== void 0) body.set("turnId", identity.turnId);
  if (identity.assistantMessageId !== void 0) {
    body.set("assistantMessageId", identity.assistantMessageId);
  }
  if (identity.attempt !== void 0) {
    body.set("attempt", String(identity.attempt));
  }
}
async function fetchWithTimeout(url2, options, timeoutMs = CALLBACK_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url2, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
function buildRetryDelayMs(attempt) {
  const exponential = Math.pow(2, attempt - 1) * CALLBACK_HTTP_RETRY_BASE_MS;
  const jitter = Math.floor(Math.random() * 500);
  return exponential + jitter;
}
async function callConvex(type, path, args) {
  const endpoint = type === "mutation" ? "/api/mutation" : "/api/action";
  const headers = {
    "Content-Type": "application/json"
  };
  if (CONVEX_TOKEN) headers["Authorization"] = "Bearer " + CONVEX_TOKEN;
  const res = await fetchWithTimeout(CONVEX_URL + endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ path, args, format: "json" })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      "Convex " + type + " " + path + " failed: " + res.status + " " + text
    );
  }
  return await readResponseJson(res) ?? null;
}
async function callConvexWithRetry(type, path, args, maxRetries = CALLBACK_HTTP_MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await callConvex(type, path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error(
        "callConvex(" + type + ") attempt " + attempt + " failed, retrying in " + delayMs + "ms:",
        String(e)
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
async function callStreamingHeartbeatTouchOnce(entityId) {
  if (CONVEX_SITE_URL && STREAMING_HMAC) {
    const body = new URLSearchParams();
    body.set("entityId", entityId);
    body.set("hmac", STREAMING_HMAC);
    body.set("touchOnly", "1");
    appendActiveTurnIdentity(body);
    const res = await fetchWithTimeout(
      CONVEX_SITE_URL + "/api/streaming/heartbeat",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        "Streaming heartbeat touch failed: " + res.status + " " + text
      );
    }
    return res.text();
  }
  return await callConvex("mutation", "streaming:touch", {
    entityId,
    ...activeTurnIdentityArgs()
  });
}
async function callStreamingHeartbeatOnce(entityId, currentActivity, currentContent, pendingQuestion) {
  if (CONVEX_SITE_URL && STREAMING_HMAC) {
    const body = new URLSearchParams();
    body.set("entityId", entityId);
    body.set("hmac", STREAMING_HMAC);
    body.set("currentActivity", currentActivity);
    body.set("currentContent", currentContent || "");
    appendActiveTurnIdentity(body);
    if (pendingQuestion) {
      body.set("pendingQuestion", pendingQuestion);
    }
    const res = await fetchWithTimeout(
      CONVEX_SITE_URL + "/api/streaming/heartbeat",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error("Streaming heartbeat failed: " + res.status + " " + text);
    }
    return res.text();
  }
  const args = {
    entityId,
    currentActivity,
    currentContent,
    ...activeTurnIdentityArgs()
  };
  if (pendingQuestion) {
    args.pendingQuestion = pendingQuestion;
  }
  return await callConvex("mutation", "streaming:set", args);
}
async function callStreamingHeartbeat(entityId, currentActivity, currentContent, pendingQuestion) {
  let attempt = 0;
  while (true) {
    try {
      return await callStreamingHeartbeatOnce(
        entityId,
        currentActivity,
        currentContent,
        pendingQuestion
      );
    } catch (e) {
      attempt++;
      if (attempt > STREAMING_HEARTBEAT_MAX_RETRIES) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error(
        "streaming heartbeat attempt " + attempt + " failed, retrying in " + delayMs + "ms:",
        String(e)
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
async function callStreamingHeartbeatTouch(entityId) {
  let attempt = 0;
  while (true) {
    try {
      return await callStreamingHeartbeatTouchOnce(entityId);
    } catch (e) {
      attempt++;
      if (attempt > STREAMING_HEARTBEAT_MAX_RETRIES) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error(
        "streaming heartbeat touch attempt " + attempt + " failed, retrying in " + delayMs + "ms:",
        String(e)
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// callback-src/parse/stepBudget.ts
var STEP_FIELD_CAPS = {
  command: 600,
  output: 1200,
  editSide: 1e3,
  editsMax: 4,
  filesMax: 10,
  contentPreview: 1e3,
  /** Soft ceiling for the whole steps JSON payload (under Convex 1 MiB). */
  jsonBytes: 600 * 1024
};
function headCap(text, max) {
  if (text.length <= max) {
    return { text, truncated: false };
  }
  return { text: text.slice(0, max), truncated: true };
}
function tailCap(text, max) {
  if (text.length <= max) {
    return { text, truncated: false };
  }
  return { text: text.slice(text.length - max), truncated: true };
}
var HEAVY_FIELDS = ["output", "edits", "files", "contentPreview"];
function stripHeavyField(step, field) {
  if (field === "output" && step.output !== void 0) {
    delete step.output;
    return true;
  }
  if (field === "edits" && step.edits !== void 0) {
    delete step.edits;
    return true;
  }
  if (field === "files" && step.files !== void 0) {
    delete step.files;
    return true;
  }
  if (field === "contentPreview" && step.contentPreview !== void 0) {
    delete step.contentPreview;
    return true;
  }
  return false;
}
function enforceStepBudget(steps) {
  let encoded = JSON.stringify(steps);
  if (encoded.length <= STEP_FIELD_CAPS.jsonBytes) {
    return steps;
  }
  for (const field of HEAVY_FIELDS) {
    for (const step of steps) {
      if (encoded.length <= STEP_FIELD_CAPS.jsonBytes) {
        return steps;
      }
      if (stripHeavyField(step, field)) {
        encoded = JSON.stringify(steps);
      }
    }
  }
  return steps;
}
function serializeSteps(steps) {
  return JSON.stringify(enforceStepBudget(steps));
}

// callback-src/parse/toolResultCapture.ts
function capCommand(command) {
  return headCap(command, STEP_FIELD_CAPS.command).text;
}
function capContentPreview(content) {
  return headCap(content, STEP_FIELD_CAPS.contentPreview).text;
}
function buildStepOutput(text, exitCode) {
  const trimmed = text.trim();
  if (!trimmed && exitCode === void 0) {
    return void 0;
  }
  const capped = tailCap(trimmed, STEP_FIELD_CAPS.output);
  return {
    text: capped.text,
    exitCode,
    truncated: capped.truncated ? true : void 0
  };
}
function extractClaudeEdits(input) {
  const edits = [];
  const pushEdit = (oldText, newText) => {
    if (edits.length >= STEP_FIELD_CAPS.editsMax) return;
    edits.push({
      oldText: headCap(oldText, STEP_FIELD_CAPS.editSide).text,
      newText: headCap(newText, STEP_FIELD_CAPS.editSide).text
    });
  };
  if (typeof input.old_string === "string" && typeof input.new_string === "string") {
    pushEdit(input.old_string, input.new_string);
  }
  if (Array.isArray(input.edits)) {
    for (const item of input.edits) {
      if (edits.length >= STEP_FIELD_CAPS.editsMax) break;
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const oldText = typeof item.old_string === "string" ? item.old_string : typeof item.oldText === "string" ? item.oldText : typeof item.old_text === "string" ? item.old_text : "";
      const newText = typeof item.new_string === "string" ? item.new_string : typeof item.newText === "string" ? item.newText : typeof item.new_text === "string" ? item.new_text : "";
      if (oldText || newText) {
        pushEdit(oldText, newText);
      }
    }
  }
  return edits.length > 0 ? edits : void 0;
}
function readStringField(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}
function readNumberField(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return void 0;
}
function pickToolCallId(obj) {
  const id = readStringField(obj, [
    "call_id",
    "callId",
    "tool_use_id",
    "toolUseId",
    "tool_call_id",
    "toolCallId",
    "id"
  ]);
  return id.trim() ? id.trim() : void 0;
}
function probeToolCompleteResult(source) {
  if (source === null || source === void 0) {
    return void 0;
  }
  if (typeof source === "string") {
    const output2 = buildStepOutput(source);
    return output2 ? { output: output2 } : void 0;
  }
  if (typeof source !== "object" || Array.isArray(source)) {
    return void 0;
  }
  const obj = source;
  const nestedResult = obj.result && typeof obj.result === "object" && !Array.isArray(obj.result) ? obj.result : null;
  const textCandidates = [];
  const pushText = (value) => {
    if (typeof value === "string" && value.trim()) {
      textCandidates.push(value);
    }
  };
  pushText(obj.aggregated_output);
  pushText(obj.output);
  pushText(obj.stdout);
  pushText(obj.stderr);
  pushText(obj.content);
  if (nestedResult) {
    pushText(nestedResult.output);
    pushText(nestedResult.stdout);
    pushText(nestedResult.stderr);
    pushText(nestedResult.content);
  }
  if (typeof obj.result === "string") {
    textCandidates.push(obj.result);
  }
  const exitCode = readNumberField(obj, ["exit_code", "exitCode", "exit"]) ?? (nestedResult ? readNumberField(nestedResult, ["exit_code", "exitCode", "exit"]) : void 0);
  const combined = textCandidates.join("\\n").trim();
  const output = buildStepOutput(combined, exitCode);
  const isError = obj.is_error === true || obj.isError === true || typeof obj.error === "string" && obj.error.trim().length > 0 || exitCode !== void 0 && exitCode !== 0;
  const files = extractFilePaths(obj);
  if (!output && !isError && files.length === 0) {
    return void 0;
  }
  return {
    output,
    isError: isError ? true : void 0,
    files: files.length > 0 ? files : void 0
  };
}
function extractFilePaths(obj) {
  const paths = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (path) => {
    const trimmed = path.trim();
    if (!trimmed || seen.has(trimmed)) return;
    if (paths.length >= STEP_FIELD_CAPS.filesMax) return;
    seen.add(trimmed);
    paths.push(trimmed);
  };
  if (Array.isArray(obj.files)) {
    for (const item of obj.files) {
      if (typeof item === "string") add(item);
    }
  }
  if (Array.isArray(obj.changes)) {
    for (const change of obj.changes) {
      if (!change || typeof change !== "object" || Array.isArray(change)) {
        continue;
      }
      if (typeof change.path === "string") add(change.path);
      if (typeof change.file_path === "string") add(change.file_path);
    }
  }
  return paths;
}
function probeCodexItemResult(item, failed) {
  const probed = probeToolCompleteResult(item);
  const files = extractFilePaths(item);
  const exitCode = readNumberField(item, ["exit_code", "exitCode"]);
  const isError = failed || exitCode !== void 0 && exitCode !== 0 || probed?.isError === true;
  if (!probed && files.length === 0 && !isError) {
    return void 0;
  }
  return {
    output: probed?.output,
    isError: isError ? true : void 0,
    files: files.length > 0 ? files : probed?.files
  };
}
function probeOpencodeStateResult(state) {
  const status = typeof state.status === "string" ? state.status : "";
  const outputText = typeof state.output === "string" ? state.output : typeof state.error === "string" ? state.error : "";
  const metadata = state.metadata && typeof state.metadata === "object" && !Array.isArray(state.metadata) ? state.metadata : null;
  const exitCode = metadata ? readNumberField(metadata, ["exit", "exit_code", "exitCode"]) : void 0;
  const time3 = state.time && typeof state.time === "object" && !Array.isArray(state.time) ? state.time : null;
  let durationMs;
  if (time3 && typeof time3.start === "number" && typeof time3.end === "number" && time3.end >= time3.start) {
    durationMs = time3.end - time3.start;
  }
  const isError = status === "error" || typeof state.error === "string" && state.error.trim().length > 0 || exitCode !== void 0 && exitCode !== 0;
  const output = buildStepOutput(outputText, exitCode);
  if (!output && !isError && durationMs === void 0) {
    return void 0;
  }
  return {
    output,
    isError: isError ? true : void 0,
    durationMs
  };
}

// callback-src/parse/toolSteps.ts
function opencodeToolToStep(part) {
  const tool = typeof part.tool === "string" ? part.tool : "tool";
  const stateObj = part.state && typeof part.state === "object" && !Array.isArray(part.state) ? part.state : null;
  const input = stateObj && "input" in stateObj && stateObj.input && typeof stateObj.input === "object" && !Array.isArray(stateObj.input) ? stateObj.input : {};
  const rawPath = typeof input.filePath === "string" ? input.filePath : typeof input.file_path === "string" ? input.file_path : typeof input.path === "string" ? input.path : "";
  const path = rawPath ? shortenPath(rawPath) : "";
  const toolUseId = pickToolCallId(part) ?? (typeof part.callID === "string" && part.callID.trim() ? part.callID.trim() : void 0);
  let step;
  switch (tool) {
    case "read":
      step = {
        type: "read",
        label: "Reading file...",
        detail: path || void 0,
        path: rawPath || void 0,
        status: "active"
      };
      break;
    case "glob":
      step = {
        type: "search_files",
        label: "Searching files...",
        detail: typeof input.pattern === "string" ? input.pattern : void 0,
        status: "active"
      };
      break;
    case "grep":
      step = {
        type: "search_code",
        label: "Searching code...",
        detail: typeof input.pattern === "string" ? input.pattern : void 0,
        status: "active"
      };
      break;
    case "write": {
      const content = typeof input.content === "string" ? input.content : void 0;
      step = {
        type: "write",
        label: "Creating file...",
        detail: path || void 0,
        path: rawPath || void 0,
        contentPreview: content ? capContentPreview(content) : void 0,
        status: "active"
      };
      break;
    }
    case "edit":
      step = {
        type: "edit",
        label: "Editing file...",
        detail: path || void 0,
        path: rawPath || void 0,
        edits: extractClaudeEdits(input),
        status: "active"
      };
      break;
    case "bash": {
      const rawCommand = typeof input.command === "string" ? input.command : "";
      step = {
        type: "bash",
        label: "Running command...",
        detail: rawCommand ? rawCommand.slice(0, 300) : void 0,
        command: rawCommand ? capCommand(rawCommand) : void 0,
        status: "active"
      };
      break;
    }
    case "webfetch":
      step = {
        type: "web_fetch",
        label: "Fetching URL...",
        detail: typeof input.url === "string" ? input.url : void 0,
        status: "active"
      };
      break;
    case "websearch":
      step = {
        type: "web_search",
        label: "Searching web...",
        detail: typeof input.query === "string" ? input.query : void 0,
        status: "active"
      };
      break;
    case "task":
      step = {
        type: "subtask",
        label: "Running agent...",
        detail: typeof input.description === "string" ? input.description : void 0,
        status: "active"
      };
      break;
    case "todowrite":
    case "todoread":
      step = { type: "tool", label: "Updating tasks...", status: "active" };
      break;
    default:
      step = {
        type: "tool",
        label: "Using " + tool + "...",
        status: "active"
      };
      break;
  }
  if (toolUseId) {
    step.toolUseId = toolUseId;
  }
  return step;
}
function resolveCursorToolCall(toolCall) {
  for (const key of Object.keys(toolCall)) {
    if (!key.endsWith("ToolCall")) continue;
    const payload = toolCall[key];
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      continue;
    const args = "args" in payload && payload.args && typeof payload.args === "object" && !Array.isArray(payload.args) ? payload.args : "input" in payload && payload.input && typeof payload.input === "object" && !Array.isArray(payload.input) ? payload.input : "parameters" in payload && payload.parameters && typeof payload.parameters === "object" && !Array.isArray(payload.parameters) ? payload.parameters : payload;
    return {
      kind: key.slice(0, -"ToolCall".length).toLowerCase(),
      args,
      displayName: key
    };
  }
  const flatName = typeof toolCall.name === "string" ? toolCall.name : typeof toolCall.tool === "string" ? toolCall.tool : typeof toolCall.type === "string" ? toolCall.type : "";
  const flatArgs = toolCall.args && typeof toolCall.args === "object" && !Array.isArray(toolCall.args) ? toolCall.args : toolCall.input && typeof toolCall.input === "object" && !Array.isArray(toolCall.input) ? toolCall.input : toolCall.parameters && typeof toolCall.parameters === "object" && !Array.isArray(toolCall.parameters) ? toolCall.parameters : {};
  return {
    kind: flatName.toLowerCase(),
    args: flatArgs,
    displayName: flatName
  };
}
function cursorToolToStep(toolCall) {
  const { kind, args, displayName } = resolveCursorToolCall(toolCall);
  const pickString = (keys) => {
    for (const key of keys) {
      if (typeof args[key] === "string" && args[key].trim()) {
        return args[key];
      }
    }
    return "";
  };
  const rawPath = pickString([
    "path",
    "file_path",
    "filePath",
    "target_file",
    "targetFile",
    "relativePath",
    "relative_path"
  ]);
  const path = rawPath ? shortenPath(String(rawPath)) : "";
  const command = pickString(["command", "cmd"]);
  const query = pickString([
    "query",
    "pattern",
    "url",
    "glob_pattern",
    "globPattern"
  ]);
  const tool = kind || displayName.toLowerCase();
  let step;
  if (tool.includes("read")) {
    step = {
      type: "read",
      label: "Reading file...",
      detail: path || void 0,
      path: rawPath || void 0,
      status: "active"
    };
  } else if (tool.includes("write") || tool.includes("create")) {
    step = {
      type: "write",
      label: "Creating file...",
      detail: path || void 0,
      path: rawPath || void 0,
      status: "active"
    };
  } else if (tool.includes("edit") || tool.includes("patch") || tool.includes("apply") || tool.includes("replace") || tool.includes("strreplace")) {
    step = {
      type: "edit",
      label: "Editing file...",
      detail: path || void 0,
      path: rawPath || void 0,
      status: "active",
      edits: extractClaudeEdits(args)
    };
  } else if (tool.includes("delete") || tool.includes("remove")) {
    step = {
      type: "edit",
      label: "Deleting file...",
      detail: path || void 0,
      path: rawPath || void 0,
      status: "active"
    };
  } else if (tool.includes("glob") || tool.includes("list") || tool === "ls") {
    step = {
      type: "search_files",
      label: "Searching files...",
      detail: query || path || void 0,
      status: "active"
    };
  } else if (tool.includes("grep") || tool.includes("search")) {
    step = {
      type: tool.includes("file") ? "search_files" : "search_code",
      label: tool.includes("file") ? "Searching files..." : "Searching code...",
      detail: query || path || void 0,
      status: "active"
    };
  } else if (tool.includes("bash") || tool.includes("shell") || tool.includes("exec") || tool.includes("command") || tool.includes("terminal")) {
    step = {
      type: "bash",
      label: "Running command...",
      detail: command ? command.slice(0, 300) : void 0,
      command: command ? capCommand(command) : void 0,
      status: "active"
    };
  } else if (tool.includes("webfetch") || tool.includes("web_fetch") || tool.includes("fetch") && !tool.includes("search")) {
    step = {
      type: "web_fetch",
      label: "Fetching URL...",
      detail: query || void 0,
      status: "active"
    };
  } else if (tool.includes("websearch") || tool.includes("web_search")) {
    step = {
      type: "web_search",
      label: "Searching web...",
      detail: query || void 0,
      status: "active"
    };
  } else if (tool.includes("todo")) {
    step = { type: "tool", label: "Updating tasks...", status: "active" };
  } else if (tool.includes("mcp")) {
    const server = pickString([
      "server",
      "serverName",
      "server_name",
      "toolName",
      "tool_name"
    ]);
    step = {
      type: "tool",
      label: server ? "Using MCP " + server + "..." : "Using MCP tool...",
      status: "active"
    };
  } else {
    const fallbackName = displayName || kind || "tool";
    step = {
      type: "tool",
      label: "Using " + fallbackName + "...",
      status: "active"
    };
  }
  const toolUseId = pickToolCallId(toolCall);
  if (toolUseId) {
    step.toolUseId = toolUseId;
  }
  return step;
}
function toolCallToStep(name, input) {
  const rawPath = typeof input.file_path === "string" ? String(input.file_path) : "";
  const path = rawPath ? shortenPath(rawPath) : "";
  switch (name) {
    case "Read":
      return {
        type: "read",
        label: "Reading file...",
        detail: path || void 0,
        path: rawPath || void 0,
        status: "active"
      };
    case "Glob":
      return {
        type: "search_files",
        label: "Searching files...",
        detail: typeof input.pattern === "string" ? String(input.pattern) : void 0,
        status: "active"
      };
    case "Grep":
      return {
        type: "search_code",
        label: "Searching code...",
        detail: typeof input.pattern === "string" ? String(input.pattern) : void 0,
        status: "active"
      };
    case "Write": {
      const content = typeof input.content === "string" ? input.content : void 0;
      return {
        type: "write",
        label: "Creating file...",
        detail: path || void 0,
        path: rawPath || void 0,
        contentPreview: content ? capContentPreview(content) : void 0,
        status: "active"
      };
    }
    case "Edit": {
      const edits = extractClaudeEdits(input);
      return {
        type: "edit",
        label: "Editing file...",
        detail: path || void 0,
        path: rawPath || void 0,
        edits,
        status: "active"
      };
    }
    case "Bash":
    case "bash": {
      const rawCommand = typeof input.command === "string" ? String(input.command) : "";
      return {
        type: "bash",
        label: input.run_in_background === true ? "Running in background..." : "Running command...",
        detail: rawCommand ? rawCommand.slice(0, 300) : void 0,
        command: rawCommand ? capCommand(rawCommand) : void 0,
        status: "active"
      };
    }
    case "KillShell":
      return {
        type: "bash",
        label: "Stopping background process...",
        detail: typeof input.shell_id === "string" ? String(input.shell_id) : typeof input.shellId === "string" ? String(input.shellId) : void 0,
        status: "active"
      };
    case "Skill":
      return {
        type: "tool",
        label: "Using Skill...",
        detail: typeof input.skill === "string" ? String(input.skill) : void 0,
        status: "active"
      };
    case "WebFetch":
      return {
        type: "web_fetch",
        label: "Fetching URL...",
        detail: typeof input.url === "string" ? String(input.url) : void 0,
        status: "active"
      };
    case "WebSearch":
      return {
        type: "web_search",
        label: "Searching web...",
        detail: typeof input.query === "string" ? String(input.query) : void 0,
        status: "active"
      };
    case "NotebookEdit":
      return {
        type: "notebook",
        label: "Editing notebook...",
        detail: typeof input.notebook_path === "string" ? shortenPath(String(input.notebook_path)) : void 0,
        path: typeof input.notebook_path === "string" ? String(input.notebook_path) : void 0,
        status: "active"
      };
    // Subagent spawn. Named \`Agent\` since claude-code v2.1.63; older CLIs emit
    // \`Task\`. Match both so subagent runs are always recognised (a bare \`Task\`
    // previously fell through to the generic "Using Task..." row).
    case "Agent":
    case "Task":
      return {
        type: "subtask",
        label: "Running agent...",
        detail: typeof input.description === "string" ? String(input.description) : typeof input.subagent_type === "string" ? String(input.subagent_type) : void 0,
        status: "active"
      };
    case "TodoWrite":
      return { type: "tool", label: "Updating tasks...", status: "active" };
    case "TodoRead":
      return { type: "tool", label: "Reading tasks...", status: "active" };
    case "AskUserQuestion":
      return {
        type: "question",
        label: "Asking a question...",
        status: "active"
      };
    default:
      return {
        type: "tool",
        label: "Using " + name + "...",
        status: "active"
      };
  }
}
function getCodexFieldValue(item, keys) {
  const sources = [item];
  if (item.input && typeof item.input === "object" && !Array.isArray(item.input)) {
    sources.push(item.input);
  }
  for (const source of sources) {
    for (const key of keys) {
      if (typeof source[key] === "string" && source[key].trim()) {
        return source[key].trim();
      }
    }
  }
  return "";
}
function getCodexThreadId(event) {
  if (typeof event.thread_id === "string" && event.thread_id.trim()) {
    return event.thread_id.trim();
  }
  if (event.thread && typeof event.thread === "object" && !Array.isArray(event.thread) && typeof event.thread.id === "string" && event.thread.id.trim()) {
    return event.thread.id.trim();
  }
  return "";
}
function getCodexAgentMessageText(item) {
  if (item.type !== "agent_message") {
    return "";
  }
  if (typeof item.text === "string" && item.text) {
    return item.text;
  }
  if (!Array.isArray(item.content)) {
    return "";
  }
  const parts = [];
  for (const block of item.content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    if (typeof block.text === "string" && block.text) {
      parts.push(block.text);
      continue;
    }
    if (typeof block.content === "string" && block.content) {
      parts.push(block.content);
    }
  }
  return parts.join("");
}
function codexItemToStep(item) {
  const itemType = item && typeof item.type === "string" && item.type.trim() ? item.type.trim() : "tool";
  const normalizedType = itemType.toLowerCase();
  const pathValue = getCodexFieldValue(item, [
    "file_path",
    "path",
    "target_file",
    "target_path",
    "notebook_path"
  ]);
  const queryValue = getCodexFieldValue(item, ["query", "pattern", "url"]);
  const commandValue = getCodexFieldValue(item, ["command", "cmd"]);
  const descriptionValue = getCodexFieldValue(item, [
    "description",
    "name",
    "tool",
    "skill"
  ]);
  const normalizedDescription = descriptionValue.toLowerCase();
  const pathDetail = pathValue ? shortenPath(String(pathValue)) : "";
  const itemId = typeof item.id === "string" && item.id.trim() ? item.id.trim() : void 0;
  const withId = (step) => {
    if (itemId) step.toolUseId = itemId;
    return step;
  };
  if (normalizedType.includes("file_change") || normalizedType === "filechange") {
    const files = extractFilePaths(item);
    return withId({
      type: "edit",
      label: "Editing file...",
      detail: files[0] ? shortenPath(files[0]) : pathDetail || void 0,
      path: files[0] || pathValue || void 0,
      files: files.length > 0 ? files : void 0,
      status: "active"
    });
  }
  if (normalizedType === "mcp_tool_call") {
    if (normalizedDescription.includes("fetch_file")) {
      return withId({
        type: "read",
        label: "Reading file...",
        detail: descriptionValue || void 0,
        status: "active"
      });
    }
    if (normalizedDescription.includes("search") || normalizedDescription.includes("list_repositories") || normalizedDescription.includes("list_mcp_resources")) {
      return withId({
        type: "search_code",
        label: "Searching code...",
        detail: descriptionValue || void 0,
        status: "active"
      });
    }
    return withId({
      type: "tool",
      label: "Using MCP...",
      detail: descriptionValue || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("web")) {
    return withId({
      type: normalizedType.includes("search") ? "web_search" : "web_fetch",
      label: normalizedType.includes("search") ? "Searching web..." : "Fetching URL...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("read")) {
    return withId({
      type: "read",
      label: "Reading file...",
      detail: pathDetail || void 0,
      path: pathValue || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("grep") || normalizedType.includes("search")) {
    return withId({
      type: normalizedType.includes("file") ? "search_files" : "search_code",
      label: normalizedType.includes("file") ? "Searching files..." : "Searching code...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("glob") || normalizedType.includes("list")) {
    return withId({
      type: "search_files",
      label: "Searching files...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("write") || normalizedType.includes("create")) {
    return withId({
      type: "write",
      label: "Creating file...",
      detail: pathDetail || void 0,
      path: pathValue || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("edit") || normalizedType.includes("patch") || normalizedType.includes("apply")) {
    return withId({
      type: "edit",
      label: "Editing file...",
      detail: pathDetail || void 0,
      path: pathValue || void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("command") || normalizedType.includes("shell") || normalizedType.includes("bash") || normalizedType.includes("exec")) {
    return withId({
      type: "bash",
      label: "Running command...",
      detail: commandValue || descriptionValue || void 0,
      command: commandValue ? capCommand(commandValue) : void 0,
      status: "active"
    });
  }
  if (normalizedType.includes("agent")) {
    return withId({
      type: "subtask",
      label: "Running agent...",
      detail: descriptionValue || void 0,
      status: "active"
    });
  }
  return withId({
    type: "tool",
    label: "Using " + itemType + "...",
    detail: descriptionValue || pathDetail || queryValue || void 0,
    status: "active"
  });
}

// callback-src/runtime/proofMedia.ts
var PROOF_NO_MEDIA_MESSAGE = "Eva decided not to capture.";
function proofMediaCandidateRoots(workDir, rootDirectory) {
  const roots = [workDir];
  const trimmed = rootDirectory?.trim() ?? "";
  if (trimmed.length > 0 && trimmed !== "." && !trimmed.startsWith("/") && !trimmed.includes("..")) {
    const appRoot = \`\${workDir}/\${trimmed.replace(/\\/+\$/, "")}\`;
    if (appRoot !== workDir) {
      roots.push(appRoot);
    }
  }
  return roots;
}
function proofMediaSearchDirs(workDir, rootDirectory) {
  const roots = proofMediaCandidateRoots(workDir, rootDirectory);
  return {
    recordings: roots.map((root) => \`\${root}/recordings\`),
    screenshots: roots.map((root) => \`\${root}/screenshots\`)
  };
}

// callback-src/runtime/completion.ts
import {
  existsSync as existsSync3,
  readFileSync as readFileSync2,
  readdirSync as readdirSync2,
  unlinkSync,
  writeFileSync as writeFileSync2
} from "fs";
import { createHash } from "crypto";
function parseJsonObject(line) {
  const parsed = tryParseJson(line);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed;
}
function writeDoneFile(status, extras) {
  if (callbackState.doneFileWritten) return;
  callbackState.doneFileWritten = true;
  try {
    const payload = {
      endedAt: Date.now(),
      startedAt: SCRIPT_STARTED_AT,
      durationMs: Date.now() - SCRIPT_STARTED_AT,
      status,
      provider: PROVIDER,
      entityId: ENTITY_ID || null,
      runId: RUN_ID || null,
      resultEventSeen: callbackState.resultEventSeen,
      accumulatedStepCount: callbackState.accumulatedSteps.length,
      parsedStreamEventCount: callbackState.parsedStreamEventCount,
      rawLogBytesWritten: callbackState.rawLogBytesWritten,
      ...extras
    };
    writeFileSync2(DONE_FILE, JSON.stringify(payload));
  } catch (err) {
    console.error(
      "Failed to write done file: " + String(err instanceof Error ? err.message : err)
    );
  }
}
function computeCodexCostUsd(model, inputTokens, cachedInputTokens, outputTokens) {
  const pricing = CODEX_PRICING_PER_MILLION[model];
  if (!pricing) return 0;
  const nonCachedInput = Math.max(0, inputTokens - cachedInputTokens);
  return nonCachedInput * pricing.input / 1e6 + cachedInputTokens * pricing.cached / 1e6 + outputTokens * pricing.output / 1e6;
}
function buildClaudeShapedResult(args) {
  return JSON.stringify({
    type: "result",
    provider: args.provider,
    total_cost_usd: args.totalCostUsd,
    duration_ms: args.durationMs,
    usage: {
      input_tokens: args.inputTokens,
      output_tokens: args.outputTokens,
      cache_read_input_tokens: args.cacheReadInputTokens,
      cache_creation_input_tokens: args.cacheCreationInputTokens
    },
    modelUsage: args.model ? { [args.model]: {} } : {}
  });
}
function extractResultEvent(output) {
  if (PROVIDER === "cursor") {
    let resultText = "";
    let isError = false;
    let sawResult = false;
    let durationMs = 0;
    const assistantParts = [];
    for (const line of output.split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (parsed.type === "result") {
          sawResult = true;
          isError = Boolean(parsed.is_error);
          if (typeof parsed.duration_ms === "number")
            durationMs = parsed.duration_ms;
          if (typeof parsed.result === "string") {
            resultText = parsed.result;
          } else if (parsed.result !== void 0) {
            resultText = JSON.stringify(parsed.result);
          }
          continue;
        }
        if (parsed.type === "assistant" && parsed.message && typeof parsed.message === "object" && !Array.isArray(parsed.message) && Array.isArray(parsed.message.content)) {
          for (const block of parsed.message.content) {
            if (block && typeof block === "object" && !Array.isArray(block) && block.type === "text" && typeof block.text === "string") {
              assistantParts.push(block.text);
            }
          }
        }
      } catch {
      }
    }
    if (sawResult) {
      return {
        result: resultText || assistantParts.join(""),
        isError,
        rawResultEvent: buildClaudeShapedResult({
          provider: "cursor",
          totalCostUsd: 0,
          durationMs: durationMs || attemptElapsedMs(),
          inputTokens: 0,
          outputTokens: 0,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
          model: normalizedCursorModel
        })
      };
    }
    if (assistantParts.length > 0) {
      return {
        result: assistantParts.join(""),
        isError: false,
        rawResultEvent: ""
      };
    }
    return null;
  }
  if (PROVIDER === "opencode") {
    let finalMessageId = "";
    let sawStopStep = false;
    let errorLine = "";
    let errorMessage = "";
    const textByMessageId = /* @__PURE__ */ new Map();
    let totalCostUsd = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let reasoningTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let stepModel = "";
    for (const line of output.split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (parsed.type === "step_finish" && parsed.part) {
          const part = typeof parsed.part === "object" && !Array.isArray(parsed.part) ? parsed.part : null;
          if (part && typeof part.cost === "number") totalCostUsd += part.cost;
          const t = part && part.tokens;
          if (t && typeof t === "object" && !Array.isArray(t)) {
            if (typeof t.input === "number") inputTokens = t.input;
            if (typeof t.output === "number") outputTokens += t.output;
            if (typeof t.reasoning === "number") reasoningTokens += t.reasoning;
            if (t.cache && typeof t.cache === "object" && !Array.isArray(t.cache)) {
              if (typeof t.cache.read === "number")
                cacheReadTokens = t.cache.read;
              if (typeof t.cache.write === "number")
                cacheWriteTokens += t.cache.write;
            }
          }
          if (part && typeof part.modelID === "string" && part.modelID) {
            stepModel = part.modelID;
          }
          if (part && part.reason === "stop" && typeof part.messageID === "string" && part.messageID) {
            finalMessageId = part.messageID;
            sawStopStep = true;
          }
          continue;
        }
        if (parsed.type === "text" && parsed.part && typeof parsed.part === "object" && !Array.isArray(parsed.part) && typeof parsed.part.messageID === "string" && parsed.part.messageID && typeof parsed.part.text === "string") {
          const existing = textByMessageId.get(parsed.part.messageID) || "";
          textByMessageId.set(
            parsed.part.messageID,
            existing + parsed.part.text
          );
          continue;
        }
        if (parsed.type === "error") {
          errorLine = clean;
          const err = parsed.error && typeof parsed.error === "object" && !Array.isArray(parsed.error) ? parsed.error : null;
          if (err && err.data && typeof err.data === "object" && !Array.isArray(err.data) && typeof err.data.message === "string") {
            errorMessage = err.data.message;
          } else if (err && typeof err.name === "string") {
            errorMessage = err.name;
          } else {
            errorMessage = "Opencode error";
          }
        }
      } catch {
      }
    }
    if (sawStopStep) {
      return {
        result: textByMessageId.get(finalMessageId) || "",
        isError: false,
        rawResultEvent: buildClaudeShapedResult({
          provider: "opencode",
          totalCostUsd,
          durationMs: attemptElapsedMs(),
          inputTokens,
          outputTokens: outputTokens + reasoningTokens,
          cacheReadInputTokens: cacheReadTokens,
          cacheCreationInputTokens: cacheWriteTokens,
          model: stepModel || normalizedOpencodeModel
        })
      };
    }
    if (errorMessage) {
      return { result: errorMessage, isError: true, rawResultEvent: errorLine };
    }
    return null;
  }
  if (PROVIDER === "codex") {
    let finalText = "";
    let lastInputTokens = 0;
    let lastCachedInputTokens = 0;
    let lastOutputTokens = 0;
    for (const line of output.split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (parsed.type === "item.completed" && parsed.item && typeof parsed.item === "object" && !Array.isArray(parsed.item) && parsed.item.type === "agent_message") {
          const messageText = getCodexAgentMessageText(parsed.item);
          if (messageText) finalText = messageText;
          continue;
        }
        if (parsed.type === "token_count" && parsed.info) {
          const info = typeof parsed.info === "object" && !Array.isArray(parsed.info) ? parsed.info : null;
          const total = info && info.total_token_usage;
          if (total && typeof total === "object" && !Array.isArray(total)) {
            if (typeof total.input_tokens === "number")
              lastInputTokens = total.input_tokens;
            if (typeof total.cached_input_tokens === "number")
              lastCachedInputTokens = total.cached_input_tokens;
            if (typeof total.output_tokens === "number")
              lastOutputTokens = total.output_tokens;
          }
        }
      } catch {
      }
    }
    if (!finalText) return null;
    const nonCachedInput = Math.max(0, lastInputTokens - lastCachedInputTokens);
    return {
      result: finalText,
      isError: false,
      rawResultEvent: buildClaudeShapedResult({
        provider: "codex",
        totalCostUsd: computeCodexCostUsd(
          normalizedCodexModel,
          lastInputTokens,
          lastCachedInputTokens,
          lastOutputTokens
        ),
        durationMs: attemptElapsedMs(),
        inputTokens: nonCachedInput,
        outputTokens: lastOutputTokens,
        cacheReadInputTokens: lastCachedInputTokens,
        cacheCreationInputTokens: 0,
        model: normalizedCodexModel
      })
    };
  }
  let resultEvent = null;
  for (const line of output.split("\\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = parseJsonObject(clean);
      if (!parsed) continue;
      if (parsed.type === "result") {
        const r = parsed.result ?? "";
        const withProvider = JSON.stringify({ ...parsed, provider: "claude" });
        resultEvent = {
          result: typeof r === "string" ? r : JSON.stringify(r),
          isError: Boolean(parsed.is_error),
          rawResultEvent: withProvider
        };
      }
    } catch {
    }
  }
  return resultEvent;
}
function buildErrorMessage(code, fatalHeartbeatError, toolStallError, timedOutForMaxRuntime, timedOutForNoOutput, timedOutForFirstEvent, timedOutForFirstAssistant, timedOutAfterFirstText, timedOutForZombie) {
  const cliName = PROVIDER === "codex" ? "Codex CLI" : PROVIDER === "opencode" ? "Opencode CLI" : PROVIDER === "cursor" ? "Cursor CLI" : "Claude CLI";
  if (fatalHeartbeatError) return fatalHeartbeatError;
  if (toolStallError) return toolStallError;
  if (timedOutForZombie) {
    return cliName + " terminated because the CLI process entered zombie state (likely a grandchild held stdio open after the CLI exited)";
  }
  if (timedOutForMaxRuntime) {
    return cliName + " terminated after max runtime of " + MAX_TOTAL_RUNTIME_MS + "ms";
  }
  if (timedOutForFirstEvent) {
    return cliName + " produced no parseable stream-json events within " + FIRST_EVENT_TIMEOUT_MS + "ms";
  }
  if (timedOutForFirstAssistant) {
    return cliName + " initialized but produced no assistant response within " + FIRST_ASSISTANT_EVENT_TIMEOUT_MS + "ms \\u2014 likely MCP initialization or API congestion";
  }
  if (timedOutAfterFirstText) {
    return cliName + " stalled after first text block for " + POST_TEXT_STALL_TIMEOUT_MS + "ms";
  }
  if (timedOutForNoOutput) {
    return cliName + " terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms";
  }
  if (code === 137 || code === 143) {
    return cliName + (code === 137 ? " was killed before it finished \\u2014 the sandbox ran out of memory." : " was stopped before it finished \\u2014 the run was interrupted.") + " This usually means the sandbox was stopped or a new message cancelled the run, so nothing was completed. Send the request again on a running sandbox.";
  }
  return cliName + " exited with code " + code;
}
function appendDiagnosticTail(message) {
  const details = [];
  const stdoutTail = callbackState.rawOutput.slice(-1500).trim();
  const stderrTail = callbackState.stderrOutput.slice(-1500).trim();
  if (stdoutTail) details.push("stdout tail:\\n" + stdoutTail);
  if (stderrTail) details.push("stderr tail:\\n" + stderrTail);
  if (details.length === 0) {
    details.push(
      "(stdout and stderr were empty \\u2014 CLI likely hung before emitting stream-json, e.g. bad --model)"
    );
  }
  return message + "\\n\\n" + details.join("\\n\\n");
}
async function uploadMediaFile(filePath, mimeType) {
  const urlRes = await callConvexWithRetry(
    "mutation",
    "screenshots:generateUploadUrl",
    {},
    3
  );
  const urlValue = urlRes && typeof urlRes === "object" && !Array.isArray(urlRes) && urlRes.value && typeof urlRes.value === "string" ? urlRes.value : "";
  if (!urlValue) throw new Error("Missing upload URL");
  const fileData = readFileSync2(filePath);
  const uploadRes = await fetchWithTimeout(
    urlValue,
    {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: fileData
    },
    3e4
  );
  if (!uploadRes.ok) {
    throw new Error("Upload failed: " + uploadRes.status);
  }
  const uploadJson = await readResponseJson(uploadRes);
  if (uploadJson && typeof uploadJson === "object" && !Array.isArray(uploadJson) && typeof uploadJson.storageId === "string") {
    return uploadJson.storageId;
  }
  throw new Error("Missing storageId in upload response");
}
async function persistTaskProofIfNeeded(uploaded) {
  if (uploaded.length > 0) {
    if (ENTITY_ID_FIELD === "taskId" && RUN_ID) {
      for (const item of uploaded) {
        const saveArgs = {
          taskId: ENTITY_ID ?? "",
          storageId: item.storageId,
          fileName: item.fileName
        };
        if (RUN_ID) saveArgs.runId = RUN_ID;
        await callConvexWithRetry("mutation", "taskProof:save", saveArgs, 3);
      }
      return;
    }
    const mediaArgs = {
      parentId: ENTITY_ID ?? "",
      mediaStorageIds: uploaded.map((item) => item.storageId),
      ...activeTurnIdentityArgs()
    };
    await callConvexWithRetry(
      "action",
      "screenshots:attachMedia",
      mediaArgs,
      3
    );
    return;
  }
  if (ENTITY_ID_FIELD === "taskId") {
    if (!TASK_PROOF_CAPTURE_ENABLED) return;
    if (!RUN_ID) return;
    const messageArgs = {
      taskId: ENTITY_ID ?? "",
      message: PROOF_NO_MEDIA_MESSAGE,
      runId: RUN_ID
    };
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      messageArgs,
      3
    );
  }
}
async function deliverCompletionWithMedia(completionArgs) {
  const uploadFirst = isProofCompletionMutation(COMPLETION_MUTATION);
  if (uploadFirst) {
    await uploadAndAttachSandboxMedia();
  }
  await callConvexWithRetry(
    "mutation",
    COMPLETION_MUTATION ?? "",
    completionArgs
  );
  if (!uploadFirst) {
    await uploadAndAttachSandboxMedia();
  }
}
async function uploadAndAttachSandboxMedia() {
  if (RUN_ID && !TASK_PROOF_CAPTURE_ENABLED) return;
  const uploaded = [];
  const seenDigests = /* @__PURE__ */ new Set();
  const isDuplicate = (filePath) => {
    const digest = createHash("sha256").update(readFileSync2(filePath)).digest("hex");
    if (seenDigests.has(digest)) return true;
    seenDigests.add(digest);
    return false;
  };
  const { recordings, screenshots } = proofMediaSearchDirs(
    WORK_DIR,
    ROOT_DIRECTORY
  );
  for (const recDir of recordings) {
    if (!existsSync3(recDir)) continue;
    for (const file2 of readdirSync2(recDir)) {
      if (!/\\.(webm|mp4|mov|avi)\$/i.test(file2)) continue;
      const fp = recDir + "/" + file2;
      const mimeType = file2.endsWith(".mp4") ? "video/mp4" : "video/webm";
      try {
        if (!isDuplicate(fp)) {
          const storageId = await uploadMediaFile(fp, mimeType);
          uploaded.push({ storageId, fileName: file2 });
        }
      } catch {
      }
      try {
        unlinkSync(fp);
      } catch {
      }
    }
  }
  const mimeMap = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp"
  };
  for (const ssDir of screenshots) {
    if (!existsSync3(ssDir)) continue;
    for (const file2 of readdirSync2(ssDir)) {
      if (!/\\.(png|jpg|jpeg|gif|webp)\$/i.test(file2)) continue;
      const fp = ssDir + "/" + file2;
      const ext = file2.split(".").pop()?.toLowerCase() ?? "png";
      const mimeType = mimeMap[ext] || "image/png";
      try {
        if (!isDuplicate(fp)) {
          const storageId = await uploadMediaFile(fp, mimeType);
          uploaded.push({ storageId, fileName: file2 });
        }
      } catch {
      }
      try {
        unlinkSync(fp);
      } catch {
      }
    }
  }
  try {
    await persistTaskProofIfNeeded(uploaded);
  } catch (e) {
    console.error("Failed to persist task proof:", e);
    const proofError = e instanceof Error ? e.message : String(e);
    await saveProofFailureMessageIfNeeded(
      "Proof capture failed after completion: " + proofError
    );
  }
}
async function saveProofFailureMessageIfNeeded(message) {
  if (ENTITY_ID_FIELD !== "taskId") return;
  if (!TASK_PROOF_CAPTURE_ENABLED) return;
  if (!RUN_ID) return;
  try {
    const failureArgs = {
      taskId: ENTITY_ID ?? "",
      message
    };
    if (RUN_ID) failureArgs.runId = RUN_ID;
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      failureArgs,
      2
    );
  } catch (error40) {
    console.error("Failed to record proof persistence error:", error40);
  }
}
function hasToolActivity() {
  return callbackState.accumulatedSteps.some((step) => TOOL_STEP_TYPES.has(step.type));
}

// callback-src/session/claudeSession.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "fs";
function buildClaudeStartupStep() {
  if (callbackState.waitingForFirstAssistantEvent && callbackState.claudeInitAt > 0) {
    const elapsedSeconds = Math.max(
      1,
      Math.floor((Date.now() - callbackState.claudeInitAt) / 1e3)
    );
    return callbackState.activeClaudeSessionMode === "resume" ? {
      label: "Restoring Claude session...",
      detail: "Claude started. Restoring saved context... " + elapsedSeconds + "s"
    } : {
      label: "Starting Claude CLI...",
      detail: "Claude started. Waiting for first output... " + elapsedSeconds + "s"
    };
  }
  return callbackState.activeClaudeSessionMode === "resume" ? {
    label: "Starting Claude CLI...",
    detail: "Launching Claude with saved session..."
  } : {
    label: "Starting Claude CLI...",
    detail: "Launching Claude process..."
  };
}
function readClaudeSessionState() {
  if (!existsSync4(CLAUDE_LOCAL_STATE_FILE)) {
    return null;
  }
  const parsed = tryParseJson(readFileSync3(CLAUDE_LOCAL_STATE_FILE, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const resumeSessionId = typeof parsed.resumeSessionId === "string" ? parsed.resumeSessionId.trim() : "";
  if (!resumeSessionId) {
    return null;
  }
  return { resumeSessionId };
}
function writeClaudeSessionState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  const resumeSessionId = typeof callbackState.activeClaudeSessionId === "string" && callbackState.activeClaudeSessionId.trim() ? callbackState.activeClaudeSessionId.trim() : process.env.CLAUDE_SESSION_ID;
  if (!resumeSessionId) {
    return;
  }
  mkdirSync2(CLAUDE_RUNTIME_CONFIG_DIR, { recursive: true });
  writeFileSync3(
    CLAUDE_LOCAL_STATE_FILE,
    JSON.stringify(
      {
        logicalSessionId: process.env.CLAUDE_SESSION_ID,
        resumeSessionId,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      null,
      2
    )
  );
}
function collectClaudeTranscriptSessionIds() {
  const sessionIds = /* @__PURE__ */ new Set();
  const configuredSessionId = process.env.CLAUDE_SESSION_ID;
  if (configuredSessionId) {
    sessionIds.add(configuredSessionId);
  }
  const persistedState = readClaudeSessionState();
  if (persistedState && persistedState.resumeSessionId) {
    sessionIds.add(persistedState.resumeSessionId);
  }
  const currentSessionId = typeof callbackState.activeClaudeSessionId === "string" ? callbackState.activeClaudeSessionId.trim() : "";
  if (currentSessionId) {
    sessionIds.add(currentSessionId);
  }
  return Array.from(sessionIds);
}
function hydratePersistedClaudeState() {
  const startedAt = Date.now();
  if (!process.env.CLAUDE_SESSION_ID) {
    log("hydratePersistedClaudeState skipped: no Claude session id");
    return;
  }
  copyBaseClaudeConfig();
  mkdirSync2(CLAUDE_LOCAL_PROJECT_DIR, { recursive: true });
  const prepareScript = "mkdir -p " + JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) + " " + JSON.stringify(CLAUDE_RUNTIME_CONFIG_DIR);
  runTimedBashSync(prepareScript, "hydratePersistedClaudeState(prepare)");
  copyFileIfPresent(
    CLAUDE_PERSIST_STATE_FILE,
    CLAUDE_LOCAL_STATE_FILE,
    "hydratePersistedClaudeState(state)"
  );
  const transcriptSessionIds = collectClaudeTranscriptSessionIds();
  for (const sessionId of transcriptSessionIds) {
    copyFileIfPresent(
      buildClaudeTranscriptPath(CLAUDE_PERSIST_PROJECT_DIR, sessionId),
      buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, sessionId),
      "hydratePersistedClaudeState(" + sessionId + ")"
    );
  }
  log(
    "hydratePersistedClaudeState sessionIds=" + (transcriptSessionIds.length > 0 ? transcriptSessionIds.join(",") : "none")
  );
  log(
    "hydratePersistedClaudeState finished in " + String(Date.now() - startedAt) + "ms"
  );
}
function ensureClaudeWorkspaceTrust() {
  const configPath = CLAUDE_RUNTIME_CONFIG_DIR + "/.claude.json";
  mkdirSync2(CLAUDE_RUNTIME_CONFIG_DIR, { recursive: true });
  const parsed = existsSync4(configPath) ? tryParseJson(readFileSync3(configPath, "utf8")) : null;
  const config2 = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...parsed } : {};
  const rawProjects = config2.projects;
  const projects = rawProjects && typeof rawProjects === "object" && !Array.isArray(rawProjects) ? { ...rawProjects } : {};
  const rawProject = projects[WORK_DIR];
  const projectEntry = rawProject && typeof rawProject === "object" && !Array.isArray(rawProject) ? { ...rawProject } : {};
  projectEntry.hasTrustDialogAccepted = true;
  projects[WORK_DIR] = projectEntry;
  config2.projects = projects;
  writeFileSync3(configPath, JSON.stringify(config2, null, 2));
}
function resolveClaudeSessionMode() {
  const configuredSessionId = process.env.CLAUDE_SESSION_ID;
  if (!configuredSessionId) {
    return { mode: "none", sessionId: null };
  }
  const persistedState = readClaudeSessionState();
  if (persistedState) {
    if (existsSync4(
      buildClaudeTranscriptPath(
        CLAUDE_LOCAL_PROJECT_DIR,
        persistedState.resumeSessionId
      )
    )) {
      return { mode: "resume", sessionId: persistedState.resumeSessionId };
    }
    log(
      "resolveClaudeSessionMode: persisted state without transcript, starting fresh session"
    );
    return { mode: "session", sessionId: configuredSessionId };
  }
  if (existsSync4(
    buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, configuredSessionId)
  )) {
    return { mode: "resume", sessionId: configuredSessionId };
  }
  return { mode: "session", sessionId: configuredSessionId };
}
function syncClaudeStateToPersist(reason) {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  writeClaudeSessionState();
  const prepareScript = "mkdir -p " + JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) + " " + JSON.stringify(CLAUDE_PERSIST_DIR);
  runTimedBashSync(
    prepareScript,
    "syncClaudeStateToPersist(" + reason + ":prepare)"
  );
  copyFileIfPresent(
    CLAUDE_LOCAL_STATE_FILE,
    CLAUDE_PERSIST_STATE_FILE,
    "syncClaudeStateToPersist(" + reason + ":state)"
  );
  const transcriptSessionIds = collectClaudeTranscriptSessionIds();
  for (const sessionId of transcriptSessionIds) {
    copyFileIfPresent(
      buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, sessionId),
      buildClaudeTranscriptPath(CLAUDE_PERSIST_PROJECT_DIR, sessionId),
      "syncClaudeStateToPersist(" + reason + ":" + sessionId + ")"
    );
  }
  log(
    "syncClaudeStateToPersist(" + reason + ") sessionIds=" + (transcriptSessionIds.length > 0 ? transcriptSessionIds.join(",") : "none")
  );
}
function prepareClaudeSessionState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    callbackState.activeClaudeSessionMode = "none";
    updateThinkingStep("Starting Claude CLI...", "Launching Claude process...");
    return { mode: "none", sessionId: null };
  }
  updateThinkingStep(
    "Preparing Claude session...",
    "Hydrating saved session..."
  );
  hydratePersistedClaudeState();
  ensureClaudeWorkspaceTrust();
  const sessionMode = resolveClaudeSessionMode();
  callbackState.activeClaudeSessionMode = sessionMode.mode;
  updateThinkingStep(
    "Preparing Claude session...",
    sessionMode.mode === "resume" ? "Saved session hydrated. Starting Claude..." : "Preparing fresh saved session..."
  );
  if (sessionMode.sessionId) {
    callbackState.activeClaudeSessionId = sessionMode.sessionId;
  }
  logTranscriptStats(
    sessionMode.sessionId ?? "",
    sessionMode.mode === "resume" ? "resume transcript stats" : "session transcript stats"
  );
  log(
    "prepareClaudeSessionState resolved mode=" + sessionMode.mode + " sessionId=" + (sessionMode.sessionId || "none")
  );
  return sessionMode;
}

// callback-src/runtime/backgroundShells.ts
var PENDING_CAP = 200;
var QUEUE_CAP = 20;
var FLUSH_FAILURE_COOLDOWN_MS = 1e4;
var BG_SHELL_ID_RE = /running in (?:the )?background.*?ID:?\\s*([\\w-]+)/i;
var pendingBashToolUses = /* @__PURE__ */ new Map();
var pendingKillShellUses = /* @__PURE__ */ new Map();
var eventQueue = [];
var flushInFlight = false;
var flushCooldownUntil = 0;
function trimMap(map2, cap) {
  while (map2.size > cap) {
    const first = map2.keys().next();
    if (first.done) break;
    map2.delete(first.value);
  }
}
function enqueue(event) {
  if (eventQueue.length >= QUEUE_CAP) {
    eventQueue.shift();
  }
  eventQueue.push(event);
}
function trackClaudeToolUse(name, input, toolUseId) {
  if (!toolUseId) return;
  if (name === "Bash" || name === "bash") {
    const command = typeof input.command === "string" ? input.command : "";
    pendingBashToolUses.set(toolUseId, { command });
    trimMap(pendingBashToolUses, PENDING_CAP);
    return;
  }
  if (name === "KillShell") {
    const shellId = typeof input.shell_id === "string" ? input.shell_id : typeof input.shellId === "string" ? input.shellId : "";
    if (!shellId) return;
    pendingKillShellUses.set(toolUseId, { shellId });
    trimMap(pendingKillShellUses, PENDING_CAP);
  }
}
function trackClaudeToolResult(toolUseId, resultText, isError) {
  if (!toolUseId) return;
  const killPending = pendingKillShellUses.get(toolUseId);
  if (killPending) {
    pendingKillShellUses.delete(toolUseId);
    if (!isError) {
      enqueue({ kind: "agent_killed", shellId: killPending.shellId });
    }
    return;
  }
  const bashPending = pendingBashToolUses.get(toolUseId);
  if (!bashPending) return;
  pendingBashToolUses.delete(toolUseId);
  if (isError) return;
  const match = BG_SHELL_ID_RE.exec(resultText);
  if (!match) return;
  const shellId = match[1];
  enqueue({
    kind: "register",
    key: toolUseId,
    command: bashPending.command,
    ...shellId ? { shellId } : {}
  });
}
function canFlushBackgroundShells() {
  return PROVIDER === "claude" && ENTITY_ID_FIELD === "sessionId" && typeof ENTITY_ID === "string" && ENTITY_ID.length > 0;
}
async function flushBackgroundShellQueue() {
  if (!canFlushBackgroundShells()) return;
  if (flushInFlight) return;
  if (Date.now() < flushCooldownUntil) return;
  if (eventQueue.length === 0) return;
  flushInFlight = true;
  const sessionId = ENTITY_ID;
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    flushInFlight = false;
    return;
  }
  try {
    while (eventQueue.length > 0) {
      const event = eventQueue[0];
      if (!event) break;
      if (event.kind === "register") {
        const registerArgs = {
          sessionId,
          key: event.key,
          command: event.command
        };
        if (event.shellId !== void 0) {
          registerArgs.shellId = event.shellId;
        }
        await callConvexWithRetry(
          "mutation",
          "backgroundProcesses:register",
          registerArgs
        );
      } else {
        await callConvexWithRetry(
          "mutation",
          "backgroundProcesses:markExitedByShellId",
          { sessionId, shellId: event.shellId }
        );
      }
      eventQueue.shift();
    }
  } catch (error40) {
    flushCooldownUntil = Date.now() + FLUSH_FAILURE_COOLDOWN_MS;
    log(
      "backgroundShells flush failed: " + (error40 instanceof Error ? error40.message : String(error40))
    );
  } finally {
    flushInFlight = false;
  }
}

// callback-src/parse/sdkTaxonomy.ts
var loggedUnknownKinds = /* @__PURE__ */ new Set();
var knownBackgroundTaskIds = /* @__PURE__ */ new Set();
function readString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function readStringArray(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const s = readString(item);
    if (s) out.push(s);
  }
  return out;
}
function pushNoticeStep(label, detail) {
  return [
    {
      kind: "push_step",
      step: {
        type: "notice",
        label,
        detail,
        status: "complete"
      }
    }
  ];
}
function completeActiveStatusStep() {
  for (let i = callbackState.accumulatedSteps.length - 1; i >= 0; i--) {
    const step = callbackState.accumulatedSteps[i];
    if (step.type === "status" && step.status === "active") {
      step.status = "complete";
      return;
    }
  }
}
function patchStepDetailByToolUseId(toolUseId, detail) {
  for (let i = callbackState.accumulatedSteps.length - 1; i >= 0; i--) {
    const step = callbackState.accumulatedSteps[i];
    if (step.toolUseId === toolUseId && step.status === "active") {
      step.detail = detail;
      return;
    }
  }
  const last = callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1];
  if (last?.status === "active") {
    last.detail = detail;
  }
}
function patchStepsWithSummary(toolUseIds, summary) {
  const idSet = new Set(toolUseIds);
  for (const step of callbackState.accumulatedSteps) {
    if (step.toolUseId && idSet.has(step.toolUseId)) {
      step.detail = summary;
    }
  }
}
function appendHookDetail(hookId, detail) {
  for (let i = callbackState.accumulatedSteps.length - 1; i >= 0; i--) {
    const step = callbackState.accumulatedSteps[i];
    if (step.type === "hook" && step.toolUseId === hookId) {
      const trimmed = detail.trim();
      if (!trimmed) return;
      step.detail = step.detail ? \`\${step.detail}
\${trimmed}\` : trimmed;
      return;
    }
  }
}
function readFileNamesFromPersisted(event) {
  const filesField = event.files;
  if (!Array.isArray(filesField)) return "";
  const names = [];
  for (const entry of filesField) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }
    const filename = readString(entry.filename);
    if (filename) names.push(filename);
  }
  return names.join(", ");
}
function readBackgroundTaskIds(event) {
  const tasksField = event.tasks;
  if (!Array.isArray(tasksField)) return [];
  const ids = [];
  for (const task of tasksField) {
    if (typeof task !== "object" || task === null || Array.isArray(task)) {
      continue;
    }
    const taskId = readString(task.task_id);
    if (taskId) ids.push(taskId);
  }
  return ids;
}
function readBackgroundTaskDescriptions(event) {
  const tasksField = event.tasks;
  const descriptions = /* @__PURE__ */ new Map();
  if (!Array.isArray(tasksField)) return descriptions;
  for (const task of tasksField) {
    if (typeof task !== "object" || task === null || Array.isArray(task)) {
      continue;
    }
    const taskId = readString(task.task_id);
    const description = readString(task.description);
    if (taskId && description) {
      descriptions.set(taskId, description);
    }
  }
  return descriptions;
}
function diffNewBackgroundTaskIds(taskIds) {
  const newly = [];
  for (const id of taskIds) {
    if (!knownBackgroundTaskIds.has(id)) {
      newly.push(id);
    }
  }
  for (const id of taskIds) {
    knownBackgroundTaskIds.add(id);
  }
  return newly;
}
function logUnknownSdkKind(kind) {
  if (loggedUnknownKinds.has(kind)) return;
  loggedUnknownKinds.add(kind);
  log("unhandled sdk kind: " + kind);
}
function parseModelReroute(event) {
  const subtype = readString(event.subtype);
  if (subtype === "model_reroute" || subtype === "model_fallback") {
    const reason = readString(event.reason) ?? readString(event.message) ?? readString(event.content);
    return pushNoticeStep("Model rerouted", reason);
  }
  if (subtype === "informational") {
    const content = readString(event.content);
    if (content && (content.toLowerCase().includes("rerouted") || content.toLowerCase().includes("fallback model"))) {
      return pushNoticeStep("Model rerouted", content);
    }
  }
  return null;
}
function isTaskSystemSubtype(subtype) {
  return subtype === "task_started" || subtype === "task_updated" || subtype === "task_notification" || subtype === "task_progress";
}
function consumesClaudeSdkTaxonomyMessage(event) {
  const messageType = typeof event.type === "string" ? event.type.trim() : void 0;
  if (!messageType) return false;
  if (messageType === "tool_progress" || messageType === "tool_use_summary" || messageType === "auth_status" || messageType === "rate_limit_event") {
    return true;
  }
  if (messageType !== "system") return false;
  const subtype = typeof event.subtype === "string" ? event.subtype.trim() : void 0;
  if (!subtype || subtype === "init" || isTaskSystemSubtype(subtype)) {
    return false;
  }
  return true;
}
function parseClaudeSdkTaxonomy(event) {
  const messageType = readString(event.type);
  if (!messageType) return [];
  if (messageType !== "system" && messageType !== "tool_progress" && messageType !== "tool_use_summary" && messageType !== "auth_status" && messageType !== "rate_limit_event") {
    return [];
  }
  if (messageType === "auth_status" || messageType === "rate_limit_event") {
    return [];
  }
  if (messageType === "tool_progress") {
    completeActiveStatusStep();
    const toolUseId = readString(event.tool_use_id);
    const elapsed = event.elapsed_time_seconds;
    if (toolUseId && typeof elapsed === "number" && Number.isFinite(elapsed)) {
      const seconds = Math.max(0, Math.floor(elapsed));
      patchStepDetailByToolUseId(toolUseId, \`\${seconds}s elapsed\`);
    }
    return [];
  }
  if (messageType === "tool_use_summary") {
    completeActiveStatusStep();
    const summary = readString(event.summary);
    const ids = readStringArray(event.preceding_tool_use_ids);
    if (summary && ids.length > 0) {
      patchStepsWithSummary(ids, summary);
    }
    return [];
  }
  const subtype = readString(event.subtype);
  if (!subtype) {
    logUnknownSdkKind(\`\${messageType}:?\`);
    return [];
  }
  if (subtype === "thinking_tokens") {
    return [];
  }
  if (subtype === "status") {
    if (event.status === "compacting") {
      return [
        { kind: "mark_last_complete" },
        {
          kind: "push_step",
          step: {
            type: "status",
            label: "Compacting context...",
            status: "active"
          }
        }
      ];
    }
    return [];
  }
  completeActiveStatusStep();
  if (subtype === "compact_boundary") {
    return pushNoticeStep("Context compacted");
  }
  if (subtype === "files_persisted") {
    const names = readFileNamesFromPersisted(event);
    return pushNoticeStep(
      "Files persisted",
      names.length > 0 ? names : void 0
    );
  }
  if (subtype === "hook_started") {
    const hookId = readString(event.hook_id);
    const hookName = readString(event.hook_name) ?? "Hook";
    if (!hookId) return [];
    return [
      { kind: "mark_last_complete" },
      {
        kind: "push_step",
        step: {
          type: "hook",
          label: hookName,
          toolUseId: hookId,
          status: "active"
        },
        trackingId: hookId
      }
    ];
  }
  if (subtype === "hook_progress") {
    const hookId = readString(event.hook_id);
    const output = readString(event.output) ?? readString(event.stdout) ?? readString(event.stderr);
    if (hookId && output) {
      appendHookDetail(hookId, output);
    }
    return [];
  }
  if (subtype === "hook_response") {
    const hookId = readString(event.hook_id);
    if (!hookId) return [];
    return [{ kind: "complete_tool", trackingId: hookId }];
  }
  if (subtype === "background_tasks_changed") {
    const taskIds = readBackgroundTaskIds(event);
    const descriptions = readBackgroundTaskDescriptions(event);
    const newly = diffNewBackgroundTaskIds(taskIds);
    const events = [];
    for (const taskId of newly) {
      const description = descriptions.get(taskId);
      events.push(
        ...pushNoticeStep("Agent moved to background", description ?? taskId)
      );
    }
    return events;
  }
  const reroute = parseModelReroute(event);
  if (reroute) {
    return reroute;
  }
  if (subtype !== "init" && subtype !== "task_started" && subtype !== "task_updated" && subtype !== "task_notification" && subtype !== "task_progress") {
    logUnknownSdkKind(\`\${messageType}:\${subtype}\`);
  }
  return [];
}
function completeStatusOnNonStatusMessage(event) {
  const messageType = readString(event.type);
  if (messageType === "system" && event.subtype === "status") {
    return;
  }
  completeActiveStatusStep();
}

// callback-src/providers/claude.ts
function claudeToolCompleteResult(resultText, isError) {
  const output = buildStepOutput(resultText);
  if (!output && !isError) {
    return void 0;
  }
  return {
    output,
    isError: isError ? true : void 0
  };
}
function extractToolResultText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const item of content) {
    if (typeof item === "string") {
      parts.push(item);
      continue;
    }
    if (item && typeof item === "object" && !Array.isArray(item) && item.type === "text" && typeof item.text === "string") {
      parts.push(item.text);
    }
  }
  return parts.join("");
}
function normalizeTodoStatus(value) {
  return value === "in_progress" || value === "completed" ? value : "pending";
}
function reduceTodoState(name, input) {
  if (name === "TodoWrite") {
    const raw = Array.isArray(input.todos) ? input.todos : [];
    callbackState.todoState.length = 0;
    for (const item of raw) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const content = typeof item.content === "string" ? item.content : "";
      if (!content) continue;
      callbackState.todoState.push({ content, status: normalizeTodoStatus(item.status) });
    }
  } else if (name === "TaskCreate") {
    const content = typeof input.subject === "string" ? input.subject : typeof input.description === "string" ? input.description : "";
    if (content) {
      callbackState.todoState.push({ content, status: normalizeTodoStatus(input.status) });
    }
  } else if (name === "TaskUpdate") {
    const last = callbackState.todoState[callbackState.todoState.length - 1];
    if (last) {
      if (input.status !== void 0)
        last.status = normalizeTodoStatus(input.status);
      if (typeof input.subject === "string" && input.subject) {
        last.content = input.subject;
      }
    }
  }
  return callbackState.todoState.map((t) => ({ ...t }));
}
function parseClaudeStreamEvent(event) {
  const events = [];
  const inner = event.event && typeof event.event === "object" && !Array.isArray(event.event) ? event.event : null;
  if (!inner) return events;
  if (inner.type === "message_start") {
    events.push({ kind: "mark_message_start" });
    return events;
  }
  if (inner.type === "content_block_start") {
    const contentBlock = inner.content_block && typeof inner.content_block === "object" && !Array.isArray(inner.content_block) ? inner.content_block : null;
    if (contentBlock && contentBlock.type === "text") {
      events.push({ kind: "mark_text_block_start" });
    }
    return events;
  }
  if (inner.type !== "content_block_delta") return events;
  const delta = inner.delta && typeof inner.delta === "object" && !Array.isArray(inner.delta) ? inner.delta : null;
  if (!delta) return events;
  if (delta.type === "text_delta" && typeof delta.text === "string") {
    if (delta.text) {
      events.push({ kind: "stream_text_delta", text: delta.text });
    }
    return events;
  }
  if (delta.type === "thinking_delta" && typeof delta.thinking === "string") {
    if (delta.thinking) {
      events.push({ kind: "update_reasoning", text: delta.thinking });
    }
  }
  return events;
}
function claudeParseLine(event) {
  if (consumesClaudeSdkTaxonomyMessage(event)) {
    return parseClaudeSdkTaxonomy(event);
  }
  const events = [];
  if (event.type === "stream_event") {
    return parseClaudeStreamEvent(event);
  }
  if (event.type === "tool_result") {
    const toolUseId = typeof event.tool_use_id === "string" && event.tool_use_id.trim() ? event.tool_use_id.trim() : void 0;
    const resultText = event.content !== void 0 ? extractToolResultText(event.content) : "";
    const isError = event.is_error === true;
    if (toolUseId) {
      trackClaudeToolResult(toolUseId, resultText, isError);
    }
    const result = claudeToolCompleteResult(resultText, isError);
    events.push(
      result ? { kind: "complete_tool", trackingId: toolUseId, result } : { kind: "complete_tool", trackingId: toolUseId }
    );
    return events;
  }
  if (event.type === "user") {
    const message2 = event.message && typeof event.message === "object" && !Array.isArray(event.message) ? event.message : null;
    const content2 = message2 && Array.isArray(message2.content) ? message2.content : [];
    for (const block of content2) {
      if (!block || typeof block !== "object" || Array.isArray(block)) continue;
      if (block.type === "tool_result" && typeof block.tool_use_id === "string" && block.tool_use_id.trim()) {
        const toolUseId = block.tool_use_id.trim();
        const resultText = block.content !== void 0 ? extractToolResultText(block.content) : "";
        const isError = block.is_error === true;
        trackClaudeToolResult(toolUseId, resultText, isError);
        const result = claudeToolCompleteResult(resultText, isError);
        events.push(
          result ? { kind: "complete_tool", trackingId: toolUseId, result } : { kind: "complete_tool", trackingId: toolUseId }
        );
      }
    }
    if (events.length > 0) {
      return events;
    }
  }
  if (event.type !== "assistant") return events;
  if (callbackState.waitingForFirstAssistantEvent) {
    events.push({ kind: "mark_first_assistant" });
  }
  const message = event.message && typeof event.message === "object" && !Array.isArray(event.message) ? event.message : null;
  const content = message && Array.isArray(message.content) ? message.content : [];
  const parentToolUseId = typeof event.parent_tool_use_id === "string" && event.parent_tool_use_id.trim() ? event.parent_tool_use_id.trim() : void 0;
  for (const block of content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    if (block.type === "tool_use" && typeof block.name === "string") {
      const input = block.input && typeof block.input === "object" && !Array.isArray(block.input) ? block.input : {};
      if (block.name === "TodoWrite" || block.name === "TaskCreate" || block.name === "TaskUpdate") {
        events.push({
          kind: "set_todos",
          todos: reduceTodoState(block.name, input)
        });
        continue;
      }
      if (block.name === "TodoRead" || block.name === "TaskGet" || block.name === "TaskList") {
        continue;
      }
      const step = toolCallToStep(block.name, input);
      const trackingId = typeof block.id === "string" && block.id.trim() ? block.id.trim() : void 0;
      if (trackingId) {
        step.toolUseId = trackingId;
        trackClaudeToolUse(block.name, input, trackingId);
      }
      if (parentToolUseId) step.parentToolUseId = parentToolUseId;
      events.push(
        trackingId ? { kind: "push_step", step, trackingId } : { kind: "push_step", step }
      );
      if (!BLOCKING_QUESTIONS_ENABLED && block.name === "AskUserQuestion" && block.input) {
        events.push({
          kind: "set_pending_question",
          data: JSON.stringify(block.input)
        });
      }
    } else if (block.type === "thinking" && "thinking" in block && block.thinking) {
      events.push({ kind: "update_reasoning", text: String(block.thinking) });
    } else if (block.type === "text" && "text" in block && block.text) {
      if (!callbackState.streamedAssistantTextThisMessage) {
        events.push({ kind: "append_text", text: String(block.text) });
      }
    }
  }
  return events;
}
function onStreamLine(parsed) {
  if (parsed.type === "system" && parsed.subtype === "init" && typeof parsed.session_id === "string" && parsed.session_id.trim()) {
    callbackState.activeClaudeSessionId = parsed.session_id.trim();
    callbackState.claudeInitAt = Date.now();
    callbackState.waitingForFirstAssistantEvent = true;
    log(
      "claude init event after " + String(elapsedAttemptMs()) + "ms sessionId=" + callbackState.activeClaudeSessionId
    );
    log("captured Claude session id " + callbackState.activeClaudeSessionId);
    const startupStep = buildClaudeStartupStep();
    updateThinkingStep(startupStep.label, startupStep.detail);
    return { needsHeartbeat: true };
  }
  if (parsed.type === "assistant") {
    if (callbackState.firstAssistantEventAt === 0) {
      callbackState.firstAssistantEventAt = Date.now();
      log(
        "first assistant event after " + String(callbackState.firstAssistantEventAt - callbackState.activeAttemptStartedAt) + "ms"
      );
    }
    const message = parsed.message && typeof parsed.message === "object" && !Array.isArray(parsed.message) ? parsed.message : null;
    const contentBlocks = message && Array.isArray(message.content) ? message.content : [];
    for (const block of contentBlocks) {
      if (block && typeof block === "object" && !Array.isArray(block) && block.type === "text" && typeof block.text === "string") {
        if (callbackState.firstTextBlockAt === 0) {
          callbackState.firstTextBlockAt = Date.now();
          log(
            "first text block after " + String(callbackState.firstTextBlockAt - callbackState.activeAttemptStartedAt) + "ms chars=" + String(block.text.length)
          );
        }
        break;
      }
    }
    return {};
  }
  if (parsed.type === "result" && !callbackState.resultEventSeen) {
    callbackState.resultEventSeen = true;
    syncClaudeStateToPersist("result-event");
  }
  return {};
}
var claudeAdapter = {
  parseLine: claudeParseLine,
  onStreamLine(_line, parsed) {
    return onStreamLine(parsed);
  }
};

// callback-src/session/codexSession.ts
import { mkdirSync as mkdirSync4, writeFileSync as writeFileSync5 } from "fs";

// callback-src/session/createSessionStore.ts
import { existsSync as existsSync5, mkdirSync as mkdirSync3, readFileSync as readFileSync4, writeFileSync as writeFileSync4 } from "fs";
function createSessionStore(config2) {
  const readSessionState = () => {
    const statePath = existsSync5(config2.localStateFile) ? config2.localStateFile : existsSync5(config2.persistStateFile) ? config2.persistStateFile : "";
    if (!statePath) {
      return null;
    }
    try {
      const parsed = JSON.parse(readFileSync4(statePath, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      const value = parsed[config2.resumeField];
      if (typeof value === "string" && value.trim()) {
        if (config2.resumeField === "resumeThreadId") {
          return { resumeThreadId: value.trim() };
        }
        return { resumeSessionId: value.trim() };
      }
    } catch (error40) {
      console.error(
        "Failed to read session state from " + statePath + ":",
        String(error40)
      );
    }
    return null;
  };
  const writeSessionState = () => {
    const activeId = config2.getActiveId();
    if (!activeId) {
      return;
    }
    mkdirSync3(config2.runtimeHomeDir, { recursive: true });
    const payload = {
      [config2.resumeField]: activeId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeFileSync4(config2.localStateFile, JSON.stringify(payload, null, 2));
  };
  const hydratePersistedState = (label) => {
    mkdirSync3(config2.runtimeHomeDir, { recursive: true });
    copyFileIfPresent(
      config2.persistStateFile,
      config2.localStateFile,
      label + "(state)"
    );
  };
  const syncStateToPersist = (label) => {
    writeSessionState();
    mkdirSync3(config2.persistDir, { recursive: true });
    copyFileIfPresent(
      config2.localStateFile,
      config2.persistStateFile,
      label + "(state)"
    );
  };
  const resolveResumeId = () => {
    const persisted = readSessionState();
    if (!persisted) return null;
    if (config2.resumeField === "resumeThreadId") {
      return persisted.resumeThreadId ?? null;
    }
    return persisted.resumeSessionId ?? null;
  };
  return {
    readSessionState,
    writeSessionState,
    hydratePersistedState,
    syncStateToPersist,
    resolveResumeId
  };
}

// callback-src/session/codexSession.ts
var store = createSessionStore({
  runtimeHomeDir: CODEX_RUNTIME_HOME_DIR,
  persistDir: CODEX_PERSIST_DIR,
  localStateFile: CODEX_LOCAL_STATE_FILE,
  persistStateFile: CODEX_PERSIST_STATE_FILE,
  resumeField: "resumeThreadId",
  getActiveId: () => callbackState.activeCodexThreadId,
  setActiveId: (id) => {
    callbackState.activeCodexThreadId = id;
  }
});
var readCodexSessionState = store.readSessionState;
var writeCodexSessionState = store.writeSessionState;
function syncCodexStateToPersist() {
  store.syncStateToPersist("syncCodexStateToPersist");
  copyFileIfPresent(
    CODEX_AUTH_FILE,
    CODEX_PERSIST_AUTH_FILE,
    "syncCodexStateToPersist(auth)"
  );
}
function writeCodexFileIfConfigured(fileName, rawValue, encodedValue) {
  const value = rawValue || (encodedValue ? decodeBase64(encodedValue) : "");
  if (!value) {
    return;
  }
  mkdirSync4(CODEX_RUNTIME_HOME_DIR, { recursive: true });
  writeFileSync5(CODEX_RUNTIME_HOME_DIR + "/" + fileName, value);
}
function buildCodexRuntimeConfig(rawValue, encodedValue) {
  const configuredValue = rawValue || (encodedValue ? decodeBase64(encodedValue) : "");
  const preservedLines = configuredValue ? configuredValue.split(/\\r?\\n/).filter((line) => {
    const trimmed = line.trim().toLowerCase();
    return !trimmed.startsWith("sandbox_mode") && !trimmed.startsWith("approval_policy") && // Drop any configured reasoning effort; the session lever wins when set.
    !(codexReasoningEffort && trimmed.startsWith("model_reasoning_effort"));
  }) : [];
  const normalizedPreservedLines = preservedLines.filter((line) => line.trim());
  const runtimeLines = [
    'approval_policy = "never"',
    'sandbox_mode = "danger-full-access"'
  ];
  if (codexReasoningEffort) {
    runtimeLines.push(\`model_reasoning_effort = "\${codexReasoningEffort}"\`);
  }
  if (normalizedPreservedLines.length > 0) {
    runtimeLines.push(...normalizedPreservedLines);
  }
  return runtimeLines.join("\\n") + "\\n";
}
function hydratePersistedCodexState() {
  store.hydratePersistedState("hydratePersistedCodexState");
  if (!CODEX_AUTH_JSON && !CODEX_AUTH_JSON_BASE64) {
    copyFileIfPresent(
      CODEX_PERSIST_AUTH_FILE,
      CODEX_AUTH_FILE,
      "hydratePersistedCodexState(auth)"
    );
  }
  writeCodexFileIfConfigured(
    "auth.json",
    CODEX_AUTH_JSON,
    CODEX_AUTH_JSON_BASE64
  );
  mkdirSync4(CODEX_RUNTIME_HOME_DIR, { recursive: true });
  writeFileSync5(
    CODEX_RUNTIME_HOME_DIR + "/config.toml",
    buildCodexRuntimeConfig(CODEX_CONFIG_TOML, CODEX_CONFIG_TOML_BASE64)
  );
}
function prepareCodexSessionState() {
  updateThinkingStep(
    "Preparing Codex session...",
    "Hydrating saved session..."
  );
  hydratePersistedCodexState();
  const persistedState = readCodexSessionState();
  updateThinkingStep(
    "Preparing Codex session...",
    persistedState ? "Saved session hydrated. Starting Codex..." : "Preparing fresh Codex session..."
  );
  return persistedState && persistedState.resumeThreadId ? { mode: "resume", sessionId: persistedState.resumeThreadId } : { mode: "none", sessionId: null };
}

// callback-src/providers/codex.ts
function codexParseLine(event) {
  const events = [];
  const threadId = getCodexThreadId(event);
  if (event.type === "thread.started" && threadId) {
    events.push({ kind: "set_codex_thread", threadId });
    events.push({
      kind: "update_thinking",
      label: "Starting Codex CLI...",
      detail: "Restoring saved context..."
    });
    return events;
  }
  if (event.type === "turn.started") {
    events.push({
      kind: "update_thinking",
      label: "Starting Codex CLI...",
      detail: "Codex is reasoning..."
    });
    return events;
  }
  if ((event.type === "item.started" || event.type === "item.updated" || event.type === "item.completed") && event.item && typeof event.item === "object" && !Array.isArray(event.item) && event.item.type === "reasoning") {
    if (typeof event.item.text === "string" && event.item.text.trim()) {
      events.push({ kind: "update_reasoning", text: event.item.text });
    }
    return events;
  }
  if (event.type === "item.started" && event.item && typeof event.item === "object" && !Array.isArray(event.item) && typeof event.item.type === "string" && event.item.type !== "agent_message") {
    const step = codexItemToStep(event.item);
    const trackingId = step.type !== "thinking" && typeof event.item.id === "string" ? event.item.id : void 0;
    events.push(
      trackingId ? { kind: "push_step", step, trackingId } : { kind: "push_step", step }
    );
    return events;
  }
  if (event.type === "item.completed" && event.item && typeof event.item === "object" && !Array.isArray(event.item) && event.item.type === "agent_message") {
    const messageText = getCodexAgentMessageText(event.item);
    if (messageText) {
      events.push({ kind: "append_text", text: messageText });
    }
    return events;
  }
  if ((event.type === "item.completed" || event.type === "item.failed") && event.item && typeof event.item === "object" && !Array.isArray(event.item) && typeof event.item.type === "string" && event.item.type !== "agent_message") {
    const result = probeCodexItemResult(
      event.item,
      event.type === "item.failed"
    );
    if (typeof event.item.id === "string") {
      events.push(
        result ? {
          kind: "complete_tool",
          trackingId: event.item.id,
          result
        } : { kind: "complete_tool", trackingId: event.item.id }
      );
    } else if (result) {
      events.push({ kind: "complete_tool", result });
    } else {
      events.push({ kind: "mark_last_complete" });
    }
    return events;
  }
  if (event.type === "turn.completed") {
    events.push({ kind: "mark_last_complete" });
    return events;
  }
  return events;
}
function inspectCodexStdout(text) {
  for (const line of text.split("\\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = tryParseJson(clean);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.type === "item.completed" && parsed.item && typeof parsed.item === "object" && !Array.isArray(parsed.item) && parsed.item.type === "agent_message" && getCodexAgentMessageText(parsed.item) && callbackState.firstTextBlockAt === 0) {
        callbackState.firstTextBlockAt = Date.now();
      }
    } catch {
    }
  }
}
function onStreamLine2(parsed) {
  const threadId = getCodexThreadId(parsed);
  if (parsed.type === "thread.started" && threadId) {
    callbackState.activeCodexThreadId = threadId;
    writeCodexSessionState();
    return {};
  }
  if (parsed.type === "turn.completed" && !callbackState.resultEventSeen) {
    callbackState.resultEventSeen = true;
    syncCodexStateToPersist();
  }
  return {};
}
var codexAdapter = {
  parseLine: codexParseLine,
  onStreamLine(_line, parsed) {
    return onStreamLine2(parsed);
  },
  onStdoutText: inspectCodexStdout
};

// callback-src/session/cursorSession.ts
import {
  existsSync as existsSync6,
  mkdirSync as mkdirSync5,
  readFileSync as readFileSync5,
  renameSync,
  writeFileSync as writeFileSync6
} from "fs";
var store2 = createSessionStore({
  runtimeHomeDir: CURSOR_RUNTIME_HOME_DIR,
  persistDir: CURSOR_PERSIST_DIR,
  localStateFile: CURSOR_LOCAL_STATE_FILE,
  persistStateFile: CURSOR_PERSIST_STATE_FILE,
  resumeField: "resumeSessionId",
  getActiveId: () => callbackState.activeCursorSessionId,
  setActiveId: (id) => {
    callbackState.activeCursorSessionId = id;
  }
});
var readCursorSessionState = store2.readSessionState;
var writeCursorSessionState = store2.writeSessionState;
function syncCursorStateToPersist() {
  const providerState = readCursorProviderState();
  if (providerState?.transport === "acp-v1") {
    writeCursorAcpSessionState(providerState.sessionId);
    return;
  }
  store2.syncStateToPersist("syncCursorStateToPersist");
}
function parseCursorProviderState(raw) {
  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  if (parsed.schemaVersion === 2 && parsed.transport === "acp-v1" && typeof parsed.sessionId === "string" && parsed.sessionId.trim()) {
    return {
      schemaVersion: 2,
      transport: "acp-v1",
      sessionId: parsed.sessionId.trim()
    };
  }
  if (typeof parsed.resumeSessionId === "string" && parsed.resumeSessionId.trim()) {
    return {
      schemaVersion: 1,
      transport: "stream-json",
      sessionId: parsed.resumeSessionId.trim()
    };
  }
  return null;
}
function readCursorProviderState() {
  for (const path of [CURSOR_LOCAL_STATE_FILE, CURSOR_PERSIST_STATE_FILE]) {
    if (!existsSync6(path)) continue;
    try {
      const state = parseCursorProviderState(readFileSync5(path, "utf8"));
      if (state) return state;
    } catch (error40) {
      console.error("Failed to read Cursor provider state:", String(error40));
    }
  }
  return null;
}
function writeJsonAtomically(path, value) {
  const directory = path.slice(0, path.lastIndexOf("/"));
  if (directory) mkdirSync5(directory, { recursive: true });
  const temporaryPath = \`\${path}.\${process.pid}.tmp\`;
  writeFileSync6(temporaryPath, value, { mode: 384 });
  renameSync(temporaryPath, path);
}
function writeCursorAcpSessionState(sessionId) {
  const value = JSON.stringify({
    schemaVersion: 2,
    transport: "acp-v1",
    sessionId
  });
  writeJsonAtomically(CURSOR_LOCAL_STATE_FILE, value);
  writeJsonAtomically(CURSOR_PERSIST_STATE_FILE, value);
  callbackState.activeCursorSessionId = sessionId;
}
function hydratePersistedCursorState() {
  store2.hydratePersistedState("hydratePersistedCursorState");
  if (existsSync6("/tmp/eva-mcp.json")) {
    try {
      const raw = readFileSync5("/tmp/eva-mcp.json", "utf8");
      const evaMcp = tryParseJson(raw);
      const cursorDir = WORK_DIR + "/.cursor";
      mkdirSync5(cursorDir, { recursive: true });
      const cursorMcp = { mcpServers: {} };
      if (evaMcp && typeof evaMcp === "object" && !Array.isArray(evaMcp) && evaMcp.mcpServers && typeof evaMcp.mcpServers === "object" && !Array.isArray(evaMcp.mcpServers)) {
        for (const [name, server] of Object.entries(evaMcp.mcpServers)) {
          if (!server || typeof server !== "object" || Array.isArray(server))
            continue;
          const entry = {};
          if (typeof server.url === "string") entry.url = server.url;
          if (server.headers && typeof server.headers === "object" && !Array.isArray(server.headers)) {
            const headers = {};
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
      writeFileSync6(
        cursorDir + "/mcp.json",
        JSON.stringify(cursorMcp, null, 2)
      );
    } catch (error40) {
      console.error(
        "Failed to translate MCP config for Cursor:",
        String(error40)
      );
    }
  }
}
function prepareCursorSessionState() {
  updateThinkingStep(
    "Preparing Cursor session...",
    "Hydrating saved session..."
  );
  hydratePersistedCursorState();
  const providerState = readCursorProviderState();
  if (providerState?.transport === "acp-v1") {
    callbackState.activeCursorSessionId = providerState.sessionId;
    return { mode: "resume", sessionId: providerState.sessionId };
  }
  const persistedState = readCursorSessionState();
  updateThinkingStep(
    "Preparing Cursor session...",
    persistedState ? "Saved session hydrated. Starting Cursor..." : "Preparing fresh Cursor session..."
  );
  if (persistedState && persistedState.resumeSessionId) {
    callbackState.activeCursorSessionId = persistedState.resumeSessionId;
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  return { mode: "none", sessionId: null };
}

// callback-src/providers/cursor.ts
function cursorParseLine(event) {
  const events = [];
  if (event.type === "system" && event.subtype === "init") {
    events.push({
      kind: "update_thinking",
      label: "Starting Cursor CLI...",
      detail: "Cursor session initializing..."
    });
    return events;
  }
  if (event.type === "assistant") {
    const message = event.message && typeof event.message === "object" && !Array.isArray(event.message) ? event.message : null;
    const contentBlocks = message && Array.isArray(message.content) ? message.content : [];
    for (const block of contentBlocks) {
      if (block && typeof block === "object" && !Array.isArray(block) && block.type === "text" && typeof block.text === "string" && block.text) {
        events.push({ kind: "append_text", text: block.text });
      } else if (block && typeof block === "object" && !Array.isArray(block) && block.type === "thinking" && typeof block.thinking === "string" && block.thinking) {
        events.push({ kind: "update_reasoning", text: block.thinking });
      }
    }
    return events;
  }
  if (event.type === "tool_call" && event.subtype === "started" && event.tool_call && typeof event.tool_call === "object" && !Array.isArray(event.tool_call)) {
    const step = cursorToolToStep(event.tool_call);
    const trackingId = pickToolCallId(event) ?? step.toolUseId ?? pickToolCallId(event.tool_call);
    if (trackingId) {
      step.toolUseId = trackingId;
      events.push({ kind: "push_step", step, trackingId });
    } else {
      events.push({ kind: "push_step", step });
    }
    return events;
  }
  if (event.type === "tool_call" && event.subtype === "completed") {
    const trackingId = pickToolCallId(event) ?? (event.tool_call && typeof event.tool_call === "object" && !Array.isArray(event.tool_call) ? pickToolCallId(event.tool_call) : void 0);
    const result = probeToolCompleteResult(event);
    events.push(
      result ? { kind: "complete_tool", trackingId, result } : { kind: "complete_tool", trackingId }
    );
    return events;
  }
  if (event.type === "result") {
    events.push({ kind: "mark_last_complete" });
    return events;
  }
  return events;
}
function onStreamLine3(parsed) {
  if (parsed.type === "system" && parsed.subtype === "init" && typeof parsed.session_id === "string" && parsed.session_id.trim()) {
    const sid = parsed.session_id.trim();
    if (sid !== callbackState.activeCursorSessionId) {
      callbackState.activeCursorSessionId = sid;
      writeCursorSessionState();
      return { needsHeartbeat: true };
    }
    return {};
  }
  if (parsed.type === "assistant") {
    if (callbackState.firstAssistantEventAt === 0) callbackState.firstAssistantEventAt = Date.now();
    const message = parsed.message && typeof parsed.message === "object" && !Array.isArray(parsed.message) ? parsed.message : null;
    const contentBlocks = message && Array.isArray(message.content) ? message.content : [];
    for (const block of contentBlocks) {
      if (block && typeof block === "object" && !Array.isArray(block) && block.type === "text" && typeof block.text === "string" && callbackState.firstTextBlockAt === 0) {
        callbackState.firstTextBlockAt = Date.now();
        break;
      }
    }
    return {};
  }
  if (parsed.type === "tool_call") {
    callbackState.firstTextBlockAt = 0;
    return {};
  }
  if (parsed.type === "result" && !callbackState.resultEventSeen) {
    callbackState.resultEventSeen = true;
    syncCursorStateToPersist();
  }
  return {};
}
var cursorAdapter = {
  parseLine: cursorParseLine,
  onStreamLine(_line, parsed) {
    return onStreamLine3(parsed);
  }
};

// callback-src/session/opencodeSession.ts
import { mkdirSync as mkdirSync6, writeFileSync as writeFileSync7 } from "fs";
var store3 = createSessionStore({
  runtimeHomeDir: OPENCODE_RUNTIME_HOME_DIR,
  persistDir: OPENCODE_PERSIST_DIR,
  localStateFile: OPENCODE_LOCAL_STATE_FILE,
  persistStateFile: OPENCODE_PERSIST_STATE_FILE,
  resumeField: "resumeSessionId",
  getActiveId: () => callbackState.activeOpencodeSessionId,
  setActiveId: (id) => {
    callbackState.activeOpencodeSessionId = id;
  }
});
var readOpencodeSessionState = store3.readSessionState;
var writeOpencodeSessionState = store3.writeSessionState;
function syncOpencodeStateToPersist() {
  store3.syncStateToPersist("syncOpencodeStateToPersist");
  copyFileIfPresent(
    OPENCODE_AUTH_FILE,
    OPENCODE_PERSIST_AUTH_FILE,
    "syncOpencodeStateToPersist(auth)"
  );
}
function hydratePersistedOpencodeState() {
  store3.hydratePersistedState("hydratePersistedOpencodeState");
  const configJson = OPENCODE_CONFIG_JSON || (OPENCODE_CONFIG_JSON_BASE64 ? decodeBase64(OPENCODE_CONFIG_JSON_BASE64) : "");
  if (configJson) {
    process.env.OPENCODE_CONFIG_CONTENT = configJson;
  }
  mkdirSync6(OPENCODE_AUTH_DIR, { recursive: true });
  const authJson = OPENCODE_AUTH_JSON || (OPENCODE_AUTH_JSON_BASE64 ? decodeBase64(OPENCODE_AUTH_JSON_BASE64) : "");
  if (authJson) {
    writeFileSync7(OPENCODE_AUTH_FILE, authJson);
  } else {
    copyFileIfPresent(
      OPENCODE_PERSIST_AUTH_FILE,
      OPENCODE_AUTH_FILE,
      "hydratePersistedOpencodeState(auth)"
    );
  }
  process.env.OPENCODE_PERMISSION = '"allow"';
  process.env.OPENCODE_DISABLE_AUTOUPDATE = "1";
}
function prepareOpencodeSessionState() {
  updateThinkingStep(
    "Preparing Opencode session...",
    "Hydrating saved session..."
  );
  hydratePersistedOpencodeState();
  const persistedState = readOpencodeSessionState();
  updateThinkingStep(
    "Preparing Opencode session...",
    persistedState ? "Saved session hydrated. Starting Opencode..." : "Preparing fresh Opencode session..."
  );
  if (persistedState && persistedState.resumeSessionId) {
    callbackState.activeOpencodeSessionId = persistedState.resumeSessionId;
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  return { mode: "none", sessionId: null };
}

// callback-src/providers/opencode.ts
function opencodeParseLine(event) {
  const events = [];
  if (event.type === "reasoning" && event.part && typeof event.part === "object" && !Array.isArray(event.part) && typeof event.part.text === "string" && event.part.text) {
    events.push({ kind: "update_reasoning", text: event.part.text });
    return events;
  }
  if (event.type === "text" && event.part && typeof event.part === "object" && !Array.isArray(event.part) && typeof event.part.text === "string" && event.part.text) {
    events.push({ kind: "append_text", text: event.part.text });
    return events;
  }
  if (event.type === "tool_use" && event.part && typeof event.part === "object" && !Array.isArray(event.part)) {
    const state = "state" in event.part && event.part.state && typeof event.part.state === "object" && !Array.isArray(event.part.state) ? event.part.state : {};
    const status = typeof state.status === "string" ? state.status : "";
    if (status === "running") {
      const step = opencodeToolToStep(event.part);
      const trackingId = step.toolUseId;
      events.push(
        trackingId ? { kind: "push_step", step, trackingId } : { kind: "push_step", step }
      );
      return events;
    }
    if (status === "completed" || status === "error") {
      const step = opencodeToolToStep(event.part);
      const result = probeOpencodeStateResult(state);
      events.push(
        result ? {
          kind: "complete_tool",
          trackingId: step.toolUseId,
          result
        } : { kind: "complete_tool", trackingId: step.toolUseId }
      );
      return events;
    }
    return events;
  }
  if (event.type === "step_finish") {
    const reason = event.part && typeof event.part === "object" && !Array.isArray(event.part) && typeof event.part.reason === "string" ? event.part.reason : "";
    if (reason === "stop") {
      events.push({ kind: "mark_last_complete" });
    }
    return events;
  }
  return events;
}
function onStreamLine4(parsed) {
  const sessionID = typeof parsed.sessionID === "string" && parsed.sessionID.trim() ? parsed.sessionID.trim() : "";
  let needsHeartbeat = false;
  if (sessionID && sessionID !== callbackState.activeOpencodeSessionId) {
    callbackState.activeOpencodeSessionId = sessionID;
    writeOpencodeSessionState();
    needsHeartbeat = true;
  }
  if (parsed.type === "step_start") {
    if (callbackState.firstAssistantEventAt === 0) {
      callbackState.firstAssistantEventAt = Date.now();
    }
  }
  if (parsed.type === "text" && parsed.part && typeof parsed.part === "object" && !Array.isArray(parsed.part) && typeof parsed.part.text === "string" && parsed.part.text) {
    if (callbackState.firstTextBlockAt === 0) {
      callbackState.firstTextBlockAt = Date.now();
    }
  }
  if (parsed.type === "step_finish" && parsed.part && typeof parsed.part === "object" && !Array.isArray(parsed.part) && parsed.part.reason === "stop" && !callbackState.resultEventSeen) {
    if (typeof parsed.part.messageID === "string" && parsed.part.messageID) {
      callbackState.opencodeFinalMessageId = parsed.part.messageID;
    }
    callbackState.resultEventSeen = true;
    syncOpencodeStateToPersist();
  }
  return needsHeartbeat ? { needsHeartbeat: true } : {};
}
var opencodeAdapter = {
  parseLine: opencodeParseLine,
  onStreamLine(_line, parsed) {
    return onStreamLine4(parsed);
  }
};

// callback-src/parse/canonical.ts
var stepStartedAt = /* @__PURE__ */ new WeakMap();
function mergeToolResult(step, result) {
  if (result.output) {
    step.output = result.output;
  }
  if (result.isError !== void 0) {
    step.isError = result.isError;
  }
  if (result.files && result.files.length > 0) {
    step.files = result.files;
  }
  if (result.durationMs !== void 0) {
    step.durationMs = result.durationMs;
  }
}
function markStepComplete(step) {
  step.status = "complete";
  if (completedLabels[step.label]) {
    step.label = completedLabels[step.label];
  } else if (step.label.startsWith("Using ") && step.label.endsWith("...")) {
    step.label = "Used " + step.label.slice(6, -3);
  }
  if (step.durationMs === void 0) {
    const started = stepStartedAt.get(step);
    if (started !== void 0) {
      step.durationMs = Date.now() - started;
    }
  }
}
function markLastComplete() {
  if (callbackState.accumulatedSteps.length === 0) return;
  markStepComplete(callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1]);
}
function completeToolStep(trackingId, result) {
  if (trackingId) {
    for (let i = callbackState.accumulatedSteps.length - 1; i >= 0; i--) {
      const step = callbackState.accumulatedSteps[i];
      if (step.toolUseId === trackingId) {
        if (result) mergeToolResult(step, result);
        markStepComplete(step);
        return;
      }
    }
  }
  if (callbackState.accumulatedSteps.length > 0) {
    const last = callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1];
    if (result) mergeToolResult(last, result);
    markStepComplete(last);
    return;
  }
}
function summarizeTodos(todos) {
  const done = todos.filter((t) => t.status === "completed").length;
  return \`\${done} of \${todos.length} done\`;
}
function applyTodosSnapshot(todos) {
  const existing = callbackState.accumulatedSteps.find((step) => step.type === "todos");
  if (existing) {
    existing.todos = todos;
    existing.detail = summarizeTodos(todos);
    return;
  }
  markLastComplete();
  callbackState.accumulatedSteps.push({
    type: "todos",
    label: "Updating tasks...",
    detail: summarizeTodos(todos),
    todos,
    status: "active"
  });
  callbackState.lastStepType = "tool";
}
function updateThinkingStep(label, detail) {
  void label;
  void detail;
  callbackState.lastStepType = "thinking";
}
function shouldRecordProgressStep(step) {
  return step.type !== "thinking" && step.type !== "reasoning" && step.type !== "response";
}
function pushProgressStep(step) {
  if (!shouldRecordProgressStep(step)) {
    updateThinkingStep(step.label, step.detail);
    return;
  }
  const last = callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1];
  const isFirstChildUnderParent = step.parentToolUseId !== void 0 && last !== void 0 && last.toolUseId === step.parentToolUseId;
  if (!isFirstChildUnderParent) {
    markLastComplete();
  }
  callbackState.accumulatedSteps.push(step);
  stepStartedAt.set(step, Date.now());
  callbackState.lastStepType = "tool";
}
function parseToCanonical(event, provider = PROVIDER) {
  if (provider === "cursor") return cursorParseLine(event);
  if (provider === "opencode") return opencodeParseLine(event);
  if (provider === "codex") return codexParseLine(event);
  return claudeParseLine(event);
}
function applyCanonicalEvents(events) {
  if (events.length === 0) return false;
  for (const ev of events) {
    switch (ev.kind) {
      case "update_thinking":
        updateThinkingStep(ev.label, ev.detail);
        break;
      case "push_step":
        pushProgressStep(ev.step);
        if (shouldRecordProgressStep(ev.step)) {
          if (ev.trackingId) callbackState.codexToolItemIds.add(ev.trackingId);
          callbackState.inFlightToolUses++;
        }
        break;
      case "complete_tool":
        completeToolStep(ev.trackingId, ev.result);
        if (ev.trackingId !== void 0) {
          callbackState.codexToolItemIds.delete(ev.trackingId);
        }
        if (callbackState.inFlightToolUses > 0) {
          callbackState.inFlightToolUses--;
        }
        break;
      case "mark_last_complete":
        markLastComplete();
        break;
      case "append_text":
        appendStreamedContent(ev.text, true);
        break;
      case "stream_text_delta":
        appendStreamedContent(ev.text, callbackState.pendingParagraphBreak);
        callbackState.pendingParagraphBreak = false;
        callbackState.streamedAssistantTextThisMessage = true;
        break;
      case "mark_message_start":
        callbackState.streamedAssistantTextThisMessage = false;
        callbackState.pendingParagraphBreak = true;
        break;
      case "mark_text_block_start":
        callbackState.pendingParagraphBreak = true;
        break;
      case "update_reasoning":
        callbackState.lastStepType = "thinking";
        break;
      case "set_pending_question":
        callbackState.pendingQuestionData = ev.data;
        break;
      case "set_todos":
        applyTodosSnapshot(ev.todos);
        break;
      case "set_codex_thread":
        callbackState.activeCodexThreadId = ev.threadId;
        break;
      case "mark_first_assistant":
        callbackState.waitingForFirstAssistantEvent = false;
        break;
    }
  }
  return true;
}
function parseStreamEvent(line) {
  const event = tryParseJson(line);
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return false;
  }
  try {
    completeStatusOnNonStatusMessage(event);
    if (consumesClaudeSdkTaxonomyMessage(event)) {
      applyCanonicalEvents(parseClaudeSdkTaxonomy(event));
      return true;
    }
    return applyCanonicalEvents(parseToCanonical(event, PROVIDER));
  } catch {
    return false;
  }
}
function appendStreamedContent(text, isBlockBoundary = false) {
  const nextText = String(text);
  if (!nextText) {
    return;
  }
  if (nextText.startsWith(callbackState.currentStreamedContent)) {
    callbackState.currentStreamedContent = nextText;
    return;
  }
  if (isBlockBoundary && callbackState.currentStreamedContent.length > 0 && !callbackState.currentStreamedContent.endsWith("\\n") && !nextText.startsWith("\\n")) {
    callbackState.currentStreamedContent += "\\n\\n";
  }
  callbackState.currentStreamedContent += nextText;
}

// callback-src/runtime/heartbeats.ts
import { writeFileSync as writeFileSync8 } from "fs";

// callback-src/runtime/processControl.ts
import { spawnSync as spawnSync2 } from "child_process";
function terminateAttemptProcess(child) {
  try {
    child.kill("SIGTERM");
  } catch {
  }
  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
    }
  }, 2e3);
}
function isChildZombie(pid) {
  if (!pid) return false;
  try {
    const result = spawnSync2("ps", ["-p", String(pid), "-o", "state="], {
      timeout: 2e3,
      encoding: "utf8"
    });
    if (result.error || result.status !== 0) return false;
    return (result.stdout || "").trim() === "Z";
  } catch {
    return false;
  }
}

// callback-src/runtime/heartbeats.ts
var flushInterval = null;
var heartbeatInterval = null;
function buildStreamingPayload() {
  return serializeSteps(callbackState.accumulatedSteps);
}
function markHeartbeatSuccess(payload) {
  callbackState.lastSentPayload = payload;
  callbackState.lastSentContent = callbackState.currentStreamedContent;
  callbackState.lastStreamingSentAt = Date.now();
  if (callbackState.consecutiveHeartbeatFailures > 0) {
    console.error(
      "Heartbeat recovered after " + callbackState.consecutiveHeartbeatFailures + " consecutive failures"
    );
  }
  callbackState.consecutiveHeartbeatFailures = 0;
  callbackState.heartbeatFailureStreakStartedAt = 0;
}
function noteHeartbeatFailure(error40) {
  const message = error40 instanceof Error ? error40.message : String(error40);
  callbackState.consecutiveHeartbeatFailures++;
  if (callbackState.consecutiveHeartbeatFailures === 1) {
    callbackState.heartbeatFailureStreakStartedAt = Date.now();
  }
  console.error(
    "Heartbeat failed (consecutive: " + callbackState.consecutiveHeartbeatFailures + "):",
    message
  );
  if (callbackState.consecutiveHeartbeatFailures === 2 || callbackState.consecutiveHeartbeatFailures === 4) {
    console.error(
      "[streaming-heartbeat] degraded: " + callbackState.consecutiveHeartbeatFailures + " consecutive post-retry failures (burstFatal>=" + HEARTBEAT_FATAL_BURST + " or slowFatal>=" + HEARTBEAT_FATAL_SLOW_COUNT + " over " + HEARTBEAT_FATAL_SLOW_WINDOW_MS + "ms)"
    );
  }
  if (callbackState.fatalHeartbeatErrorMessage) {
    return;
  }
  const streakAge = callbackState.heartbeatFailureStreakStartedAt > 0 ? Date.now() - callbackState.heartbeatFailureStreakStartedAt : 0;
  const burstFatal = callbackState.consecutiveHeartbeatFailures >= HEARTBEAT_FATAL_BURST;
  const slowFatal = callbackState.consecutiveHeartbeatFailures >= HEARTBEAT_FATAL_SLOW_COUNT && streakAge >= HEARTBEAT_FATAL_SLOW_WINDOW_MS;
  const absoluteFatal = callbackState.consecutiveHeartbeatFailures >= HEARTBEAT_ABSOLUTE_MAX_FAILURES;
  if (burstFatal || slowFatal || absoluteFatal) {
    callbackState.fatalHeartbeatErrorMessage = "Lost streaming heartbeat after " + String(callbackState.consecutiveHeartbeatFailures) + " consecutive failures: " + message;
    log(callbackState.fatalHeartbeatErrorMessage);
    if (callbackState.activeAttemptChild) {
      terminateAttemptProcess(callbackState.activeAttemptChild);
    }
  }
}
async function sendStreamingHeartbeatUpdate(payload) {
  try {
    await callStreamingHeartbeat(
      STREAMING_ENTITY_ID ?? "",
      payload,
      callbackState.currentStreamedContent,
      callbackState.pendingQuestionData || void 0
    );
    markHeartbeatSuccess(payload);
    return true;
  } catch (error40) {
    noteHeartbeatFailure(error40 instanceof Error ? error40 : String(error40));
    return false;
  }
}
async function flushStreaming() {
  if (callbackState.flushInProgress) return;
  if (callbackState.rawOutput.length <= callbackState.lastProcessed) {
    void flushBackgroundShellQueue();
    return;
  }
  callbackState.flushInProgress = true;
  try {
    const pending = callbackState.rawOutput.slice(callbackState.lastProcessed);
    const lastNewline = pending.lastIndexOf("\\n");
    if (lastNewline === -1) return;
    callbackState.lastProcessed += lastNewline + 1;
    let hasNew = false;
    for (const line of pending.slice(0, lastNewline).split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      if (parseStreamEvent(clean)) {
        hasNew = true;
        callbackState.parsedStreamEventCount++;
      }
    }
    const contentChanged = callbackState.currentStreamedContent !== callbackState.lastSentContent;
    if (hasNew || contentChanged) {
      const payload = buildStreamingPayload();
      if (payload === callbackState.lastSentPayload && !contentChanged) {
        return;
      }
      await sendStreamingHeartbeatUpdate(payload);
    } else if (callbackState.inFlightToolUses > 0 && Date.now() - callbackState.lastStreamingSentAt > 15e3) {
      const entityId = STREAMING_ENTITY_ID ?? "";
      if (entityId) {
        await callStreamingHeartbeatTouch(entityId);
        callbackState.lastStreamingSentAt = Date.now();
      }
    }
  } finally {
    callbackState.flushInProgress = false;
    void flushBackgroundShellQueue();
  }
}
var PING_STUCK_MS = 45e3;
async function heartbeatPing() {
  if (callbackState.pingInProgress && callbackState.pingStartedAt > 0 && Date.now() - callbackState.pingStartedAt < PING_STUCK_MS) {
    return;
  }
  if (callbackState.pingInProgress) {
    console.warn(
      "[streaming-heartbeat] pingInProgress stuck past timeout, resetting"
    );
    callbackState.pingInProgress = false;
  }
  if (Date.now() - callbackState.lastStreamingSentAt < 1e4) return;
  callbackState.pingInProgress = true;
  callbackState.pingStartedAt = Date.now();
  try {
    if (callbackState.waitingForFirstAssistantEvent) {
      const startupStep = buildClaudeStartupStep();
      updateThinkingStep(startupStep.label, startupStep.detail);
      await sendStreamingHeartbeatUpdate(buildStreamingPayload());
      return;
    }
    const entityId = STREAMING_ENTITY_ID ?? "";
    if (!entityId) return;
    await callStreamingHeartbeatTouch(entityId);
    callbackState.lastStreamingSentAt = Date.now();
    callbackState.consecutiveHeartbeatFailures = 0;
    callbackState.heartbeatFailureStreakStartedAt = 0;
  } catch (error40) {
    noteHeartbeatFailure(error40 instanceof Error ? error40 : String(error40));
  } finally {
    callbackState.pingInProgress = false;
    callbackState.pingStartedAt = 0;
  }
}
async function initialHeartbeat() {
  const startedAt = Date.now();
  let attempt = 0;
  while (attempt <= 1) {
    try {
      const payload = buildStreamingPayload();
      await callStreamingHeartbeat(
        STREAMING_ENTITY_ID ?? "",
        payload,
        callbackState.currentStreamedContent,
        callbackState.pendingQuestionData || void 0
      );
      markHeartbeatSuccess(payload);
      log(
        "initialHeartbeat succeeded in " + String(Date.now() - startedAt) + "ms attempts=" + String(attempt + 1)
      );
      return;
    } catch (e) {
      attempt++;
      if (attempt > 1) throw e;
      await new Promise((r) => setTimeout(r, 1e3));
    }
  }
}
function startStreamingLoops() {
  flushInterval = setInterval(() => {
    void flushStreaming();
  }, 150);
  heartbeatInterval = setInterval(() => {
    void heartbeatPing();
  }, 1e4);
}
async function stopStreamingLoops() {
  if (callbackState.streamingLoopsStopped) return;
  callbackState.streamingLoopsStopped = true;
  if (flushInterval) clearInterval(flushInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  await flushStreaming();
}
async function setFinalizingState() {
  markLastComplete();
  callbackState.lastStepType = "thinking";
  try {
    await sendStreamingHeartbeatUpdate(buildStreamingPayload());
  } catch {
  }
}
async function runPreflightHeartbeat() {
  try {
    await initialHeartbeat();
    try {
      writeFileSync8(READY_FILE, String(Date.now()));
      log(
        "ready file written after " + String(Date.now() - SCRIPT_STARTED_AT) + "ms"
      );
    } catch {
    }
    return true;
  } catch (error40) {
    console.error("Callback preflight failed:", String(error40));
    return false;
  }
}

// callback-src/providers/index.ts
function getProviderAdapter(provider = PROVIDER) {
  if (provider === "codex") return codexAdapter;
  if (provider === "opencode") return opencodeAdapter;
  if (provider === "cursor") return cursorAdapter;
  return claudeAdapter;
}

// callback-src/parse/streamRouter.ts
function processRealtimeStdoutChunk(text) {
  callbackState.realtimeOutputBuffer += text;
  while (true) {
    const newlineIndex = callbackState.realtimeOutputBuffer.indexOf("\\n");
    if (newlineIndex === -1) {
      return;
    }
    const line = callbackState.realtimeOutputBuffer.slice(0, newlineIndex).trim();
    callbackState.realtimeOutputBuffer = callbackState.realtimeOutputBuffer.slice(newlineIndex + 1);
    if (!line) {
      continue;
    }
    handleRealtimeStreamLine(line);
  }
}
function handleRealtimeStreamLine(line) {
  const parsed = tryParseJson(line);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return;
  }
  const result = getProviderAdapter(PROVIDER).onStreamLine(line, parsed);
  if (result.needsHeartbeat) {
    void sendStreamingHeartbeatUpdate(buildStreamingPayload());
  }
}

// callback-src/runtime/buffers.ts
import { createWriteStream } from "fs";
function trimBufferHead(buf) {
  if (buf.length <= OUTPUT_BUFFER_MAX_BYTES) return buf;
  return buf.slice(buf.length - OUTPUT_BUFFER_MAX_BYTES);
}
function appendToRawOutput(text) {
  appendRawOutputChunk(text);
  const trimAmount = trimRawOutputHead(OUTPUT_BUFFER_MAX_BYTES);
  if (trimAmount > 0) {
    shiftLastProcessed(trimAmount);
  }
}
function appendToRawLogFile(text) {
  if (callbackState.rawLogStreamFailed || !text) return;
  try {
    if (!callbackState.rawLogStream) {
      const stream = createWriteStream(RAW_LOG_FILE, { flags: "a" });
      stream.on("error", (err) => {
        setRawLogStreamFailed(true);
        console.error(
          "Raw log stream error: " + String(err instanceof Error ? err.message : err)
        );
      });
      assignRawLogStream(stream);
      stream.write(text);
    } else {
      callbackState.rawLogStream.write(text);
    }
    incrementRawLogBytesWritten(Buffer.byteLength(text));
  } catch (err) {
    setRawLogStreamFailed(true);
    console.error(
      "Failed to append to raw log: " + String(err instanceof Error ? err.message : err)
    );
  }
}

// callback-src/providers/claudeSdk.ts
import { execSync } from "child_process";
import { existsSync as existsSync7, readFileSync as readFileSync6 } from "fs";

// callback-src/runtime/cliAttempt.ts
import { spawn } from "child_process";
import { writeFileSync as writeFileSync9 } from "fs";
function evaluateAttemptHealth(input) {
  const result = {
    shouldTerminate: false,
    timedOutForZombie: false,
    timedOutForMaxRuntime: false,
    timedOutForFirstEvent: false,
    timedOutForFirstAssistant: false,
    timedOutAfterFirstText: false,
    timedOutForNoOutput: false,
    toolStallErrorMessage: input.toolStallErrorMessage
  };
  if (callbackState.fatalHeartbeatErrorMessage) {
    result.shouldTerminate = true;
    return result;
  }
  if (isChildZombie(input.childPid)) {
    if (callbackState.resultEventSeen) {
      result.logMessage = input.processLabel + " detected zombie state for pid=" + String(input.childPid) + " after result event; terminating for cleanup";
      result.shouldTerminate = true;
      return result;
    }
    result.timedOutForZombie = true;
    result.logMessage = input.processLabel + " detected zombie state for pid=" + String(input.childPid) + "; terminating";
    result.shouldTerminate = true;
    return result;
  }
  if (Date.now() - SCRIPT_STARTED_AT > MAX_TOTAL_RUNTIME_MS) {
    result.timedOutForMaxRuntime = true;
    result.shouldTerminate = true;
    return result;
  }
  if (callbackState.parsedStreamEventCount === input.parsedEventsAtStart && Date.now() - input.attemptStartedAt > FIRST_EVENT_TIMEOUT_MS) {
    result.timedOutForFirstEvent = true;
    result.shouldTerminate = true;
    return result;
  }
  if (callbackState.waitingForFirstAssistantEvent && callbackState.claudeInitAt > 0 && Date.now() - callbackState.claudeInitAt > FIRST_ASSISTANT_EVENT_TIMEOUT_MS) {
    result.timedOutForFirstAssistant = true;
    result.logMessage = input.processLabel + " stalled waiting for first assistant event for " + String(Date.now() - callbackState.claudeInitAt) + "ms after init; terminating process";
    result.shouldTerminate = true;
    return result;
  }
  if (callbackState.inFlightToolUses > 0 || callbackState.resultEventSeen) {
    return result;
  }
  return result;
}
function resetAttemptState() {
  callbackState.realtimeOutputBuffer = "";
  callbackState.resultEventSeen = false;
  callbackState.waitingForFirstAssistantEvent = false;
  callbackState.claudeInitAt = 0;
  callbackState.currentStreamedContent = "";
  callbackState.firstAssistantEventAt = 0;
  callbackState.firstTextBlockAt = 0;
  callbackState.fatalHeartbeatErrorMessage = "";
  callbackState.heartbeatFailureStreakStartedAt = 0;
  callbackState.inFlightToolUses = 0;
  callbackState.codexToolItemIds.clear();
}
async function runCliAttempt(options) {
  resetAttemptState();
  callbackState.activeAttemptStartedAt = Date.now();
  updateThinkingStep(options.startupStep.label, options.startupStep.detail);
  if (options.onStart) {
    options.onStart();
  }
  return await new Promise((resolve, reject) => {
    const child = spawn(
      "bash",
      ["-c", "cd " + WORK_DIR + " && " + options.cmd],
      {
        env: options.env,
        stdio: ["pipe", "pipe", "pipe"]
      }
    );
    callbackState.activeAttemptChild = child;
    if (child.pid) {
      try {
        writeFileSync9("/proc/" + String(child.pid) + "/oom_score_adj", "300");
      } catch {
      }
    }
    log(
      options.processLabel + " process spawned after " + String(elapsedAttemptMs()) + "ms pid=" + String(child.pid || "unknown")
    );
    let attemptOutput = "";
    const attemptStartedAt = Date.now();
    const parsedEventsAtStart = callbackState.parsedStreamEventCount;
    let lastStdoutAt = Date.now();
    let timedOutForNoOutput = false;
    let timedOutForMaxRuntime = false;
    let timedOutForFirstEvent = false;
    let timedOutForFirstAssistant = false;
    let timedOutAfterFirstText = false;
    let timedOutForZombie = false;
    let toolStallErrorMessage = "";
    const noOutputTimer = setInterval(() => {
      const health = evaluateAttemptHealth({
        childPid: child.pid,
        parsedEventsAtStart,
        attemptStartedAt,
        lastStdoutAt,
        processLabel: options.processLabel,
        toolStallErrorMessage
      });
      toolStallErrorMessage = health.toolStallErrorMessage;
      if (health.logMessage) {
        log(health.logMessage);
      }
      if (!health.shouldTerminate) {
        return;
      }
      timedOutForZombie = health.timedOutForZombie;
      timedOutForMaxRuntime = health.timedOutForMaxRuntime;
      timedOutForFirstEvent = health.timedOutForFirstEvent;
      timedOutForFirstAssistant = health.timedOutForFirstAssistant;
      timedOutAfterFirstText = health.timedOutAfterFirstText;
      timedOutForNoOutput = health.timedOutForNoOutput;
      terminateAttemptProcess(child);
    }, NO_OUTPUT_CHECK_INTERVAL_MS);
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      appendToRawLogFile(text);
      attemptOutput = trimBufferHead(attemptOutput + text);
      appendToRawOutput(text);
      lastStdoutAt = Date.now();
      processRealtimeStdoutChunk(text);
      if (options.onStdoutText) {
        options.onStdoutText(text);
      }
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      appendToRawLogFile(
        "[stderr] " + text + (text.endsWith("\\n") ? "" : "\\n")
      );
      callbackState.stderrOutput = trimBufferHead(callbackState.stderrOutput + text);
    });
    child.on("close", (code, signal) => {
      clearInterval(noOutputTimer);
      callbackState.activeAttemptChild = null;
      const terminatedBySignal = signal !== null;
      log(
        options.attemptLabel + " finished in " + elapsedAttemptMs() + "ms (code=" + code + ", signal=" + (signal ?? "none") + ", timedOutForNoOutput=" + timedOutForNoOutput + ", timedOutForMaxRuntime=" + timedOutForMaxRuntime + ", timedOutForFirstEvent=" + timedOutForFirstEvent + ", timedOutForFirstAssistant=" + timedOutForFirstAssistant + ", timedOutAfterFirstText=" + timedOutAfterFirstText + ", timedOutForZombie=" + timedOutForZombie + ", toolStallError=" + (toolStallErrorMessage || "none") + ", outputBytes=" + attemptOutput.length + ", stderrBytes=" + callbackState.stderrOutput.length + ")"
      );
      resolve({
        code: code ?? 1,
        terminatedBySignal,
        output: attemptOutput,
        timedOutForNoOutput,
        timedOutForMaxRuntime,
        timedOutForFirstEvent,
        timedOutForFirstAssistant,
        timedOutAfterFirstText,
        timedOutForZombie,
        toolStallErrorMessage
      });
    });
    child.on("error", (err) => {
      clearInterval(noOutputTimer);
      reject(err);
    });
  });
}

// callback-src/runtime/pendingQuestion.ts
var POLL_INTERVAL_MS = 300;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function readClaimedAnswer(result) {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload = typeof inner === "object" && inner !== null && !Array.isArray(inner) ? inner : result;
  const answer = payload.answer;
  return typeof answer === "string" ? answer : null;
}
async function postQuestion(toolUseId, payload) {
  await callConvexWithRetry("mutation", "pendingQuestions:post", {
    entityId: ENTITY_ID ?? "",
    toolUseId,
    payload,
    ...activeTurnIdentityArgs()
  });
}
async function pollForAnswer(toolUseId, signal) {
  while (!signal.aborted) {
    const result = await callConvexWithRetry(
      "mutation",
      "pendingQuestions:claimAnswer",
      {
        entityId: ENTITY_ID ?? "",
        toolUseId,
        ...activeTurnIdentityArgs()
      }
    );
    const answer = readClaimedAnswer(result);
    if (answer !== null) return answer;
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}
function parsePendingQuestionAnswers(answerJson) {
  try {
    const parsed = JSON.parse(answerJson);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const answers = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") answers[key] = value;
      }
      return answers;
    }
  } catch {
  }
  return {};
}
async function waitForPendingQuestionAnswer(toolUseId, payload, signal) {
  callbackState.awaitingQuestionAnswer = true;
  try {
    await postQuestion(toolUseId, payload);
    const answerJson = await pollForAnswer(toolUseId, signal);
    return answerJson === null ? null : parsePendingQuestionAnswers(answerJson);
  } finally {
    callbackState.awaitingQuestionAnswer = false;
  }
}
function buildCanUseTool() {
  return async (toolName, input, options) => {
    if (!CLAIM_MUTATION && (toolName === "Agent" || toolName === "Task") && input.run_in_background === true) {
      return {
        behavior: "allow",
        updatedInput: { ...input, run_in_background: false }
      };
    }
    if (toolName !== "AskUserQuestion") {
      return { behavior: "allow", updatedInput: input };
    }
    const toolUseId = typeof options.toolUseID === "string" && options.toolUseID ? options.toolUseID : "";
    log("canUseTool: AskUserQuestion \\u2014 posting question, awaiting user answer");
    const answers = await waitForPendingQuestionAnswer(
      toolUseId,
      JSON.stringify(input),
      options.signal
    );
    if (answers === null) {
      return { behavior: "deny", message: "The question was cancelled." };
    }
    return {
      behavior: "allow",
      updatedInput: { ...input, answers }
    };
  };
}

// callback-src/providers/claudeSdk.ts
var SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";
var SDK_VERSION = "0.3.201";
var MCP_CONFIG_PATH = "/tmp/eva-mcp.json";
function globalNpmRoot() {
  return execSync("npm root -g", { encoding: "utf8" }).trim();
}
var SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk";
async function loadSdk() {
  const globalEntry = globalNpmRoot() + "/" + SDK_PACKAGE + "/sdk.mjs";
  const localEntry = SDK_LOCAL_PREFIX + "/node_modules/" + SDK_PACKAGE + "/sdk.mjs";
  if (existsSync7(globalEntry)) {
    const mod2 = await import(globalEntry);
    return mod2;
  }
  if (!existsSync7(localEntry)) {
    log(
      "claude-agent-sdk not found in sandbox; installing " + SDK_PACKAGE + "@" + SDK_VERSION + " to " + SDK_LOCAL_PREFIX + " (one-time)"
    );
    execSync(
      "mkdir -p " + SDK_LOCAL_PREFIX + " && npm install --prefix " + SDK_LOCAL_PREFIX + " " + SDK_PACKAGE + "@" + SDK_VERSION,
      { encoding: "utf8", timeout: 18e4 }
    );
  }
  const mod = await import(localEntry);
  return mod;
}
function claudeExecutablePath() {
  try {
    return execSync("command -v claude", { encoding: "utf8" }).trim();
  } catch {
    const fallback = process.env.CLAUDE_BIN_PATH || "";
    return fallback && existsSync7(fallback) ? fallback : "claude";
  }
}
function readPromptText() {
  return readFileSync6("/tmp/design-prompt.txt", "utf8");
}
function buildSdkOptions(sessionMode) {
  const extraArgs = { settings: settingsJson };
  if (existsSync7(MCP_CONFIG_PATH)) {
    extraArgs["mcp-config"] = MCP_CONFIG_PATH;
  }
  return buildSdkOptionsFromParts(sessionMode, extraArgs);
}
var EVA_SDK_SYSTEM_APPEND = "You are running inside Eva, a platform that runs coding agents in remote sandboxes against GitHub repos. Treat the workspace as the active repo checkout.";
function buildSdkOptionsFromParts(sessionMode, extraArgs, tools = "agent") {
  const allowedToolsOption = tools === "agent" && ALLOWED_TOOLS ? { allowedTools: ALLOWED_TOOLS.split(",") } : { allowedTools: [] };
  const permissionOption = tools === "agent" && BLOCKING_QUESTIONS_ENABLED ? {
    permissionMode: "default",
    allowDangerouslySkipPermissions: false,
    canUseTool: buildCanUseTool()
  } : {
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true
  };
  const env = {
    ...process.env,
    CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR,
    DISABLE_NON_ESSENTIAL_MODEL_CALLS: "1",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    DISABLE_TELEMETRY: "1",
    DISABLE_AUTOUPDATER: "1",
    DISABLE_ERROR_REPORTING: "1",
    // Defer MCP/tool schemas when they exceed ~10% of context (agent turns only).
    ENABLE_TOOL_SEARCH: "auto"
  };
  if (CLAIM_MUTATION || ENTITY_ID_FIELD === "sessionId") {
    delete env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS;
  }
  const effortOption = claudeEffort === "low" || claudeEffort === "medium" || claudeEffort === "high" || claudeEffort === "xhigh" || claudeEffort === "max" ? { effort: claudeEffort } : {};
  return {
    cwd: WORK_DIR,
    model: normalizedClaudeModel,
    pathToClaudeCodeExecutable: claudeExecutablePath(),
    systemPrompt: SYSTEM_PROMPT ? {
      type: "preset",
      preset: "claude_code",
      append: \`\${EVA_SDK_SYSTEM_APPEND}

\${SYSTEM_PROMPT}\`
    } : {
      type: "preset",
      preset: "claude_code",
      append: EVA_SDK_SYSTEM_APPEND
    },
    ...permissionOption,
    // Emit token-level partial (\`stream_event\`) messages so claudeParseLine can
    // stream text deltas into the reply live (dedup guards the final message).
    includePartialMessages: true,
    ...allowedToolsOption,
    env,
    ...sessionMode.mode === "session" && sessionMode.sessionId ? { sessionId: sessionMode.sessionId } : {},
    ...sessionMode.mode === "resume" && sessionMode.sessionId ? { resume: sessionMode.sessionId } : {},
    extraArgs,
    ...effortOption
  };
}
async function runClaudeSdkAttempt(sessionMode) {
  resetAttemptState();
  callbackState.activeAttemptStartedAt = Date.now();
  const startupStep = buildClaudeStartupStep();
  updateThinkingStep(startupStep.label, startupStep.detail);
  log(
    "runClaudeSdkAttempt started (mode=" + sessionMode.mode + ", sessionId=" + (sessionMode.sessionId || "none") + ")"
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
    options: buildSdkOptions(effectiveMode)
  });
  const interrupt = async () => {
    try {
      if (q.interrupt) await q.interrupt();
    } catch {
    }
  };
  const healthTimer = setInterval(() => {
    const now = Date.now();
    if (callbackState.awaitingQuestionAnswer) {
      callbackState.activeAttemptStartedAt = now;
      lastMessageAt = now;
      return;
    }
    if (now - callbackState.activeAttemptStartedAt > MAX_TOTAL_RUNTIME_MS) {
      timedOutForMaxRuntime = true;
      log("runClaudeSdkAttempt: max runtime exceeded \\u2014 interrupting");
      void interrupt();
      return;
    }
    if (!sawResult && now - lastMessageAt > NO_OUTPUT_TIMEOUT_MS * 5) {
      timedOutForNoOutput = true;
      log("runClaudeSdkAttempt: no SDK messages \\u2014 interrupting");
      void interrupt();
    }
  }, NO_OUTPUT_CHECK_INTERVAL_MS);
  const consumeQuery = async () => {
    for await (const message of q) {
      lastMessageAt = Date.now();
      const line = JSON.stringify(message) + "\\n";
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
    } catch (error40) {
      const messageText = error40 instanceof Error ? error40.message : String(error40);
      if (effectiveMode.mode === "resume" && effectiveMode.sessionId && messageText.includes("No conversation found with session ID")) {
        log(
          "runClaudeSdkAttempt: resume target missing \\u2014 retrying as a new session with the same id"
        );
        appendToRawLogFile("[sdk-retry] " + messageText + "\\n");
        sawResult = false;
        resultIsError = false;
        effectiveMode = { mode: "session", sessionId: effectiveMode.sessionId };
        q = sdk.query({
          prompt: readPromptText(),
          options: buildSdkOptions(effectiveMode)
        });
        await consumeQuery();
      } else {
        throw error40;
      }
    }
  } catch (error40) {
    const messageText = error40 instanceof Error ? error40.message : String(error40);
    queryErrorMessage = messageText;
    log("runClaudeSdkAttempt: query failed \\u2014 " + messageText);
    appendToRawLogFile("[sdk-error] " + messageText + "\\n");
    callbackState.stderrOutput = trimBufferHead(callbackState.stderrOutput + messageText + "\\n");
  } finally {
    clearInterval(healthTimer);
  }
  const code = sawResult && !resultIsError && !timedOutForMaxRuntime && !timedOutForNoOutput ? 0 : 1;
  log(
    "runClaudeSdkAttempt finished in " + String(Date.now() - callbackState.activeAttemptStartedAt) + "ms (code=" + code + ", sawResult=" + sawResult + ", resultIsError=" + resultIsError + ", timedOutForNoOutput=" + timedOutForNoOutput + ", timedOutForMaxRuntime=" + timedOutForMaxRuntime + ", outputBytes=" + attemptOutput.length + (queryErrorMessage ? ", queryError=" + queryErrorMessage : "") + ")"
  );
  return {
    code,
    terminatedBySignal: false,
    output: attemptOutput,
    timedOutForNoOutput,
    timedOutForMaxRuntime,
    timedOutForFirstEvent: false,
    timedOutForFirstAssistant: false,
    timedOutAfterFirstText: false,
    timedOutForZombie: false,
    toolStallErrorMessage: ""
  };
}

// callback-src/providers/claimPendingTurnParse.ts
function readStopTaskToolUseIds(result) {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return [];
  }
  const inner = result.value;
  const payload = typeof inner === "object" && inner !== null && !Array.isArray(inner) ? inner : result;
  const field = payload.stopTaskToolUseIds;
  if (!Array.isArray(field)) {
    return [];
  }
  return field.filter((id) => typeof id === "string");
}
function readCancelRequested(result) {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return false;
  }
  const inner = result.value;
  const payload = typeof inner === "object" && inner !== null && !Array.isArray(inner) ? inner : result;
  return payload.cancelRequested === true;
}

// callback-src/providers/daemonTurn.ts
import { writeFileSync as writeFileSync10 } from "node:fs";
function readClaimPayload(result) {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  return typeof inner === "object" && inner !== null && !Array.isArray(inner) ? inner : result;
}
function readClaimedTurn(result) {
  const payload = readClaimPayload(result);
  if (payload === null || typeof payload.prompt !== "string") {
    return null;
  }
  const attachmentUrls = Array.isArray(payload.attachmentUrls) ? payload.attachmentUrls.filter(
    (url2) => typeof url2 === "string"
  ) : [];
  const identity = typeof payload.turnId === "string" && typeof payload.assistantMessageId === "string" && typeof payload.attempt === "number" && Number.isSafeInteger(payload.attempt) && payload.attempt > 0 ? {
    turnId: payload.turnId,
    assistantMessageId: payload.assistantMessageId,
    attempt: payload.attempt
  } : null;
  return { prompt: payload.prompt, attachmentUrls, identity };
}
function attachmentExtensionForMimeType(mimeType) {
  const type = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (type) {
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "text/html":
      return ".html";
    case "text/markdown":
      return ".md";
    case "text/plain":
      return ".txt";
    default:
      return type.startsWith("image/") ? ".png" : ".bin";
  }
}
async function materializeTurnAttachments(turn) {
  if (turn.attachmentUrls.length === 0) return;
  const paths = [];
  for (let index = 0; index < turn.attachmentUrls.length; index++) {
    const url2 = turn.attachmentUrls[index];
    if (!url2) continue;
    try {
      const response = await fetchWithTimeout(url2, { method: "GET" });
      if (!response.ok) {
        log(\`daemon: attachment download failed status=\${response.status}\`);
        continue;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      const extension = attachmentExtensionForMimeType(
        response.headers.get("content-type") ?? ""
      );
      const path = \`/tmp/eva-attachment-\${index}\${extension}\`;
      writeFileSync10(path, bytes);
      paths.push(path);
    } catch (error40) {
      log(
        \`daemon: attachment download error \${error40 instanceof Error ? error40.message : String(error40)}\`
      );
    }
  }
  if (paths.length === 0) return;
  const list = paths.map((path) => \`- \${path}\`).join("\\n");
  turn.prompt += \`

---
The user attached the following file(s). Read them with your file-reading tool before responding:
\${list}\`;
}

// callback-src/providers/daemonAuth.ts
function readGithubToken(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const value = data.value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const payload = value;
  return typeof payload.token === "string" ? payload.token : null;
}
async function ensureDaemonGithubToken() {
  if (!REPO_ID || !CONVEX_URL || !CONVEX_TOKEN) return;
  try {
    const response = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + CONVEX_TOKEN
      },
      body: JSON.stringify({
        path: "github:getInstallationTokenAction",
        args: { repoId: REPO_ID },
        format: "json"
      })
    });
    if (!response.ok) return;
    const token = readGithubToken(await readResponseJson(response));
    if (!token) return;
    process.env.GITHUB_TOKEN = token;
    process.env.GH_TOKEN = token;
  } catch {
  }
}

// callback-src/providers/claudeSdkDaemon.ts
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var daemonPaths = resolveDaemonPaths();
var DAEMON_PID_FILE = daemonPaths.pid;
var DAEMON_ENTITY_FILE = daemonPaths.entity;
var DAEMON_OPTS_FILE = daemonPaths.opts;
var IDLE_EXIT_MS = 45 * 60 * 1e3;
var PROMPT_POLL_INTERVAL_MS = 50;
var NO_MESSAGE_TIMEOUT_MS = NO_OUTPUT_TIMEOUT_MS * 5;
var WATCHDOG_TICK_MS = 5e3;
var CANCEL_SETTLE_TIMEOUT_MS = 3e4;
var turnActive = false;
var turnStartedAtMs = 0;
var lastMessageAtMs = 0;
var daemonTurn = null;
var pendingClaimedTurn = null;
var daemonExiting = false;
var openingSyntheticTurn = false;
var lastIdleActivityAtMs = Date.now();
var agentTurnOutput = "";
var agentTurnStartedAt = 0;
var sawFirstMessageThisTurn = { value: false };
var sawAssistantThisTurn = { value: false };
var turnCancelInFlight = false;
var turnCancelRequestedAtMs = 0;
var recognisedSubagentToolUseIds = /* @__PURE__ */ new Set();
var settledSubagentToolUseIds = /* @__PURE__ */ new Set();
var unsettledBackgroundAgents = /* @__PURE__ */ new Map();
var pendingAgentStops = /* @__PURE__ */ new Set();
var currentAgentRunner = null;
function entityMutationArgs(fields) {
  return {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    ...fields
  };
}
function beginWatchedTurn() {
  turnActive = true;
  turnStartedAtMs = Date.now();
  lastMessageAtMs = turnStartedAtMs;
}
function noteWatchedMessage() {
  lastMessageAtMs = Date.now();
}
function endWatchedTurn() {
  turnActive = false;
}
async function failTurnAndExit(error40) {
  log("daemon: failing turn \\u2014 " + error40);
  try {
    await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", {
      [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
      success: false,
      result: null,
      error: error40,
      activityLog: serializeSteps(callbackState.accumulatedSteps),
      ...RUN_ID ? { runId: RUN_ID } : {},
      ...activeTurnIdentityArgs()
    });
  } catch {
  }
  try {
    unlinkSync2(DAEMON_PID_FILE);
  } catch {
  }
  await stopStreamingLoops();
  process.exit(1);
}
async function exitWithoutCompletion(reason) {
  log("daemon: exiting without completion \\u2014 " + reason);
  try {
    unlinkSync2(DAEMON_PID_FILE);
  } catch {
  }
  await stopStreamingLoops();
}
function startTurnWatchdog() {
  const timer = setInterval(() => {
    const now = Date.now();
    if (turnCancelInFlight) {
      if (now - turnCancelRequestedAtMs > CANCEL_SETTLE_TIMEOUT_MS) {
        log("daemon: cancelled turn did not settle in time \\u2014 exiting");
        process.exit(1);
      }
      return;
    }
    if (!turnActive) return;
    if (callbackState.awaitingQuestionAnswer) {
      turnStartedAtMs = now;
      lastMessageAtMs = now;
      return;
    }
    if (now - turnStartedAtMs > MAX_TOTAL_RUNTIME_MS) {
      turnActive = false;
      if (daemonTurn?.kind === "synthetic") {
        void failSyntheticTurn(
          "The assistant exceeded the maximum turn runtime."
        );
      } else {
        void failTurnAndExit(
          "The assistant exceeded the maximum turn runtime."
        );
      }
    } else if (now - lastMessageAtMs > NO_MESSAGE_TIMEOUT_MS) {
      turnActive = false;
      if (daemonTurn?.kind === "synthetic") {
        void failSyntheticTurn(
          "The assistant stopped responding. Please try again."
        );
      } else {
        void failTurnAndExit(
          "The assistant stopped responding. Please try again."
        );
      }
    }
  }, WATCHDOG_TICK_MS);
  timer.unref?.();
}
function createPromptStream() {
  const queue = [];
  let notify = null;
  const push = (text) => {
    queue.push({
      type: "user",
      message: { role: "user", content: text },
      parent_tool_use_id: null,
      session_id: callbackState.activeClaudeSessionId || ""
    });
    const resume = notify;
    notify = null;
    if (resume) resume();
  };
  const iterable = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (queue.length === 0) {
            await new Promise((resolve) => {
              notify = resolve;
            });
          }
          const value = queue.shift();
          if (value === void 0) {
            return { value: void 0, done: true };
          }
          return { value, done: false };
        }
      };
    }
  };
  return { push, iterable };
}
function resetTurnState() {
  callbackState.accumulatedSteps.length = 0;
  callbackState.currentStreamedContent = "";
  callbackState.streamedAssistantTextThisMessage = false;
  callbackState.resultEventSeen = false;
  callbackState.rawOutput = "";
  callbackState.lastProcessed = 0;
  callbackState.inFlightToolUses = 0;
  callbackState.pendingQuestionData = "";
  callbackState.todoState.length = 0;
  callbackState.awaitingQuestionAnswer = false;
  callbackState.lastStepType = "thinking";
}
async function finalizeTurn(output) {
  await flushStreaming();
  const resultEvent = extractResultEvent(output);
  for (const step of callbackState.accumulatedSteps) step.status = "complete";
  const activityLog = serializeSteps(callbackState.accumulatedSteps);
  const success2 = resultEvent ? !resultEvent.isError : false;
  const completionArgs = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success: success2,
    result: resultEvent?.result ?? callbackState.rawOutput,
    error: resultEvent?.isError ? resultEvent.result : null,
    activityLog,
    ...activeTurnIdentityArgs()
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (resultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = resultEvent.rawResultEvent;
  }
  if (callbackState.pendingQuestionData) {
    completionArgs.pendingQuestion = callbackState.pendingQuestionData;
  }
  await setFinalizingState();
  const completionSentAt = Date.now();
  await deliverCompletionWithMedia(completionArgs);
  log(
    "daemon: turn finalized success=" + success2 + " steps=" + activityLog.length + " (completion mutation " + (Date.now() - completionSentAt) + "ms)"
  );
  const bookkeepingAt = Date.now();
  syncClaudeStateToPersist("daemon-turn");
  log(
    "daemon: post-turn bookkeeping took " + (Date.now() - bookkeepingAt) + "ms"
  );
}
function readSyntheticTurnMessageId(result) {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload = typeof inner === "object" && inner !== null && !Array.isArray(inner) ? inner : result;
  const messageId = payload.messageId;
  return typeof messageId === "string" ? messageId : null;
}
function readParentToolUseId(message) {
  const parentField = message.parent_tool_use_id;
  if (typeof parentField === "string" && parentField.trim()) {
    return parentField.trim();
  }
  return null;
}
function readStringField2(message, field) {
  const value = message[field];
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function recogniseSubagentToolUses(message) {
  if (message.type !== "assistant") {
    return;
  }
  const nested = message.message;
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
    return;
  }
  const content = nested.content;
  if (!Array.isArray(content)) {
    return;
  }
  for (const block of content) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) {
      continue;
    }
    if (block.type !== "tool_use") {
      continue;
    }
    const name = block.name;
    if (name !== "Agent" && name !== "Task") {
      continue;
    }
    const id = block.id;
    if (typeof id === "string" && id.trim()) {
      recognisedSubagentToolUseIds.add(id.trim());
    }
  }
}
function shouldDropSubagentMessage(message) {
  const parentId = readParentToolUseId(message);
  if (parentId === null) {
    return false;
  }
  return settledSubagentToolUseIds.has(parentId);
}
function shouldMintSyntheticTurn(message) {
  if (message.type === "assistant" || message.type === "stream_event") {
    return true;
  }
  const parentId = readParentToolUseId(message);
  if (parentId === null) {
    return false;
  }
  return recognisedSubagentToolUseIds.has(parentId);
}
function completeSubtaskStep(toolUseId) {
  for (const step of callbackState.accumulatedSteps) {
    if (step.type === "subtask" && step.toolUseId === toolUseId) {
      step.status = "complete";
    }
  }
}
function settleSubagent(toolUseId, terminalStatus) {
  settledSubagentToolUseIds.add(toolUseId);
  const entry = unsettledBackgroundAgents.get(toolUseId);
  unsettledBackgroundAgents.delete(toolUseId);
  completeSubtaskStep(toolUseId);
  if (entry) {
    void syncBackgroundAgentsToConvex([
      {
        ...entry,
        status: terminalStatus,
        settledAt: Date.now()
      }
    ]);
  }
}
function toConvexBackgroundAgent(entry) {
  const payload = {
    toolUseId: entry.toolUseId,
    status: entry.status,
    startedAt: entry.startedAt
  };
  if (entry.taskId) {
    payload.taskId = entry.taskId;
  }
  if (entry.description) {
    payload.description = entry.description;
  }
  if (entry.backgrounded === true) {
    payload.backgrounded = true;
  }
  if (entry.settledAt !== void 0) {
    payload.settledAt = entry.settledAt;
  }
  return payload;
}
async function syncBackgroundAgentsToConvex(agents) {
  if (agents.length === 0) {
    return;
  }
  try {
    await callConvexWithRetry(
      "mutation",
      UPDATE_BACKGROUND_AGENTS_MUTATION ?? "",
      entityMutationArgs({
        agents: agents.map(toConvexBackgroundAgent)
      })
    );
  } catch {
  }
}
function findAgentByTaskId(taskId) {
  for (const entry of unsettledBackgroundAgents.values()) {
    if (entry.taskId === taskId) {
      return entry;
    }
  }
  return void 0;
}
function markAgentsBackgrounded(taskIds) {
  const patches = [];
  for (const taskId of taskIds) {
    const entry = findAgentByTaskId(taskId);
    if (!entry || entry.backgrounded === true) {
      continue;
    }
    entry.backgrounded = true;
    patches.push({ ...entry });
  }
  if (patches.length > 0) {
    void syncBackgroundAgentsToConvex(patches);
  }
}
async function dispatchPendingAgentStops(agentRunner) {
  const pendingStops = [];
  pendingAgentStops.forEach((toolUseId) => {
    pendingStops.push(toolUseId);
  });
  for (const toolUseId of pendingStops) {
    const entry = unsettledBackgroundAgents.get(toolUseId);
    if (!entry?.taskId) {
      continue;
    }
    pendingAgentStops.delete(toolUseId);
    try {
      await agentRunner.stopTask(entry.taskId);
      log("daemon: stopTask dispatched taskId=" + entry.taskId);
    } catch (error40) {
      const messageText = error40 instanceof Error ? error40.message : String(error40);
      log("daemon: stopTask failed \\u2014 " + messageText);
      pendingAgentStops.add(toolUseId);
    }
  }
}
function handleBackgroundTasksChanged(message) {
  if (message.type !== "system" || message.subtype !== "background_tasks_changed") {
    return;
  }
  const tasksField = message.tasks;
  if (!Array.isArray(tasksField)) {
    return;
  }
  const taskIds = [];
  for (const task of tasksField) {
    if (typeof task !== "object" || task === null || Array.isArray(task)) {
      continue;
    }
    const taskIdField = task.task_id;
    const taskId = typeof taskIdField === "string" && taskIdField.trim() ? taskIdField.trim() : void 0;
    if (taskId) {
      taskIds.push(taskId);
    }
  }
  markAgentsBackgrounded(taskIds);
}
function handleSystemTaskMessage(message) {
  if (message.type !== "system") {
    return;
  }
  const subtype = message.subtype;
  if (typeof subtype !== "string") {
    return;
  }
  const toolUseId = readStringField2(message, "tool_use_id");
  if (subtype === "task_started" && toolUseId) {
    const entry = {
      toolUseId,
      taskId: readStringField2(message, "task_id"),
      description: readStringField2(message, "description"),
      status: "running",
      startedAt: Date.now()
    };
    unsettledBackgroundAgents.set(toolUseId, entry);
    void syncBackgroundAgentsToConvex([entry]);
    if (currentAgentRunner) {
      void dispatchPendingAgentStops(currentAgentRunner);
    }
    return;
  }
  if ((subtype === "task_updated" || subtype === "task_notification") && toolUseId) {
    const status = readStringField2(message, "status");
    const terminal = status === "completed" || status === "failed" || status === "killed" || status === "stopped" || subtype === "task_notification";
    if (terminal) {
      settleSubagent(toolUseId, status ?? "completed");
    }
  }
}
async function failSyntheticTurn(error40) {
  if (daemonTurn?.kind !== "synthetic") {
    return;
  }
  log("daemon: failing synthetic turn \\u2014 " + error40);
  const messageId = daemonTurn.messageId;
  try {
    await flushStreaming();
    for (const step of callbackState.accumulatedSteps) {
      step.status = "complete";
    }
    await callConvexWithRetry(
      "mutation",
      COMPLETE_SYNTHETIC_TURN_MUTATION ?? "",
      entityMutationArgs({
        messageId,
        success: false,
        result: null,
        error: error40,
        activityLog: serializeSteps(callbackState.accumulatedSteps)
      })
    );
  } catch {
  }
  endWatchedTurn();
  resetTurnState();
  daemonTurn = null;
  agentTurnOutput = "";
}
async function ensureSyntheticTurn() {
  if (daemonTurn !== null || openingSyntheticTurn) {
    return;
  }
  openingSyntheticTurn = true;
  try {
    const result = await callConvexWithRetry(
      "mutation",
      OPEN_SYNTHETIC_TURN_MUTATION ?? "",
      entityMutationArgs({})
    );
    const messageId = readSyntheticTurnMessageId(result);
    if (messageId === null) {
      log("daemon: openSyntheticTurn returned no messageId");
      return;
    }
    resetTurnState();
    daemonTurn = { kind: "synthetic", messageId };
    agentTurnStartedAt = Date.now();
    sawFirstMessageThisTurn = { value: false };
    sawAssistantThisTurn = { value: false };
    callbackState.activeAttemptStartedAt = agentTurnStartedAt;
    beginWatchedTurn();
    log("daemon: synthetic turn opened messageId=" + messageId);
  } finally {
    openingSyntheticTurn = false;
  }
}
async function finalizeSyntheticTurn(output) {
  if (daemonTurn?.kind !== "synthetic") {
    return;
  }
  const messageId = daemonTurn.messageId;
  await flushStreaming();
  const resultEvent = extractResultEvent(output);
  for (const step of callbackState.accumulatedSteps) {
    step.status = "complete";
  }
  const activityLog = serializeSteps(callbackState.accumulatedSteps);
  const success2 = resultEvent ? !resultEvent.isError : false;
  const completionArgs = entityMutationArgs({
    messageId,
    success: success2,
    result: resultEvent?.result ?? callbackState.rawOutput,
    error: resultEvent?.isError ? resultEvent.result : null,
    activityLog
  });
  if (callbackState.pendingQuestionData) {
    completionArgs.pendingQuestion = callbackState.pendingQuestionData;
  }
  await callConvexWithRetry(
    "mutation",
    COMPLETE_SYNTHETIC_TURN_MUTATION ?? "",
    completionArgs
  );
  syncClaudeStateToPersist("daemon-synthetic-turn");
  endWatchedTurn();
  resetTurnState();
  daemonTurn = null;
  agentTurnOutput = "";
  log("daemon: synthetic turn finalized success=" + success2);
}
function startRealAgentTurn(turn, agentRunner) {
  resetTurnState();
  setActiveTurnIdentity(turn.identity);
  daemonTurn = { kind: "real" };
  agentTurnStartedAt = Date.now();
  sawFirstMessageThisTurn = { value: false };
  sawAssistantThisTurn = { value: false };
  beginWatchedTurn();
  agentRunner.push(turn.prompt);
  callbackState.activeAttemptStartedAt = agentTurnStartedAt;
  agentTurnOutput = "";
  log("daemon: real turn started");
}
function handleCancelRequested(agentRunner) {
  if (daemonTurn === null) {
    log("daemon: cancelRequested with no active turn \\u2014 ignored");
    return;
  }
  if (turnCancelInFlight) {
    return;
  }
  turnCancelInFlight = true;
  turnCancelRequestedAtMs = Date.now();
  endWatchedTurn();
  log("daemon: cancel requested \\u2014 interrupting in-flight turn");
  void agentRunner.interrupt().catch((error40) => {
    const messageText = error40 instanceof Error ? error40.message : String(error40);
    log("daemon: interrupt failed \\u2014 " + messageText);
  });
}
function startClaimWatcher(agentRunner) {
  void (async () => {
    while (!daemonExiting) {
      if (callbackScriptWentStaleOnDisk()) {
        log("daemon: callback script updated on disk \\u2014 exiting for respawn");
        daemonExiting = true;
        return;
      }
      try {
        const claimed = await callConvexWithRetry(
          "mutation",
          CLAIM_MUTATION ?? "",
          entityMutationArgs({
            model: MODEL,
            callbackProtocolVersion: CHAT_TURN_PROTOCOL_VERSION2
          })
        );
        const stopIds = readStopTaskToolUseIds(claimed);
        for (const toolUseId of stopIds) {
          pendingAgentStops.add(toolUseId);
        }
        await dispatchPendingAgentStops(agentRunner);
        if (readCancelRequested(claimed)) {
          handleCancelRequested(agentRunner);
        }
        const turn = readClaimedTurn(claimed);
        if (turn !== null) {
          await materializeTurnAttachments(turn);
          lastIdleActivityAtMs = Date.now();
          if (daemonTurn === null) {
            pendingClaimedTurn = turn;
          } else if (daemonTurn.kind === "synthetic") {
            pendingClaimedTurn = turn;
          } else if (turnCancelInFlight) {
            pendingClaimedTurn = turn;
          } else {
            log(
              "daemon: claim discarded while real turn active (prompt lost; pendingTurn was already cleared)"
            );
          }
        }
      } catch {
      }
      await sleep2(PROMPT_POLL_INTERVAL_MS);
    }
  })();
}
async function runDaemonMessagePump(agentRunner) {
  while (!daemonExiting) {
    if (daemonTurn === null && pendingClaimedTurn !== null) {
      const turn = pendingClaimedTurn;
      pendingClaimedTurn = null;
      startRealAgentTurn(turn, agentRunner);
      continue;
    }
    if (daemonTurn === null && pendingClaimedTurn === null && unsettledBackgroundAgents.size === 0 && Date.now() - lastIdleActivityAtMs > IDLE_EXIT_MS) {
      log("daemon: idle timeout \\u2014 exiting");
      return;
    }
    if (daemonTurn === null && !agentRunner.hasPending()) {
      await sleep2(PROMPT_POLL_INTERVAL_MS);
      continue;
    }
    const message = await agentRunner.waitMessage();
    if (message === null) {
      if (turnCancelInFlight) {
        await exitWithoutCompletion("pump ended while a cancel was settling");
        return;
      }
      if (turnActive) {
        if (daemonTurn?.kind === "synthetic") {
          await failSyntheticTurn(
            "The assistant ended without a reply. Please try again."
          );
        } else {
          await failTurnAndExit(
            "The assistant ended without a reply. Please try again."
          );
        }
      }
      return;
    }
    lastIdleActivityAtMs = Date.now();
    if (shouldDropSubagentMessage(message)) {
      const messageType = typeof message.type === "string" ? message.type : "?";
      log("daemon: dropped settled subagent message type=" + messageType);
      continue;
    }
    recogniseSubagentToolUses(message);
    handleSystemTaskMessage(message);
    handleBackgroundTasksChanged(message);
    if (turnCancelInFlight) {
      if (message.type !== "result") {
        continue;
      }
      resetTurnState();
      setActiveTurnIdentity(null);
      daemonTurn = null;
      agentTurnOutput = "";
      turnCancelInFlight = false;
      continue;
    }
    if (message.type === "result" && daemonTurn === null) {
      log("daemon: result with no live turn \\u2014 ignored");
      continue;
    }
    if (daemonTurn === null) {
      if (!shouldMintSyntheticTurn(message)) {
        const messageType = typeof message.type === "string" ? message.type : "?";
        log(
          "daemon: between-turn " + messageType + " consumed without minting a synthetic turn"
        );
        continue;
      }
      await ensureSyntheticTurn();
      if (daemonTurn === null) {
        continue;
      }
      agentTurnOutput = "";
    }
    noteWatchedMessage();
    const processed = handleDaemonMessage(
      message,
      agentTurnOutput,
      agentTurnStartedAt,
      sawFirstMessageThisTurn,
      sawAssistantThisTurn
    );
    agentTurnOutput = processed.output;
    if (!processed.isResult) {
      continue;
    }
    endWatchedTurn();
    const resultAt = Date.now();
    log(
      "daemon[timing]: result message +" + (resultAt - agentTurnStartedAt) + "ms after turn start"
    );
    if (daemonTurn?.kind === "synthetic") {
      await finalizeSyntheticTurn(agentTurnOutput);
    } else {
      await finalizeTurn(agentTurnOutput);
      log(
        "daemon[timing]: finalizeTurn took " + (Date.now() - resultAt) + "ms"
      );
      daemonTurn = null;
      setActiveTurnIdentity(null);
    }
    if (pendingClaimedTurn !== null && daemonTurn === null) {
      const parked = pendingClaimedTurn;
      pendingClaimedTurn = null;
      startRealAgentTurn(parked, agentRunner);
    }
  }
}
function handleDaemonMessage(message, output, turnStartedAt, sawFirstMessageThisTurn2, sawAssistantThisTurn2) {
  const messageType = typeof message.type === "string" ? message.type : "?";
  if (!sawFirstMessageThisTurn2.value) {
    sawFirstMessageThisTurn2.value = true;
    log(
      "daemon[timing]: first SDK message (" + messageType + ") +" + (Date.now() - turnStartedAt) + "ms after turn start"
    );
  }
  if (!sawAssistantThisTurn2.value && messageType === "assistant") {
    sawAssistantThisTurn2.value = true;
    log(
      "daemon[timing]: first assistant msg +" + (Date.now() - turnStartedAt) + "ms after turn start"
    );
  }
  const line = JSON.stringify(message) + "\\n";
  appendToRawLogFile(line);
  const nextOutput = trimBufferHead(output + line);
  appendToRawOutput(line);
  processRealtimeStdoutChunk(line);
  const isResult = message.type === "result";
  return { output: nextOutput, isResult };
}
function createWarmAgentRunner(sdk, options) {
  const { push, iterable } = createPromptStream();
  log("daemon: booting warm agent query()");
  const query = sdk.query({ prompt: iterable, options });
  const pending = [];
  let notify = null;
  let pumpFinished = false;
  const wakeWaiters = () => {
    const resume = notify;
    notify = null;
    if (resume) resume();
  };
  void (async () => {
    try {
      for await (const raw of query) {
        if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
          continue;
        }
        pending.push(raw);
        wakeWaiters();
      }
    } catch (error40) {
      const messageText = error40 instanceof Error ? error40.message : String(error40);
      log("daemon: agent query pump failed \\u2014 " + messageText);
    } finally {
      pumpFinished = true;
      wakeWaiters();
    }
  })();
  const waitMessage = async () => {
    while (pending.length === 0) {
      if (pumpFinished) return null;
      await new Promise((resolve) => {
        notify = resolve;
      });
      if (pending.length === 0 && pumpFinished) return null;
    }
    const message = pending.shift();
    return message ?? null;
  };
  const drainPending = () => {
    const drained = pending.slice();
    pending.length = 0;
    return drained;
  };
  const hasPending = () => pending.length > 0;
  const stopTask = async (taskId) => {
    if (typeof query.stopTask === "function") {
      await query.stopTask(taskId);
      return;
    }
    log("daemon: stopTask unavailable on SDK query handle");
  };
  const interrupt = async () => {
    if (typeof query.interrupt === "function") {
      await query.interrupt();
      return;
    }
    log("daemon: interrupt unavailable on SDK query handle");
  };
  return { push, waitMessage, drainPending, hasPending, stopTask, interrupt };
}
function callbackScriptWentStaleOnDisk() {
  if (!CALLBACK_SCRIPT_FP) return false;
  try {
    const onDisk = readFileSync7("/tmp/eva-callback-fp", "utf8").trim();
    return onDisk !== CALLBACK_SCRIPT_FP;
  } catch {
    return false;
  }
}
async function runSdkDaemon() {
  if (!CLAIM_MUTATION) {
    log("daemon: CLAIM_MUTATION env is required in sdk-daemon mode");
    process.exit(1);
  }
  if (!OPEN_SYNTHETIC_TURN_MUTATION || !COMPLETE_SYNTHETIC_TURN_MUTATION) {
    log(
      "daemon: synthetic turn mutation env vars are required in sdk-daemon mode"
    );
    process.exit(1);
  }
  writeFileSync11(DAEMON_PID_FILE, String(process.pid));
  writeFileSync11(DAEMON_ENTITY_FILE, ENTITY_ID ?? "");
  writeFileSync11(DAEMON_OPTS_FILE, DAEMON_OPTS_SIG);
  const preflightOk2 = await runPreflightHeartbeat();
  if (!preflightOk2) {
    log("daemon: preflight failed");
    process.exit(1);
  }
  startStreamingLoops();
  await ensureDaemonGithubToken();
  const sessionMode = prepareClaudeSessionState();
  const options = buildSdkOptions(sessionMode);
  const sdk = await loadSdk();
  const agentRunner = createWarmAgentRunner(sdk, options);
  currentAgentRunner = agentRunner;
  log(
    "runSdkDaemon started (entityId=" + (ENTITY_ID ?? "none") + ", mode=" + sessionMode.mode + ")"
  );
  log("daemon: warm query() live, claim watcher started");
  startTurnWatchdog();
  startClaimWatcher(agentRunner);
  try {
    await runDaemonMessagePump(agentRunner);
  } catch (error40) {
    const messageText = error40 instanceof Error ? error40.message : String(error40);
    log("daemon: query failed \\u2014 " + messageText);
    try {
      await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", {
        [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
        success: false,
        result: null,
        error: "Agent SDK daemon failed: " + messageText,
        activityLog: serializeSteps(callbackState.accumulatedSteps),
        ...activeTurnIdentityArgs()
      });
    } catch {
    }
  } finally {
    try {
      unlinkSync2(DAEMON_PID_FILE);
      unlinkSync2(DAEMON_ENTITY_FILE);
      unlinkSync2(DAEMON_OPTS_FILE);
      if (ENTITY_ID_FIELD === "sessionId") {
        const legacy = resolveLegacySessionDaemonPaths();
        try {
          unlinkSync2(legacy.pid);
        } catch {
        }
        try {
          unlinkSync2(legacy.entity);
        } catch {
        }
        try {
          unlinkSync2(legacy.opts);
        } catch {
        }
      }
    } catch {
    }
    await stopStreamingLoops();
  }
  process.exit(0);
}

// callback-src/providers/cursorAcpDaemon.ts
import { readFileSync as readFileSync9, unlinkSync as unlinkSync3, writeFileSync as writeFileSync12 } from "node:fs";

// callback-src/providers/cursorAcpRuntime.ts
import { existsSync as existsSync8, readFileSync as readFileSync8 } from "node:fs";
import { spawn as spawn2 } from "node:child_process";
import { Readable, Writable } from "node:stream";

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/schema/index.js
var AGENT_METHODS = {
  initialize: "initialize",
  authenticate: "authenticate",
  providers_list: "providers/list",
  providers_set: "providers/set",
  providers_disable: "providers/disable",
  session_new: "session/new",
  session_load: "session/load",
  session_set_mode: "session/set_mode",
  session_set_config_option: "session/set_config_option",
  session_prompt: "session/prompt",
  session_cancel: "session/cancel",
  mcp_message: "mcp/message",
  session_list: "session/list",
  session_delete: "session/delete",
  session_fork: "session/fork",
  session_resume: "session/resume",
  session_close: "session/close",
  logout: "logout",
  nes_start: "nes/start",
  nes_suggest: "nes/suggest",
  nes_accept: "nes/accept",
  nes_reject: "nes/reject",
  nes_close: "nes/close",
  document_did_open: "document/didOpen",
  document_did_change: "document/didChange",
  document_did_close: "document/didClose",
  document_did_save: "document/didSave",
  document_did_focus: "document/didFocus"
};
var CLIENT_METHODS = {
  session_request_permission: "session/request_permission",
  session_update: "session/update",
  fs_write_text_file: "fs/write_text_file",
  fs_read_text_file: "fs/read_text_file",
  terminal_create: "terminal/create",
  terminal_output: "terminal/output",
  terminal_release: "terminal/release",
  terminal_wait_for_exit: "terminal/wait_for_exit",
  terminal_kill: "terminal/kill",
  mcp_connect: "mcp/connect",
  mcp_message: "mcp/message",
  mcp_disconnect: "mcp/disconnect",
  elicitation_create: "elicitation/create",
  elicitation_complete: "elicitation/complete"
};
var PROTOCOL_METHODS = {
  cancel_request: "\$/cancel_request"
};
var PROTOCOL_VERSION = 1;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/external.js
var external_exports = {};
__export(external_exports, {
  \$brand: () => \$brand,
  \$input: () => \$input,
  \$output: () => \$output,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFile: () => ZodFile,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRealError: () => ZodRealError,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  coerce: () => coerce_exports,
  config: () => config,
  core: () => core_exports2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  function: () => _function,
  getErrorMap: () => getErrorMap,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  includes: () => _includes,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  overwrite: () => _overwrite,
  parse: () => parse2,
  parseAsync: () => parseAsync2,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  preprocess: () => preprocess,
  prettifyError: () => prettifyError,
  promise: () => promise,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeParse: () => safeParse2,
  safeParseAsync: () => safeParseAsync2,
  set: () => set,
  setErrorMap: () => setErrorMap,
  size: () => _size,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  \$ZodAny: () => \$ZodAny,
  \$ZodArray: () => \$ZodArray,
  \$ZodAsyncError: () => \$ZodAsyncError,
  \$ZodBase64: () => \$ZodBase64,
  \$ZodBase64URL: () => \$ZodBase64URL,
  \$ZodBigInt: () => \$ZodBigInt,
  \$ZodBigIntFormat: () => \$ZodBigIntFormat,
  \$ZodBoolean: () => \$ZodBoolean,
  \$ZodCIDRv4: () => \$ZodCIDRv4,
  \$ZodCIDRv6: () => \$ZodCIDRv6,
  \$ZodCUID: () => \$ZodCUID,
  \$ZodCUID2: () => \$ZodCUID2,
  \$ZodCatch: () => \$ZodCatch,
  \$ZodCheck: () => \$ZodCheck,
  \$ZodCheckBigIntFormat: () => \$ZodCheckBigIntFormat,
  \$ZodCheckEndsWith: () => \$ZodCheckEndsWith,
  \$ZodCheckGreaterThan: () => \$ZodCheckGreaterThan,
  \$ZodCheckIncludes: () => \$ZodCheckIncludes,
  \$ZodCheckLengthEquals: () => \$ZodCheckLengthEquals,
  \$ZodCheckLessThan: () => \$ZodCheckLessThan,
  \$ZodCheckLowerCase: () => \$ZodCheckLowerCase,
  \$ZodCheckMaxLength: () => \$ZodCheckMaxLength,
  \$ZodCheckMaxSize: () => \$ZodCheckMaxSize,
  \$ZodCheckMimeType: () => \$ZodCheckMimeType,
  \$ZodCheckMinLength: () => \$ZodCheckMinLength,
  \$ZodCheckMinSize: () => \$ZodCheckMinSize,
  \$ZodCheckMultipleOf: () => \$ZodCheckMultipleOf,
  \$ZodCheckNumberFormat: () => \$ZodCheckNumberFormat,
  \$ZodCheckOverwrite: () => \$ZodCheckOverwrite,
  \$ZodCheckProperty: () => \$ZodCheckProperty,
  \$ZodCheckRegex: () => \$ZodCheckRegex,
  \$ZodCheckSizeEquals: () => \$ZodCheckSizeEquals,
  \$ZodCheckStartsWith: () => \$ZodCheckStartsWith,
  \$ZodCheckStringFormat: () => \$ZodCheckStringFormat,
  \$ZodCheckUpperCase: () => \$ZodCheckUpperCase,
  \$ZodCustom: () => \$ZodCustom,
  \$ZodCustomStringFormat: () => \$ZodCustomStringFormat,
  \$ZodDate: () => \$ZodDate,
  \$ZodDefault: () => \$ZodDefault,
  \$ZodDiscriminatedUnion: () => \$ZodDiscriminatedUnion,
  \$ZodE164: () => \$ZodE164,
  \$ZodEmail: () => \$ZodEmail,
  \$ZodEmoji: () => \$ZodEmoji,
  \$ZodEnum: () => \$ZodEnum,
  \$ZodError: () => \$ZodError,
  \$ZodFile: () => \$ZodFile,
  \$ZodFunction: () => \$ZodFunction,
  \$ZodGUID: () => \$ZodGUID,
  \$ZodIPv4: () => \$ZodIPv4,
  \$ZodIPv6: () => \$ZodIPv6,
  \$ZodISODate: () => \$ZodISODate,
  \$ZodISODateTime: () => \$ZodISODateTime,
  \$ZodISODuration: () => \$ZodISODuration,
  \$ZodISOTime: () => \$ZodISOTime,
  \$ZodIntersection: () => \$ZodIntersection,
  \$ZodJWT: () => \$ZodJWT,
  \$ZodKSUID: () => \$ZodKSUID,
  \$ZodLazy: () => \$ZodLazy,
  \$ZodLiteral: () => \$ZodLiteral,
  \$ZodMap: () => \$ZodMap,
  \$ZodNaN: () => \$ZodNaN,
  \$ZodNanoID: () => \$ZodNanoID,
  \$ZodNever: () => \$ZodNever,
  \$ZodNonOptional: () => \$ZodNonOptional,
  \$ZodNull: () => \$ZodNull,
  \$ZodNullable: () => \$ZodNullable,
  \$ZodNumber: () => \$ZodNumber,
  \$ZodNumberFormat: () => \$ZodNumberFormat,
  \$ZodObject: () => \$ZodObject,
  \$ZodOptional: () => \$ZodOptional,
  \$ZodPipe: () => \$ZodPipe,
  \$ZodPrefault: () => \$ZodPrefault,
  \$ZodPromise: () => \$ZodPromise,
  \$ZodReadonly: () => \$ZodReadonly,
  \$ZodRealError: () => \$ZodRealError,
  \$ZodRecord: () => \$ZodRecord,
  \$ZodRegistry: () => \$ZodRegistry,
  \$ZodSet: () => \$ZodSet,
  \$ZodString: () => \$ZodString,
  \$ZodStringFormat: () => \$ZodStringFormat,
  \$ZodSuccess: () => \$ZodSuccess,
  \$ZodSymbol: () => \$ZodSymbol,
  \$ZodTemplateLiteral: () => \$ZodTemplateLiteral,
  \$ZodTransform: () => \$ZodTransform,
  \$ZodTuple: () => \$ZodTuple,
  \$ZodType: () => \$ZodType,
  \$ZodULID: () => \$ZodULID,
  \$ZodURL: () => \$ZodURL,
  \$ZodUUID: () => \$ZodUUID,
  \$ZodUndefined: () => \$ZodUndefined,
  \$ZodUnion: () => \$ZodUnion,
  \$ZodUnknown: () => \$ZodUnknown,
  \$ZodVoid: () => \$ZodVoid,
  \$ZodXID: () => \$ZodXID,
  \$brand: () => \$brand,
  \$constructor: () => \$constructor,
  \$input: () => \$input,
  \$output: () => \$output,
  Doc: () => Doc,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  clone: () => clone,
  config: () => config,
  flattenError: () => flattenError,
  formatError: () => formatError,
  function: () => _function,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  parse: () => parse,
  parseAsync: () => parseAsync,
  prettifyError: () => prettifyError,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  treeifyError: () => treeifyError,
  util: () => util_exports,
  version: () => version
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/core.js
var NEVER = Object.freeze({
  status: "aborted"
});
// @__NO_SIDE_EFFECTS__
function \$constructor(name, initializer3, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a = inst._zod).traits ?? (_a.traits = /* @__PURE__ */ new Set());
    inst._zod.traits.add(name);
    initializer3(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var \$brand = Symbol("zod_brand");
var \$ZodAsyncError = class extends Error {
  constructor() {
    super(\`Encountered Promise during synchronous parse. Use .parseAsync() instead.\`);
  }
};
var globalConfig = {};
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  stringifyPrimitive: () => stringifyPrimitive,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error();
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set2 = false;
  return {
    get value() {
      if (!set2) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("\$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function defineLazy(object2, key, getter) {
  const set2 = false;
  Object.defineProperty(object2, key, {
    get() {
      if (!set2) {
        const value = getter();
        object2[key] = value;
        return value;
      }
      throw new Error("cached value already set");
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
var captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached(() => {
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(\`Unknown data type: \${t}\`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both \`message\` and \`error\` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return \`"\${value}"\`;
  return \`\${value}\`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const newShape = {};
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(\`Unrecognized key: "\${key}"\`);
    }
    if (!mask[key])
      continue;
    newShape[key] = currDef.shape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function omit(schema, mask) {
  const newShape = { ...schema._zod.def.shape };
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(\`Unrecognized key: "\${key}"\`);
    }
    if (!mask[key])
      continue;
    delete newShape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
    // delete existing checks
  };
  return clone(schema, def);
}
function merge(a, b) {
  return clone(a, {
    ...a._zod.def,
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    catchall: b._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function partial(Class2, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in oldShape)) {
        throw new Error(\`Unrecognized key: "\${key}"\`);
      }
      if (!mask[key])
        continue;
      shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  } else {
    for (const key in oldShape) {
      shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function required(Class2, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in shape)) {
        throw new Error(\`Unrecognized key: "\${key}"\`);
      }
      if (!mask[key])
        continue;
      shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  } else {
    for (const key in oldShape) {
      shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    // optional: [],
    checks: []
  });
}
function aborted(x, startIndex = 0) {
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true)
      return true;
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
var Class = class {
  constructor(..._args) {
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "\$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  Object.defineProperty(inst, "message", {
    get() {
      return JSON.stringify(def, jsonStringifyReplacer, 2);
    },
    enumerable: true
    // configurable: false,
  });
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var \$ZodError = \$constructor("\$ZodError", initializer);
var \$ZodRealError = \$constructor("\$ZodError", initializer, { Parent: Error });
function flattenError(error40, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error40.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error40, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const fieldErrors = { _errors: [] };
  const processError = (error41) => {
    for (const issue2 of error41.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues });
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues });
      } else if (issue2.path.length === 0) {
        fieldErrors._errors.push(mapper(issue2));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue2.path.length) {
          const el = issue2.path[i];
          const terminal = i === issue2.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue2));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error40);
  return fieldErrors;
}
function treeifyError(error40, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const result = { errors: [] };
  const processError = (error41, path = []) => {
    var _a, _b;
    for (const issue2 of error41.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, issue2.path));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, issue2.path);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, issue2.path);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i];
          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            (_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i++;
        }
      }
    }
  };
  processError(error40);
  return result;
}
function toDotPath(path) {
  const segs = [];
  for (const seg of path) {
    if (typeof seg === "number")
      segs.push(\`[\${seg}]\`);
    else if (typeof seg === "symbol")
      segs.push(\`[\${JSON.stringify(String(seg))}]\`);
    else if (/[^\\w\$]/.test(seg))
      segs.push(\`[\${JSON.stringify(seg)}]\`);
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error40) {
  const lines = [];
  const issues = [...error40.issues].sort((a, b) => a.path.length - b.path.length);
  for (const issue2 of issues) {
    lines.push(\`\\u2716 \${issue2.message}\`);
    if (issue2.path?.length)
      lines.push(\`  \\u2192 at \${toDotPath(issue2.path)}\`);
  }
  return lines.join("\\n");
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new \$ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var parse = /* @__PURE__ */ _parse(\$ZodRealError);
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var parseAsync = /* @__PURE__ */ _parseAsync(\$ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new \$ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? \$ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse(\$ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(\$ZodRealError);

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  _emoji: () => _emoji,
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hostname: () => hostname,
  html5Email: () => html5Email,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  nanoid: () => nanoid,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
var cuid = /^[cC][^\\s-]{8,}\$/;
var cuid2 = /^[0-9a-z]+\$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}\$/;
var xid = /^[0-9a-vA-V]{20}\$/;
var ksuid = /^[A-Za-z0-9]{27}\$/;
var nanoid = /^[a-zA-Z0-9_-]{21}\$/;
var duration = /^P(?:(\\d+W)|(?!.*W)(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+([.,]\\d+)?S)?)?)\$/;
var extendedDuration = /^[-+]?P(?!\$)(?:(?:[-+]?\\d+Y)|(?:[-+]?\\d+[.,]\\d+Y\$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M\$))?(?:(?:[-+]?\\d+W)|(?:[-+]?\\d+[.,]\\d+W\$))?(?:(?:[-+]?\\d+D)|(?:[-+]?\\d+[.,]\\d+D\$))?(?:T(?=[\\d+-])(?:(?:[-+]?\\d+H)|(?:[-+]?\\d+[.,]\\d+H\$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M\$))?(?:[-+]?\\d+(?:[.,]\\d+)?S)?)??\$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)\$/;
  return new RegExp(\`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-\${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})\$\`);
};
var uuid4 = /* @__PURE__ */ uuid(4);
var uuid6 = /* @__PURE__ */ uuid(6);
var uuid7 = /* @__PURE__ */ uuid(7);
var email = /^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}\$/;
var html5Email = /^[a-zA-Z0-9.!#\$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\$/;
var rfc5322Email = /^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))\$/;
var unicodeEmail = /^[^\\s@"]{1,64}@[^\\s@]{1,255}\$/u;
var browserEmail = /^[a-zA-Z0-9.!#\$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\$/;
var _emoji = \`^(\\\\p{Extended_Pictographic}|\\\\p{Emoji_Component})+\$\`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\/([0-9]|[1-2][0-9]|3[0-2])\$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])\$/;
var base64 = /^\$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?\$/;
var base64url = /^[A-Za-z0-9_-]*\$/;
var hostname = /^([a-zA-Z0-9-]+\\.)*[a-zA-Z0-9-]+\$/;
var domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}\$/;
var e164 = /^\\+(?:[0-9]){6,14}[0-9]\$/;
var dateSource = \`(?:(?:\\\\d\\\\d[2468][048]|\\\\d\\\\d[13579][26]|\\\\d\\\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\\\d|30)|(?:02)-(?:0[1-9]|1\\\\d|2[0-8])))\`;
var date = /* @__PURE__ */ new RegExp(\`^\${dateSource}\$\`);
function timeSource(args) {
  const hhmm = \`(?:[01]\\\\d|2[0-3]):[0-5]\\\\d\`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? \`\${hhmm}\` : args.precision === 0 ? \`\${hhmm}:[0-5]\\\\d\` : \`\${hhmm}:[0-5]\\\\d\\\\.\\\\d{\${args.precision}}\` : \`\${hhmm}(?::[0-5]\\\\d(?:\\\\.\\\\d+)?)?\`;
  return regex;
}
function time(args) {
  return new RegExp(\`^\${timeSource(args)}\$\`);
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(\`([+-]\\\\d{2}:\\\\d{2})\`);
  const timeRegex2 = \`\${time3}(?:\${opts.join("|")})\`;
  return new RegExp(\`^\${dateSource}T(?:\${timeRegex2})\$\`);
}
var string = (params) => {
  const regex = params ? \`[\\\\s\\\\S]{\${params?.minimum ?? 0},\${params?.maximum ?? ""}}\` : \`[\\\\s\\\\S]*\`;
  return new RegExp(\`^\${regex}\$\`);
};
var bigint = /^\\d+n?\$/;
var integer = /^\\d+\$/;
var number = /^-?\\d+(?:\\.\\d+)?/i;
var boolean = /true|false/i;
var _null = /null/i;
var _undefined = /undefined/i;
var lowercase = /^[^A-Z]*\$/;
var uppercase = /^[^a-z]*\$/;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/checks.js
var \$ZodCheck = /* @__PURE__ */ \$constructor("\$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var \$ZodCheckLessThan = /* @__PURE__ */ \$constructor("\$ZodCheckLessThan", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckGreaterThan = /* @__PURE__ */ \$constructor("\$ZodCheckGreaterThan", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckMultipleOf = /* @__PURE__ */ \$constructor("\$ZodCheckMultipleOf", (inst, def) => {
  \$ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a;
    (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckNumberFormat = /* @__PURE__ */ \$constructor("\$ZodCheckNumberFormat", (inst, def) => {
  \$ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
var \$ZodCheckBigIntFormat = /* @__PURE__ */ \$constructor("\$ZodCheckBigIntFormat", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (input < minimum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
var \$ZodCheckMaxSize = /* @__PURE__ */ \$constructor("\$ZodCheckMaxSize", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size <= def.maximum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_big",
      maximum: def.maximum,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckMinSize = /* @__PURE__ */ \$constructor("\$ZodCheckMinSize", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size >= def.minimum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_small",
      minimum: def.minimum,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckSizeEquals = /* @__PURE__ */ \$constructor("\$ZodCheckSizeEquals", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.size;
    bag.maximum = def.size;
    bag.size = def.size;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size === def.size)
      return;
    const tooBig = size > def.size;
    payload.issues.push({
      origin: getSizableOrigin(input),
      ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckMaxLength = /* @__PURE__ */ \$constructor("\$ZodCheckMaxLength", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckMinLength = /* @__PURE__ */ \$constructor("\$ZodCheckMinLength", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckLengthEquals = /* @__PURE__ */ \$constructor("\$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  \$ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckStringFormat = /* @__PURE__ */ \$constructor("\$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  \$ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var \$ZodCheckRegex = /* @__PURE__ */ \$constructor("\$ZodCheckRegex", (inst, def) => {
  \$ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckLowerCase = /* @__PURE__ */ \$constructor("\$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  \$ZodCheckStringFormat.init(inst, def);
});
var \$ZodCheckUpperCase = /* @__PURE__ */ \$constructor("\$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  \$ZodCheckStringFormat.init(inst, def);
});
var \$ZodCheckIncludes = /* @__PURE__ */ \$constructor("\$ZodCheckIncludes", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? \`^.{\${def.position}}\${escapedRegex}\` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckStartsWith = /* @__PURE__ */ \$constructor("\$ZodCheckStartsWith", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const pattern = new RegExp(\`^\${escapeRegex(def.prefix)}.*\`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCheckEndsWith = /* @__PURE__ */ \$constructor("\$ZodCheckEndsWith", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const pattern = new RegExp(\`.*\${escapeRegex(def.suffix)}\$\`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var \$ZodCheckProperty = /* @__PURE__ */ \$constructor("\$ZodCheckProperty", (inst, def) => {
  \$ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    const result = def.schema._zod.run({
      value: payload.value[def.property],
      issues: []
    }, {});
    if (result instanceof Promise) {
      return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
    }
    handleCheckPropertyResult(result, payload, def.property);
    return;
  };
});
var \$ZodCheckMimeType = /* @__PURE__ */ \$constructor("\$ZodCheckMimeType", (inst, def) => {
  \$ZodCheck.init(inst, def);
  const mimeSet = new Set(def.mime);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.mime = def.mime;
  });
  inst._zod.check = (payload) => {
    if (mimeSet.has(payload.value.type))
      return;
    payload.issues.push({
      code: "invalid_value",
      values: def.mime,
      input: payload.value.type,
      inst
    });
  };
});
var \$ZodCheckOverwrite = /* @__PURE__ */ \$constructor("\$ZodCheckOverwrite", (inst, def) => {
  \$ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [\`\`];
    const lines = [...content.map((x) => \`  \${x}\`)];
    return new F(...args, lines.join("\\n"));
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 0,
  patch: 0
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/schemas.js
var \$ZodType = /* @__PURE__ */ \$constructor("\$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("\$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted2 = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted2) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new \$ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted2)
              isAborted2 = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted2)
            isAborted2 = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    inst._zod.run = (payload, ctx) => {
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new \$ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  };
});
var \$ZodString = /* @__PURE__ */ \$constructor("\$ZodString", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var \$ZodStringFormat = /* @__PURE__ */ \$constructor("\$ZodStringFormat", (inst, def) => {
  \$ZodCheckStringFormat.init(inst, def);
  \$ZodString.init(inst, def);
});
var \$ZodGUID = /* @__PURE__ */ \$constructor("\$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodUUID = /* @__PURE__ */ \$constructor("\$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(\`Invalid UUID version: "\${def.version}"\`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  \$ZodStringFormat.init(inst, def);
});
var \$ZodEmail = /* @__PURE__ */ \$constructor("\$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodURL = /* @__PURE__ */ \$constructor("\$ZodURL", (inst, def) => {
  \$ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const orig = payload.value;
      const url2 = new URL(orig);
      const href = url2.href;
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url2.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (!orig.endsWith("/") && href.endsWith("/")) {
        payload.value = href.slice(0, -1);
      } else {
        payload.value = href;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var \$ZodEmoji = /* @__PURE__ */ \$constructor("\$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  \$ZodStringFormat.init(inst, def);
});
var \$ZodNanoID = /* @__PURE__ */ \$constructor("\$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodCUID = /* @__PURE__ */ \$constructor("\$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodCUID2 = /* @__PURE__ */ \$constructor("\$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodULID = /* @__PURE__ */ \$constructor("\$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodXID = /* @__PURE__ */ \$constructor("\$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodKSUID = /* @__PURE__ */ \$constructor("\$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodISODateTime = /* @__PURE__ */ \$constructor("\$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  \$ZodStringFormat.init(inst, def);
});
var \$ZodISODate = /* @__PURE__ */ \$constructor("\$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodISOTime = /* @__PURE__ */ \$constructor("\$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  \$ZodStringFormat.init(inst, def);
});
var \$ZodISODuration = /* @__PURE__ */ \$constructor("\$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodIPv4 = /* @__PURE__ */ \$constructor("\$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  \$ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = \`ipv4\`;
  });
});
var \$ZodIPv6 = /* @__PURE__ */ \$constructor("\$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  \$ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = \`ipv6\`;
  });
  inst._zod.check = (payload) => {
    try {
      new URL(\`http://[\${payload.value}]\`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var \$ZodCIDRv4 = /* @__PURE__ */ \$constructor("\$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  \$ZodStringFormat.init(inst, def);
});
var \$ZodCIDRv6 = /* @__PURE__ */ \$constructor("\$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  \$ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const [address, prefix] = payload.value.split("/");
    try {
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (\`\${prefixNum}\` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(\`http://[\${address}]\`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var \$ZodBase64 = /* @__PURE__ */ \$constructor("\$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  \$ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var \$ZodBase64URL = /* @__PURE__ */ \$constructor("\$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  \$ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64url";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodE164 = /* @__PURE__ */ \$constructor("\$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  \$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var \$ZodJWT = /* @__PURE__ */ \$constructor("\$ZodJWT", (inst, def) => {
  \$ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodCustomStringFormat = /* @__PURE__ */ \$constructor("\$ZodCustomStringFormat", (inst, def) => {
  \$ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (def.fn(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: def.format,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var \$ZodNumber = /* @__PURE__ */ \$constructor("\$ZodNumber", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var \$ZodNumberFormat = /* @__PURE__ */ \$constructor("\$ZodNumber", (inst, def) => {
  \$ZodCheckNumberFormat.init(inst, def);
  \$ZodNumber.init(inst, def);
});
var \$ZodBoolean = /* @__PURE__ */ \$constructor("\$ZodBoolean", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodBigInt = /* @__PURE__ */ \$constructor("\$ZodBigInt", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var \$ZodBigIntFormat = /* @__PURE__ */ \$constructor("\$ZodBigInt", (inst, def) => {
  \$ZodCheckBigIntFormat.init(inst, def);
  \$ZodBigInt.init(inst, def);
});
var \$ZodSymbol = /* @__PURE__ */ \$constructor("\$ZodSymbol", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "symbol")
      return payload;
    payload.issues.push({
      expected: "symbol",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodUndefined = /* @__PURE__ */ \$constructor("\$ZodUndefined", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = _undefined;
  inst._zod.values = /* @__PURE__ */ new Set([void 0]);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "undefined",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodNull = /* @__PURE__ */ \$constructor("\$ZodNull", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodAny = /* @__PURE__ */ \$constructor("\$ZodAny", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var \$ZodUnknown = /* @__PURE__ */ \$constructor("\$ZodUnknown", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var \$ZodNever = /* @__PURE__ */ \$constructor("\$ZodNever", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var \$ZodVoid = /* @__PURE__ */ \$constructor("\$ZodVoid", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "void",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodDate = /* @__PURE__ */ \$constructor("\$ZodDate", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var \$ZodArray = /* @__PURE__ */ \$constructor("\$ZodArray", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handleObjectResult(result, final, key) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
  if (result.issues.length) {
    if (input[key] === void 0) {
      if (key in input) {
        final.value[key] = void 0;
      } else {
        final.value[key] = result.value;
      }
    } else {
      final.issues.push(...prefixIssues(key, result.issues));
    }
  } else if (result.value === void 0) {
    if (key in input)
      final.value[key] = void 0;
  } else {
    final.value[key] = result.value;
  }
}
var \$ZodObject = /* @__PURE__ */ \$constructor("\$ZodObject", (inst, def) => {
  \$ZodType.init(inst, def);
  const _normalized = cached(() => {
    const keys = Object.keys(def.shape);
    for (const k of keys) {
      if (!(def.shape[k] instanceof \$ZodType)) {
        throw new Error(\`Invalid element at key "\${k}": expected a Zod schema\`);
      }
    }
    const okeys = optionalKeys(def.shape);
    return {
      shape: def.shape,
      keys,
      keySet: new Set(keys),
      numKeys: keys.length,
      optionalKeys: new Set(okeys)
    };
  });
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return \`shape[\${k}]._zod.run({ value: input[\${k}], issues: [] }, ctx)\`;
    };
    doc.write(\`const input = payload.value;\`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = \`key_\${counter++}\`;
    }
    doc.write(\`const newResult = {}\`);
    for (const key of normalized.keys) {
      if (normalized.optionalKeys.has(key)) {
        const id = ids[key];
        doc.write(\`const \${id} = \${parseStr(key)};\`);
        const k = esc(key);
        doc.write(\`
        if (\${id}.issues.length) {
          if (input[\${k}] === undefined) {
            if (\${k} in input) {
              newResult[\${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              \${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [\${k}, ...iss.path] : [\${k}],
              }))
            );
          }
        } else if (\${id}.value === undefined) {
          if (\${k} in input) newResult[\${k}] = undefined;
        } else {
          newResult[\${k}] = \${id}.value;
        }
        \`);
      } else {
        const id = ids[key];
        doc.write(\`const \${id} = \${parseStr(key)};\`);
        doc.write(\`
          if (\${id}.issues.length) payload.issues = payload.issues.concat(\${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [\${esc(key)}, ...iss.path] : [\${esc(key)}]
          })));\`);
        doc.write(\`newResult[\${esc(key)}] = \${id}.value\`);
      }
    }
    doc.write(\`payload.value = newResult;\`);
    doc.write(\`return payload;\`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
    } else {
      payload.value = {};
      const shape = value.shape;
      for (const key of value.keys) {
        const el = shape[key];
        const r = el._zod.run({ value: input[key], issues: [] }, ctx);
        const isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
        if (r instanceof Promise) {
          proms.push(r.then((r2) => isOptional ? handleOptionalObjectResult(r2, payload, key, input) : handleObjectResult(r2, payload, key)));
        } else if (isOptional) {
          handleOptionalObjectResult(r, payload, key, input);
        } else {
          handleObjectResult(r, payload, key);
        }
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    const unrecognized = [];
    const keySet = value.keySet;
    const _catchall = catchall._zod;
    const t = _catchall.def.type;
    for (const key of Object.keys(input)) {
      if (keySet.has(key))
        continue;
      if (t === "never") {
        unrecognized.push(key);
        continue;
      }
      const r = _catchall.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handleObjectResult(r2, payload, key)));
      } else {
        handleObjectResult(r, payload, key);
      }
    }
    if (unrecognized.length) {
      payload.issues.push({
        code: "unrecognized_keys",
        keys: unrecognized,
        input,
        inst
      });
    }
    if (!proms.length)
      return payload;
    return Promise.all(proms).then(() => {
      return payload;
    });
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var \$ZodUnion = /* @__PURE__ */ \$constructor("\$ZodUnion", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(\`^(\${patterns.map((p) => cleanRegex(p.source)).join("|")})\$\`);
    }
    return void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
var \$ZodDiscriminatedUnion = /* @__PURE__ */ \$constructor("\$ZodDiscriminatedUnion", (inst, def) => {
  \$ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazy(inst._zod, "propValues", () => {
    const propValues = {};
    for (const option of def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(\`Invalid discriminated union option at index "\${def.options.indexOf(option)}"\`);
      for (const [k, v] of Object.entries(pv)) {
        if (!propValues[k])
          propValues[k] = /* @__PURE__ */ new Set();
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    return propValues;
  });
  const disc = cached(() => {
    const opts = def.options;
    const map2 = /* @__PURE__ */ new Map();
    for (const o of opts) {
      const values = o._zod.propValues[def.discriminator];
      if (!values || values.size === 0)
        throw new Error(\`Invalid discriminated union option at index "\${def.options.indexOf(o)}"\`);
      for (const v of values) {
        if (map2.has(v)) {
          throw new Error(\`Duplicate discriminator value "\${String(v)}"\`);
        }
        map2.set(v, o);
      }
    }
    return map2;
  });
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const opt = disc.value.get(input?.[def.discriminator]);
    if (opt) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback) {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var \$ZodIntersection = /* @__PURE__ */ \$constructor("\$ZodIntersection", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(\`Unmergable intersection. Error path: \${JSON.stringify(merged.mergeErrorPath)}\`);
  }
  result.value = merged.data;
  return result;
}
var \$ZodTuple = /* @__PURE__ */ \$constructor("\$ZodTuple", (inst, def) => {
  \$ZodType.init(inst, def);
  const items = def.items;
  const optStart = items.length - [...items].reverse().findIndex((item) => item._zod.optin !== "optional");
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = [];
    const proms = [];
    if (!def.rest) {
      const tooBig = input.length > items.length;
      const tooSmall = input.length < optStart - 1;
      if (tooBig || tooSmall) {
        payload.issues.push({
          input,
          inst,
          origin: "array",
          ...tooBig ? { code: "too_big", maximum: items.length } : { code: "too_small", minimum: items.length }
        });
        return payload;
      }
    }
    let i = -1;
    for (const item of items) {
      i++;
      if (i >= input.length) {
        if (i >= optStart)
          continue;
      }
      const result = item._zod.run({
        value: input[i],
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
      } else {
        handleTupleResult(result, payload, i);
      }
    }
    if (def.rest) {
      const rest = input.slice(items.length);
      for (const el of rest) {
        i++;
        const result = def.rest._zod.run({
          value: el,
          issues: []
        }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var \$ZodRecord = /* @__PURE__ */ \$constructor("\$ZodRecord", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (def.keyType._zod.values) {
      const values = def.keyType._zod.values;
      payload.value = {};
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[key] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[key] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!values.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        if (keyResult.issues.length) {
          payload.issues.push({
            origin: "record",
            code: "invalid_key",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          });
          payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var \$ZodMap = /* @__PURE__ */ \$constructor("\$ZodMap", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Map)) {
      payload.issues.push({
        expected: "map",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Map();
    for (const [key, value] of input) {
      const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
      const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
          handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
        }));
      } else {
        handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_key",
        input,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
var \$ZodSet = /* @__PURE__ */ \$constructor("\$ZodSet", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Set)) {
      payload.issues.push({
        input,
        inst,
        expected: "set",
        code: "invalid_type"
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Set();
    for (const item of input) {
      const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleSetResult(result2, payload)));
      } else
        handleSetResult(result, payload);
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
var \$ZodEnum = /* @__PURE__ */ \$constructor("\$ZodEnum", (inst, def) => {
  \$ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  inst._zod.values = new Set(values);
  inst._zod.pattern = new RegExp(\`^(\${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})\$\`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var \$ZodLiteral = /* @__PURE__ */ \$constructor("\$ZodLiteral", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.values = new Set(def.values);
  inst._zod.pattern = new RegExp(\`^(\${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})\$\`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var \$ZodFile = /* @__PURE__ */ \$constructor("\$ZodFile", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input instanceof File)
      return payload;
    payload.issues.push({
      expected: "file",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var \$ZodTransform = /* @__PURE__ */ \$constructor("\$ZodTransform", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const _out = def.transform(payload.value, payload);
    if (_ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new \$ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
var \$ZodOptional = /* @__PURE__ */ \$constructor("\$ZodOptional", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(\`^(\${cleanRegex(pattern.source)})?\$\`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var \$ZodNullable = /* @__PURE__ */ \$constructor("\$ZodNullable", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(\`^(\${cleanRegex(pattern.source)}|null)\$\`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var \$ZodDefault = /* @__PURE__ */ \$constructor("\$ZodDefault", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var \$ZodPrefault = /* @__PURE__ */ \$constructor("\$ZodPrefault", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var \$ZodNonOptional = /* @__PURE__ */ \$constructor("\$ZodNonOptional", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var \$ZodSuccess = /* @__PURE__ */ \$constructor("\$ZodSuccess", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.issues.length === 0;
        return payload;
      });
    }
    payload.value = result.issues.length === 0;
    return payload;
  };
});
var \$ZodCatch = /* @__PURE__ */ \$constructor("\$ZodCatch", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
    }
    return payload;
  };
});
var \$ZodNaN = /* @__PURE__ */ \$constructor("\$ZodNaN", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "nan",
        code: "invalid_type"
      });
      return payload;
    }
    return payload;
  };
});
var \$ZodPipe = /* @__PURE__ */ \$constructor("\$ZodPipe", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def, ctx));
    }
    return handlePipeResult(left, def, ctx);
  };
});
function handlePipeResult(left, def, ctx) {
  if (aborted(left)) {
    return left;
  }
  return def.out._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var \$ZodReadonly = /* @__PURE__ */ \$constructor("\$ZodReadonly", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var \$ZodTemplateLiteral = /* @__PURE__ */ \$constructor("\$ZodTemplateLiteral", (inst, def) => {
  \$ZodType.init(inst, def);
  const regexParts = [];
  for (const part of def.parts) {
    if (part instanceof \$ZodType) {
      if (!part._zod.pattern) {
        throw new Error(\`Invalid template literal part, no pattern found: \${[...part._zod.traits].shift()}\`);
      }
      const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
      if (!source)
        throw new Error(\`Invalid template literal part: \${part._zod.traits}\`);
      const start = source.startsWith("^") ? 1 : 0;
      const end = source.endsWith("\$") ? source.length - 1 : source.length;
      regexParts.push(source.slice(start, end));
    } else if (part === null || primitiveTypes.has(typeof part)) {
      regexParts.push(escapeRegex(\`\${part}\`));
    } else {
      throw new Error(\`Invalid template literal part: \${part}\`);
    }
  }
  inst._zod.pattern = new RegExp(\`^\${regexParts.join("")}\$\`);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "string") {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "template_literal",
        code: "invalid_type"
      });
      return payload;
    }
    inst._zod.pattern.lastIndex = 0;
    if (!inst._zod.pattern.test(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        code: "invalid_format",
        format: "template_literal",
        pattern: inst._zod.pattern.source
      });
      return payload;
    }
    return payload;
  };
});
var \$ZodPromise = /* @__PURE__ */ \$constructor("\$ZodPromise", (inst, def) => {
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
  };
});
var \$ZodLazy = /* @__PURE__ */ \$constructor("\$ZodLazy", (inst, def) => {
  \$ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => def.getter());
  defineLazy(inst._zod, "pattern", () => inst._zod.innerType._zod.pattern);
  defineLazy(inst._zod, "propValues", () => inst._zod.innerType._zod.propValues);
  defineLazy(inst._zod, "optin", () => inst._zod.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => inst._zod.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var \$ZodCustom = /* @__PURE__ */ \$constructor("\$ZodCustom", (inst, def) => {
  \$ZodCheck.init(inst, def);
  \$ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  ca: () => ca_default,
  cs: () => cs_default,
  de: () => de_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  he: () => he_default,
  hu: () => hu_default,
  id: () => id_default,
  it: () => it_default,
  ja: () => ja_default,
  kh: () => kh_default,
  ko: () => ko_default,
  mk: () => mk_default,
  ms: () => ms_default,
  nl: () => nl_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ru: () => ru_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  th: () => th_default,
  tr: () => tr_default,
  ua: () => ua_default,
  ur: () => ur_default,
  vi: () => vi_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ar.js
var error = () => {
  const Sizable = {
    string: { unit: "\\u062D\\u0631\\u0641", verb: "\\u0623\\u0646 \\u064A\\u062D\\u0648\\u064A" },
    file: { unit: "\\u0628\\u0627\\u064A\\u062A", verb: "\\u0623\\u0646 \\u064A\\u062D\\u0648\\u064A" },
    array: { unit: "\\u0639\\u0646\\u0635\\u0631", verb: "\\u0623\\u0646 \\u064A\\u062D\\u0648\\u064A" },
    set: { unit: "\\u0639\\u0646\\u0635\\u0631", verb: "\\u0623\\u0646 \\u064A\\u062D\\u0648\\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0645\\u062F\\u062E\\u0644",
    email: "\\u0628\\u0631\\u064A\\u062F \\u0625\\u0644\\u0643\\u062A\\u0631\\u0648\\u0646\\u064A",
    url: "\\u0631\\u0627\\u0628\\u0637",
    emoji: "\\u0625\\u064A\\u0645\\u0648\\u062C\\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u062A\\u0627\\u0631\\u064A\\u062E \\u0648\\u0648\\u0642\\u062A \\u0628\\u0645\\u0639\\u064A\\u0627\\u0631 ISO",
    date: "\\u062A\\u0627\\u0631\\u064A\\u062E \\u0628\\u0645\\u0639\\u064A\\u0627\\u0631 ISO",
    time: "\\u0648\\u0642\\u062A \\u0628\\u0645\\u0639\\u064A\\u0627\\u0631 ISO",
    duration: "\\u0645\\u062F\\u0629 \\u0628\\u0645\\u0639\\u064A\\u0627\\u0631 ISO",
    ipv4: "\\u0639\\u0646\\u0648\\u0627\\u0646 IPv4",
    ipv6: "\\u0639\\u0646\\u0648\\u0627\\u0646 IPv6",
    cidrv4: "\\u0645\\u062F\\u0649 \\u0639\\u0646\\u0627\\u0648\\u064A\\u0646 \\u0628\\u0635\\u064A\\u063A\\u0629 IPv4",
    cidrv6: "\\u0645\\u062F\\u0649 \\u0639\\u0646\\u0627\\u0648\\u064A\\u0646 \\u0628\\u0635\\u064A\\u063A\\u0629 IPv6",
    base64: "\\u0646\\u064E\\u0635 \\u0628\\u062A\\u0631\\u0645\\u064A\\u0632 base64-encoded",
    base64url: "\\u0646\\u064E\\u0635 \\u0628\\u062A\\u0631\\u0645\\u064A\\u0632 base64url-encoded",
    json_string: "\\u0646\\u064E\\u0635 \\u0639\\u0644\\u0649 \\u0647\\u064A\\u0626\\u0629 JSON",
    e164: "\\u0631\\u0642\\u0645 \\u0647\\u0627\\u062A\\u0641 \\u0628\\u0645\\u0639\\u064A\\u0627\\u0631 E.164",
    jwt: "JWT",
    template_literal: "\\u0645\\u062F\\u062E\\u0644"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0645\\u062F\\u062E\\u0644\\u0627\\u062A \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644\\u0629: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0625\\u062F\\u062E\\u0627\\u0644 \${issue2.expected}\\u060C \\u0648\\u0644\\u0643\\u0646 \\u062A\\u0645 \\u0625\\u062F\\u062E\\u0627\\u0644 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u0645\\u062F\\u062E\\u0644\\u0627\\u062A \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644\\u0629: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0625\\u062F\\u062E\\u0627\\u0644 \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u0627\\u062E\\u062A\\u064A\\u0627\\u0631 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062A\\u0648\\u0642\\u0639 \\u0627\\u0646\\u062A\\u0642\\u0627\\u0621 \\u0623\\u062D\\u062F \\u0647\\u0630\\u0647 \\u0627\\u0644\\u062E\\u064A\\u0627\\u0631\\u0627\\u062A: \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \` \\u0623\\u0643\\u0628\\u0631 \\u0645\\u0646 \\u0627\\u0644\\u0644\\u0627\\u0632\\u0645: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0623\\u0646 \\u062A\\u0643\\u0648\\u0646 \${issue2.origin ?? "\\u0627\\u0644\\u0642\\u064A\\u0645\\u0629"} \${adj} \${issue2.maximum.toString()} \${sizing.unit ?? "\\u0639\\u0646\\u0635\\u0631"}\`;
        return \`\\u0623\\u0643\\u0628\\u0631 \\u0645\\u0646 \\u0627\\u0644\\u0644\\u0627\\u0632\\u0645: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0623\\u0646 \\u062A\\u0643\\u0648\\u0646 \${issue2.origin ?? "\\u0627\\u0644\\u0642\\u064A\\u0645\\u0629"} \${adj} \${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0623\\u0635\\u063A\\u0631 \\u0645\\u0646 \\u0627\\u0644\\u0644\\u0627\\u0632\\u0645: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0644\\u0640 \${issue2.origin} \\u0623\\u0646 \\u064A\\u0643\\u0648\\u0646 \${adj} \${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u0623\\u0635\\u063A\\u0631 \\u0645\\u0646 \\u0627\\u0644\\u0644\\u0627\\u0632\\u0645: \\u064A\\u0641\\u062A\\u0631\\u0636 \\u0644\\u0640 \${issue2.origin} \\u0623\\u0646 \\u064A\\u0643\\u0648\\u0646 \${adj} \${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u0646\\u064E\\u0635 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062C\\u0628 \\u0623\\u0646 \\u064A\\u0628\\u062F\\u0623 \\u0628\\u0640 "\${issue2.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`\\u0646\\u064E\\u0635 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062C\\u0628 \\u0623\\u0646 \\u064A\\u0646\\u062A\\u0647\\u064A \\u0628\\u0640 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u0646\\u064E\\u0635 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062C\\u0628 \\u0623\\u0646 \\u064A\\u062A\\u0636\\u0645\\u0651\\u064E\\u0646 "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u0646\\u064E\\u0635 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062C\\u0628 \\u0623\\u0646 \\u064A\\u0637\\u0627\\u0628\\u0642 \\u0627\\u0644\\u0646\\u0645\\u0637 \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644\`;
      }
      case "not_multiple_of":
        return \`\\u0631\\u0642\\u0645 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644: \\u064A\\u062C\\u0628 \\u0623\\u0646 \\u064A\\u0643\\u0648\\u0646 \\u0645\\u0646 \\u0645\\u0636\\u0627\\u0639\\u0641\\u0627\\u062A \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u0645\\u0639\\u0631\\u0641\${issue2.keys.length > 1 ? "\\u0627\\u062A" : ""} \\u063A\\u0631\\u064A\\u0628\${issue2.keys.length > 1 ? "\\u0629" : ""}: \${joinValues(issue2.keys, "\\u060C ")}\`;
      case "invalid_key":
        return \`\\u0645\\u0639\\u0631\\u0641 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644 \\u0641\\u064A \${issue2.origin}\`;
      case "invalid_union":
        return "\\u0645\\u062F\\u062E\\u0644 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644";
      case "invalid_element":
        return \`\\u0645\\u062F\\u062E\\u0644 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644 \\u0641\\u064A \${issue2.origin}\`;
      default:
        return "\\u0645\\u062F\\u062E\\u0644 \\u063A\\u064A\\u0631 \\u0645\\u0642\\u0628\\u0648\\u0644";
    }
  };
};
function ar_default() {
  return {
    localeError: error()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/az.js
var error2 = () => {
  const Sizable = {
    string: { unit: "simvol", verb: "olmal\\u0131d\\u0131r" },
    file: { unit: "bayt", verb: "olmal\\u0131d\\u0131r" },
    array: { unit: "element", verb: "olmal\\u0131d\\u0131r" },
    set: { unit: "element", verb: "olmal\\u0131d\\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Yanl\\u0131\\u015F d\\u0259y\\u0259r: g\\xF6zl\\u0259nil\\u0259n \${issue2.expected}, daxil olan \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Yanl\\u0131\\u015F d\\u0259y\\u0259r: g\\xF6zl\\u0259nil\\u0259n \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Yanl\\u0131\\u015F se\\xE7im: a\\u015Fa\\u011F\\u0131dak\\u0131lardan biri olmal\\u0131d\\u0131r: \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\xC7ox b\\xF6y\\xFCk: g\\xF6zl\\u0259nil\\u0259n \${issue2.origin ?? "d\\u0259y\\u0259r"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "element"}\`;
        return \`\\xC7ox b\\xF6y\\xFCk: g\\xF6zl\\u0259nil\\u0259n \${issue2.origin ?? "d\\u0259y\\u0259r"} \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\xC7ox ki\\xE7ik: g\\xF6zl\\u0259nil\\u0259n \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        return \`\\xC7ox ki\\xE7ik: g\\xF6zl\\u0259nil\\u0259n \${issue2.origin} \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Yanl\\u0131\\u015F m\\u0259tn: "\${_issue.prefix}" il\\u0259 ba\\u015Flamal\\u0131d\\u0131r\`;
        if (_issue.format === "ends_with")
          return \`Yanl\\u0131\\u015F m\\u0259tn: "\${_issue.suffix}" il\\u0259 bitm\\u0259lidir\`;
        if (_issue.format === "includes")
          return \`Yanl\\u0131\\u015F m\\u0259tn: "\${_issue.includes}" daxil olmal\\u0131d\\u0131r\`;
        if (_issue.format === "regex")
          return \`Yanl\\u0131\\u015F m\\u0259tn: \${_issue.pattern} \\u015Fablonuna uy\\u011Fun olmal\\u0131d\\u0131r\`;
        return \`Yanl\\u0131\\u015F \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Yanl\\u0131\\u015F \\u0259d\\u0259d: \${issue2.divisor} il\\u0259 b\\xF6l\\xFCn\\u0259 bil\\u0259n olmal\\u0131d\\u0131r\`;
      case "unrecognized_keys":
        return \`Tan\\u0131nmayan a\\xE7ar\${issue2.keys.length > 1 ? "lar" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} daxilind\\u0259 yanl\\u0131\\u015F a\\xE7ar\`;
      case "invalid_union":
        return "Yanl\\u0131\\u015F d\\u0259y\\u0259r";
      case "invalid_element":
        return \`\${issue2.origin} daxilind\\u0259 yanl\\u0131\\u015F d\\u0259y\\u0259r\`;
      default:
        return \`Yanl\\u0131\\u015F d\\u0259y\\u0259r\`;
    }
  };
};
function az_default() {
  return {
    localeError: error2()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error3 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\\u0441\\u0456\\u043C\\u0432\\u0430\\u043B",
        few: "\\u0441\\u0456\\u043C\\u0432\\u0430\\u043B\\u044B",
        many: "\\u0441\\u0456\\u043C\\u0432\\u0430\\u043B\\u0430\\u045E"
      },
      verb: "\\u043C\\u0435\\u0446\\u044C"
    },
    array: {
      unit: {
        one: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442",
        few: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u044B",
        many: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0430\\u045E"
      },
      verb: "\\u043C\\u0435\\u0446\\u044C"
    },
    set: {
      unit: {
        one: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442",
        few: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u044B",
        many: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0430\\u045E"
      },
      verb: "\\u043C\\u0435\\u0446\\u044C"
    },
    file: {
      unit: {
        one: "\\u0431\\u0430\\u0439\\u0442",
        few: "\\u0431\\u0430\\u0439\\u0442\\u044B",
        many: "\\u0431\\u0430\\u0439\\u0442\\u0430\\u045E"
      },
      verb: "\\u043C\\u0435\\u0446\\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u043B\\u0456\\u043A";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u043C\\u0430\\u0441\\u0456\\u045E";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0443\\u0432\\u043E\\u0434",
    email: "email \\u0430\\u0434\\u0440\\u0430\\u0441",
    url: "URL",
    emoji: "\\u044D\\u043C\\u043E\\u0434\\u0437\\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\u0434\\u0430\\u0442\\u0430 \\u0456 \\u0447\\u0430\\u0441",
    date: "ISO \\u0434\\u0430\\u0442\\u0430",
    time: "ISO \\u0447\\u0430\\u0441",
    duration: "ISO \\u043F\\u0440\\u0430\\u0446\\u044F\\u0433\\u043B\\u0430\\u0441\\u0446\\u044C",
    ipv4: "IPv4 \\u0430\\u0434\\u0440\\u0430\\u0441",
    ipv6: "IPv6 \\u0430\\u0434\\u0440\\u0430\\u0441",
    cidrv4: "IPv4 \\u0434\\u044B\\u044F\\u043F\\u0430\\u0437\\u043E\\u043D",
    cidrv6: "IPv6 \\u0434\\u044B\\u044F\\u043F\\u0430\\u0437\\u043E\\u043D",
    base64: "\\u0440\\u0430\\u0434\\u043E\\u043A \\u0443 \\u0444\\u0430\\u0440\\u043C\\u0430\\u0446\\u0435 base64",
    base64url: "\\u0440\\u0430\\u0434\\u043E\\u043A \\u0443 \\u0444\\u0430\\u0440\\u043C\\u0430\\u0446\\u0435 base64url",
    json_string: "JSON \\u0440\\u0430\\u0434\\u043E\\u043A",
    e164: "\\u043D\\u0443\\u043C\\u0430\\u0440 E.164",
    jwt: "JWT",
    template_literal: "\\u0443\\u0432\\u043E\\u0434"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u045E\\u0432\\u043E\\u0434: \\u0447\\u0430\\u043A\\u0430\\u045E\\u0441\\u044F \${issue2.expected}, \\u0430\\u0442\\u0440\\u044B\\u043C\\u0430\\u043D\\u0430 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u045E\\u0432\\u043E\\u0434: \\u0447\\u0430\\u043A\\u0430\\u043B\\u0430\\u0441\\u044F \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u0432\\u0430\\u0440\\u044B\\u044F\\u043D\\u0442: \\u0447\\u0430\\u043A\\u0430\\u045E\\u0441\\u044F \\u0430\\u0434\\u0437\\u0456\\u043D \\u0437 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u0430 \\u0432\\u044F\\u043B\\u0456\\u043A\\u0456: \\u0447\\u0430\\u043A\\u0430\\u043B\\u0430\\u0441\\u044F, \\u0448\\u0442\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u044D\\u043D\\u043D\\u0435"} \\u043F\\u0430\\u0432\\u0456\\u043D\\u043D\\u0430 \${sizing.verb} \${adj}\${issue2.maximum.toString()} \${unit}\`;
        }
        return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u0430 \\u0432\\u044F\\u043B\\u0456\\u043A\\u0456: \\u0447\\u0430\\u043A\\u0430\\u043B\\u0430\\u0441\\u044F, \\u0448\\u0442\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u044D\\u043D\\u043D\\u0435"} \\u043F\\u0430\\u0432\\u0456\\u043D\\u043D\\u0430 \\u0431\\u044B\\u0446\\u044C \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u0430 \\u043C\\u0430\\u043B\\u044B: \\u0447\\u0430\\u043A\\u0430\\u043B\\u0430\\u0441\\u044F, \\u0448\\u0442\\u043E \${issue2.origin} \\u043F\\u0430\\u0432\\u0456\\u043D\\u043D\\u0430 \${sizing.verb} \${adj}\${issue2.minimum.toString()} \${unit}\`;
        }
        return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u0430 \\u043C\\u0430\\u043B\\u044B: \\u0447\\u0430\\u043A\\u0430\\u043B\\u0430\\u0441\\u044F, \\u0448\\u0442\\u043E \${issue2.origin} \\u043F\\u0430\\u0432\\u0456\\u043D\\u043D\\u0430 \\u0431\\u044B\\u0446\\u044C \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u0440\\u0430\\u0434\\u043E\\u043A: \\u043F\\u0430\\u0432\\u0456\\u043D\\u0435\\u043D \\u043F\\u0430\\u0447\\u044B\\u043D\\u0430\\u0446\\u0446\\u0430 \\u0437 "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u0440\\u0430\\u0434\\u043E\\u043A: \\u043F\\u0430\\u0432\\u0456\\u043D\\u0435\\u043D \\u0437\\u0430\\u043A\\u0430\\u043D\\u0447\\u0432\\u0430\\u0446\\u0446\\u0430 \\u043D\\u0430 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u0440\\u0430\\u0434\\u043E\\u043A: \\u043F\\u0430\\u0432\\u0456\\u043D\\u0435\\u043D \\u0437\\u043C\\u044F\\u0448\\u0447\\u0430\\u0446\\u044C "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u0440\\u0430\\u0434\\u043E\\u043A: \\u043F\\u0430\\u0432\\u0456\\u043D\\u0435\\u043D \\u0430\\u0434\\u043F\\u0430\\u0432\\u044F\\u0434\\u0430\\u0446\\u044C \\u0448\\u0430\\u0431\\u043B\\u043E\\u043D\\u0443 \${_issue.pattern}\`;
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u043B\\u0456\\u043A: \\u043F\\u0430\\u0432\\u0456\\u043D\\u0435\\u043D \\u0431\\u044B\\u0446\\u044C \\u043A\\u0440\\u0430\\u0442\\u043D\\u044B\\u043C \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u041D\\u0435\\u0440\\u0430\\u0441\\u043F\\u0430\\u0437\\u043D\\u0430\\u043D\\u044B \${issue2.keys.length > 1 ? "\\u043A\\u043B\\u044E\\u0447\\u044B" : "\\u043A\\u043B\\u044E\\u0447"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u043A\\u043B\\u044E\\u0447 \\u0443 \${issue2.origin}\`;
      case "invalid_union":
        return "\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u045E\\u0432\\u043E\\u0434";
      case "invalid_element":
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u0430\\u0435 \\u0437\\u043D\\u0430\\u0447\\u044D\\u043D\\u043D\\u0435 \\u045E \${issue2.origin}\`;
      default:
        return \`\\u041D\\u044F\\u043F\\u0440\\u0430\\u0432\\u0456\\u043B\\u044C\\u043D\\u044B \\u045E\\u0432\\u043E\\u0434\`;
    }
  };
};
function be_default() {
  return {
    localeError: error3()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ca.js
var error4 = () => {
  const Sizable = {
    string: { unit: "car\\xE0cters", verb: "contenir" },
    file: { unit: "bytes", verb: "contenir" },
    array: { unit: "elements", verb: "contenir" },
    set: { unit: "elements", verb: "contenir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "entrada",
    email: "adre\\xE7a electr\\xF2nica",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i hora ISO",
    date: "data ISO",
    time: "hora ISO",
    duration: "durada ISO",
    ipv4: "adre\\xE7a IPv4",
    ipv6: "adre\\xE7a IPv6",
    cidrv4: "rang IPv4",
    cidrv6: "rang IPv6",
    base64: "cadena codificada en base64",
    base64url: "cadena codificada en base64url",
    json_string: "cadena JSON",
    e164: "n\\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Tipus inv\\xE0lid: s'esperava \${issue2.expected}, s'ha rebut \${parsedType4(issue2.input)}\`;
      // return \`Tipus invàlid: s'esperava \${issue.expected}, s'ha rebut \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Valor inv\\xE0lid: s'esperava \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Opci\\xF3 inv\\xE0lida: s'esperava una de \${joinValues(issue2.values, " o ")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "com a m\\xE0xim" : "menys de";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Massa gran: s'esperava que \${issue2.origin ?? "el valor"} contingu\\xE9s \${adj} \${issue2.maximum.toString()} \${sizing.unit ?? "elements"}\`;
        return \`Massa gran: s'esperava que \${issue2.origin ?? "el valor"} fos \${adj} \${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "com a m\\xEDnim" : "m\\xE9s de";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Massa petit: s'esperava que \${issue2.origin} contingu\\xE9s \${adj} \${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Massa petit: s'esperava que \${issue2.origin} fos \${adj} \${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Format inv\\xE0lid: ha de comen\\xE7ar amb "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`Format inv\\xE0lid: ha d'acabar amb "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Format inv\\xE0lid: ha d'incloure "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Format inv\\xE0lid: ha de coincidir amb el patr\\xF3 \${_issue.pattern}\`;
        return \`Format inv\\xE0lid per a \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`N\\xFAmero inv\\xE0lid: ha de ser m\\xFAltiple de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Clau\${issue2.keys.length > 1 ? "s" : ""} no reconeguda\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Clau inv\\xE0lida a \${issue2.origin}\`;
      case "invalid_union":
        return "Entrada inv\\xE0lida";
      // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
      case "invalid_element":
        return \`Element inv\\xE0lid a \${issue2.origin}\`;
      default:
        return \`Entrada inv\\xE0lida\`;
    }
  };
};
function ca_default() {
  return {
    localeError: error4()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/cs.js
var error5 = () => {
  const Sizable = {
    string: { unit: "znak\\u016F", verb: "m\\xEDt" },
    file: { unit: "bajt\\u016F", verb: "m\\xEDt" },
    array: { unit: "prvk\\u016F", verb: "m\\xEDt" },
    set: { unit: "prvk\\u016F", verb: "m\\xEDt" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u010D\\xEDslo";
      }
      case "string": {
        return "\\u0159et\\u011Bzec";
      }
      case "boolean": {
        return "boolean";
      }
      case "bigint": {
        return "bigint";
      }
      case "function": {
        return "funkce";
      }
      case "symbol": {
        return "symbol";
      }
      case "undefined": {
        return "undefined";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "pole";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "regul\\xE1rn\\xED v\\xFDraz",
    email: "e-mailov\\xE1 adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "datum a \\u010Das ve form\\xE1tu ISO",
    date: "datum ve form\\xE1tu ISO",
    time: "\\u010Das ve form\\xE1tu ISO",
    duration: "doba trv\\xE1n\\xED ISO",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    base64: "\\u0159et\\u011Bzec zak\\xF3dovan\\xFD ve form\\xE1tu base64",
    base64url: "\\u0159et\\u011Bzec zak\\xF3dovan\\xFD ve form\\xE1tu base64url",
    json_string: "\\u0159et\\u011Bzec ve form\\xE1tu JSON",
    e164: "\\u010D\\xEDslo E.164",
    jwt: "JWT",
    template_literal: "vstup"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Neplatn\\xFD vstup: o\\u010Dek\\xE1v\\xE1no \${issue2.expected}, obdr\\u017Eeno \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Neplatn\\xFD vstup: o\\u010Dek\\xE1v\\xE1no \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Neplatn\\xE1 mo\\u017Enost: o\\u010Dek\\xE1v\\xE1na jedna z hodnot \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Hodnota je p\\u0159\\xEDli\\u0161 velk\\xE1: \${issue2.origin ?? "hodnota"} mus\\xED m\\xEDt \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "prvk\\u016F"}\`;
        }
        return \`Hodnota je p\\u0159\\xEDli\\u0161 velk\\xE1: \${issue2.origin ?? "hodnota"} mus\\xED b\\xFDt \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Hodnota je p\\u0159\\xEDli\\u0161 mal\\xE1: \${issue2.origin ?? "hodnota"} mus\\xED m\\xEDt \${adj}\${issue2.minimum.toString()} \${sizing.unit ?? "prvk\\u016F"}\`;
        }
        return \`Hodnota je p\\u0159\\xEDli\\u0161 mal\\xE1: \${issue2.origin ?? "hodnota"} mus\\xED b\\xFDt \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Neplatn\\xFD \\u0159et\\u011Bzec: mus\\xED za\\u010D\\xEDnat na "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Neplatn\\xFD \\u0159et\\u011Bzec: mus\\xED kon\\u010Dit na "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Neplatn\\xFD \\u0159et\\u011Bzec: mus\\xED obsahovat "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Neplatn\\xFD \\u0159et\\u011Bzec: mus\\xED odpov\\xEDdat vzoru \${_issue.pattern}\`;
        return \`Neplatn\\xFD form\\xE1t \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Neplatn\\xE9 \\u010D\\xEDslo: mus\\xED b\\xFDt n\\xE1sobkem \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Nezn\\xE1m\\xE9 kl\\xED\\u010De: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Neplatn\\xFD kl\\xED\\u010D v \${issue2.origin}\`;
      case "invalid_union":
        return "Neplatn\\xFD vstup";
      case "invalid_element":
        return \`Neplatn\\xE1 hodnota v \${issue2.origin}\`;
      default:
        return \`Neplatn\\xFD vstup\`;
    }
  };
};
function cs_default() {
  return {
    localeError: error5()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/de.js
var error6 = () => {
  const Sizable = {
    string: { unit: "Zeichen", verb: "zu haben" },
    file: { unit: "Bytes", verb: "zu haben" },
    array: { unit: "Elemente", verb: "zu haben" },
    set: { unit: "Elemente", verb: "zu haben" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "Zahl";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "Array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "Eingabe",
    email: "E-Mail-Adresse",
    url: "URL",
    emoji: "Emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-Datum und -Uhrzeit",
    date: "ISO-Datum",
    time: "ISO-Uhrzeit",
    duration: "ISO-Dauer",
    ipv4: "IPv4-Adresse",
    ipv6: "IPv6-Adresse",
    cidrv4: "IPv4-Bereich",
    cidrv6: "IPv6-Bereich",
    base64: "Base64-codierter String",
    base64url: "Base64-URL-codierter String",
    json_string: "JSON-String",
    e164: "E.164-Nummer",
    jwt: "JWT",
    template_literal: "Eingabe"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Ung\\xFCltige Eingabe: erwartet \${issue2.expected}, erhalten \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Ung\\xFCltige Eingabe: erwartet \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Ung\\xFCltige Option: erwartet eine von \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Zu gro\\xDF: erwartet, dass \${issue2.origin ?? "Wert"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "Elemente"} hat\`;
        return \`Zu gro\\xDF: erwartet, dass \${issue2.origin ?? "Wert"} \${adj}\${issue2.maximum.toString()} ist\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Zu klein: erwartet, dass \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit} hat\`;
        }
        return \`Zu klein: erwartet, dass \${issue2.origin} \${adj}\${issue2.minimum.toString()} ist\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Ung\\xFCltiger String: muss mit "\${_issue.prefix}" beginnen\`;
        if (_issue.format === "ends_with")
          return \`Ung\\xFCltiger String: muss mit "\${_issue.suffix}" enden\`;
        if (_issue.format === "includes")
          return \`Ung\\xFCltiger String: muss "\${_issue.includes}" enthalten\`;
        if (_issue.format === "regex")
          return \`Ung\\xFCltiger String: muss dem Muster \${_issue.pattern} entsprechen\`;
        return \`Ung\\xFCltig: \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Ung\\xFCltige Zahl: muss ein Vielfaches von \${issue2.divisor} sein\`;
      case "unrecognized_keys":
        return \`\${issue2.keys.length > 1 ? "Unbekannte Schl\\xFCssel" : "Unbekannter Schl\\xFCssel"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Ung\\xFCltiger Schl\\xFCssel in \${issue2.origin}\`;
      case "invalid_union":
        return "Ung\\xFCltige Eingabe";
      case "invalid_element":
        return \`Ung\\xFCltiger Wert in \${issue2.origin}\`;
      default:
        return \`Ung\\xFCltige Eingabe\`;
    }
  };
};
function de_default() {
  return {
    localeError: error6()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/en.js
var parsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "number";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
        return data.constructor.name;
      }
    }
  }
  return t;
};
var error7 = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const Nouns = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Invalid input: expected \${issue2.expected}, received \${parsedType(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Invalid input: expected \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Invalid option: expected one of \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Too big: expected \${issue2.origin ?? "value"} to have \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elements"}\`;
        return \`Too big: expected \${issue2.origin ?? "value"} to be \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Too small: expected \${issue2.origin} to have \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Too small: expected \${issue2.origin} to be \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Invalid string: must start with "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`Invalid string: must end with "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Invalid string: must include "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Invalid string: must match pattern \${_issue.pattern}\`;
        return \`Invalid \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Invalid number: must be a multiple of \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Unrecognized key\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Invalid key in \${issue2.origin}\`;
      case "invalid_union":
        return "Invalid input";
      case "invalid_element":
        return \`Invalid value in \${issue2.origin}\`;
      default:
        return \`Invalid input\`;
    }
  };
};
function en_default() {
  return {
    localeError: error7()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/eo.js
var parsedType2 = (data) => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "nombro";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "tabelo";
      }
      if (data === null) {
        return "senvalora";
      }
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
        return data.constructor.name;
      }
    }
  }
  return t;
};
var error8 = () => {
  const Sizable = {
    string: { unit: "karaktrojn", verb: "havi" },
    file: { unit: "bajtojn", verb: "havi" },
    array: { unit: "elementojn", verb: "havi" },
    set: { unit: "elementojn", verb: "havi" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const Nouns = {
    regex: "enigo",
    email: "retadreso",
    url: "URL",
    emoji: "emo\\u011Dio",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datotempo",
    date: "ISO-dato",
    time: "ISO-tempo",
    duration: "ISO-da\\u016Dro",
    ipv4: "IPv4-adreso",
    ipv6: "IPv6-adreso",
    cidrv4: "IPv4-rango",
    cidrv6: "IPv6-rango",
    base64: "64-ume kodita karaktraro",
    base64url: "URL-64-ume kodita karaktraro",
    json_string: "JSON-karaktraro",
    e164: "E.164-nombro",
    jwt: "JWT",
    template_literal: "enigo"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Nevalida enigo: atendi\\u011Dis \${issue2.expected}, ricevi\\u011Dis \${parsedType2(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Nevalida enigo: atendi\\u011Dis \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Nevalida opcio: atendi\\u011Dis unu el \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Tro granda: atendi\\u011Dis ke \${issue2.origin ?? "valoro"} havu \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementojn"}\`;
        return \`Tro granda: atendi\\u011Dis ke \${issue2.origin ?? "valoro"} havu \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Tro malgranda: atendi\\u011Dis ke \${issue2.origin} havu \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Tro malgranda: atendi\\u011Dis ke \${issue2.origin} estu \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Nevalida karaktraro: devas komenci\\u011Di per "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Nevalida karaktraro: devas fini\\u011Di per "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Nevalida karaktraro: devas inkluzivi "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Nevalida karaktraro: devas kongrui kun la modelo \${_issue.pattern}\`;
        return \`Nevalida \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Nevalida nombro: devas esti oblo de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Nekonata\${issue2.keys.length > 1 ? "j" : ""} \\u015Dlosilo\${issue2.keys.length > 1 ? "j" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Nevalida \\u015Dlosilo en \${issue2.origin}\`;
      case "invalid_union":
        return "Nevalida enigo";
      case "invalid_element":
        return \`Nevalida valoro en \${issue2.origin}\`;
      default:
        return \`Nevalida enigo\`;
    }
  };
};
function eo_default() {
  return {
    localeError: error8()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/es.js
var error9 = () => {
  const Sizable = {
    string: { unit: "caracteres", verb: "tener" },
    file: { unit: "bytes", verb: "tener" },
    array: { unit: "elementos", verb: "tener" },
    set: { unit: "elementos", verb: "tener" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "n\\xFAmero";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "arreglo";
        }
        if (data === null) {
          return "nulo";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "entrada",
    email: "direcci\\xF3n de correo electr\\xF3nico",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "fecha y hora ISO",
    date: "fecha ISO",
    time: "hora ISO",
    duration: "duraci\\xF3n ISO",
    ipv4: "direcci\\xF3n IPv4",
    ipv6: "direcci\\xF3n IPv6",
    cidrv4: "rango IPv4",
    cidrv6: "rango IPv6",
    base64: "cadena codificada en base64",
    base64url: "URL codificada en base64",
    json_string: "cadena JSON",
    e164: "n\\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Entrada inv\\xE1lida: se esperaba \${issue2.expected}, recibido \${parsedType4(issue2.input)}\`;
      // return \`Entrada inválida: se esperaba \${issue.expected}, recibido \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Entrada inv\\xE1lida: se esperaba \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Opci\\xF3n inv\\xE1lida: se esperaba una de \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Demasiado grande: se esperaba que \${issue2.origin ?? "valor"} tuviera \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementos"}\`;
        return \`Demasiado grande: se esperaba que \${issue2.origin ?? "valor"} fuera \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Demasiado peque\\xF1o: se esperaba que \${issue2.origin} tuviera \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Demasiado peque\\xF1o: se esperaba que \${issue2.origin} fuera \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Cadena inv\\xE1lida: debe comenzar con "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Cadena inv\\xE1lida: debe terminar en "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Cadena inv\\xE1lida: debe incluir "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Cadena inv\\xE1lida: debe coincidir con el patr\\xF3n \${_issue.pattern}\`;
        return \`Inv\\xE1lido \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`N\\xFAmero inv\\xE1lido: debe ser m\\xFAltiplo de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Llave\${issue2.keys.length > 1 ? "s" : ""} desconocida\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Llave inv\\xE1lida en \${issue2.origin}\`;
      case "invalid_union":
        return "Entrada inv\\xE1lida";
      case "invalid_element":
        return \`Valor inv\\xE1lido en \${issue2.origin}\`;
      default:
        return \`Entrada inv\\xE1lida\`;
    }
  };
};
function es_default() {
  return {
    localeError: error9()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/fa.js
var error10 = () => {
  const Sizable = {
    string: { unit: "\\u06A9\\u0627\\u0631\\u0627\\u06A9\\u062A\\u0631", verb: "\\u062F\\u0627\\u0634\\u062A\\u0647 \\u0628\\u0627\\u0634\\u062F" },
    file: { unit: "\\u0628\\u0627\\u06CC\\u062A", verb: "\\u062F\\u0627\\u0634\\u062A\\u0647 \\u0628\\u0627\\u0634\\u062F" },
    array: { unit: "\\u0622\\u06CC\\u062A\\u0645", verb: "\\u062F\\u0627\\u0634\\u062A\\u0647 \\u0628\\u0627\\u0634\\u062F" },
    set: { unit: "\\u0622\\u06CC\\u062A\\u0645", verb: "\\u062F\\u0627\\u0634\\u062A\\u0647 \\u0628\\u0627\\u0634\\u062F" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0639\\u062F\\u062F";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u0622\\u0631\\u0627\\u06CC\\u0647";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0648\\u0631\\u0648\\u062F\\u06CC",
    email: "\\u0622\\u062F\\u0631\\u0633 \\u0627\\u06CC\\u0645\\u06CC\\u0644",
    url: "URL",
    emoji: "\\u0627\\u06CC\\u0645\\u0648\\u062C\\u06CC",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u062A\\u0627\\u0631\\u06CC\\u062E \\u0648 \\u0632\\u0645\\u0627\\u0646 \\u0627\\u06CC\\u0632\\u0648",
    date: "\\u062A\\u0627\\u0631\\u06CC\\u062E \\u0627\\u06CC\\u0632\\u0648",
    time: "\\u0632\\u0645\\u0627\\u0646 \\u0627\\u06CC\\u0632\\u0648",
    duration: "\\u0645\\u062F\\u062A \\u0632\\u0645\\u0627\\u0646 \\u0627\\u06CC\\u0632\\u0648",
    ipv4: "IPv4 \\u0622\\u062F\\u0631\\u0633",
    ipv6: "IPv6 \\u0622\\u062F\\u0631\\u0633",
    cidrv4: "IPv4 \\u062F\\u0627\\u0645\\u0646\\u0647",
    cidrv6: "IPv6 \\u062F\\u0627\\u0645\\u0646\\u0647",
    base64: "base64-encoded \\u0631\\u0634\\u062A\\u0647",
    base64url: "base64url-encoded \\u0631\\u0634\\u062A\\u0647",
    json_string: "JSON \\u0631\\u0634\\u062A\\u0647",
    e164: "E.164 \\u0639\\u062F\\u062F",
    jwt: "JWT",
    template_literal: "\\u0648\\u0631\\u0648\\u062F\\u06CC"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0648\\u0631\\u0648\\u062F\\u06CC \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0645\\u06CC\\u200C\\u0628\\u0627\\u06CC\\u0633\\u062A \${issue2.expected} \\u0645\\u06CC\\u200C\\u0628\\u0648\\u062F\\u060C \${parsedType4(issue2.input)} \\u062F\\u0631\\u06CC\\u0627\\u0641\\u062A \\u0634\\u062F\`;
      case "invalid_value":
        if (issue2.values.length === 1) {
          return \`\\u0648\\u0631\\u0648\\u062F\\u06CC \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0645\\u06CC\\u200C\\u0628\\u0627\\u06CC\\u0633\\u062A \${stringifyPrimitive(issue2.values[0])} \\u0645\\u06CC\\u200C\\u0628\\u0648\\u062F\`;
        }
        return \`\\u06AF\\u0632\\u06CC\\u0646\\u0647 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0645\\u06CC\\u200C\\u0628\\u0627\\u06CC\\u0633\\u062A \\u06CC\\u06A9\\u06CC \\u0627\\u0632 \${joinValues(issue2.values, "|")} \\u0645\\u06CC\\u200C\\u0628\\u0648\\u062F\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u062E\\u06CC\\u0644\\u06CC \\u0628\\u0632\\u0631\\u06AF: \${issue2.origin ?? "\\u0645\\u0642\\u062F\\u0627\\u0631"} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0639\\u0646\\u0635\\u0631"} \\u0628\\u0627\\u0634\\u062F\`;
        }
        return \`\\u062E\\u06CC\\u0644\\u06CC \\u0628\\u0632\\u0631\\u06AF: \${issue2.origin ?? "\\u0645\\u0642\\u062F\\u0627\\u0631"} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.maximum.toString()} \\u0628\\u0627\\u0634\\u062F\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u062E\\u06CC\\u0644\\u06CC \\u06A9\\u0648\\u0686\\u06A9: \${issue2.origin} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.minimum.toString()} \${sizing.unit} \\u0628\\u0627\\u0634\\u062F\`;
        }
        return \`\\u062E\\u06CC\\u0644\\u06CC \\u06A9\\u0648\\u0686\\u06A9: \${issue2.origin} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.minimum.toString()} \\u0628\\u0627\\u0634\\u062F\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u0631\\u0634\\u062A\\u0647 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0628\\u0627\\u06CC\\u062F \\u0628\\u0627 "\${_issue.prefix}" \\u0634\\u0631\\u0648\\u0639 \\u0634\\u0648\\u062F\`;
        }
        if (_issue.format === "ends_with") {
          return \`\\u0631\\u0634\\u062A\\u0647 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0628\\u0627\\u06CC\\u062F \\u0628\\u0627 "\${_issue.suffix}" \\u062A\\u0645\\u0627\\u0645 \\u0634\\u0648\\u062F\`;
        }
        if (_issue.format === "includes") {
          return \`\\u0631\\u0634\\u062A\\u0647 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0628\\u0627\\u06CC\\u062F \\u0634\\u0627\\u0645\\u0644 "\${_issue.includes}" \\u0628\\u0627\\u0634\\u062F\`;
        }
        if (_issue.format === "regex") {
          return \`\\u0631\\u0634\\u062A\\u0647 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0628\\u0627\\u06CC\\u062F \\u0628\\u0627 \\u0627\\u0644\\u06AF\\u0648\\u06CC \${_issue.pattern} \\u0645\\u0637\\u0627\\u0628\\u0642\\u062A \\u062F\\u0627\\u0634\\u062A\\u0647 \\u0628\\u0627\\u0634\\u062F\`;
        }
        return \`\${Nouns[_issue.format] ?? issue2.format} \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631\`;
      }
      case "not_multiple_of":
        return \`\\u0639\\u062F\\u062F \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631: \\u0628\\u0627\\u06CC\\u062F \\u0645\\u0636\\u0631\\u0628 \${issue2.divisor} \\u0628\\u0627\\u0634\\u062F\`;
      case "unrecognized_keys":
        return \`\\u06A9\\u0644\\u06CC\\u062F\${issue2.keys.length > 1 ? "\\u0647\\u0627\\u06CC" : ""} \\u0646\\u0627\\u0634\\u0646\\u0627\\u0633: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u06A9\\u0644\\u06CC\\u062F \\u0646\\u0627\\u0634\\u0646\\u0627\\u0633 \\u062F\\u0631 \${issue2.origin}\`;
      case "invalid_union":
        return \`\\u0648\\u0631\\u0648\\u062F\\u06CC \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631\`;
      case "invalid_element":
        return \`\\u0645\\u0642\\u062F\\u0627\\u0631 \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631 \\u062F\\u0631 \${issue2.origin}\`;
      default:
        return \`\\u0648\\u0631\\u0648\\u062F\\u06CC \\u0646\\u0627\\u0645\\u0639\\u062A\\u0628\\u0631\`;
    }
  };
};
function fa_default() {
  return {
    localeError: error10()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/fi.js
var error11 = () => {
  const Sizable = {
    string: { unit: "merkki\\xE4", subject: "merkkijonon" },
    file: { unit: "tavua", subject: "tiedoston" },
    array: { unit: "alkiota", subject: "listan" },
    set: { unit: "alkiota", subject: "joukon" },
    number: { unit: "", subject: "luvun" },
    bigint: { unit: "", subject: "suuren kokonaisluvun" },
    int: { unit: "", subject: "kokonaisluvun" },
    date: { unit: "", subject: "p\\xE4iv\\xE4m\\xE4\\xE4r\\xE4n" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "s\\xE4\\xE4nn\\xF6llinen lauseke",
    email: "s\\xE4hk\\xF6postiosoite",
    url: "URL-osoite",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-aikaleima",
    date: "ISO-p\\xE4iv\\xE4m\\xE4\\xE4r\\xE4",
    time: "ISO-aika",
    duration: "ISO-kesto",
    ipv4: "IPv4-osoite",
    ipv6: "IPv6-osoite",
    cidrv4: "IPv4-alue",
    cidrv6: "IPv6-alue",
    base64: "base64-koodattu merkkijono",
    base64url: "base64url-koodattu merkkijono",
    json_string: "JSON-merkkijono",
    e164: "E.164-luku",
    jwt: "JWT",
    template_literal: "templaattimerkkijono"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Virheellinen tyyppi: odotettiin \${issue2.expected}, oli \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Virheellinen sy\\xF6te: t\\xE4ytyy olla \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Virheellinen valinta: t\\xE4ytyy olla yksi seuraavista: \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Liian suuri: \${sizing.subject} t\\xE4ytyy olla \${adj}\${issue2.maximum.toString()} \${sizing.unit}\`.trim();
        }
        return \`Liian suuri: arvon t\\xE4ytyy olla \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Liian pieni: \${sizing.subject} t\\xE4ytyy olla \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`.trim();
        }
        return \`Liian pieni: arvon t\\xE4ytyy olla \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Virheellinen sy\\xF6te: t\\xE4ytyy alkaa "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Virheellinen sy\\xF6te: t\\xE4ytyy loppua "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Virheellinen sy\\xF6te: t\\xE4ytyy sis\\xE4lt\\xE4\\xE4 "\${_issue.includes}"\`;
        if (_issue.format === "regex") {
          return \`Virheellinen sy\\xF6te: t\\xE4ytyy vastata s\\xE4\\xE4nn\\xF6llist\\xE4 lauseketta \${_issue.pattern}\`;
        }
        return \`Virheellinen \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Virheellinen luku: t\\xE4ytyy olla luvun \${issue2.divisor} monikerta\`;
      case "unrecognized_keys":
        return \`\${issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return "Virheellinen avain tietueessa";
      case "invalid_union":
        return "Virheellinen unioni";
      case "invalid_element":
        return "Virheellinen arvo joukossa";
      default:
        return \`Virheellinen sy\\xF6te\`;
    }
  };
};
function fi_default() {
  return {
    localeError: error11()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/fr.js
var error12 = () => {
  const Sizable = {
    string: { unit: "caract\\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\\xE9l\\xE9ments", verb: "avoir" },
    set: { unit: "\\xE9l\\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "nombre";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "tableau";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "entr\\xE9e",
    email: "adresse e-mail",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date et heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\\xEEne encod\\xE9e en base64",
    base64url: "cha\\xEEne encod\\xE9e en base64url",
    json_string: "cha\\xEEne JSON",
    e164: "num\\xE9ro E.164",
    jwt: "JWT",
    template_literal: "entr\\xE9e"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Entr\\xE9e invalide : \${issue2.expected} attendu, \${parsedType4(issue2.input)} re\\xE7u\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Entr\\xE9e invalide : \${stringifyPrimitive(issue2.values[0])} attendu\`;
        return \`Option invalide : une valeur parmi \${joinValues(issue2.values, "|")} attendue\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Trop grand : \${issue2.origin ?? "valeur"} doit \${sizing.verb} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\xE9l\\xE9ment(s)"}\`;
        return \`Trop grand : \${issue2.origin ?? "valeur"} doit \\xEAtre \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Trop petit : \${issue2.origin} doit \${sizing.verb} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Trop petit : \${issue2.origin} doit \\xEAtre \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Cha\\xEEne invalide : doit commencer par "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Cha\\xEEne invalide : doit se terminer par "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Cha\\xEEne invalide : doit inclure "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Cha\\xEEne invalide : doit correspondre au mod\\xE8le \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} invalide\`;
      }
      case "not_multiple_of":
        return \`Nombre invalide : doit \\xEAtre un multiple de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Cl\\xE9\${issue2.keys.length > 1 ? "s" : ""} non reconnue\${issue2.keys.length > 1 ? "s" : ""} : \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Cl\\xE9 invalide dans \${issue2.origin}\`;
      case "invalid_union":
        return "Entr\\xE9e invalide";
      case "invalid_element":
        return \`Valeur invalide dans \${issue2.origin}\`;
      default:
        return \`Entr\\xE9e invalide\`;
    }
  };
};
function fr_default() {
  return {
    localeError: error12()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/fr-CA.js
var error13 = () => {
  const Sizable = {
    string: { unit: "caract\\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\\xE9l\\xE9ments", verb: "avoir" },
    set: { unit: "\\xE9l\\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "entr\\xE9e",
    email: "adresse courriel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date-heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\\xEEne encod\\xE9e en base64",
    base64url: "cha\\xEEne encod\\xE9e en base64url",
    json_string: "cha\\xEEne JSON",
    e164: "num\\xE9ro E.164",
    jwt: "JWT",
    template_literal: "entr\\xE9e"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Entr\\xE9e invalide : attendu \${issue2.expected}, re\\xE7u \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Entr\\xE9e invalide : attendu \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Option invalide : attendu l'une des valeurs suivantes \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "\\u2264" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Trop grand : attendu que \${issue2.origin ?? "la valeur"} ait \${adj}\${issue2.maximum.toString()} \${sizing.unit}\`;
        return \`Trop grand : attendu que \${issue2.origin ?? "la valeur"} soit \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\\u2265" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Trop petit : attendu que \${issue2.origin} ait \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Trop petit : attendu que \${issue2.origin} soit \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Cha\\xEEne invalide : doit commencer par "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`Cha\\xEEne invalide : doit se terminer par "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Cha\\xEEne invalide : doit inclure "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Cha\\xEEne invalide : doit correspondre au motif \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} invalide\`;
      }
      case "not_multiple_of":
        return \`Nombre invalide : doit \\xEAtre un multiple de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Cl\\xE9\${issue2.keys.length > 1 ? "s" : ""} non reconnue\${issue2.keys.length > 1 ? "s" : ""} : \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Cl\\xE9 invalide dans \${issue2.origin}\`;
      case "invalid_union":
        return "Entr\\xE9e invalide";
      case "invalid_element":
        return \`Valeur invalide dans \${issue2.origin}\`;
      default:
        return \`Entr\\xE9e invalide\`;
    }
  };
};
function fr_CA_default() {
  return {
    localeError: error13()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/he.js
var error14 = () => {
  const Sizable = {
    string: { unit: "\\u05D0\\u05D5\\u05EA\\u05D9\\u05D5\\u05EA", verb: "\\u05DC\\u05DB\\u05DC\\u05D5\\u05DC" },
    file: { unit: "\\u05D1\\u05D9\\u05D9\\u05D8\\u05D9\\u05DD", verb: "\\u05DC\\u05DB\\u05DC\\u05D5\\u05DC" },
    array: { unit: "\\u05E4\\u05E8\\u05D9\\u05D8\\u05D9\\u05DD", verb: "\\u05DC\\u05DB\\u05DC\\u05D5\\u05DC" },
    set: { unit: "\\u05E4\\u05E8\\u05D9\\u05D8\\u05D9\\u05DD", verb: "\\u05DC\\u05DB\\u05DC\\u05D5\\u05DC" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u05E7\\u05DC\\u05D8",
    email: "\\u05DB\\u05EA\\u05D5\\u05D1\\u05EA \\u05D0\\u05D9\\u05DE\\u05D9\\u05D9\\u05DC",
    url: "\\u05DB\\u05EA\\u05D5\\u05D1\\u05EA \\u05E8\\u05E9\\u05EA",
    emoji: "\\u05D0\\u05D9\\u05DE\\u05D5\\u05D2'\\u05D9",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u05EA\\u05D0\\u05E8\\u05D9\\u05DA \\u05D5\\u05D6\\u05DE\\u05DF ISO",
    date: "\\u05EA\\u05D0\\u05E8\\u05D9\\u05DA ISO",
    time: "\\u05D6\\u05DE\\u05DF ISO",
    duration: "\\u05DE\\u05E9\\u05DA \\u05D6\\u05DE\\u05DF ISO",
    ipv4: "\\u05DB\\u05EA\\u05D5\\u05D1\\u05EA IPv4",
    ipv6: "\\u05DB\\u05EA\\u05D5\\u05D1\\u05EA IPv6",
    cidrv4: "\\u05D8\\u05D5\\u05D5\\u05D7 IPv4",
    cidrv6: "\\u05D8\\u05D5\\u05D5\\u05D7 IPv6",
    base64: "\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05D1\\u05D1\\u05E1\\u05D9\\u05E1 64",
    base64url: "\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05D1\\u05D1\\u05E1\\u05D9\\u05E1 64 \\u05DC\\u05DB\\u05EA\\u05D5\\u05D1\\u05D5\\u05EA \\u05E8\\u05E9\\u05EA",
    json_string: "\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA JSON",
    e164: "\\u05DE\\u05E1\\u05E4\\u05E8 E.164",
    jwt: "JWT",
    template_literal: "\\u05E7\\u05DC\\u05D8"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u05E7\\u05DC\\u05D8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF: \\u05E6\\u05E8\\u05D9\\u05DA \${issue2.expected}, \\u05D4\\u05EA\\u05E7\\u05D1\\u05DC \${parsedType4(issue2.input)}\`;
      // return \`Invalid input: expected \${issue.expected}, received \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u05E7\\u05DC\\u05D8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF: \\u05E6\\u05E8\\u05D9\\u05DA \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u05E7\\u05DC\\u05D8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF: \\u05E6\\u05E8\\u05D9\\u05DA \\u05D0\\u05D7\\u05EA \\u05DE\\u05D4\\u05D0\\u05E4\\u05E9\\u05E8\\u05D5\\u05D9\\u05D5\\u05EA  \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u05D2\\u05D3\\u05D5\\u05DC \\u05DE\\u05D3\\u05D9: \${issue2.origin ?? "value"} \\u05E6\\u05E8\\u05D9\\u05DA \\u05DC\\u05D4\\u05D9\\u05D5\\u05EA \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elements"}\`;
        return \`\\u05D2\\u05D3\\u05D5\\u05DC \\u05DE\\u05D3\\u05D9: \${issue2.origin ?? "value"} \\u05E6\\u05E8\\u05D9\\u05DA \\u05DC\\u05D4\\u05D9\\u05D5\\u05EA \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u05E7\\u05D8\\u05DF \\u05DE\\u05D3\\u05D9: \${issue2.origin} \\u05E6\\u05E8\\u05D9\\u05DA \\u05DC\\u05D4\\u05D9\\u05D5\\u05EA \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u05E7\\u05D8\\u05DF \\u05DE\\u05D3\\u05D9: \${issue2.origin} \\u05E6\\u05E8\\u05D9\\u05DA \\u05DC\\u05D4\\u05D9\\u05D5\\u05EA \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05E0\\u05D4: \\u05D7\\u05D9\\u05D9\\u05D1\\u05EA \\u05DC\\u05D4\\u05EA\\u05D7\\u05D9\\u05DC \\u05D1"\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05E0\\u05D4: \\u05D7\\u05D9\\u05D9\\u05D1\\u05EA \\u05DC\\u05D4\\u05E1\\u05EA\\u05D9\\u05D9\\u05DD \\u05D1 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05E0\\u05D4: \\u05D7\\u05D9\\u05D9\\u05D1\\u05EA \\u05DC\\u05DB\\u05DC\\u05D5\\u05DC "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u05DE\\u05D7\\u05E8\\u05D5\\u05D6\\u05EA \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05E0\\u05D4: \\u05D7\\u05D9\\u05D9\\u05D1\\u05EA \\u05DC\\u05D4\\u05EA\\u05D0\\u05D9\\u05DD \\u05DC\\u05EA\\u05D1\\u05E0\\u05D9\\u05EA \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF\`;
      }
      case "not_multiple_of":
        return \`\\u05DE\\u05E1\\u05E4\\u05E8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF: \\u05D7\\u05D9\\u05D9\\u05D1 \\u05DC\\u05D4\\u05D9\\u05D5\\u05EA \\u05DE\\u05DB\\u05E4\\u05DC\\u05D4 \\u05E9\\u05DC \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u05DE\\u05E4\\u05EA\\u05D7\${issue2.keys.length > 1 ? "\\u05D5\\u05EA" : ""} \\u05DC\\u05D0 \\u05DE\\u05D6\\u05D5\\u05D4\${issue2.keys.length > 1 ? "\\u05D9\\u05DD" : "\\u05D4"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u05DE\\u05E4\\u05EA\\u05D7 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF \\u05D1\${issue2.origin}\`;
      case "invalid_union":
        return "\\u05E7\\u05DC\\u05D8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF";
      case "invalid_element":
        return \`\\u05E2\\u05E8\\u05DA \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF \\u05D1\${issue2.origin}\`;
      default:
        return \`\\u05E7\\u05DC\\u05D8 \\u05DC\\u05D0 \\u05EA\\u05E7\\u05D9\\u05DF\`;
    }
  };
};
function he_default() {
  return {
    localeError: error14()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/hu.js
var error15 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "legyen" },
    file: { unit: "byte", verb: "legyen" },
    array: { unit: "elem", verb: "legyen" },
    set: { unit: "elem", verb: "legyen" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "sz\\xE1m";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "t\\xF6mb";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "bemenet",
    email: "email c\\xEDm",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO id\\u0151b\\xE9lyeg",
    date: "ISO d\\xE1tum",
    time: "ISO id\\u0151",
    duration: "ISO id\\u0151intervallum",
    ipv4: "IPv4 c\\xEDm",
    ipv6: "IPv6 c\\xEDm",
    cidrv4: "IPv4 tartom\\xE1ny",
    cidrv6: "IPv6 tartom\\xE1ny",
    base64: "base64-k\\xF3dolt string",
    base64url: "base64url-k\\xF3dolt string",
    json_string: "JSON string",
    e164: "E.164 sz\\xE1m",
    jwt: "JWT",
    template_literal: "bemenet"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\xC9rv\\xE9nytelen bemenet: a v\\xE1rt \\xE9rt\\xE9k \${issue2.expected}, a kapott \\xE9rt\\xE9k \${parsedType4(issue2.input)}\`;
      // return \`Invalid input: expected \${issue.expected}, received \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\xC9rv\\xE9nytelen bemenet: a v\\xE1rt \\xE9rt\\xE9k \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\xC9rv\\xE9nytelen opci\\xF3: valamelyik \\xE9rt\\xE9k v\\xE1rt \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`T\\xFAl nagy: \${issue2.origin ?? "\\xE9rt\\xE9k"} m\\xE9rete t\\xFAl nagy \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elem"}\`;
        return \`T\\xFAl nagy: a bemeneti \\xE9rt\\xE9k \${issue2.origin ?? "\\xE9rt\\xE9k"} t\\xFAl nagy: \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`T\\xFAl kicsi: a bemeneti \\xE9rt\\xE9k \${issue2.origin} m\\xE9rete t\\xFAl kicsi \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`T\\xFAl kicsi: a bemeneti \\xE9rt\\xE9k \${issue2.origin} t\\xFAl kicsi \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\xC9rv\\xE9nytelen string: "\${_issue.prefix}" \\xE9rt\\xE9kkel kell kezd\\u0151dnie\`;
        if (_issue.format === "ends_with")
          return \`\\xC9rv\\xE9nytelen string: "\${_issue.suffix}" \\xE9rt\\xE9kkel kell v\\xE9gz\\u0151dnie\`;
        if (_issue.format === "includes")
          return \`\\xC9rv\\xE9nytelen string: "\${_issue.includes}" \\xE9rt\\xE9ket kell tartalmaznia\`;
        if (_issue.format === "regex")
          return \`\\xC9rv\\xE9nytelen string: \${_issue.pattern} mint\\xE1nak kell megfelelnie\`;
        return \`\\xC9rv\\xE9nytelen \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\xC9rv\\xE9nytelen sz\\xE1m: \${issue2.divisor} t\\xF6bbsz\\xF6r\\xF6s\\xE9nek kell lennie\`;
      case "unrecognized_keys":
        return \`Ismeretlen kulcs\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\xC9rv\\xE9nytelen kulcs \${issue2.origin}\`;
      case "invalid_union":
        return "\\xC9rv\\xE9nytelen bemenet";
      case "invalid_element":
        return \`\\xC9rv\\xE9nytelen \\xE9rt\\xE9k: \${issue2.origin}\`;
      default:
        return \`\\xC9rv\\xE9nytelen bemenet\`;
    }
  };
};
function hu_default() {
  return {
    localeError: error15()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/id.js
var error16 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "memiliki" },
    file: { unit: "byte", verb: "memiliki" },
    array: { unit: "item", verb: "memiliki" },
    set: { unit: "item", verb: "memiliki" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "input",
    email: "alamat email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tanggal dan waktu format ISO",
    date: "tanggal format ISO",
    time: "jam format ISO",
    duration: "durasi format ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    cidrv4: "rentang alamat IPv4",
    cidrv6: "rentang alamat IPv6",
    base64: "string dengan enkode base64",
    base64url: "string dengan enkode base64url",
    json_string: "string JSON",
    e164: "angka E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Input tidak valid: diharapkan \${issue2.expected}, diterima \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Input tidak valid: diharapkan \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Pilihan tidak valid: diharapkan salah satu dari \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Terlalu besar: diharapkan \${issue2.origin ?? "value"} memiliki \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elemen"}\`;
        return \`Terlalu besar: diharapkan \${issue2.origin ?? "value"} menjadi \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Terlalu kecil: diharapkan \${issue2.origin} memiliki \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Terlalu kecil: diharapkan \${issue2.origin} menjadi \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`String tidak valid: harus dimulai dengan "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`String tidak valid: harus berakhir dengan "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`String tidak valid: harus menyertakan "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`String tidak valid: harus sesuai pola \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} tidak valid\`;
      }
      case "not_multiple_of":
        return \`Angka tidak valid: harus kelipatan dari \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Kunci tidak dikenali \${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Kunci tidak valid di \${issue2.origin}\`;
      case "invalid_union":
        return "Input tidak valid";
      case "invalid_element":
        return \`Nilai tidak valid di \${issue2.origin}\`;
      default:
        return \`Input tidak valid\`;
    }
  };
};
function id_default() {
  return {
    localeError: error16()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/it.js
var error17 = () => {
  const Sizable = {
    string: { unit: "caratteri", verb: "avere" },
    file: { unit: "byte", verb: "avere" },
    array: { unit: "elementi", verb: "avere" },
    set: { unit: "elementi", verb: "avere" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "numero";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "vettore";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "input",
    email: "indirizzo email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data e ora ISO",
    date: "data ISO",
    time: "ora ISO",
    duration: "durata ISO",
    ipv4: "indirizzo IPv4",
    ipv6: "indirizzo IPv6",
    cidrv4: "intervallo IPv4",
    cidrv6: "intervallo IPv6",
    base64: "stringa codificata in base64",
    base64url: "URL codificata in base64",
    json_string: "stringa JSON",
    e164: "numero E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Input non valido: atteso \${issue2.expected}, ricevuto \${parsedType4(issue2.input)}\`;
      // return \`Input non valido: atteso \${issue.expected}, ricevuto \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Input non valido: atteso \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Opzione non valida: atteso uno tra \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Troppo grande: \${issue2.origin ?? "valore"} deve avere \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementi"}\`;
        return \`Troppo grande: \${issue2.origin ?? "valore"} deve essere \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Troppo piccolo: \${issue2.origin} deve avere \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Troppo piccolo: \${issue2.origin} deve essere \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Stringa non valida: deve iniziare con "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Stringa non valida: deve terminare con "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Stringa non valida: deve includere "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Stringa non valida: deve corrispondere al pattern \${_issue.pattern}\`;
        return \`Invalid \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Numero non valido: deve essere un multiplo di \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Chiav\${issue2.keys.length > 1 ? "i" : "e"} non riconosciut\${issue2.keys.length > 1 ? "e" : "a"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Chiave non valida in \${issue2.origin}\`;
      case "invalid_union":
        return "Input non valido";
      case "invalid_element":
        return \`Valore non valido in \${issue2.origin}\`;
      default:
        return \`Input non valido\`;
    }
  };
};
function it_default() {
  return {
    localeError: error17()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ja.js
var error18 = () => {
  const Sizable = {
    string: { unit: "\\u6587\\u5B57", verb: "\\u3067\\u3042\\u308B" },
    file: { unit: "\\u30D0\\u30A4\\u30C8", verb: "\\u3067\\u3042\\u308B" },
    array: { unit: "\\u8981\\u7D20", verb: "\\u3067\\u3042\\u308B" },
    set: { unit: "\\u8981\\u7D20", verb: "\\u3067\\u3042\\u308B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u6570\\u5024";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u914D\\u5217";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u5165\\u529B\\u5024",
    email: "\\u30E1\\u30FC\\u30EB\\u30A2\\u30C9\\u30EC\\u30B9",
    url: "URL",
    emoji: "\\u7D75\\u6587\\u5B57",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\\u65E5\\u6642",
    date: "ISO\\u65E5\\u4ED8",
    time: "ISO\\u6642\\u523B",
    duration: "ISO\\u671F\\u9593",
    ipv4: "IPv4\\u30A2\\u30C9\\u30EC\\u30B9",
    ipv6: "IPv6\\u30A2\\u30C9\\u30EC\\u30B9",
    cidrv4: "IPv4\\u7BC4\\u56F2",
    cidrv6: "IPv6\\u7BC4\\u56F2",
    base64: "base64\\u30A8\\u30F3\\u30B3\\u30FC\\u30C9\\u6587\\u5B57\\u5217",
    base64url: "base64url\\u30A8\\u30F3\\u30B3\\u30FC\\u30C9\\u6587\\u5B57\\u5217",
    json_string: "JSON\\u6587\\u5B57\\u5217",
    e164: "E.164\\u756A\\u53F7",
    jwt: "JWT",
    template_literal: "\\u5165\\u529B\\u5024"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u7121\\u52B9\\u306A\\u5165\\u529B: \${issue2.expected}\\u304C\\u671F\\u5F85\\u3055\\u308C\\u307E\\u3057\\u305F\\u304C\\u3001\${parsedType4(issue2.input)}\\u304C\\u5165\\u529B\\u3055\\u308C\\u307E\\u3057\\u305F\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u7121\\u52B9\\u306A\\u5165\\u529B: \${stringifyPrimitive(issue2.values[0])}\\u304C\\u671F\\u5F85\\u3055\\u308C\\u307E\\u3057\\u305F\`;
        return \`\\u7121\\u52B9\\u306A\\u9078\\u629E: \${joinValues(issue2.values, "\\u3001")}\\u306E\\u3044\\u305A\\u308C\\u304B\\u3067\\u3042\\u308B\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
      case "too_big": {
        const adj = issue2.inclusive ? "\\u4EE5\\u4E0B\\u3067\\u3042\\u308B" : "\\u3088\\u308A\\u5C0F\\u3055\\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u5927\\u304D\\u3059\\u304E\\u308B\\u5024: \${issue2.origin ?? "\\u5024"}\\u306F\${issue2.maximum.toString()}\${sizing.unit ?? "\\u8981\\u7D20"}\${adj}\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        return \`\\u5927\\u304D\\u3059\\u304E\\u308B\\u5024: \${issue2.origin ?? "\\u5024"}\\u306F\${issue2.maximum.toString()}\${adj}\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\\u4EE5\\u4E0A\\u3067\\u3042\\u308B" : "\\u3088\\u308A\\u5927\\u304D\\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u5C0F\\u3055\\u3059\\u304E\\u308B\\u5024: \${issue2.origin}\\u306F\${issue2.minimum.toString()}\${sizing.unit}\${adj}\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        return \`\\u5C0F\\u3055\\u3059\\u304E\\u308B\\u5024: \${issue2.origin}\\u306F\${issue2.minimum.toString()}\${adj}\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u7121\\u52B9\\u306A\\u6587\\u5B57\\u5217: "\${_issue.prefix}"\\u3067\\u59CB\\u307E\\u308B\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        if (_issue.format === "ends_with")
          return \`\\u7121\\u52B9\\u306A\\u6587\\u5B57\\u5217: "\${_issue.suffix}"\\u3067\\u7D42\\u308F\\u308B\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        if (_issue.format === "includes")
          return \`\\u7121\\u52B9\\u306A\\u6587\\u5B57\\u5217: "\${_issue.includes}"\\u3092\\u542B\\u3080\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        if (_issue.format === "regex")
          return \`\\u7121\\u52B9\\u306A\\u6587\\u5B57\\u5217: \\u30D1\\u30BF\\u30FC\\u30F3\${_issue.pattern}\\u306B\\u4E00\\u81F4\\u3059\\u308B\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
        return \`\\u7121\\u52B9\\u306A\${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u7121\\u52B9\\u306A\\u6570\\u5024: \${issue2.divisor}\\u306E\\u500D\\u6570\\u3067\\u3042\\u308B\\u5FC5\\u8981\\u304C\\u3042\\u308A\\u307E\\u3059\`;
      case "unrecognized_keys":
        return \`\\u8A8D\\u8B58\\u3055\\u308C\\u3066\\u3044\\u306A\\u3044\\u30AD\\u30FC\${issue2.keys.length > 1 ? "\\u7FA4" : ""}: \${joinValues(issue2.keys, "\\u3001")}\`;
      case "invalid_key":
        return \`\${issue2.origin}\\u5185\\u306E\\u7121\\u52B9\\u306A\\u30AD\\u30FC\`;
      case "invalid_union":
        return "\\u7121\\u52B9\\u306A\\u5165\\u529B";
      case "invalid_element":
        return \`\${issue2.origin}\\u5185\\u306E\\u7121\\u52B9\\u306A\\u5024\`;
      default:
        return \`\\u7121\\u52B9\\u306A\\u5165\\u529B\`;
    }
  };
};
function ja_default() {
  return {
    localeError: error18()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/kh.js
var error19 = () => {
  const Sizable = {
    string: { unit: "\\u178F\\u17BD\\u17A2\\u1780\\u17D2\\u179F\\u179A", verb: "\\u1782\\u17BD\\u179A\\u1798\\u17B6\\u1793" },
    file: { unit: "\\u1794\\u17C3", verb: "\\u1782\\u17BD\\u179A\\u1798\\u17B6\\u1793" },
    array: { unit: "\\u1792\\u17B6\\u178F\\u17BB", verb: "\\u1782\\u17BD\\u179A\\u1798\\u17B6\\u1793" },
    set: { unit: "\\u1792\\u17B6\\u178F\\u17BB", verb: "\\u1782\\u17BD\\u179A\\u1798\\u17B6\\u1793" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "\\u1798\\u17B7\\u1793\\u1798\\u17C2\\u1793\\u1787\\u17B6\\u179B\\u17C1\\u1781 (NaN)" : "\\u179B\\u17C1\\u1781";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u17A2\\u17B6\\u179A\\u17C1 (Array)";
        }
        if (data === null) {
          return "\\u1782\\u17D2\\u1798\\u17B6\\u1793\\u178F\\u1798\\u17D2\\u179B\\u17C3 (null)";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1794\\u1789\\u17D2\\u1785\\u17BC\\u179B",
    email: "\\u17A2\\u17B6\\u179F\\u1799\\u178A\\u17D2\\u178B\\u17B6\\u1793\\u17A2\\u17CA\\u17B8\\u1798\\u17C2\\u179B",
    url: "URL",
    emoji: "\\u179F\\u1789\\u17D2\\u1789\\u17B6\\u17A2\\u17B6\\u179A\\u1798\\u17D2\\u1798\\u178E\\u17CD",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u1780\\u17B6\\u179B\\u1794\\u179A\\u17B7\\u1785\\u17D2\\u1786\\u17C1\\u1791 \\u1793\\u17B7\\u1784\\u1798\\u17C9\\u17C4\\u1784 ISO",
    date: "\\u1780\\u17B6\\u179B\\u1794\\u179A\\u17B7\\u1785\\u17D2\\u1786\\u17C1\\u1791 ISO",
    time: "\\u1798\\u17C9\\u17C4\\u1784 ISO",
    duration: "\\u179A\\u1799\\u17C8\\u1796\\u17C1\\u179B ISO",
    ipv4: "\\u17A2\\u17B6\\u179F\\u1799\\u178A\\u17D2\\u178B\\u17B6\\u1793 IPv4",
    ipv6: "\\u17A2\\u17B6\\u179F\\u1799\\u178A\\u17D2\\u178B\\u17B6\\u1793 IPv6",
    cidrv4: "\\u178A\\u17C2\\u1793\\u17A2\\u17B6\\u179F\\u1799\\u178A\\u17D2\\u178B\\u17B6\\u1793 IPv4",
    cidrv6: "\\u178A\\u17C2\\u1793\\u17A2\\u17B6\\u179F\\u1799\\u178A\\u17D2\\u178B\\u17B6\\u1793 IPv6",
    base64: "\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u17A2\\u17CA\\u17B7\\u1780\\u17BC\\u178A base64",
    base64url: "\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u17A2\\u17CA\\u17B7\\u1780\\u17BC\\u178A base64url",
    json_string: "\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A JSON",
    e164: "\\u179B\\u17C1\\u1781 E.164",
    jwt: "JWT",
    template_literal: "\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1794\\u1789\\u17D2\\u1785\\u17BC\\u179B"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1794\\u1789\\u17D2\\u1785\\u17BC\\u179B\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${issue2.expected} \\u1794\\u17C9\\u17BB\\u1793\\u17D2\\u178F\\u17C2\\u1791\\u1791\\u17BD\\u179B\\u1794\\u17B6\\u1793 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1794\\u1789\\u17D2\\u1785\\u17BC\\u179B\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u1787\\u1798\\u17D2\\u179A\\u17BE\\u179F\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1787\\u17B6\\u1798\\u17BD\\u1799\\u1780\\u17D2\\u1793\\u17BB\\u1784\\u1785\\u17C6\\u178E\\u17C4\\u1798 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u1792\\u17C6\\u1796\\u17C1\\u1780\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${issue2.origin ?? "\\u178F\\u1798\\u17D2\\u179B\\u17C3"} \${adj} \${issue2.maximum.toString()} \${sizing.unit ?? "\\u1792\\u17B6\\u178F\\u17BB"}\`;
        return \`\\u1792\\u17C6\\u1796\\u17C1\\u1780\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${issue2.origin ?? "\\u178F\\u1798\\u17D2\\u179B\\u17C3"} \${adj} \${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u178F\\u17BC\\u1785\\u1796\\u17C1\\u1780\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${issue2.origin} \${adj} \${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u178F\\u17BC\\u1785\\u1796\\u17C1\\u1780\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1780\\u17B6\\u179A \${issue2.origin} \${adj} \${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1785\\u17B6\\u1794\\u17CB\\u1795\\u17D2\\u178F\\u17BE\\u1798\\u178A\\u17C4\\u1799 "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1794\\u1789\\u17D2\\u1785\\u1794\\u17CB\\u178A\\u17C4\\u1799 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1798\\u17B6\\u1793 "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u1781\\u17D2\\u179F\\u17C2\\u17A2\\u1780\\u17D2\\u179F\\u179A\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u178F\\u17C2\\u1795\\u17D2\\u1782\\u17BC\\u1795\\u17D2\\u1782\\u1784\\u1793\\u17B9\\u1784\\u1791\\u1798\\u17D2\\u179A\\u1784\\u17CB\\u178A\\u17C2\\u179B\\u1794\\u17B6\\u1793\\u1780\\u17C6\\u178E\\u178F\\u17CB \${_issue.pattern}\`;
        return \`\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u179B\\u17C1\\u1781\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u17D6 \\u178F\\u17D2\\u179A\\u17BC\\u179C\\u178F\\u17C2\\u1787\\u17B6\\u1796\\u17A0\\u17BB\\u1782\\u17BB\\u178E\\u1793\\u17C3 \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u179A\\u1780\\u1783\\u17BE\\u1789\\u179F\\u17C4\\u1798\\u17B7\\u1793\\u179F\\u17D2\\u1782\\u17B6\\u179B\\u17CB\\u17D6 \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u179F\\u17C4\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1793\\u17C5\\u1780\\u17D2\\u1793\\u17BB\\u1784 \${issue2.origin}\`;
      case "invalid_union":
        return \`\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\`;
      case "invalid_element":
        return \`\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\\u1793\\u17C5\\u1780\\u17D2\\u1793\\u17BB\\u1784 \${issue2.origin}\`;
      default:
        return \`\\u1791\\u17B7\\u1793\\u17D2\\u1793\\u1793\\u17D0\\u1799\\u1798\\u17B7\\u1793\\u178F\\u17D2\\u179A\\u17B9\\u1798\\u178F\\u17D2\\u179A\\u17BC\\u179C\`;
    }
  };
};
function kh_default() {
  return {
    localeError: error19()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ko.js
var error20 = () => {
  const Sizable = {
    string: { unit: "\\uBB38\\uC790", verb: "to have" },
    file: { unit: "\\uBC14\\uC774\\uD2B8", verb: "to have" },
    array: { unit: "\\uAC1C", verb: "to have" },
    set: { unit: "\\uAC1C", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\uC785\\uB825",
    email: "\\uC774\\uBA54\\uC77C \\uC8FC\\uC18C",
    url: "URL",
    emoji: "\\uC774\\uBAA8\\uC9C0",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\uB0A0\\uC9DC\\uC2DC\\uAC04",
    date: "ISO \\uB0A0\\uC9DC",
    time: "ISO \\uC2DC\\uAC04",
    duration: "ISO \\uAE30\\uAC04",
    ipv4: "IPv4 \\uC8FC\\uC18C",
    ipv6: "IPv6 \\uC8FC\\uC18C",
    cidrv4: "IPv4 \\uBC94\\uC704",
    cidrv6: "IPv6 \\uBC94\\uC704",
    base64: "base64 \\uC778\\uCF54\\uB529 \\uBB38\\uC790\\uC5F4",
    base64url: "base64url \\uC778\\uCF54\\uB529 \\uBB38\\uC790\\uC5F4",
    json_string: "JSON \\uBB38\\uC790\\uC5F4",
    e164: "E.164 \\uBC88\\uD638",
    jwt: "JWT",
    template_literal: "\\uC785\\uB825"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\uC798\\uBABB\\uB41C \\uC785\\uB825: \\uC608\\uC0C1 \\uD0C0\\uC785\\uC740 \${issue2.expected}, \\uBC1B\\uC740 \\uD0C0\\uC785\\uC740 \${parsedType4(issue2.input)}\\uC785\\uB2C8\\uB2E4\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\uC798\\uBABB\\uB41C \\uC785\\uB825: \\uAC12\\uC740 \${stringifyPrimitive(issue2.values[0])} \\uC774\\uC5B4\\uC57C \\uD569\\uB2C8\\uB2E4\`;
        return \`\\uC798\\uBABB\\uB41C \\uC635\\uC158: \${joinValues(issue2.values, "\\uB610\\uB294 ")} \\uC911 \\uD558\\uB098\\uC5EC\\uC57C \\uD569\\uB2C8\\uB2E4\`;
      case "too_big": {
        const adj = issue2.inclusive ? "\\uC774\\uD558" : "\\uBBF8\\uB9CC";
        const suffix = adj === "\\uBBF8\\uB9CC" ? "\\uC774\\uC5B4\\uC57C \\uD569\\uB2C8\\uB2E4" : "\\uC5EC\\uC57C \\uD569\\uB2C8\\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\\uC694\\uC18C";
        if (sizing)
          return \`\${issue2.origin ?? "\\uAC12"}\\uC774 \\uB108\\uBB34 \\uD07D\\uB2C8\\uB2E4: \${issue2.maximum.toString()}\${unit} \${adj}\${suffix}\`;
        return \`\${issue2.origin ?? "\\uAC12"}\\uC774 \\uB108\\uBB34 \\uD07D\\uB2C8\\uB2E4: \${issue2.maximum.toString()} \${adj}\${suffix}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\\uC774\\uC0C1" : "\\uCD08\\uACFC";
        const suffix = adj === "\\uC774\\uC0C1" ? "\\uC774\\uC5B4\\uC57C \\uD569\\uB2C8\\uB2E4" : "\\uC5EC\\uC57C \\uD569\\uB2C8\\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\\uC694\\uC18C";
        if (sizing) {
          return \`\${issue2.origin ?? "\\uAC12"}\\uC774 \\uB108\\uBB34 \\uC791\\uC2B5\\uB2C8\\uB2E4: \${issue2.minimum.toString()}\${unit} \${adj}\${suffix}\`;
        }
        return \`\${issue2.origin ?? "\\uAC12"}\\uC774 \\uB108\\uBB34 \\uC791\\uC2B5\\uB2C8\\uB2E4: \${issue2.minimum.toString()} \${adj}\${suffix}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\uC798\\uBABB\\uB41C \\uBB38\\uC790\\uC5F4: "\${_issue.prefix}"(\\uC73C)\\uB85C \\uC2DC\\uC791\\uD574\\uC57C \\uD569\\uB2C8\\uB2E4\`;
        }
        if (_issue.format === "ends_with")
          return \`\\uC798\\uBABB\\uB41C \\uBB38\\uC790\\uC5F4: "\${_issue.suffix}"(\\uC73C)\\uB85C \\uB05D\\uB098\\uC57C \\uD569\\uB2C8\\uB2E4\`;
        if (_issue.format === "includes")
          return \`\\uC798\\uBABB\\uB41C \\uBB38\\uC790\\uC5F4: "\${_issue.includes}"\\uC744(\\uB97C) \\uD3EC\\uD568\\uD574\\uC57C \\uD569\\uB2C8\\uB2E4\`;
        if (_issue.format === "regex")
          return \`\\uC798\\uBABB\\uB41C \\uBB38\\uC790\\uC5F4: \\uC815\\uADDC\\uC2DD \${_issue.pattern} \\uD328\\uD134\\uACFC \\uC77C\\uCE58\\uD574\\uC57C \\uD569\\uB2C8\\uB2E4\`;
        return \`\\uC798\\uBABB\\uB41C \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\uC798\\uBABB\\uB41C \\uC22B\\uC790: \${issue2.divisor}\\uC758 \\uBC30\\uC218\\uC5EC\\uC57C \\uD569\\uB2C8\\uB2E4\`;
      case "unrecognized_keys":
        return \`\\uC778\\uC2DD\\uD560 \\uC218 \\uC5C6\\uB294 \\uD0A4: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\uC798\\uBABB\\uB41C \\uD0A4: \${issue2.origin}\`;
      case "invalid_union":
        return \`\\uC798\\uBABB\\uB41C \\uC785\\uB825\`;
      case "invalid_element":
        return \`\\uC798\\uBABB\\uB41C \\uAC12: \${issue2.origin}\`;
      default:
        return \`\\uC798\\uBABB\\uB41C \\uC785\\uB825\`;
    }
  };
};
function ko_default() {
  return {
    localeError: error20()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/mk.js
var error21 = () => {
  const Sizable = {
    string: { unit: "\\u0437\\u043D\\u0430\\u0446\\u0438", verb: "\\u0434\\u0430 \\u0438\\u043C\\u0430\\u0430\\u0442" },
    file: { unit: "\\u0431\\u0430\\u0458\\u0442\\u0438", verb: "\\u0434\\u0430 \\u0438\\u043C\\u0430\\u0430\\u0442" },
    array: { unit: "\\u0441\\u0442\\u0430\\u0432\\u043A\\u0438", verb: "\\u0434\\u0430 \\u0438\\u043C\\u0430\\u0430\\u0442" },
    set: { unit: "\\u0441\\u0442\\u0430\\u0432\\u043A\\u0438", verb: "\\u0434\\u0430 \\u0438\\u043C\\u0430\\u0430\\u0442" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0431\\u0440\\u043E\\u0458";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u043D\\u0438\\u0437\\u0430";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0432\\u043D\\u0435\\u0441",
    email: "\\u0430\\u0434\\u0440\\u0435\\u0441\\u0430 \\u043D\\u0430 \\u0435-\\u043F\\u043E\\u0448\\u0442\\u0430",
    url: "URL",
    emoji: "\\u0435\\u043C\\u043E\\u045F\\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\u0434\\u0430\\u0442\\u0443\\u043C \\u0438 \\u0432\\u0440\\u0435\\u043C\\u0435",
    date: "ISO \\u0434\\u0430\\u0442\\u0443\\u043C",
    time: "ISO \\u0432\\u0440\\u0435\\u043C\\u0435",
    duration: "ISO \\u0432\\u0440\\u0435\\u043C\\u0435\\u0442\\u0440\\u0430\\u0435\\u045A\\u0435",
    ipv4: "IPv4 \\u0430\\u0434\\u0440\\u0435\\u0441\\u0430",
    ipv6: "IPv6 \\u0430\\u0434\\u0440\\u0435\\u0441\\u0430",
    cidrv4: "IPv4 \\u043E\\u043F\\u0441\\u0435\\u0433",
    cidrv6: "IPv6 \\u043E\\u043F\\u0441\\u0435\\u0433",
    base64: "base64-\\u0435\\u043D\\u043A\\u043E\\u0434\\u0438\\u0440\\u0430\\u043D\\u0430 \\u043D\\u0438\\u0437\\u0430",
    base64url: "base64url-\\u0435\\u043D\\u043A\\u043E\\u0434\\u0438\\u0440\\u0430\\u043D\\u0430 \\u043D\\u0438\\u0437\\u0430",
    json_string: "JSON \\u043D\\u0438\\u0437\\u0430",
    e164: "E.164 \\u0431\\u0440\\u043E\\u0458",
    jwt: "JWT",
    template_literal: "\\u0432\\u043D\\u0435\\u0441"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0413\\u0440\\u0435\\u0448\\u0435\\u043D \\u0432\\u043D\\u0435\\u0441: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \${issue2.expected}, \\u043F\\u0440\\u0438\\u043C\\u0435\\u043D\\u043E \${parsedType4(issue2.input)}\`;
      // return \`Invalid input: expected \${issue.expected}, received \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Invalid input: expected \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u0413\\u0440\\u0435\\u0448\\u0430\\u043D\\u0430 \\u043E\\u043F\\u0446\\u0438\\u0458\\u0430: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \\u0435\\u0434\\u043D\\u0430 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u041F\\u0440\\u0435\\u043C\\u043D\\u043E\\u0433\\u0443 \\u0433\\u043E\\u043B\\u0435\\u043C: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \${issue2.origin ?? "\\u0432\\u0440\\u0435\\u0434\\u043D\\u043E\\u0441\\u0442\\u0430"} \\u0434\\u0430 \\u0438\\u043C\\u0430 \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0435\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0438"}\`;
        return \`\\u041F\\u0440\\u0435\\u043C\\u043D\\u043E\\u0433\\u0443 \\u0433\\u043E\\u043B\\u0435\\u043C: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \${issue2.origin ?? "\\u0432\\u0440\\u0435\\u0434\\u043D\\u043E\\u0441\\u0442\\u0430"} \\u0434\\u0430 \\u0431\\u0438\\u0434\\u0435 \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u041F\\u0440\\u0435\\u043C\\u043D\\u043E\\u0433\\u0443 \\u043C\\u0430\\u043B: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \${issue2.origin} \\u0434\\u0430 \\u0438\\u043C\\u0430 \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u041F\\u0440\\u0435\\u043C\\u043D\\u043E\\u0433\\u0443 \\u043C\\u0430\\u043B: \\u0441\\u0435 \\u043E\\u0447\\u0435\\u043A\\u0443\\u0432\\u0430 \${issue2.origin} \\u0434\\u0430 \\u0431\\u0438\\u0434\\u0435 \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u041D\\u0435\\u0432\\u0430\\u0436\\u0435\\u0447\\u043A\\u0430 \\u043D\\u0438\\u0437\\u0430: \\u043C\\u043E\\u0440\\u0430 \\u0434\\u0430 \\u0437\\u0430\\u043F\\u043E\\u0447\\u043D\\u0443\\u0432\\u0430 \\u0441\\u043E "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`\\u041D\\u0435\\u0432\\u0430\\u0436\\u0435\\u0447\\u043A\\u0430 \\u043D\\u0438\\u0437\\u0430: \\u043C\\u043E\\u0440\\u0430 \\u0434\\u0430 \\u0437\\u0430\\u0432\\u0440\\u0448\\u0443\\u0432\\u0430 \\u0441\\u043E "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u041D\\u0435\\u0432\\u0430\\u0436\\u0435\\u0447\\u043A\\u0430 \\u043D\\u0438\\u0437\\u0430: \\u043C\\u043E\\u0440\\u0430 \\u0434\\u0430 \\u0432\\u043A\\u043B\\u0443\\u0447\\u0443\\u0432\\u0430 "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u041D\\u0435\\u0432\\u0430\\u0436\\u0435\\u0447\\u043A\\u0430 \\u043D\\u0438\\u0437\\u0430: \\u043C\\u043E\\u0440\\u0430 \\u0434\\u0430 \\u043E\\u0434\\u0433\\u043E\\u0430\\u0440\\u0430 \\u043D\\u0430 \\u043F\\u0430\\u0442\\u0435\\u0440\\u043D\\u043E\\u0442 \${_issue.pattern}\`;
        return \`Invalid \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u0413\\u0440\\u0435\\u0448\\u0435\\u043D \\u0431\\u0440\\u043E\\u0458: \\u043C\\u043E\\u0440\\u0430 \\u0434\\u0430 \\u0431\\u0438\\u0434\\u0435 \\u0434\\u0435\\u043B\\u0438\\u0432 \\u0441\\u043E \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\${issue2.keys.length > 1 ? "\\u041D\\u0435\\u043F\\u0440\\u0435\\u043F\\u043E\\u0437\\u043D\\u0430\\u0435\\u043D\\u0438 \\u043A\\u043B\\u0443\\u0447\\u0435\\u0432\\u0438" : "\\u041D\\u0435\\u043F\\u0440\\u0435\\u043F\\u043E\\u0437\\u043D\\u0430\\u0435\\u043D \\u043A\\u043B\\u0443\\u0447"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u0413\\u0440\\u0435\\u0448\\u0435\\u043D \\u043A\\u043B\\u0443\\u0447 \\u0432\\u043E \${issue2.origin}\`;
      case "invalid_union":
        return "\\u0413\\u0440\\u0435\\u0448\\u0435\\u043D \\u0432\\u043D\\u0435\\u0441";
      case "invalid_element":
        return \`\\u0413\\u0440\\u0435\\u0448\\u043D\\u0430 \\u0432\\u0440\\u0435\\u0434\\u043D\\u043E\\u0441\\u0442 \\u0432\\u043E \${issue2.origin}\`;
      default:
        return \`\\u0413\\u0440\\u0435\\u0448\\u0435\\u043D \\u0432\\u043D\\u0435\\u0441\`;
    }
  };
};
function mk_default() {
  return {
    localeError: error21()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ms.js
var error22 = () => {
  const Sizable = {
    string: { unit: "aksara", verb: "mempunyai" },
    file: { unit: "bait", verb: "mempunyai" },
    array: { unit: "elemen", verb: "mempunyai" },
    set: { unit: "elemen", verb: "mempunyai" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "nombor";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "input",
    email: "alamat e-mel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tarikh masa ISO",
    date: "tarikh ISO",
    time: "masa ISO",
    duration: "tempoh ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    cidrv4: "julat IPv4",
    cidrv6: "julat IPv6",
    base64: "string dikodkan base64",
    base64url: "string dikodkan base64url",
    json_string: "string JSON",
    e164: "nombor E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Input tidak sah: dijangka \${issue2.expected}, diterima \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Input tidak sah: dijangka \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Pilihan tidak sah: dijangka salah satu daripada \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Terlalu besar: dijangka \${issue2.origin ?? "nilai"} \${sizing.verb} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elemen"}\`;
        return \`Terlalu besar: dijangka \${issue2.origin ?? "nilai"} adalah \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Terlalu kecil: dijangka \${issue2.origin} \${sizing.verb} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Terlalu kecil: dijangka \${issue2.origin} adalah \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`String tidak sah: mesti bermula dengan "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`String tidak sah: mesti berakhir dengan "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`String tidak sah: mesti mengandungi "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`String tidak sah: mesti sepadan dengan corak \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} tidak sah\`;
      }
      case "not_multiple_of":
        return \`Nombor tidak sah: perlu gandaan \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Kunci tidak dikenali: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Kunci tidak sah dalam \${issue2.origin}\`;
      case "invalid_union":
        return "Input tidak sah";
      case "invalid_element":
        return \`Nilai tidak sah dalam \${issue2.origin}\`;
      default:
        return \`Input tidak sah\`;
    }
  };
};
function ms_default() {
  return {
    localeError: error22()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/nl.js
var error23 = () => {
  const Sizable = {
    string: { unit: "tekens" },
    file: { unit: "bytes" },
    array: { unit: "elementen" },
    set: { unit: "elementen" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "getal";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "invoer",
    email: "emailadres",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum en tijd",
    date: "ISO datum",
    time: "ISO tijd",
    duration: "ISO duur",
    ipv4: "IPv4-adres",
    ipv6: "IPv6-adres",
    cidrv4: "IPv4-bereik",
    cidrv6: "IPv6-bereik",
    base64: "base64-gecodeerde tekst",
    base64url: "base64 URL-gecodeerde tekst",
    json_string: "JSON string",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "invoer"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Ongeldige invoer: verwacht \${issue2.expected}, ontving \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Ongeldige invoer: verwacht \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Ongeldige optie: verwacht \\xE9\\xE9n van \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Te lang: verwacht dat \${issue2.origin ?? "waarde"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementen"} bevat\`;
        return \`Te lang: verwacht dat \${issue2.origin ?? "waarde"} \${adj}\${issue2.maximum.toString()} is\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Te kort: verwacht dat \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit} bevat\`;
        }
        return \`Te kort: verwacht dat \${issue2.origin} \${adj}\${issue2.minimum.toString()} is\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Ongeldige tekst: moet met "\${_issue.prefix}" beginnen\`;
        }
        if (_issue.format === "ends_with")
          return \`Ongeldige tekst: moet op "\${_issue.suffix}" eindigen\`;
        if (_issue.format === "includes")
          return \`Ongeldige tekst: moet "\${_issue.includes}" bevatten\`;
        if (_issue.format === "regex")
          return \`Ongeldige tekst: moet overeenkomen met patroon \${_issue.pattern}\`;
        return \`Ongeldig: \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Ongeldig getal: moet een veelvoud van \${issue2.divisor} zijn\`;
      case "unrecognized_keys":
        return \`Onbekende key\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Ongeldige key in \${issue2.origin}\`;
      case "invalid_union":
        return "Ongeldige invoer";
      case "invalid_element":
        return \`Ongeldige waarde in \${issue2.origin}\`;
      default:
        return \`Ongeldige invoer\`;
    }
  };
};
function nl_default() {
  return {
    localeError: error23()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/no.js
var error24 = () => {
  const Sizable = {
    string: { unit: "tegn", verb: "\\xE5 ha" },
    file: { unit: "bytes", verb: "\\xE5 ha" },
    array: { unit: "elementer", verb: "\\xE5 inneholde" },
    set: { unit: "elementer", verb: "\\xE5 inneholde" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "tall";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "liste";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "input",
    email: "e-postadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkeslett",
    date: "ISO-dato",
    time: "ISO-klokkeslett",
    duration: "ISO-varighet",
    ipv4: "IPv4-omr\\xE5de",
    ipv6: "IPv6-omr\\xE5de",
    cidrv4: "IPv4-spekter",
    cidrv6: "IPv6-spekter",
    base64: "base64-enkodet streng",
    base64url: "base64url-enkodet streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Ugyldig input: forventet \${issue2.expected}, fikk \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Ugyldig verdi: forventet \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Ugyldig valg: forventet en av \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`For stor(t): forventet \${issue2.origin ?? "value"} til \\xE5 ha \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementer"}\`;
        return \`For stor(t): forventet \${issue2.origin ?? "value"} til \\xE5 ha \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`For lite(n): forventet \${issue2.origin} til \\xE5 ha \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`For lite(n): forventet \${issue2.origin} til \\xE5 ha \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Ugyldig streng: m\\xE5 starte med "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Ugyldig streng: m\\xE5 ende med "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Ugyldig streng: m\\xE5 inneholde "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Ugyldig streng: m\\xE5 matche m\\xF8nsteret \${_issue.pattern}\`;
        return \`Ugyldig \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Ugyldig tall: m\\xE5 v\\xE6re et multiplum av \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\${issue2.keys.length > 1 ? "Ukjente n\\xF8kler" : "Ukjent n\\xF8kkel"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Ugyldig n\\xF8kkel i \${issue2.origin}\`;
      case "invalid_union":
        return "Ugyldig input";
      case "invalid_element":
        return \`Ugyldig verdi i \${issue2.origin}\`;
      default:
        return \`Ugyldig input\`;
    }
  };
};
function no_default() {
  return {
    localeError: error24()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ota.js
var error25 = () => {
  const Sizable = {
    string: { unit: "harf", verb: "olmal\\u0131d\\u0131r" },
    file: { unit: "bayt", verb: "olmal\\u0131d\\u0131r" },
    array: { unit: "unsur", verb: "olmal\\u0131d\\u0131r" },
    set: { unit: "unsur", verb: "olmal\\u0131d\\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "numara";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "saf";
        }
        if (data === null) {
          return "gayb";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "giren",
    email: "epostag\\xE2h",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO heng\\xE2m\\u0131",
    date: "ISO tarihi",
    time: "ISO zaman\\u0131",
    duration: "ISO m\\xFCddeti",
    ipv4: "IPv4 ni\\u015F\\xE2n\\u0131",
    ipv6: "IPv6 ni\\u015F\\xE2n\\u0131",
    cidrv4: "IPv4 menzili",
    cidrv6: "IPv6 menzili",
    base64: "base64-\\u015Fifreli metin",
    base64url: "base64url-\\u015Fifreli metin",
    json_string: "JSON metin",
    e164: "E.164 say\\u0131s\\u0131",
    jwt: "JWT",
    template_literal: "giren"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`F\\xE2sit giren: umulan \${issue2.expected}, al\\u0131nan \${parsedType4(issue2.input)}\`;
      // return \`Fâsit giren: umulan \${issue.expected}, alınan \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`F\\xE2sit giren: umulan \${stringifyPrimitive(issue2.values[0])}\`;
        return \`F\\xE2sit tercih: m\\xFBteberler \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Fazla b\\xFCy\\xFCk: \${issue2.origin ?? "value"}, \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elements"} sahip olmal\\u0131yd\\u0131.\`;
        return \`Fazla b\\xFCy\\xFCk: \${issue2.origin ?? "value"}, \${adj}\${issue2.maximum.toString()} olmal\\u0131yd\\u0131.\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Fazla k\\xFC\\xE7\\xFCk: \${issue2.origin}, \${adj}\${issue2.minimum.toString()} \${sizing.unit} sahip olmal\\u0131yd\\u0131.\`;
        }
        return \`Fazla k\\xFC\\xE7\\xFCk: \${issue2.origin}, \${adj}\${issue2.minimum.toString()} olmal\\u0131yd\\u0131.\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`F\\xE2sit metin: "\${_issue.prefix}" ile ba\\u015Flamal\\u0131.\`;
        if (_issue.format === "ends_with")
          return \`F\\xE2sit metin: "\${_issue.suffix}" ile bitmeli.\`;
        if (_issue.format === "includes")
          return \`F\\xE2sit metin: "\${_issue.includes}" ihtiv\\xE2 etmeli.\`;
        if (_issue.format === "regex")
          return \`F\\xE2sit metin: \${_issue.pattern} nak\\u015F\\u0131na uymal\\u0131.\`;
        return \`F\\xE2sit \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`F\\xE2sit say\\u0131: \${issue2.divisor} kat\\u0131 olmal\\u0131yd\\u0131.\`;
      case "unrecognized_keys":
        return \`Tan\\u0131nmayan anahtar \${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} i\\xE7in tan\\u0131nmayan anahtar var.\`;
      case "invalid_union":
        return "Giren tan\\u0131namad\\u0131.";
      case "invalid_element":
        return \`\${issue2.origin} i\\xE7in tan\\u0131nmayan k\\u0131ymet var.\`;
      default:
        return \`K\\u0131ymet tan\\u0131namad\\u0131.\`;
    }
  };
};
function ota_default() {
  return {
    localeError: error25()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ps.js
var error26 = () => {
  const Sizable = {
    string: { unit: "\\u062A\\u0648\\u06A9\\u064A", verb: "\\u0648\\u0644\\u0631\\u064A" },
    file: { unit: "\\u0628\\u0627\\u06CC\\u067C\\u0633", verb: "\\u0648\\u0644\\u0631\\u064A" },
    array: { unit: "\\u062A\\u0648\\u06A9\\u064A", verb: "\\u0648\\u0644\\u0631\\u064A" },
    set: { unit: "\\u062A\\u0648\\u06A9\\u064A", verb: "\\u0648\\u0644\\u0631\\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0639\\u062F\\u062F";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u0627\\u0631\\u06D0";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0648\\u0631\\u0648\\u062F\\u064A",
    email: "\\u0628\\u0631\\u06CC\\u069A\\u0646\\u0627\\u0644\\u06CC\\u06A9",
    url: "\\u06CC\\u0648 \\u0622\\u0631 \\u0627\\u0644",
    emoji: "\\u0627\\u06CC\\u0645\\u0648\\u062C\\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u0646\\u06CC\\u067C\\u0647 \\u0627\\u0648 \\u0648\\u062E\\u062A",
    date: "\\u0646\\u06D0\\u067C\\u0647",
    time: "\\u0648\\u062E\\u062A",
    duration: "\\u0645\\u0648\\u062F\\u0647",
    ipv4: "\\u062F IPv4 \\u067E\\u062A\\u0647",
    ipv6: "\\u062F IPv6 \\u067E\\u062A\\u0647",
    cidrv4: "\\u062F IPv4 \\u0633\\u0627\\u062D\\u0647",
    cidrv6: "\\u062F IPv6 \\u0633\\u0627\\u062D\\u0647",
    base64: "base64-encoded \\u0645\\u062A\\u0646",
    base64url: "base64url-encoded \\u0645\\u062A\\u0646",
    json_string: "JSON \\u0645\\u062A\\u0646",
    e164: "\\u062F E.164 \\u0634\\u0645\\u06D0\\u0631\\u0647",
    jwt: "JWT",
    template_literal: "\\u0648\\u0631\\u0648\\u062F\\u064A"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0646\\u0627\\u0633\\u0645 \\u0648\\u0631\\u0648\\u062F\\u064A: \\u0628\\u0627\\u06CC\\u062F \${issue2.expected} \\u0648\\u0627\\u06CC, \\u0645\\u06AB\\u0631 \${parsedType4(issue2.input)} \\u062A\\u0631\\u0644\\u0627\\u0633\\u0647 \\u0634\\u0648\`;
      case "invalid_value":
        if (issue2.values.length === 1) {
          return \`\\u0646\\u0627\\u0633\\u0645 \\u0648\\u0631\\u0648\\u062F\\u064A: \\u0628\\u0627\\u06CC\\u062F \${stringifyPrimitive(issue2.values[0])} \\u0648\\u0627\\u06CC\`;
        }
        return \`\\u0646\\u0627\\u0633\\u0645 \\u0627\\u0646\\u062A\\u062E\\u0627\\u0628: \\u0628\\u0627\\u06CC\\u062F \\u06CC\\u0648 \\u0644\\u0647 \${joinValues(issue2.values, "|")} \\u0685\\u062E\\u0647 \\u0648\\u0627\\u06CC\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0689\\u06CC\\u0631 \\u0644\\u0648\\u06CC: \${issue2.origin ?? "\\u0627\\u0631\\u0632\\u069A\\u062A"} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0639\\u0646\\u0635\\u0631\\u0648\\u0646\\u0647"} \\u0648\\u0644\\u0631\\u064A\`;
        }
        return \`\\u0689\\u06CC\\u0631 \\u0644\\u0648\\u06CC: \${issue2.origin ?? "\\u0627\\u0631\\u0632\\u069A\\u062A"} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.maximum.toString()} \\u0648\\u064A\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0689\\u06CC\\u0631 \\u06A9\\u0648\\u0686\\u0646\\u06CC: \${issue2.origin} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.minimum.toString()} \${sizing.unit} \\u0648\\u0644\\u0631\\u064A\`;
        }
        return \`\\u0689\\u06CC\\u0631 \\u06A9\\u0648\\u0686\\u0646\\u06CC: \${issue2.origin} \\u0628\\u0627\\u06CC\\u062F \${adj}\${issue2.minimum.toString()} \\u0648\\u064A\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u0646\\u0627\\u0633\\u0645 \\u0645\\u062A\\u0646: \\u0628\\u0627\\u06CC\\u062F \\u062F "\${_issue.prefix}" \\u0633\\u0631\\u0647 \\u067E\\u06CC\\u0644 \\u0634\\u064A\`;
        }
        if (_issue.format === "ends_with") {
          return \`\\u0646\\u0627\\u0633\\u0645 \\u0645\\u062A\\u0646: \\u0628\\u0627\\u06CC\\u062F \\u062F "\${_issue.suffix}" \\u0633\\u0631\\u0647 \\u067E\\u0627\\u06CC \\u062A\\u0647 \\u0648\\u0631\\u0633\\u064A\\u0696\\u064A\`;
        }
        if (_issue.format === "includes") {
          return \`\\u0646\\u0627\\u0633\\u0645 \\u0645\\u062A\\u0646: \\u0628\\u0627\\u06CC\\u062F "\${_issue.includes}" \\u0648\\u0644\\u0631\\u064A\`;
        }
        if (_issue.format === "regex") {
          return \`\\u0646\\u0627\\u0633\\u0645 \\u0645\\u062A\\u0646: \\u0628\\u0627\\u06CC\\u062F \\u062F \${_issue.pattern} \\u0633\\u0631\\u0647 \\u0645\\u0637\\u0627\\u0628\\u0642\\u062A \\u0648\\u0644\\u0631\\u064A\`;
        }
        return \`\${Nouns[_issue.format] ?? issue2.format} \\u0646\\u0627\\u0633\\u0645 \\u062F\\u06CC\`;
      }
      case "not_multiple_of":
        return \`\\u0646\\u0627\\u0633\\u0645 \\u0639\\u062F\\u062F: \\u0628\\u0627\\u06CC\\u062F \\u062F \${issue2.divisor} \\u0645\\u0636\\u0631\\u0628 \\u0648\\u064A\`;
      case "unrecognized_keys":
        return \`\\u0646\\u0627\\u0633\\u0645 \${issue2.keys.length > 1 ? "\\u06A9\\u0644\\u06CC\\u0689\\u0648\\u0646\\u0647" : "\\u06A9\\u0644\\u06CC\\u0689"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u0646\\u0627\\u0633\\u0645 \\u06A9\\u0644\\u06CC\\u0689 \\u067E\\u0647 \${issue2.origin} \\u06A9\\u06D0\`;
      case "invalid_union":
        return \`\\u0646\\u0627\\u0633\\u0645\\u0647 \\u0648\\u0631\\u0648\\u062F\\u064A\`;
      case "invalid_element":
        return \`\\u0646\\u0627\\u0633\\u0645 \\u0639\\u0646\\u0635\\u0631 \\u067E\\u0647 \${issue2.origin} \\u06A9\\u06D0\`;
      default:
        return \`\\u0646\\u0627\\u0633\\u0645\\u0647 \\u0648\\u0631\\u0648\\u062F\\u064A\`;
    }
  };
};
function ps_default() {
  return {
    localeError: error26()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/pl.js
var error27 = () => {
  const Sizable = {
    string: { unit: "znak\\xF3w", verb: "mie\\u0107" },
    file: { unit: "bajt\\xF3w", verb: "mie\\u0107" },
    array: { unit: "element\\xF3w", verb: "mie\\u0107" },
    set: { unit: "element\\xF3w", verb: "mie\\u0107" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "liczba";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "tablica";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "wyra\\u017Cenie",
    email: "adres email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i godzina w formacie ISO",
    date: "data w formacie ISO",
    time: "godzina w formacie ISO",
    duration: "czas trwania ISO",
    ipv4: "adres IPv4",
    ipv6: "adres IPv6",
    cidrv4: "zakres IPv4",
    cidrv6: "zakres IPv6",
    base64: "ci\\u0105g znak\\xF3w zakodowany w formacie base64",
    base64url: "ci\\u0105g znak\\xF3w zakodowany w formacie base64url",
    json_string: "ci\\u0105g znak\\xF3w w formacie JSON",
    e164: "liczba E.164",
    jwt: "JWT",
    template_literal: "wej\\u015Bcie"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Nieprawid\\u0142owe dane wej\\u015Bciowe: oczekiwano \${issue2.expected}, otrzymano \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Nieprawid\\u0142owe dane wej\\u015Bciowe: oczekiwano \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Nieprawid\\u0142owa opcja: oczekiwano jednej z warto\\u015Bci \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Za du\\u017Ca warto\\u015B\\u0107: oczekiwano, \\u017Ce \${issue2.origin ?? "warto\\u015B\\u0107"} b\\u0119dzie mie\\u0107 \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "element\\xF3w"}\`;
        }
        return \`Zbyt du\\u017C(y/a/e): oczekiwano, \\u017Ce \${issue2.origin ?? "warto\\u015B\\u0107"} b\\u0119dzie wynosi\\u0107 \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Za ma\\u0142a warto\\u015B\\u0107: oczekiwano, \\u017Ce \${issue2.origin ?? "warto\\u015B\\u0107"} b\\u0119dzie mie\\u0107 \${adj}\${issue2.minimum.toString()} \${sizing.unit ?? "element\\xF3w"}\`;
        }
        return \`Zbyt ma\\u0142(y/a/e): oczekiwano, \\u017Ce \${issue2.origin ?? "warto\\u015B\\u0107"} b\\u0119dzie wynosi\\u0107 \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Nieprawid\\u0142owy ci\\u0105g znak\\xF3w: musi zaczyna\\u0107 si\\u0119 od "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Nieprawid\\u0142owy ci\\u0105g znak\\xF3w: musi ko\\u0144czy\\u0107 si\\u0119 na "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Nieprawid\\u0142owy ci\\u0105g znak\\xF3w: musi zawiera\\u0107 "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Nieprawid\\u0142owy ci\\u0105g znak\\xF3w: musi odpowiada\\u0107 wzorcowi \${_issue.pattern}\`;
        return \`Nieprawid\\u0142ow(y/a/e) \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Nieprawid\\u0142owa liczba: musi by\\u0107 wielokrotno\\u015Bci\\u0105 \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Nierozpoznane klucze\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Nieprawid\\u0142owy klucz w \${issue2.origin}\`;
      case "invalid_union":
        return "Nieprawid\\u0142owe dane wej\\u015Bciowe";
      case "invalid_element":
        return \`Nieprawid\\u0142owa warto\\u015B\\u0107 w \${issue2.origin}\`;
      default:
        return \`Nieprawid\\u0142owe dane wej\\u015Bciowe\`;
    }
  };
};
function pl_default() {
  return {
    localeError: error27()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/pt.js
var error28 = () => {
  const Sizable = {
    string: { unit: "caracteres", verb: "ter" },
    file: { unit: "bytes", verb: "ter" },
    array: { unit: "itens", verb: "ter" },
    set: { unit: "itens", verb: "ter" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "n\\xFAmero";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "nulo";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "padr\\xE3o",
    email: "endere\\xE7o de e-mail",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data e hora ISO",
    date: "data ISO",
    time: "hora ISO",
    duration: "dura\\xE7\\xE3o ISO",
    ipv4: "endere\\xE7o IPv4",
    ipv6: "endere\\xE7o IPv6",
    cidrv4: "faixa de IPv4",
    cidrv6: "faixa de IPv6",
    base64: "texto codificado em base64",
    base64url: "URL codificada em base64",
    json_string: "texto JSON",
    e164: "n\\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Tipo inv\\xE1lido: esperado \${issue2.expected}, recebido \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Entrada inv\\xE1lida: esperado \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Op\\xE7\\xE3o inv\\xE1lida: esperada uma das \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Muito grande: esperado que \${issue2.origin ?? "valor"} tivesse \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementos"}\`;
        return \`Muito grande: esperado que \${issue2.origin ?? "valor"} fosse \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Muito pequeno: esperado que \${issue2.origin} tivesse \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Muito pequeno: esperado que \${issue2.origin} fosse \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Texto inv\\xE1lido: deve come\\xE7ar com "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Texto inv\\xE1lido: deve terminar com "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Texto inv\\xE1lido: deve incluir "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Texto inv\\xE1lido: deve corresponder ao padr\\xE3o \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} inv\\xE1lido\`;
      }
      case "not_multiple_of":
        return \`N\\xFAmero inv\\xE1lido: deve ser m\\xFAltiplo de \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Chave\${issue2.keys.length > 1 ? "s" : ""} desconhecida\${issue2.keys.length > 1 ? "s" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Chave inv\\xE1lida em \${issue2.origin}\`;
      case "invalid_union":
        return "Entrada inv\\xE1lida";
      case "invalid_element":
        return \`Valor inv\\xE1lido em \${issue2.origin}\`;
      default:
        return \`Campo inv\\xE1lido\`;
    }
  };
};
function pt_default() {
  return {
    localeError: error28()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error29 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\\u0441\\u0438\\u043C\\u0432\\u043E\\u043B",
        few: "\\u0441\\u0438\\u043C\\u0432\\u043E\\u043B\\u0430",
        many: "\\u0441\\u0438\\u043C\\u0432\\u043E\\u043B\\u043E\\u0432"
      },
      verb: "\\u0438\\u043C\\u0435\\u0442\\u044C"
    },
    file: {
      unit: {
        one: "\\u0431\\u0430\\u0439\\u0442",
        few: "\\u0431\\u0430\\u0439\\u0442\\u0430",
        many: "\\u0431\\u0430\\u0439\\u0442"
      },
      verb: "\\u0438\\u043C\\u0435\\u0442\\u044C"
    },
    array: {
      unit: {
        one: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442",
        few: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0430",
        many: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u043E\\u0432"
      },
      verb: "\\u0438\\u043C\\u0435\\u0442\\u044C"
    },
    set: {
      unit: {
        one: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442",
        few: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0430",
        many: "\\u044D\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u043E\\u0432"
      },
      verb: "\\u0438\\u043C\\u0435\\u0442\\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0447\\u0438\\u0441\\u043B\\u043E";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u043C\\u0430\\u0441\\u0441\\u0438\\u0432";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0432\\u0432\\u043E\\u0434",
    email: "email \\u0430\\u0434\\u0440\\u0435\\u0441",
    url: "URL",
    emoji: "\\u044D\\u043C\\u043E\\u0434\\u0437\\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\u0434\\u0430\\u0442\\u0430 \\u0438 \\u0432\\u0440\\u0435\\u043C\\u044F",
    date: "ISO \\u0434\\u0430\\u0442\\u0430",
    time: "ISO \\u0432\\u0440\\u0435\\u043C\\u044F",
    duration: "ISO \\u0434\\u043B\\u0438\\u0442\\u0435\\u043B\\u044C\\u043D\\u043E\\u0441\\u0442\\u044C",
    ipv4: "IPv4 \\u0430\\u0434\\u0440\\u0435\\u0441",
    ipv6: "IPv6 \\u0430\\u0434\\u0440\\u0435\\u0441",
    cidrv4: "IPv4 \\u0434\\u0438\\u0430\\u043F\\u0430\\u0437\\u043E\\u043D",
    cidrv6: "IPv6 \\u0434\\u0438\\u0430\\u043F\\u0430\\u0437\\u043E\\u043D",
    base64: "\\u0441\\u0442\\u0440\\u043E\\u043A\\u0430 \\u0432 \\u0444\\u043E\\u0440\\u043C\\u0430\\u0442\\u0435 base64",
    base64url: "\\u0441\\u0442\\u0440\\u043E\\u043A\\u0430 \\u0432 \\u0444\\u043E\\u0440\\u043C\\u0430\\u0442\\u0435 base64url",
    json_string: "JSON \\u0441\\u0442\\u0440\\u043E\\u043A\\u0430",
    e164: "\\u043D\\u043E\\u043C\\u0435\\u0440 E.164",
    jwt: "JWT",
    template_literal: "\\u0432\\u0432\\u043E\\u0434"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0439 \\u0432\\u0432\\u043E\\u0434: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \${issue2.expected}, \\u043F\\u043E\\u043B\\u0443\\u0447\\u0435\\u043D\\u043E \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0439 \\u0432\\u0432\\u043E\\u0434: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0439 \\u0432\\u0430\\u0440\\u0438\\u0430\\u043D\\u0442: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u043E\\u0434\\u043D\\u043E \\u0438\\u0437 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return \`\\u0421\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u0431\\u043E\\u043B\\u044C\\u0448\\u043E\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C, \\u0447\\u0442\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435"} \\u0431\\u0443\\u0434\\u0435\\u0442 \\u0438\\u043C\\u0435\\u0442\\u044C \${adj}\${issue2.maximum.toString()} \${unit}\`;
        }
        return \`\\u0421\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u0431\\u043E\\u043B\\u044C\\u0448\\u043E\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C, \\u0447\\u0442\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435"} \\u0431\\u0443\\u0434\\u0435\\u0442 \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return \`\\u0421\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u043C\\u0430\\u043B\\u0435\\u043D\\u044C\\u043A\\u043E\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C, \\u0447\\u0442\\u043E \${issue2.origin} \\u0431\\u0443\\u0434\\u0435\\u0442 \\u0438\\u043C\\u0435\\u0442\\u044C \${adj}\${issue2.minimum.toString()} \${unit}\`;
        }
        return \`\\u0421\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u043C\\u0430\\u043B\\u0435\\u043D\\u044C\\u043A\\u043E\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435: \\u043E\\u0436\\u0438\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C, \\u0447\\u0442\\u043E \${issue2.origin} \\u0431\\u0443\\u0434\\u0435\\u0442 \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u0430\\u044F \\u0441\\u0442\\u0440\\u043E\\u043A\\u0430: \\u0434\\u043E\\u043B\\u0436\\u043D\\u0430 \\u043D\\u0430\\u0447\\u0438\\u043D\\u0430\\u0442\\u044C\\u0441\\u044F \\u0441 "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u0430\\u044F \\u0441\\u0442\\u0440\\u043E\\u043A\\u0430: \\u0434\\u043E\\u043B\\u0436\\u043D\\u0430 \\u0437\\u0430\\u043A\\u0430\\u043D\\u0447\\u0438\\u0432\\u0430\\u0442\\u044C\\u0441\\u044F \\u043D\\u0430 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u0430\\u044F \\u0441\\u0442\\u0440\\u043E\\u043A\\u0430: \\u0434\\u043E\\u043B\\u0436\\u043D\\u0430 \\u0441\\u043E\\u0434\\u0435\\u0440\\u0436\\u0430\\u0442\\u044C "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u0430\\u044F \\u0441\\u0442\\u0440\\u043E\\u043A\\u0430: \\u0434\\u043E\\u043B\\u0436\\u043D\\u0430 \\u0441\\u043E\\u043E\\u0442\\u0432\\u0435\\u0442\\u0441\\u0442\\u0432\\u043E\\u0432\\u0430\\u0442\\u044C \\u0448\\u0430\\u0431\\u043B\\u043E\\u043D\\u0443 \${_issue.pattern}\`;
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0439 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u043E\\u0435 \\u0447\\u0438\\u0441\\u043B\\u043E: \\u0434\\u043E\\u043B\\u0436\\u043D\\u043E \\u0431\\u044B\\u0442\\u044C \\u043A\\u0440\\u0430\\u0442\\u043D\\u044B\\u043C \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u041D\\u0435\\u0440\\u0430\\u0441\\u043F\\u043E\\u0437\\u043D\\u0430\\u043D\\u043D\${issue2.keys.length > 1 ? "\\u044B\\u0435" : "\\u044B\\u0439"} \\u043A\\u043B\\u044E\\u0447\${issue2.keys.length > 1 ? "\\u0438" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0439 \\u043A\\u043B\\u044E\\u0447 \\u0432 \${issue2.origin}\`;
      case "invalid_union":
        return "\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0435 \\u0432\\u0445\\u043E\\u0434\\u043D\\u044B\\u0435 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0435";
      case "invalid_element":
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u043E\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u0438\\u0435 \\u0432 \${issue2.origin}\`;
      default:
        return \`\\u041D\\u0435\\u0432\\u0435\\u0440\\u043D\\u044B\\u0435 \\u0432\\u0445\\u043E\\u0434\\u043D\\u044B\\u0435 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0435\`;
    }
  };
};
function ru_default() {
  return {
    localeError: error29()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/sl.js
var error30 = () => {
  const Sizable = {
    string: { unit: "znakov", verb: "imeti" },
    file: { unit: "bajtov", verb: "imeti" },
    array: { unit: "elementov", verb: "imeti" },
    set: { unit: "elementov", verb: "imeti" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0161tevilo";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "tabela";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "vnos",
    email: "e-po\\u0161tni naslov",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum in \\u010Das",
    date: "ISO datum",
    time: "ISO \\u010Das",
    duration: "ISO trajanje",
    ipv4: "IPv4 naslov",
    ipv6: "IPv6 naslov",
    cidrv4: "obseg IPv4",
    cidrv6: "obseg IPv6",
    base64: "base64 kodiran niz",
    base64url: "base64url kodiran niz",
    json_string: "JSON niz",
    e164: "E.164 \\u0161tevilka",
    jwt: "JWT",
    template_literal: "vnos"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Neveljaven vnos: pri\\u010Dakovano \${issue2.expected}, prejeto \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Neveljaven vnos: pri\\u010Dakovano \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Neveljavna mo\\u017Enost: pri\\u010Dakovano eno izmed \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Preveliko: pri\\u010Dakovano, da bo \${issue2.origin ?? "vrednost"} imelo \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "elementov"}\`;
        return \`Preveliko: pri\\u010Dakovano, da bo \${issue2.origin ?? "vrednost"} \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Premajhno: pri\\u010Dakovano, da bo \${issue2.origin} imelo \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Premajhno: pri\\u010Dakovano, da bo \${issue2.origin} \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Neveljaven niz: mora se za\\u010Deti z "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`Neveljaven niz: mora se kon\\u010Dati z "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Neveljaven niz: mora vsebovati "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Neveljaven niz: mora ustrezati vzorcu \${_issue.pattern}\`;
        return \`Neveljaven \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Neveljavno \\u0161tevilo: mora biti ve\\u010Dkratnik \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Neprepoznan\${issue2.keys.length > 1 ? "i klju\\u010Di" : " klju\\u010D"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Neveljaven klju\\u010D v \${issue2.origin}\`;
      case "invalid_union":
        return "Neveljaven vnos";
      case "invalid_element":
        return \`Neveljavna vrednost v \${issue2.origin}\`;
      default:
        return "Neveljaven vnos";
    }
  };
};
function sl_default() {
  return {
    localeError: error30()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/sv.js
var error31 = () => {
  const Sizable = {
    string: { unit: "tecken", verb: "att ha" },
    file: { unit: "bytes", verb: "att ha" },
    array: { unit: "objekt", verb: "att inneh\\xE5lla" },
    set: { unit: "objekt", verb: "att inneh\\xE5lla" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "antal";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "lista";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "regulj\\xE4rt uttryck",
    email: "e-postadress",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datum och tid",
    date: "ISO-datum",
    time: "ISO-tid",
    duration: "ISO-varaktighet",
    ipv4: "IPv4-intervall",
    ipv6: "IPv6-intervall",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    base64: "base64-kodad str\\xE4ng",
    base64url: "base64url-kodad str\\xE4ng",
    json_string: "JSON-str\\xE4ng",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "mall-literal"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Ogiltig inmatning: f\\xF6rv\\xE4ntat \${issue2.expected}, fick \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Ogiltig inmatning: f\\xF6rv\\xE4ntat \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Ogiltigt val: f\\xF6rv\\xE4ntade en av \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`F\\xF6r stor(t): f\\xF6rv\\xE4ntade \${issue2.origin ?? "v\\xE4rdet"} att ha \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "element"}\`;
        }
        return \`F\\xF6r stor(t): f\\xF6rv\\xE4ntat \${issue2.origin ?? "v\\xE4rdet"} att ha \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`F\\xF6r lite(t): f\\xF6rv\\xE4ntade \${issue2.origin ?? "v\\xE4rdet"} att ha \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`F\\xF6r lite(t): f\\xF6rv\\xE4ntade \${issue2.origin ?? "v\\xE4rdet"} att ha \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`Ogiltig str\\xE4ng: m\\xE5ste b\\xF6rja med "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`Ogiltig str\\xE4ng: m\\xE5ste sluta med "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Ogiltig str\\xE4ng: m\\xE5ste inneh\\xE5lla "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Ogiltig str\\xE4ng: m\\xE5ste matcha m\\xF6nstret "\${_issue.pattern}"\`;
        return \`Ogiltig(t) \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Ogiltigt tal: m\\xE5ste vara en multipel av \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\${issue2.keys.length > 1 ? "Ok\\xE4nda nycklar" : "Ok\\xE4nd nyckel"}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Ogiltig nyckel i \${issue2.origin ?? "v\\xE4rdet"}\`;
      case "invalid_union":
        return "Ogiltig input";
      case "invalid_element":
        return \`Ogiltigt v\\xE4rde i \${issue2.origin ?? "v\\xE4rdet"}\`;
      default:
        return \`Ogiltig input\`;
    }
  };
};
function sv_default() {
  return {
    localeError: error31()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ta.js
var error32 = () => {
  const Sizable = {
    string: { unit: "\\u0B8E\\u0BB4\\u0BC1\\u0BA4\\u0BCD\\u0BA4\\u0BC1\\u0B95\\u0BCD\\u0B95\\u0BB3\\u0BCD", verb: "\\u0B95\\u0BCA\\u0BA3\\u0BCD\\u0B9F\\u0BBF\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD" },
    file: { unit: "\\u0BAA\\u0BC8\\u0B9F\\u0BCD\\u0B9F\\u0BC1\\u0B95\\u0BB3\\u0BCD", verb: "\\u0B95\\u0BCA\\u0BA3\\u0BCD\\u0B9F\\u0BBF\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD" },
    array: { unit: "\\u0B89\\u0BB1\\u0BC1\\u0BAA\\u0BCD\\u0BAA\\u0BC1\\u0B95\\u0BB3\\u0BCD", verb: "\\u0B95\\u0BCA\\u0BA3\\u0BCD\\u0B9F\\u0BBF\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD" },
    set: { unit: "\\u0B89\\u0BB1\\u0BC1\\u0BAA\\u0BCD\\u0BAA\\u0BC1\\u0B95\\u0BB3\\u0BCD", verb: "\\u0B95\\u0BCA\\u0BA3\\u0BCD\\u0B9F\\u0BBF\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "\\u0B8E\\u0BA3\\u0BCD \\u0B85\\u0BB2\\u0BCD\\u0BB2\\u0BBE\\u0BA4\\u0BA4\\u0BC1" : "\\u0B8E\\u0BA3\\u0BCD";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u0B85\\u0BA3\\u0BBF";
        }
        if (data === null) {
          return "\\u0BB5\\u0BC6\\u0BB1\\u0BC1\\u0BAE\\u0BC8";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0BC0\\u0B9F\\u0BC1",
    email: "\\u0BAE\\u0BBF\\u0BA9\\u0BCD\\u0BA9\\u0B9E\\u0BCD\\u0B9A\\u0BB2\\u0BCD \\u0BAE\\u0BC1\\u0B95\\u0BB5\\u0BB0\\u0BBF",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\u0BA4\\u0BC7\\u0BA4\\u0BBF \\u0BA8\\u0BC7\\u0BB0\\u0BAE\\u0BCD",
    date: "ISO \\u0BA4\\u0BC7\\u0BA4\\u0BBF",
    time: "ISO \\u0BA8\\u0BC7\\u0BB0\\u0BAE\\u0BCD",
    duration: "ISO \\u0B95\\u0BBE\\u0BB2 \\u0B85\\u0BB3\\u0BB5\\u0BC1",
    ipv4: "IPv4 \\u0BAE\\u0BC1\\u0B95\\u0BB5\\u0BB0\\u0BBF",
    ipv6: "IPv6 \\u0BAE\\u0BC1\\u0B95\\u0BB5\\u0BB0\\u0BBF",
    cidrv4: "IPv4 \\u0BB5\\u0BB0\\u0BAE\\u0BCD\\u0BAA\\u0BC1",
    cidrv6: "IPv6 \\u0BB5\\u0BB0\\u0BAE\\u0BCD\\u0BAA\\u0BC1",
    base64: "base64-encoded \\u0B9A\\u0BB0\\u0BAE\\u0BCD",
    base64url: "base64url-encoded \\u0B9A\\u0BB0\\u0BAE\\u0BCD",
    json_string: "JSON \\u0B9A\\u0BB0\\u0BAE\\u0BCD",
    e164: "E.164 \\u0B8E\\u0BA3\\u0BCD",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0BC0\\u0B9F\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${issue2.expected}, \\u0BAA\\u0BC6\\u0BB1\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0BC0\\u0B9F\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0BB5\\u0BBF\\u0BB0\\u0BC1\\u0BAA\\u0BCD\\u0BAA\\u0BAE\\u0BCD: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${joinValues(issue2.values, "|")} \\u0B87\\u0BB2\\u0BCD \\u0B92\\u0BA9\\u0BCD\\u0BB1\\u0BC1\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0BAE\\u0BBF\\u0B95 \\u0BAA\\u0BC6\\u0BB0\\u0BBF\\u0BAF\\u0BA4\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${issue2.origin ?? "\\u0BAE\\u0BA4\\u0BBF\\u0BAA\\u0BCD\\u0BAA\\u0BC1"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0B89\\u0BB1\\u0BC1\\u0BAA\\u0BCD\\u0BAA\\u0BC1\\u0B95\\u0BB3\\u0BCD"} \\u0B86\\u0B95 \\u0B87\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        }
        return \`\\u0BAE\\u0BBF\\u0B95 \\u0BAA\\u0BC6\\u0BB0\\u0BBF\\u0BAF\\u0BA4\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${issue2.origin ?? "\\u0BAE\\u0BA4\\u0BBF\\u0BAA\\u0BCD\\u0BAA\\u0BC1"} \${adj}\${issue2.maximum.toString()} \\u0B86\\u0B95 \\u0B87\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0BAE\\u0BBF\\u0B95\\u0B9A\\u0BCD \\u0B9A\\u0BBF\\u0BB1\\u0BBF\\u0BAF\\u0BA4\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit} \\u0B86\\u0B95 \\u0B87\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        }
        return \`\\u0BAE\\u0BBF\\u0B95\\u0B9A\\u0BCD \\u0B9A\\u0BBF\\u0BB1\\u0BBF\\u0BAF\\u0BA4\\u0BC1: \\u0B8E\\u0BA4\\u0BBF\\u0BB0\\u0BCD\\u0BAA\\u0BBE\\u0BB0\\u0BCD\\u0B95\\u0BCD\\u0B95\\u0BAA\\u0BCD\\u0BAA\\u0B9F\\u0BCD\\u0B9F\\u0BA4\\u0BC1 \${issue2.origin} \${adj}\${issue2.minimum.toString()} \\u0B86\\u0B95 \\u0B87\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B9A\\u0BB0\\u0BAE\\u0BCD: "\${_issue.prefix}" \\u0B87\\u0BB2\\u0BCD \\u0BA4\\u0BCA\\u0B9F\\u0B99\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        if (_issue.format === "ends_with")
          return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B9A\\u0BB0\\u0BAE\\u0BCD: "\${_issue.suffix}" \\u0B87\\u0BB2\\u0BCD \\u0BAE\\u0BC1\\u0B9F\\u0BBF\\u0BB5\\u0B9F\\u0BC8\\u0BAF \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        if (_issue.format === "includes")
          return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B9A\\u0BB0\\u0BAE\\u0BCD: "\${_issue.includes}" \\u0B90 \\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0B9F\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        if (_issue.format === "regex")
          return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B9A\\u0BB0\\u0BAE\\u0BCD: \${_issue.pattern} \\u0BAE\\u0BC1\\u0BB1\\u0BC8\\u0BAA\\u0BBE\\u0B9F\\u0BCD\\u0B9F\\u0BC1\\u0B9F\\u0BA9\\u0BCD \\u0BAA\\u0BCA\\u0BB0\\u0BC1\\u0BA8\\u0BCD\\u0BA4 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
        return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B8E\\u0BA3\\u0BCD: \${issue2.divisor} \\u0B87\\u0BA9\\u0BCD \\u0BAA\\u0BB2\\u0BAE\\u0BBE\\u0B95 \\u0B87\\u0BB0\\u0BC1\\u0B95\\u0BCD\\u0B95 \\u0BB5\\u0BC7\\u0BA3\\u0BCD\\u0B9F\\u0BC1\\u0BAE\\u0BCD\`;
      case "unrecognized_keys":
        return \`\\u0B85\\u0B9F\\u0BC8\\u0BAF\\u0BBE\\u0BB3\\u0BAE\\u0BCD \\u0BA4\\u0BC6\\u0BB0\\u0BBF\\u0BAF\\u0BBE\\u0BA4 \\u0BB5\\u0BBF\\u0B9A\\u0BC8\${issue2.keys.length > 1 ? "\\u0B95\\u0BB3\\u0BCD" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} \\u0B87\\u0BB2\\u0BCD \\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0BB5\\u0BBF\\u0B9A\\u0BC8\`;
      case "invalid_union":
        return "\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0BC0\\u0B9F\\u0BC1";
      case "invalid_element":
        return \`\${issue2.origin} \\u0B87\\u0BB2\\u0BCD \\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0BAE\\u0BA4\\u0BBF\\u0BAA\\u0BCD\\u0BAA\\u0BC1\`;
      default:
        return \`\\u0BA4\\u0BB5\\u0BB1\\u0BBE\\u0BA9 \\u0B89\\u0BB3\\u0BCD\\u0BB3\\u0BC0\\u0B9F\\u0BC1\`;
    }
  };
};
function ta_default() {
  return {
    localeError: error32()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/th.js
var error33 = () => {
  const Sizable = {
    string: { unit: "\\u0E15\\u0E31\\u0E27\\u0E2D\\u0E31\\u0E01\\u0E29\\u0E23", verb: "\\u0E04\\u0E27\\u0E23\\u0E21\\u0E35" },
    file: { unit: "\\u0E44\\u0E1A\\u0E15\\u0E4C", verb: "\\u0E04\\u0E27\\u0E23\\u0E21\\u0E35" },
    array: { unit: "\\u0E23\\u0E32\\u0E22\\u0E01\\u0E32\\u0E23", verb: "\\u0E04\\u0E27\\u0E23\\u0E21\\u0E35" },
    set: { unit: "\\u0E23\\u0E32\\u0E22\\u0E01\\u0E32\\u0E23", verb: "\\u0E04\\u0E27\\u0E23\\u0E21\\u0E35" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "\\u0E44\\u0E21\\u0E48\\u0E43\\u0E0A\\u0E48\\u0E15\\u0E31\\u0E27\\u0E40\\u0E25\\u0E02 (NaN)" : "\\u0E15\\u0E31\\u0E27\\u0E40\\u0E25\\u0E02";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u0E2D\\u0E32\\u0E23\\u0E4C\\u0E40\\u0E23\\u0E22\\u0E4C (Array)";
        }
        if (data === null) {
          return "\\u0E44\\u0E21\\u0E48\\u0E21\\u0E35\\u0E04\\u0E48\\u0E32 (null)";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E17\\u0E35\\u0E48\\u0E1B\\u0E49\\u0E2D\\u0E19",
    email: "\\u0E17\\u0E35\\u0E48\\u0E2D\\u0E22\\u0E39\\u0E48\\u0E2D\\u0E35\\u0E40\\u0E21\\u0E25",
    url: "URL",
    emoji: "\\u0E2D\\u0E34\\u0E42\\u0E21\\u0E08\\u0E34",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u0E27\\u0E31\\u0E19\\u0E17\\u0E35\\u0E48\\u0E40\\u0E27\\u0E25\\u0E32\\u0E41\\u0E1A\\u0E1A ISO",
    date: "\\u0E27\\u0E31\\u0E19\\u0E17\\u0E35\\u0E48\\u0E41\\u0E1A\\u0E1A ISO",
    time: "\\u0E40\\u0E27\\u0E25\\u0E32\\u0E41\\u0E1A\\u0E1A ISO",
    duration: "\\u0E0A\\u0E48\\u0E27\\u0E07\\u0E40\\u0E27\\u0E25\\u0E32\\u0E41\\u0E1A\\u0E1A ISO",
    ipv4: "\\u0E17\\u0E35\\u0E48\\u0E2D\\u0E22\\u0E39\\u0E48 IPv4",
    ipv6: "\\u0E17\\u0E35\\u0E48\\u0E2D\\u0E22\\u0E39\\u0E48 IPv6",
    cidrv4: "\\u0E0A\\u0E48\\u0E27\\u0E07 IP \\u0E41\\u0E1A\\u0E1A IPv4",
    cidrv6: "\\u0E0A\\u0E48\\u0E27\\u0E07 IP \\u0E41\\u0E1A\\u0E1A IPv6",
    base64: "\\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E41\\u0E1A\\u0E1A Base64",
    base64url: "\\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E41\\u0E1A\\u0E1A Base64 \\u0E2A\\u0E33\\u0E2B\\u0E23\\u0E31\\u0E1A URL",
    json_string: "\\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E41\\u0E1A\\u0E1A JSON",
    e164: "\\u0E40\\u0E1A\\u0E2D\\u0E23\\u0E4C\\u0E42\\u0E17\\u0E23\\u0E28\\u0E31\\u0E1E\\u0E17\\u0E4C\\u0E23\\u0E30\\u0E2B\\u0E27\\u0E48\\u0E32\\u0E07\\u0E1B\\u0E23\\u0E30\\u0E40\\u0E17\\u0E28 (E.164)",
    jwt: "\\u0E42\\u0E17\\u0E40\\u0E04\\u0E19 JWT",
    template_literal: "\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E17\\u0E35\\u0E48\\u0E1B\\u0E49\\u0E2D\\u0E19"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0E1B\\u0E23\\u0E30\\u0E40\\u0E20\\u0E17\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E04\\u0E27\\u0E23\\u0E40\\u0E1B\\u0E47\\u0E19 \${issue2.expected} \\u0E41\\u0E15\\u0E48\\u0E44\\u0E14\\u0E49\\u0E23\\u0E31\\u0E1A \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u0E04\\u0E48\\u0E32\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E04\\u0E27\\u0E23\\u0E40\\u0E1B\\u0E47\\u0E19 \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u0E15\\u0E31\\u0E27\\u0E40\\u0E25\\u0E37\\u0E2D\\u0E01\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E04\\u0E27\\u0E23\\u0E40\\u0E1B\\u0E47\\u0E19\\u0E2B\\u0E19\\u0E36\\u0E48\\u0E07\\u0E43\\u0E19 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "\\u0E44\\u0E21\\u0E48\\u0E40\\u0E01\\u0E34\\u0E19" : "\\u0E19\\u0E49\\u0E2D\\u0E22\\u0E01\\u0E27\\u0E48\\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u0E40\\u0E01\\u0E34\\u0E19\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14: \${issue2.origin ?? "\\u0E04\\u0E48\\u0E32"} \\u0E04\\u0E27\\u0E23\\u0E21\\u0E35\${adj} \${issue2.maximum.toString()} \${sizing.unit ?? "\\u0E23\\u0E32\\u0E22\\u0E01\\u0E32\\u0E23"}\`;
        return \`\\u0E40\\u0E01\\u0E34\\u0E19\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14: \${issue2.origin ?? "\\u0E04\\u0E48\\u0E32"} \\u0E04\\u0E27\\u0E23\\u0E21\\u0E35\${adj} \${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\\u0E2D\\u0E22\\u0E48\\u0E32\\u0E07\\u0E19\\u0E49\\u0E2D\\u0E22" : "\\u0E21\\u0E32\\u0E01\\u0E01\\u0E27\\u0E48\\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0E19\\u0E49\\u0E2D\\u0E22\\u0E01\\u0E27\\u0E48\\u0E32\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14: \${issue2.origin} \\u0E04\\u0E27\\u0E23\\u0E21\\u0E35\${adj} \${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u0E19\\u0E49\\u0E2D\\u0E22\\u0E01\\u0E27\\u0E48\\u0E32\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14: \${issue2.origin} \\u0E04\\u0E27\\u0E23\\u0E21\\u0E35\${adj} \${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E15\\u0E49\\u0E2D\\u0E07\\u0E02\\u0E36\\u0E49\\u0E19\\u0E15\\u0E49\\u0E19\\u0E14\\u0E49\\u0E27\\u0E22 "\${_issue.prefix}"\`;
        }
        if (_issue.format === "ends_with")
          return \`\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E15\\u0E49\\u0E2D\\u0E07\\u0E25\\u0E07\\u0E17\\u0E49\\u0E32\\u0E22\\u0E14\\u0E49\\u0E27\\u0E22 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\\u0E15\\u0E49\\u0E2D\\u0E07\\u0E21\\u0E35 "\${_issue.includes}" \\u0E2D\\u0E22\\u0E39\\u0E48\\u0E43\\u0E19\\u0E02\\u0E49\\u0E2D\\u0E04\\u0E27\\u0E32\\u0E21\`;
        if (_issue.format === "regex")
          return \`\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E15\\u0E49\\u0E2D\\u0E07\\u0E15\\u0E23\\u0E07\\u0E01\\u0E31\\u0E1A\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E17\\u0E35\\u0E48\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14 \${_issue.pattern}\`;
        return \`\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u0E15\\u0E31\\u0E27\\u0E40\\u0E25\\u0E02\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E15\\u0E49\\u0E2D\\u0E07\\u0E40\\u0E1B\\u0E47\\u0E19\\u0E08\\u0E33\\u0E19\\u0E27\\u0E19\\u0E17\\u0E35\\u0E48\\u0E2B\\u0E32\\u0E23\\u0E14\\u0E49\\u0E27\\u0E22 \${issue2.divisor} \\u0E44\\u0E14\\u0E49\\u0E25\\u0E07\\u0E15\\u0E31\\u0E27\`;
      case "unrecognized_keys":
        return \`\\u0E1E\\u0E1A\\u0E04\\u0E35\\u0E22\\u0E4C\\u0E17\\u0E35\\u0E48\\u0E44\\u0E21\\u0E48\\u0E23\\u0E39\\u0E49\\u0E08\\u0E31\\u0E01: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u0E04\\u0E35\\u0E22\\u0E4C\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07\\u0E43\\u0E19 \${issue2.origin}\`;
      case "invalid_union":
        return "\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07: \\u0E44\\u0E21\\u0E48\\u0E15\\u0E23\\u0E07\\u0E01\\u0E31\\u0E1A\\u0E23\\u0E39\\u0E1B\\u0E41\\u0E1A\\u0E1A\\u0E22\\u0E39\\u0E40\\u0E19\\u0E35\\u0E22\\u0E19\\u0E17\\u0E35\\u0E48\\u0E01\\u0E33\\u0E2B\\u0E19\\u0E14\\u0E44\\u0E27\\u0E49";
      case "invalid_element":
        return \`\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07\\u0E43\\u0E19 \${issue2.origin}\`;
      default:
        return \`\\u0E02\\u0E49\\u0E2D\\u0E21\\u0E39\\u0E25\\u0E44\\u0E21\\u0E48\\u0E16\\u0E39\\u0E01\\u0E15\\u0E49\\u0E2D\\u0E07\`;
    }
  };
};
function th_default() {
  return {
    localeError: error33()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/tr.js
var parsedType3 = (data) => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "number";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
        return data.constructor.name;
      }
    }
  }
  return t;
};
var error34 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "olmal\\u0131" },
    file: { unit: "bayt", verb: "olmal\\u0131" },
    array: { unit: "\\xF6\\u011Fe", verb: "olmal\\u0131" },
    set: { unit: "\\xF6\\u011Fe", verb: "olmal\\u0131" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const Nouns = {
    regex: "girdi",
    email: "e-posta adresi",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO tarih ve saat",
    date: "ISO tarih",
    time: "ISO saat",
    duration: "ISO s\\xFCre",
    ipv4: "IPv4 adresi",
    ipv6: "IPv6 adresi",
    cidrv4: "IPv4 aral\\u0131\\u011F\\u0131",
    cidrv6: "IPv6 aral\\u0131\\u011F\\u0131",
    base64: "base64 ile \\u015Fifrelenmi\\u015F metin",
    base64url: "base64url ile \\u015Fifrelenmi\\u015F metin",
    json_string: "JSON dizesi",
    e164: "E.164 say\\u0131s\\u0131",
    jwt: "JWT",
    template_literal: "\\u015Eablon dizesi"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`Ge\\xE7ersiz de\\u011Fer: beklenen \${issue2.expected}, al\\u0131nan \${parsedType3(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`Ge\\xE7ersiz de\\u011Fer: beklenen \${stringifyPrimitive(issue2.values[0])}\`;
        return \`Ge\\xE7ersiz se\\xE7enek: a\\u015Fa\\u011F\\u0131dakilerden biri olmal\\u0131: \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\xC7ok b\\xFCy\\xFCk: beklenen \${issue2.origin ?? "de\\u011Fer"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\xF6\\u011Fe"}\`;
        return \`\\xC7ok b\\xFCy\\xFCk: beklenen \${issue2.origin ?? "de\\u011Fer"} \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\xC7ok k\\xFC\\xE7\\xFCk: beklenen \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        return \`\\xC7ok k\\xFC\\xE7\\xFCk: beklenen \${issue2.origin} \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Ge\\xE7ersiz metin: "\${_issue.prefix}" ile ba\\u015Flamal\\u0131\`;
        if (_issue.format === "ends_with")
          return \`Ge\\xE7ersiz metin: "\${_issue.suffix}" ile bitmeli\`;
        if (_issue.format === "includes")
          return \`Ge\\xE7ersiz metin: "\${_issue.includes}" i\\xE7ermeli\`;
        if (_issue.format === "regex")
          return \`Ge\\xE7ersiz metin: \${_issue.pattern} desenine uymal\\u0131\`;
        return \`Ge\\xE7ersiz \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`Ge\\xE7ersiz say\\u0131: \${issue2.divisor} ile tam b\\xF6l\\xFCnebilmeli\`;
      case "unrecognized_keys":
        return \`Tan\\u0131nmayan anahtar\${issue2.keys.length > 1 ? "lar" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} i\\xE7inde ge\\xE7ersiz anahtar\`;
      case "invalid_union":
        return "Ge\\xE7ersiz de\\u011Fer";
      case "invalid_element":
        return \`\${issue2.origin} i\\xE7inde ge\\xE7ersiz de\\u011Fer\`;
      default:
        return \`Ge\\xE7ersiz de\\u011Fer\`;
    }
  };
};
function tr_default() {
  return {
    localeError: error34()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ua.js
var error35 = () => {
  const Sizable = {
    string: { unit: "\\u0441\\u0438\\u043C\\u0432\\u043E\\u043B\\u0456\\u0432", verb: "\\u043C\\u0430\\u0442\\u0438\\u043C\\u0435" },
    file: { unit: "\\u0431\\u0430\\u0439\\u0442\\u0456\\u0432", verb: "\\u043C\\u0430\\u0442\\u0438\\u043C\\u0435" },
    array: { unit: "\\u0435\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0456\\u0432", verb: "\\u043C\\u0430\\u0442\\u0438\\u043C\\u0435" },
    set: { unit: "\\u0435\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0456\\u0432", verb: "\\u043C\\u0430\\u0442\\u0438\\u043C\\u0435" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0447\\u0438\\u0441\\u043B\\u043E";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u043C\\u0430\\u0441\\u0438\\u0432";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456",
    email: "\\u0430\\u0434\\u0440\\u0435\\u0441\\u0430 \\u0435\\u043B\\u0435\\u043A\\u0442\\u0440\\u043E\\u043D\\u043D\\u043E\\u0457 \\u043F\\u043E\\u0448\\u0442\\u0438",
    url: "URL",
    emoji: "\\u0435\\u043C\\u043E\\u0434\\u0437\\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\\u0434\\u0430\\u0442\\u0430 \\u0442\\u0430 \\u0447\\u0430\\u0441 ISO",
    date: "\\u0434\\u0430\\u0442\\u0430 ISO",
    time: "\\u0447\\u0430\\u0441 ISO",
    duration: "\\u0442\\u0440\\u0438\\u0432\\u0430\\u043B\\u0456\\u0441\\u0442\\u044C ISO",
    ipv4: "\\u0430\\u0434\\u0440\\u0435\\u0441\\u0430 IPv4",
    ipv6: "\\u0430\\u0434\\u0440\\u0435\\u0441\\u0430 IPv6",
    cidrv4: "\\u0434\\u0456\\u0430\\u043F\\u0430\\u0437\\u043E\\u043D IPv4",
    cidrv6: "\\u0434\\u0456\\u0430\\u043F\\u0430\\u0437\\u043E\\u043D IPv6",
    base64: "\\u0440\\u044F\\u0434\\u043E\\u043A \\u0443 \\u043A\\u043E\\u0434\\u0443\\u0432\\u0430\\u043D\\u043D\\u0456 base64",
    base64url: "\\u0440\\u044F\\u0434\\u043E\\u043A \\u0443 \\u043A\\u043E\\u0434\\u0443\\u0432\\u0430\\u043D\\u043D\\u0456 base64url",
    json_string: "\\u0440\\u044F\\u0434\\u043E\\u043A JSON",
    e164: "\\u043D\\u043E\\u043C\\u0435\\u0440 E.164",
    jwt: "JWT",
    template_literal: "\\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0456 \\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F \${issue2.expected}, \\u043E\\u0442\\u0440\\u0438\\u043C\\u0430\\u043D\\u043E \${parsedType4(issue2.input)}\`;
      // return \`Неправильні вхідні дані: очікується \${issue.expected}, отримано \${util.getParsedType(issue.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0456 \\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0430 \\u043E\\u043F\\u0446\\u0456\\u044F: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F \\u043E\\u0434\\u043D\\u0435 \\u0437 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u043E \\u0432\\u0435\\u043B\\u0438\\u043A\\u0435: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F, \\u0449\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u043D\\u044F"} \${sizing.verb} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0435\\u043B\\u0435\\u043C\\u0435\\u043D\\u0442\\u0456\\u0432"}\`;
        return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u043E \\u0432\\u0435\\u043B\\u0438\\u043A\\u0435: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F, \\u0449\\u043E \${issue2.origin ?? "\\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u043D\\u044F"} \\u0431\\u0443\\u0434\\u0435 \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u043E \\u043C\\u0430\\u043B\\u0435: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F, \\u0449\\u043E \${issue2.origin} \${sizing.verb} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u0417\\u0430\\u043D\\u0430\\u0434\\u0442\\u043E \\u043C\\u0430\\u043B\\u0435: \\u043E\\u0447\\u0456\\u043A\\u0443\\u0454\\u0442\\u044C\\u0441\\u044F, \\u0449\\u043E \${issue2.origin} \\u0431\\u0443\\u0434\\u0435 \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \\u0440\\u044F\\u0434\\u043E\\u043A: \\u043F\\u043E\\u0432\\u0438\\u043D\\u0435\\u043D \\u043F\\u043E\\u0447\\u0438\\u043D\\u0430\\u0442\\u0438\\u0441\\u044F \\u0437 "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \\u0440\\u044F\\u0434\\u043E\\u043A: \\u043F\\u043E\\u0432\\u0438\\u043D\\u0435\\u043D \\u0437\\u0430\\u043A\\u0456\\u043D\\u0447\\u0443\\u0432\\u0430\\u0442\\u0438\\u0441\\u044F \\u043D\\u0430 "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \\u0440\\u044F\\u0434\\u043E\\u043A: \\u043F\\u043E\\u0432\\u0438\\u043D\\u0435\\u043D \\u043C\\u0456\\u0441\\u0442\\u0438\\u0442\\u0438 "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \\u0440\\u044F\\u0434\\u043E\\u043A: \\u043F\\u043E\\u0432\\u0438\\u043D\\u0435\\u043D \\u0432\\u0456\\u0434\\u043F\\u043E\\u0432\\u0456\\u0434\\u0430\\u0442\\u0438 \\u0448\\u0430\\u0431\\u043B\\u043E\\u043D\\u0443 \${_issue.pattern}\`;
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0435 \\u0447\\u0438\\u0441\\u043B\\u043E: \\u043F\\u043E\\u0432\\u0438\\u043D\\u043D\\u043E \\u0431\\u0443\\u0442\\u0438 \\u043A\\u0440\\u0430\\u0442\\u043D\\u0438\\u043C \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`\\u041D\\u0435\\u0440\\u043E\\u0437\\u043F\\u0456\\u0437\\u043D\\u0430\\u043D\\u0438\\u0439 \\u043A\\u043B\\u044E\\u0447\${issue2.keys.length > 1 ? "\\u0456" : ""}: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0438\\u0439 \\u043A\\u043B\\u044E\\u0447 \\u0443 \${issue2.origin}\`;
      case "invalid_union":
        return "\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0456 \\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456";
      case "invalid_element":
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0435 \\u0437\\u043D\\u0430\\u0447\\u0435\\u043D\\u043D\\u044F \\u0443 \${issue2.origin}\`;
      default:
        return \`\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u0456 \\u0432\\u0445\\u0456\\u0434\\u043D\\u0456 \\u0434\\u0430\\u043D\\u0456\`;
    }
  };
};
function ua_default() {
  return {
    localeError: error35()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/ur.js
var error36 = () => {
  const Sizable = {
    string: { unit: "\\u062D\\u0631\\u0648\\u0641", verb: "\\u06C1\\u0648\\u0646\\u0627" },
    file: { unit: "\\u0628\\u0627\\u0626\\u0679\\u0633", verb: "\\u06C1\\u0648\\u0646\\u0627" },
    array: { unit: "\\u0622\\u0626\\u0679\\u0645\\u0632", verb: "\\u06C1\\u0648\\u0646\\u0627" },
    set: { unit: "\\u0622\\u0626\\u0679\\u0645\\u0632", verb: "\\u06C1\\u0648\\u0646\\u0627" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "\\u0646\\u0645\\u0628\\u0631";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u0622\\u0631\\u06D2";
        }
        if (data === null) {
          return "\\u0646\\u0644";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0627\\u0646 \\u067E\\u0679",
    email: "\\u0627\\u06CC \\u0645\\u06CC\\u0644 \\u0627\\u06CC\\u0688\\u0631\\u06CC\\u0633",
    url: "\\u06CC\\u0648 \\u0622\\u0631 \\u0627\\u06CC\\u0644",
    emoji: "\\u0627\\u06CC\\u0645\\u0648\\u062C\\u06CC",
    uuid: "\\u06CC\\u0648 \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    uuidv4: "\\u06CC\\u0648 \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC \\u0648\\u06CC 4",
    uuidv6: "\\u06CC\\u0648 \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC \\u0648\\u06CC 6",
    nanoid: "\\u0646\\u06CC\\u0646\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    guid: "\\u062C\\u06CC \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    cuid: "\\u0633\\u06CC \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    cuid2: "\\u0633\\u06CC \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC 2",
    ulid: "\\u06CC\\u0648 \\u0627\\u06CC\\u0644 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    xid: "\\u0627\\u06CC\\u06A9\\u0633 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    ksuid: "\\u06A9\\u06D2 \\u0627\\u06CC\\u0633 \\u06CC\\u0648 \\u0622\\u0626\\u06CC \\u0688\\u06CC",
    datetime: "\\u0622\\u0626\\u06CC \\u0627\\u06CC\\u0633 \\u0627\\u0648 \\u0688\\u06CC\\u0679 \\u0679\\u0627\\u0626\\u0645",
    date: "\\u0622\\u0626\\u06CC \\u0627\\u06CC\\u0633 \\u0627\\u0648 \\u062A\\u0627\\u0631\\u06CC\\u062E",
    time: "\\u0622\\u0626\\u06CC \\u0627\\u06CC\\u0633 \\u0627\\u0648 \\u0648\\u0642\\u062A",
    duration: "\\u0622\\u0626\\u06CC \\u0627\\u06CC\\u0633 \\u0627\\u0648 \\u0645\\u062F\\u062A",
    ipv4: "\\u0622\\u0626\\u06CC \\u067E\\u06CC \\u0648\\u06CC 4 \\u0627\\u06CC\\u0688\\u0631\\u06CC\\u0633",
    ipv6: "\\u0622\\u0626\\u06CC \\u067E\\u06CC \\u0648\\u06CC 6 \\u0627\\u06CC\\u0688\\u0631\\u06CC\\u0633",
    cidrv4: "\\u0622\\u0626\\u06CC \\u067E\\u06CC \\u0648\\u06CC 4 \\u0631\\u06CC\\u0646\\u062C",
    cidrv6: "\\u0622\\u0626\\u06CC \\u067E\\u06CC \\u0648\\u06CC 6 \\u0631\\u06CC\\u0646\\u062C",
    base64: "\\u0628\\u06CC\\u0633 64 \\u0627\\u0646 \\u06A9\\u0648\\u0688\\u0688 \\u0633\\u0679\\u0631\\u0646\\u06AF",
    base64url: "\\u0628\\u06CC\\u0633 64 \\u06CC\\u0648 \\u0622\\u0631 \\u0627\\u06CC\\u0644 \\u0627\\u0646 \\u06A9\\u0648\\u0688\\u0688 \\u0633\\u0679\\u0631\\u0646\\u06AF",
    json_string: "\\u062C\\u06D2 \\u0627\\u06CC\\u0633 \\u0627\\u0648 \\u0627\\u06CC\\u0646 \\u0633\\u0679\\u0631\\u0646\\u06AF",
    e164: "\\u0627\\u06CC 164 \\u0646\\u0645\\u0628\\u0631",
    jwt: "\\u062C\\u06D2 \\u0688\\u0628\\u0644\\u06CC\\u0648 \\u0679\\u06CC",
    template_literal: "\\u0627\\u0646 \\u067E\\u0679"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u063A\\u0644\\u0637 \\u0627\\u0646 \\u067E\\u0679: \${issue2.expected} \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u0627\\u060C \${parsedType4(issue2.input)} \\u0645\\u0648\\u0635\\u0648\\u0644 \\u06C1\\u0648\\u0627\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u063A\\u0644\\u0637 \\u0627\\u0646 \\u067E\\u0679: \${stringifyPrimitive(issue2.values[0])} \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u0627\`;
        return \`\\u063A\\u0644\\u0637 \\u0622\\u067E\\u0634\\u0646: \${joinValues(issue2.values, "|")} \\u0645\\u06CC\\u06BA \\u0633\\u06D2 \\u0627\\u06CC\\u06A9 \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u0627\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u0628\\u06C1\\u062A \\u0628\\u0691\\u0627: \${issue2.origin ?? "\\u0648\\u06CC\\u0644\\u06CC\\u0648"} \\u06A9\\u06D2 \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u0639\\u0646\\u0627\\u0635\\u0631"} \\u06C1\\u0648\\u0646\\u06D2 \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u06D2\`;
        return \`\\u0628\\u06C1\\u062A \\u0628\\u0691\\u0627: \${issue2.origin ?? "\\u0648\\u06CC\\u0644\\u06CC\\u0648"} \\u06A9\\u0627 \${adj}\${issue2.maximum.toString()} \\u06C1\\u0648\\u0646\\u0627 \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u0627\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u0628\\u06C1\\u062A \\u0686\\u06BE\\u0648\\u0679\\u0627: \${issue2.origin} \\u06A9\\u06D2 \${adj}\${issue2.minimum.toString()} \${sizing.unit} \\u06C1\\u0648\\u0646\\u06D2 \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u06D2\`;
        }
        return \`\\u0628\\u06C1\\u062A \\u0686\\u06BE\\u0648\\u0679\\u0627: \${issue2.origin} \\u06A9\\u0627 \${adj}\${issue2.minimum.toString()} \\u06C1\\u0648\\u0646\\u0627 \\u0645\\u062A\\u0648\\u0642\\u0639 \\u062A\\u06BE\\u0627\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u063A\\u0644\\u0637 \\u0633\\u0679\\u0631\\u0646\\u06AF: "\${_issue.prefix}" \\u0633\\u06D2 \\u0634\\u0631\\u0648\\u0639 \\u06C1\\u0648\\u0646\\u0627 \\u0686\\u0627\\u06C1\\u06CC\\u06D2\`;
        }
        if (_issue.format === "ends_with")
          return \`\\u063A\\u0644\\u0637 \\u0633\\u0679\\u0631\\u0646\\u06AF: "\${_issue.suffix}" \\u067E\\u0631 \\u062E\\u062A\\u0645 \\u06C1\\u0648\\u0646\\u0627 \\u0686\\u0627\\u06C1\\u06CC\\u06D2\`;
        if (_issue.format === "includes")
          return \`\\u063A\\u0644\\u0637 \\u0633\\u0679\\u0631\\u0646\\u06AF: "\${_issue.includes}" \\u0634\\u0627\\u0645\\u0644 \\u06C1\\u0648\\u0646\\u0627 \\u0686\\u0627\\u06C1\\u06CC\\u06D2\`;
        if (_issue.format === "regex")
          return \`\\u063A\\u0644\\u0637 \\u0633\\u0679\\u0631\\u0646\\u06AF: \\u067E\\u06CC\\u0679\\u0631\\u0646 \${_issue.pattern} \\u0633\\u06D2 \\u0645\\u06CC\\u0686 \\u06C1\\u0648\\u0646\\u0627 \\u0686\\u0627\\u06C1\\u06CC\\u06D2\`;
        return \`\\u063A\\u0644\\u0637 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u063A\\u0644\\u0637 \\u0646\\u0645\\u0628\\u0631: \${issue2.divisor} \\u06A9\\u0627 \\u0645\\u0636\\u0627\\u0639\\u0641 \\u06C1\\u0648\\u0646\\u0627 \\u0686\\u0627\\u06C1\\u06CC\\u06D2\`;
      case "unrecognized_keys":
        return \`\\u063A\\u06CC\\u0631 \\u062A\\u0633\\u0644\\u06CC\\u0645 \\u0634\\u062F\\u06C1 \\u06A9\\u06CC\${issue2.keys.length > 1 ? "\\u0632" : ""}: \${joinValues(issue2.keys, "\\u060C ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} \\u0645\\u06CC\\u06BA \\u063A\\u0644\\u0637 \\u06A9\\u06CC\`;
      case "invalid_union":
        return "\\u063A\\u0644\\u0637 \\u0627\\u0646 \\u067E\\u0679";
      case "invalid_element":
        return \`\${issue2.origin} \\u0645\\u06CC\\u06BA \\u063A\\u0644\\u0637 \\u0648\\u06CC\\u0644\\u06CC\\u0648\`;
      default:
        return \`\\u063A\\u0644\\u0637 \\u0627\\u0646 \\u067E\\u0679\`;
    }
  };
};
function ur_default() {
  return {
    localeError: error36()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/vi.js
var error37 = () => {
  const Sizable = {
    string: { unit: "k\\xFD t\\u1EF1", verb: "c\\xF3" },
    file: { unit: "byte", verb: "c\\xF3" },
    array: { unit: "ph\\u1EA7n t\\u1EED", verb: "c\\xF3" },
    set: { unit: "ph\\u1EA7n t\\u1EED", verb: "c\\xF3" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "s\\u1ED1";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "m\\u1EA3ng";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u0111\\u1EA7u v\\xE0o",
    email: "\\u0111\\u1ECBa ch\\u1EC9 email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ng\\xE0y gi\\u1EDD ISO",
    date: "ng\\xE0y ISO",
    time: "gi\\u1EDD ISO",
    duration: "kho\\u1EA3ng th\\u1EDDi gian ISO",
    ipv4: "\\u0111\\u1ECBa ch\\u1EC9 IPv4",
    ipv6: "\\u0111\\u1ECBa ch\\u1EC9 IPv6",
    cidrv4: "d\\u1EA3i IPv4",
    cidrv6: "d\\u1EA3i IPv6",
    base64: "chu\\u1ED7i m\\xE3 h\\xF3a base64",
    base64url: "chu\\u1ED7i m\\xE3 h\\xF3a base64url",
    json_string: "chu\\u1ED7i JSON",
    e164: "s\\u1ED1 E.164",
    jwt: "JWT",
    template_literal: "\\u0111\\u1EA7u v\\xE0o"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u0110\\u1EA7u v\\xE0o kh\\xF4ng h\\u1EE3p l\\u1EC7: mong \\u0111\\u1EE3i \${issue2.expected}, nh\\u1EADn \\u0111\\u01B0\\u1EE3c \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u0110\\u1EA7u v\\xE0o kh\\xF4ng h\\u1EE3p l\\u1EC7: mong \\u0111\\u1EE3i \${stringifyPrimitive(issue2.values[0])}\`;
        return \`T\\xF9y ch\\u1ECDn kh\\xF4ng h\\u1EE3p l\\u1EC7: mong \\u0111\\u1EE3i m\\u1ED9t trong c\\xE1c gi\\xE1 tr\\u1ECB \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`Qu\\xE1 l\\u1EDBn: mong \\u0111\\u1EE3i \${issue2.origin ?? "gi\\xE1 tr\\u1ECB"} \${sizing.verb} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "ph\\u1EA7n t\\u1EED"}\`;
        return \`Qu\\xE1 l\\u1EDBn: mong \\u0111\\u1EE3i \${issue2.origin ?? "gi\\xE1 tr\\u1ECB"} \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`Qu\\xE1 nh\\u1ECF: mong \\u0111\\u1EE3i \${issue2.origin} \${sizing.verb} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`Qu\\xE1 nh\\u1ECF: mong \\u0111\\u1EE3i \${issue2.origin} \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`Chu\\u1ED7i kh\\xF4ng h\\u1EE3p l\\u1EC7: ph\\u1EA3i b\\u1EAFt \\u0111\\u1EA7u b\\u1EB1ng "\${_issue.prefix}"\`;
        if (_issue.format === "ends_with")
          return \`Chu\\u1ED7i kh\\xF4ng h\\u1EE3p l\\u1EC7: ph\\u1EA3i k\\u1EBFt th\\xFAc b\\u1EB1ng "\${_issue.suffix}"\`;
        if (_issue.format === "includes")
          return \`Chu\\u1ED7i kh\\xF4ng h\\u1EE3p l\\u1EC7: ph\\u1EA3i bao g\\u1ED3m "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`Chu\\u1ED7i kh\\xF4ng h\\u1EE3p l\\u1EC7: ph\\u1EA3i kh\\u1EDBp v\\u1EDBi m\\u1EABu \${_issue.pattern}\`;
        return \`\${Nouns[_issue.format] ?? issue2.format} kh\\xF4ng h\\u1EE3p l\\u1EC7\`;
      }
      case "not_multiple_of":
        return \`S\\u1ED1 kh\\xF4ng h\\u1EE3p l\\u1EC7: ph\\u1EA3i l\\xE0 b\\u1ED9i s\\u1ED1 c\\u1EE7a \${issue2.divisor}\`;
      case "unrecognized_keys":
        return \`Kh\\xF3a kh\\xF4ng \\u0111\\u01B0\\u1EE3c nh\\u1EADn d\\u1EA1ng: \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`Kh\\xF3a kh\\xF4ng h\\u1EE3p l\\u1EC7 trong \${issue2.origin}\`;
      case "invalid_union":
        return "\\u0110\\u1EA7u v\\xE0o kh\\xF4ng h\\u1EE3p l\\u1EC7";
      case "invalid_element":
        return \`Gi\\xE1 tr\\u1ECB kh\\xF4ng h\\u1EE3p l\\u1EC7 trong \${issue2.origin}\`;
      default:
        return \`\\u0110\\u1EA7u v\\xE0o kh\\xF4ng h\\u1EE3p l\\u1EC7\`;
    }
  };
};
function vi_default() {
  return {
    localeError: error37()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/zh-CN.js
var error38 = () => {
  const Sizable = {
    string: { unit: "\\u5B57\\u7B26", verb: "\\u5305\\u542B" },
    file: { unit: "\\u5B57\\u8282", verb: "\\u5305\\u542B" },
    array: { unit: "\\u9879", verb: "\\u5305\\u542B" },
    set: { unit: "\\u9879", verb: "\\u5305\\u542B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "\\u975E\\u6570\\u5B57(NaN)" : "\\u6570\\u5B57";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "\\u6570\\u7EC4";
        }
        if (data === null) {
          return "\\u7A7A\\u503C(null)";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u8F93\\u5165",
    email: "\\u7535\\u5B50\\u90AE\\u4EF6",
    url: "URL",
    emoji: "\\u8868\\u60C5\\u7B26\\u53F7",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\\u65E5\\u671F\\u65F6\\u95F4",
    date: "ISO\\u65E5\\u671F",
    time: "ISO\\u65F6\\u95F4",
    duration: "ISO\\u65F6\\u957F",
    ipv4: "IPv4\\u5730\\u5740",
    ipv6: "IPv6\\u5730\\u5740",
    cidrv4: "IPv4\\u7F51\\u6BB5",
    cidrv6: "IPv6\\u7F51\\u6BB5",
    base64: "base64\\u7F16\\u7801\\u5B57\\u7B26\\u4E32",
    base64url: "base64url\\u7F16\\u7801\\u5B57\\u7B26\\u4E32",
    json_string: "JSON\\u5B57\\u7B26\\u4E32",
    e164: "E.164\\u53F7\\u7801",
    jwt: "JWT",
    template_literal: "\\u8F93\\u5165"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u65E0\\u6548\\u8F93\\u5165\\uFF1A\\u671F\\u671B \${issue2.expected}\\uFF0C\\u5B9E\\u9645\\u63A5\\u6536 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u65E0\\u6548\\u8F93\\u5165\\uFF1A\\u671F\\u671B \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u65E0\\u6548\\u9009\\u9879\\uFF1A\\u671F\\u671B\\u4EE5\\u4E0B\\u4E4B\\u4E00 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u6570\\u503C\\u8FC7\\u5927\\uFF1A\\u671F\\u671B \${issue2.origin ?? "\\u503C"} \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u4E2A\\u5143\\u7D20"}\`;
        return \`\\u6570\\u503C\\u8FC7\\u5927\\uFF1A\\u671F\\u671B \${issue2.origin ?? "\\u503C"} \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u6570\\u503C\\u8FC7\\u5C0F\\uFF1A\\u671F\\u671B \${issue2.origin} \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u6570\\u503C\\u8FC7\\u5C0F\\uFF1A\\u671F\\u671B \${issue2.origin} \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return \`\\u65E0\\u6548\\u5B57\\u7B26\\u4E32\\uFF1A\\u5FC5\\u987B\\u4EE5 "\${_issue.prefix}" \\u5F00\\u5934\`;
        if (_issue.format === "ends_with")
          return \`\\u65E0\\u6548\\u5B57\\u7B26\\u4E32\\uFF1A\\u5FC5\\u987B\\u4EE5 "\${_issue.suffix}" \\u7ED3\\u5C3E\`;
        if (_issue.format === "includes")
          return \`\\u65E0\\u6548\\u5B57\\u7B26\\u4E32\\uFF1A\\u5FC5\\u987B\\u5305\\u542B "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u65E0\\u6548\\u5B57\\u7B26\\u4E32\\uFF1A\\u5FC5\\u987B\\u6EE1\\u8DB3\\u6B63\\u5219\\u8868\\u8FBE\\u5F0F \${_issue.pattern}\`;
        return \`\\u65E0\\u6548\${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u65E0\\u6548\\u6570\\u5B57\\uFF1A\\u5FC5\\u987B\\u662F \${issue2.divisor} \\u7684\\u500D\\u6570\`;
      case "unrecognized_keys":
        return \`\\u51FA\\u73B0\\u672A\\u77E5\\u7684\\u952E(key): \${joinValues(issue2.keys, ", ")}\`;
      case "invalid_key":
        return \`\${issue2.origin} \\u4E2D\\u7684\\u952E(key)\\u65E0\\u6548\`;
      case "invalid_union":
        return "\\u65E0\\u6548\\u8F93\\u5165";
      case "invalid_element":
        return \`\${issue2.origin} \\u4E2D\\u5305\\u542B\\u65E0\\u6548\\u503C(value)\`;
      default:
        return \`\\u65E0\\u6548\\u8F93\\u5165\`;
    }
  };
};
function zh_CN_default() {
  return {
    localeError: error38()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/locales/zh-TW.js
var error39 = () => {
  const Sizable = {
    string: { unit: "\\u5B57\\u5143", verb: "\\u64C1\\u6709" },
    file: { unit: "\\u4F4D\\u5143\\u7D44", verb: "\\u64C1\\u6709" },
    array: { unit: "\\u9805\\u76EE", verb: "\\u64C1\\u6709" },
    set: { unit: "\\u9805\\u76EE", verb: "\\u64C1\\u6709" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const parsedType4 = (data) => {
    const t = typeof data;
    switch (t) {
      case "number": {
        return Number.isNaN(data) ? "NaN" : "number";
      }
      case "object": {
        if (Array.isArray(data)) {
          return "array";
        }
        if (data === null) {
          return "null";
        }
        if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
          return data.constructor.name;
        }
      }
    }
    return t;
  };
  const Nouns = {
    regex: "\\u8F38\\u5165",
    email: "\\u90F5\\u4EF6\\u5730\\u5740",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \\u65E5\\u671F\\u6642\\u9593",
    date: "ISO \\u65E5\\u671F",
    time: "ISO \\u6642\\u9593",
    duration: "ISO \\u671F\\u9593",
    ipv4: "IPv4 \\u4F4D\\u5740",
    ipv6: "IPv6 \\u4F4D\\u5740",
    cidrv4: "IPv4 \\u7BC4\\u570D",
    cidrv6: "IPv6 \\u7BC4\\u570D",
    base64: "base64 \\u7DE8\\u78BC\\u5B57\\u4E32",
    base64url: "base64url \\u7DE8\\u78BC\\u5B57\\u4E32",
    json_string: "JSON \\u5B57\\u4E32",
    e164: "E.164 \\u6578\\u503C",
    jwt: "JWT",
    template_literal: "\\u8F38\\u5165"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return \`\\u7121\\u6548\\u7684\\u8F38\\u5165\\u503C\\uFF1A\\u9810\\u671F\\u70BA \${issue2.expected}\\uFF0C\\u4F46\\u6536\\u5230 \${parsedType4(issue2.input)}\`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return \`\\u7121\\u6548\\u7684\\u8F38\\u5165\\u503C\\uFF1A\\u9810\\u671F\\u70BA \${stringifyPrimitive(issue2.values[0])}\`;
        return \`\\u7121\\u6548\\u7684\\u9078\\u9805\\uFF1A\\u9810\\u671F\\u70BA\\u4EE5\\u4E0B\\u5176\\u4E2D\\u4E4B\\u4E00 \${joinValues(issue2.values, "|")}\`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return \`\\u6578\\u503C\\u904E\\u5927\\uFF1A\\u9810\\u671F \${issue2.origin ?? "\\u503C"} \\u61C9\\u70BA \${adj}\${issue2.maximum.toString()} \${sizing.unit ?? "\\u500B\\u5143\\u7D20"}\`;
        return \`\\u6578\\u503C\\u904E\\u5927\\uFF1A\\u9810\\u671F \${issue2.origin ?? "\\u503C"} \\u61C9\\u70BA \${adj}\${issue2.maximum.toString()}\`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return \`\\u6578\\u503C\\u904E\\u5C0F\\uFF1A\\u9810\\u671F \${issue2.origin} \\u61C9\\u70BA \${adj}\${issue2.minimum.toString()} \${sizing.unit}\`;
        }
        return \`\\u6578\\u503C\\u904E\\u5C0F\\uFF1A\\u9810\\u671F \${issue2.origin} \\u61C9\\u70BA \${adj}\${issue2.minimum.toString()}\`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return \`\\u7121\\u6548\\u7684\\u5B57\\u4E32\\uFF1A\\u5FC5\\u9808\\u4EE5 "\${_issue.prefix}" \\u958B\\u982D\`;
        }
        if (_issue.format === "ends_with")
          return \`\\u7121\\u6548\\u7684\\u5B57\\u4E32\\uFF1A\\u5FC5\\u9808\\u4EE5 "\${_issue.suffix}" \\u7D50\\u5C3E\`;
        if (_issue.format === "includes")
          return \`\\u7121\\u6548\\u7684\\u5B57\\u4E32\\uFF1A\\u5FC5\\u9808\\u5305\\u542B "\${_issue.includes}"\`;
        if (_issue.format === "regex")
          return \`\\u7121\\u6548\\u7684\\u5B57\\u4E32\\uFF1A\\u5FC5\\u9808\\u7B26\\u5408\\u683C\\u5F0F \${_issue.pattern}\`;
        return \`\\u7121\\u6548\\u7684 \${Nouns[_issue.format] ?? issue2.format}\`;
      }
      case "not_multiple_of":
        return \`\\u7121\\u6548\\u7684\\u6578\\u5B57\\uFF1A\\u5FC5\\u9808\\u70BA \${issue2.divisor} \\u7684\\u500D\\u6578\`;
      case "unrecognized_keys":
        return \`\\u7121\\u6CD5\\u8B58\\u5225\\u7684\\u9375\\u503C\${issue2.keys.length > 1 ? "\\u5011" : ""}\\uFF1A\${joinValues(issue2.keys, "\\u3001")}\`;
      case "invalid_key":
        return \`\${issue2.origin} \\u4E2D\\u6709\\u7121\\u6548\\u7684\\u9375\\u503C\`;
      case "invalid_union":
        return "\\u7121\\u6548\\u7684\\u8F38\\u5165\\u503C";
      case "invalid_element":
        return \`\${issue2.origin} \\u4E2D\\u6709\\u7121\\u6548\\u7684\\u503C\`;
      default:
        return \`\\u7121\\u6548\\u7684\\u8F38\\u5165\\u503C\`;
    }
  };
};
function zh_TW_default() {
  return {
    localeError: error39()
  };
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/registries.js
var \$output = Symbol("ZodOutput");
var \$input = Symbol("ZodInput");
var \$ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new Map();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      if (this._idmap.has(meta.id)) {
        throw new Error(\`ID \${meta.id} already exists in the registry\`);
      }
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new Map();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      return { ...pm, ...this._map.get(schema) };
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new \$ZodRegistry();
}
var globalRegistry = /* @__PURE__ */ registry();

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/api.js
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
var TimePrecision = {
  Any: null,
  Minute: -1,
  Second: 0,
  Millisecond: 3,
  Microsecond: 6
};
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new \$ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new \$ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new \$ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new \$ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _positive(params) {
  return _gt(0, params);
}
function _negative(params) {
  return _lt(0, params);
}
function _nonpositive(params) {
  return _lte(0, params);
}
function _nonnegative(params) {
  return _gte(0, params);
}
function _multipleOf(value, params) {
  return new \$ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxSize(maximum, params) {
  return new \$ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
function _minSize(minimum, params) {
  return new \$ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
function _size(size, params) {
  return new \$ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
function _maxLength(maximum, params) {
  const ch = new \$ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new \$ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new \$ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new \$ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new \$ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new \$ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new \$ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new \$ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new \$ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _property(property, schema, params) {
  return new \$ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
function _mime(types, params) {
  return new \$ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
function _overwrite(tx) {
  return new \$ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
function _union(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
function _intersection(Class2, left, right) {
  return new Class2({
    type: "intersection",
    left,
    right
  });
}
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof \$ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    type: "map",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params)
  });
}
function _enum(Class2, values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
function _nativeEnum(Class2, entries, params) {
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
function _transform(Class2, fn) {
  return new Class2({
    type: "transform",
    transform: fn
  });
}
function _optional(Class2, innerType) {
  return new Class2({
    type: "optional",
    innerType
  });
}
function _nullable(Class2, innerType) {
  return new Class2({
    type: "nullable",
    innerType
  });
}
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
function _success(Class2, innerType) {
  return new Class2({
    type: "success",
    innerType
  });
}
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
function _pipe(Class2, in_, out) {
  return new Class2({
    type: "pipe",
    in: in_,
    out
  });
}
function _readonly(Class2, innerType) {
  return new Class2({
    type: "readonly",
    innerType
  });
}
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    type: "template_literal",
    parts,
    ...normalizeParams(params)
  });
}
function _lazy(Class2, getter) {
  return new Class2({
    type: "lazy",
    getter
  });
}
function _promise(Class2, innerType) {
  return new Class2({
    type: "promise",
    innerType
  });
}
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
    falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Pipe = Classes.Pipe ?? \$ZodPipe;
  const _Boolean = Classes.Boolean ?? \$ZodBoolean;
  const _String = Classes.String ?? \$ZodString;
  const _Transform = Classes.Transform ?? \$ZodTransform;
  const tx = new _Transform({
    type: "transform",
    transform: (input, payload) => {
      let data = input;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: tx
        });
        return {};
      }
    },
    error: params.error
  });
  const innerPipe = new _Pipe({
    type: "pipe",
    in: new _String({ type: "string", error: params.error }),
    out: tx,
    error: params.error
  });
  const outerPipe = new _Pipe({
    type: "pipe",
    in: innerPipe,
    out: new _Boolean({
      type: "boolean",
      error: params.error
    }),
    error: params.error
  });
  return outerPipe;
}
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    ...normalizeParams(_params),
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/function.js
var \$ZodFunction = class {
  constructor(def) {
    this._def = def;
    this.def = def;
  }
  implement(func) {
    if (typeof func !== "function") {
      throw new Error("implement() must be called with a function");
    }
    const impl = ((...args) => {
      const parsedArgs = this._def.input ? parse(this._def.input, args, void 0, { callee: impl }) : args;
      if (!Array.isArray(parsedArgs)) {
        throw new Error("Invalid arguments schema: not an array or tuple schema.");
      }
      const output = func(...parsedArgs);
      return this._def.output ? parse(this._def.output, output, void 0, { callee: impl }) : output;
    });
    return impl;
  }
  implementAsync(func) {
    if (typeof func !== "function") {
      throw new Error("implement() must be called with a function");
    }
    const impl = (async (...args) => {
      const parsedArgs = this._def.input ? await parseAsync(this._def.input, args, void 0, { callee: impl }) : args;
      if (!Array.isArray(parsedArgs)) {
        throw new Error("Invalid arguments schema: not an array or tuple schema.");
      }
      const output = await func(...parsedArgs);
      return this._def.output ? parseAsync(this._def.output, output, void 0, { callee: impl }) : output;
    });
    return impl;
  }
  input(...args) {
    const F = this.constructor;
    if (Array.isArray(args[0])) {
      return new F({
        type: "function",
        input: new \$ZodTuple({
          type: "tuple",
          items: args[0],
          rest: args[1]
        }),
        output: this._def.output
      });
    }
    return new F({
      type: "function",
      input: args[0],
      output: this._def.output
    });
  }
  output(output) {
    const F = this.constructor;
    return new F({
      type: "function",
      input: this._def.input,
      output
    });
  }
};
function _function(params) {
  return new \$ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? _tuple(\$ZodTuple, params?.input) : params?.input ?? _array(\$ZodArray, _unknown(\$ZodUnknown)),
    output: params?.output ?? _unknown(\$ZodUnknown)
  });
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/to-json-schema.js
var JSONSchemaGenerator = class {
  constructor(params) {
    this.counter = 0;
    this.metadataRegistry = params?.metadata ?? globalRegistry;
    this.target = params?.target ?? "draft-2020-12";
    this.unrepresentable = params?.unrepresentable ?? "throw";
    this.override = params?.override ?? (() => {
    });
    this.io = params?.io ?? "output";
    this.seen = /* @__PURE__ */ new Map();
  }
  process(schema, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    const formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    };
    const seen = this.seen.get(schema);
    if (seen) {
      seen.count++;
      const isCycle = _params.schemaPath.includes(schema);
      if (isCycle) {
        seen.cycle = _params.path;
      }
      return seen.schema;
    }
    const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
    this.seen.set(schema, result);
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
      result.schema = overrideSchema;
    } else {
      const params = {
        ..._params,
        schemaPath: [..._params.schemaPath, schema],
        path: _params.path
      };
      const parent = schema._zod.parent;
      if (parent) {
        result.ref = parent;
        this.process(parent, params);
        this.seen.get(parent).isParent = true;
      } else {
        const _json = result.schema;
        switch (def.type) {
          case "string": {
            const json2 = _json;
            json2.type = "string";
            const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
            if (typeof minimum === "number")
              json2.minLength = minimum;
            if (typeof maximum === "number")
              json2.maxLength = maximum;
            if (format) {
              json2.format = formatMap[format] ?? format;
              if (json2.format === "")
                delete json2.format;
            }
            if (contentEncoding)
              json2.contentEncoding = contentEncoding;
            if (patterns && patterns.size > 0) {
              const regexes = [...patterns];
              if (regexes.length === 1)
                json2.pattern = regexes[0].source;
              else if (regexes.length > 1) {
                result.schema.allOf = [
                  ...regexes.map((regex) => ({
                    ...this.target === "draft-7" ? { type: "string" } : {},
                    pattern: regex.source
                  }))
                ];
              }
            }
            break;
          }
          case "number": {
            const json2 = _json;
            const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
            if (typeof format === "string" && format.includes("int"))
              json2.type = "integer";
            else
              json2.type = "number";
            if (typeof exclusiveMinimum === "number")
              json2.exclusiveMinimum = exclusiveMinimum;
            if (typeof minimum === "number") {
              json2.minimum = minimum;
              if (typeof exclusiveMinimum === "number") {
                if (exclusiveMinimum >= minimum)
                  delete json2.minimum;
                else
                  delete json2.exclusiveMinimum;
              }
            }
            if (typeof exclusiveMaximum === "number")
              json2.exclusiveMaximum = exclusiveMaximum;
            if (typeof maximum === "number") {
              json2.maximum = maximum;
              if (typeof exclusiveMaximum === "number") {
                if (exclusiveMaximum <= maximum)
                  delete json2.maximum;
                else
                  delete json2.exclusiveMaximum;
              }
            }
            if (typeof multipleOf === "number")
              json2.multipleOf = multipleOf;
            break;
          }
          case "boolean": {
            const json2 = _json;
            json2.type = "boolean";
            break;
          }
          case "bigint": {
            if (this.unrepresentable === "throw") {
              throw new Error("BigInt cannot be represented in JSON Schema");
            }
            break;
          }
          case "symbol": {
            if (this.unrepresentable === "throw") {
              throw new Error("Symbols cannot be represented in JSON Schema");
            }
            break;
          }
          case "null": {
            _json.type = "null";
            break;
          }
          case "any": {
            break;
          }
          case "unknown": {
            break;
          }
          case "undefined": {
            if (this.unrepresentable === "throw") {
              throw new Error("Undefined cannot be represented in JSON Schema");
            }
            break;
          }
          case "void": {
            if (this.unrepresentable === "throw") {
              throw new Error("Void cannot be represented in JSON Schema");
            }
            break;
          }
          case "never": {
            _json.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw") {
              throw new Error("Date cannot be represented in JSON Schema");
            }
            break;
          }
          case "array": {
            const json2 = _json;
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json2.minItems = minimum;
            if (typeof maximum === "number")
              json2.maxItems = maximum;
            json2.type = "array";
            json2.items = this.process(def.element, { ...params, path: [...params.path, "items"] });
            break;
          }
          case "object": {
            const json2 = _json;
            json2.type = "object";
            json2.properties = {};
            const shape = def.shape;
            for (const key in shape) {
              json2.properties[key] = this.process(shape[key], {
                ...params,
                path: [...params.path, "properties", key]
              });
            }
            const allKeys = new Set(Object.keys(shape));
            const requiredKeys = new Set([...allKeys].filter((key) => {
              const v = def.shape[key]._zod;
              if (this.io === "input") {
                return v.optin === void 0;
              } else {
                return v.optout === void 0;
              }
            }));
            if (requiredKeys.size > 0) {
              json2.required = Array.from(requiredKeys);
            }
            if (def.catchall?._zod.def.type === "never") {
              json2.additionalProperties = false;
            } else if (!def.catchall) {
              if (this.io === "output")
                json2.additionalProperties = false;
            } else if (def.catchall) {
              json2.additionalProperties = this.process(def.catchall, {
                ...params,
                path: [...params.path, "additionalProperties"]
              });
            }
            break;
          }
          case "union": {
            const json2 = _json;
            json2.anyOf = def.options.map((x, i) => this.process(x, {
              ...params,
              path: [...params.path, "anyOf", i]
            }));
            break;
          }
          case "intersection": {
            const json2 = _json;
            const a = this.process(def.left, {
              ...params,
              path: [...params.path, "allOf", 0]
            });
            const b = this.process(def.right, {
              ...params,
              path: [...params.path, "allOf", 1]
            });
            const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
            const allOf = [
              ...isSimpleIntersection(a) ? a.allOf : [a],
              ...isSimpleIntersection(b) ? b.allOf : [b]
            ];
            json2.allOf = allOf;
            break;
          }
          case "tuple": {
            const json2 = _json;
            json2.type = "array";
            const prefixItems = def.items.map((x, i) => this.process(x, { ...params, path: [...params.path, "prefixItems", i] }));
            if (this.target === "draft-2020-12") {
              json2.prefixItems = prefixItems;
            } else {
              json2.items = prefixItems;
            }
            if (def.rest) {
              const rest = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
              if (this.target === "draft-2020-12") {
                json2.items = rest;
              } else {
                json2.additionalItems = rest;
              }
            }
            if (def.rest) {
              json2.items = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
            }
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json2.minItems = minimum;
            if (typeof maximum === "number")
              json2.maxItems = maximum;
            break;
          }
          case "record": {
            const json2 = _json;
            json2.type = "object";
            json2.propertyNames = this.process(def.keyType, { ...params, path: [...params.path, "propertyNames"] });
            json2.additionalProperties = this.process(def.valueType, {
              ...params,
              path: [...params.path, "additionalProperties"]
            });
            break;
          }
          case "map": {
            if (this.unrepresentable === "throw") {
              throw new Error("Map cannot be represented in JSON Schema");
            }
            break;
          }
          case "set": {
            if (this.unrepresentable === "throw") {
              throw new Error("Set cannot be represented in JSON Schema");
            }
            break;
          }
          case "enum": {
            const json2 = _json;
            const values = getEnumValues(def.entries);
            if (values.every((v) => typeof v === "number"))
              json2.type = "number";
            if (values.every((v) => typeof v === "string"))
              json2.type = "string";
            json2.enum = values;
            break;
          }
          case "literal": {
            const json2 = _json;
            const vals = [];
            for (const val of def.values) {
              if (val === void 0) {
                if (this.unrepresentable === "throw") {
                  throw new Error("Literal \`undefined\` cannot be represented in JSON Schema");
                } else {
                }
              } else if (typeof val === "bigint") {
                if (this.unrepresentable === "throw") {
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                } else {
                  vals.push(Number(val));
                }
              } else {
                vals.push(val);
              }
            }
            if (vals.length === 0) {
            } else if (vals.length === 1) {
              const val = vals[0];
              json2.type = val === null ? "null" : typeof val;
              json2.const = val;
            } else {
              if (vals.every((v) => typeof v === "number"))
                json2.type = "number";
              if (vals.every((v) => typeof v === "string"))
                json2.type = "string";
              if (vals.every((v) => typeof v === "boolean"))
                json2.type = "string";
              if (vals.every((v) => v === null))
                json2.type = "null";
              json2.enum = vals;
            }
            break;
          }
          case "file": {
            const json2 = _json;
            const file2 = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            };
            const { minimum, maximum, mime } = schema._zod.bag;
            if (minimum !== void 0)
              file2.minLength = minimum;
            if (maximum !== void 0)
              file2.maxLength = maximum;
            if (mime) {
              if (mime.length === 1) {
                file2.contentMediaType = mime[0];
                Object.assign(json2, file2);
              } else {
                json2.anyOf = mime.map((m) => {
                  const mFile = { ...file2, contentMediaType: m };
                  return mFile;
                });
              }
            } else {
              Object.assign(json2, file2);
            }
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw") {
              throw new Error("Transforms cannot be represented in JSON Schema");
            }
            break;
          }
          case "nullable": {
            const inner = this.process(def.innerType, params);
            _json.anyOf = [inner, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "success": {
            const json2 = _json;
            json2.type = "boolean";
            break;
          }
          case "default": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.default = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "prefault": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            if (this.io === "input")
              _json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "catch": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            let catchValue;
            try {
              catchValue = def.catchValue(void 0);
            } catch {
              throw new Error("Dynamic catch values are not supported in JSON Schema");
            }
            _json.default = catchValue;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw") {
              throw new Error("NaN cannot be represented in JSON Schema");
            }
            break;
          }
          case "template_literal": {
            const json2 = _json;
            const pattern = schema._zod.pattern;
            if (!pattern)
              throw new Error("Pattern not found in template literal");
            json2.type = "string";
            json2.pattern = pattern.source;
            break;
          }
          case "pipe": {
            const innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "readonly": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.readOnly = true;
            break;
          }
          // passthrough types
          case "promise": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "optional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "lazy": {
            const innerType = schema._zod.innerType;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "custom": {
            if (this.unrepresentable === "throw") {
              throw new Error("Custom types cannot be represented in JSON Schema");
            }
            break;
          }
          default: {
            def;
          }
        }
      }
    }
    const meta = this.metadataRegistry.get(schema);
    if (meta)
      Object.assign(result.schema, meta);
    if (this.io === "input" && isTransforming(schema)) {
      delete result.schema.examples;
      delete result.schema.default;
    }
    if (this.io === "input" && result.schema._prefault)
      (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    const _result = this.seen.get(schema);
    return _result.schema;
  }
  emit(schema, _params) {
    const params = {
      cycles: _params?.cycles ?? "ref",
      reused: _params?.reused ?? "inline",
      // unrepresentable: _params?.unrepresentable ?? "throw",
      // uri: _params?.uri ?? ((id) => \`\${id}\`),
      external: _params?.external ?? void 0
    };
    const root = this.seen.get(schema);
    if (!root)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    const makeURI = (entry) => {
      const defsSegment = this.target === "draft-2020-12" ? "\$defs" : "definitions";
      if (params.external) {
        const externalId = params.external.registry.get(entry[0])?.id;
        const uriGenerator = params.external.uri ?? ((id2) => id2);
        if (externalId) {
          return { ref: uriGenerator(externalId) };
        }
        const id = entry[1].defId ?? entry[1].schema.id ?? \`schema\${this.counter++}\`;
        entry[1].defId = id;
        return { defId: id, ref: \`\${uriGenerator("__shared")}#/\${defsSegment}/\${id}\` };
      }
      if (entry[1] === root) {
        return { ref: "#" };
      }
      const uriPrefix = \`#\`;
      const defUriPrefix = \`\${uriPrefix}/\${defsSegment}/\`;
      const defId = entry[1].schema.id ?? \`__schema\${this.counter++}\`;
      return { defId, ref: defUriPrefix + defId };
    };
    const extractToDef = (entry) => {
      if (entry[1].schema.\$ref) {
        return;
      }
      const seen = entry[1];
      const { ref, defId } = makeURI(entry);
      seen.def = { ...seen.schema };
      if (defId)
        seen.defId = defId;
      const schema2 = seen.schema;
      for (const key in schema2) {
        delete schema2[key];
      }
      schema2.\$ref = ref;
    };
    if (params.cycles === "throw") {
      for (const entry of this.seen.entries()) {
        const seen = entry[1];
        if (seen.cycle) {
          throw new Error(\`Cycle detected: #/\${seen.cycle?.join("/")}/<root>

Set the \\\`cycles\\\` parameter to \\\`"ref"\\\` to resolve cyclical schemas with defs.\`);
        }
      }
    }
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (schema === entry[0]) {
        extractToDef(entry);
        continue;
      }
      if (params.external) {
        const ext = params.external.registry.get(entry[0])?.id;
        if (schema !== entry[0] && ext) {
          extractToDef(entry);
          continue;
        }
      }
      const id = this.metadataRegistry.get(entry[0])?.id;
      if (id) {
        extractToDef(entry);
        continue;
      }
      if (seen.cycle) {
        extractToDef(entry);
        continue;
      }
      if (seen.count > 1) {
        if (params.reused === "ref") {
          extractToDef(entry);
          continue;
        }
      }
    }
    const flattenRef = (zodSchema, params2) => {
      const seen = this.seen.get(zodSchema);
      const schema2 = seen.def ?? seen.schema;
      const _cached = { ...schema2 };
      if (seen.ref === null) {
        return;
      }
      const ref = seen.ref;
      seen.ref = null;
      if (ref) {
        flattenRef(ref, params2);
        const refSchema = this.seen.get(ref).schema;
        if (refSchema.\$ref && params2.target === "draft-7") {
          schema2.allOf = schema2.allOf ?? [];
          schema2.allOf.push(refSchema);
        } else {
          Object.assign(schema2, refSchema);
          Object.assign(schema2, _cached);
        }
      }
      if (!seen.isParent)
        this.override({
          zodSchema,
          jsonSchema: schema2,
          path: seen.path ?? []
        });
    };
    for (const entry of [...this.seen.entries()].reverse()) {
      flattenRef(entry[0], { target: this.target });
    }
    const result = {};
    if (this.target === "draft-2020-12") {
      result.\$schema = "https://json-schema.org/draft/2020-12/schema";
    } else if (this.target === "draft-7") {
      result.\$schema = "http://json-schema.org/draft-07/schema#";
    } else {
      console.warn(\`Invalid target: \${this.target}\`);
    }
    if (params.external?.uri) {
      const id = params.external.registry.get(schema)?.id;
      if (!id)
        throw new Error("Schema is missing an \`id\` property");
      result.\$id = params.external.uri(id);
    }
    Object.assign(result, root.def);
    const defs = params.external?.defs ?? {};
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        defs[seen.defId] = seen.def;
      }
    }
    if (params.external) {
    } else {
      if (Object.keys(defs).length > 0) {
        if (this.target === "draft-2020-12") {
          result.\$defs = defs;
        } else {
          result.definitions = defs;
        }
      }
    }
    try {
      return JSON.parse(JSON.stringify(result));
    } catch (_err) {
      throw new Error("Error converting schema to JSON.");
    }
  }
};
function toJSONSchema(input, _params) {
  if (input instanceof \$ZodRegistry) {
    const gen2 = new JSONSchemaGenerator(_params);
    const defs = {};
    for (const entry of input._idmap.entries()) {
      const [_, schema] = entry;
      gen2.process(schema);
    }
    const schemas = {};
    const external = {
      registry: input,
      uri: _params?.uri,
      defs
    };
    for (const entry of input._idmap.entries()) {
      const [key, schema] = entry;
      schemas[key] = gen2.emit(schema, {
        ..._params,
        external
      });
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = gen2.target === "draft-2020-12" ? "\$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const gen = new JSONSchemaGenerator(_params);
  gen.process(input);
  return gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const schema = _schema;
  const def = schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return false;
    case "array": {
      return isTransforming(def.element, ctx);
    }
    case "object": {
      for (const key in def.shape) {
        if (isTransforming(def.shape[key], ctx))
          return true;
      }
      return false;
    }
    case "union": {
      for (const option of def.options) {
        if (isTransforming(option, ctx))
          return true;
      }
      return false;
    }
    case "intersection": {
      return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    case "tuple": {
      for (const item of def.items) {
        if (isTransforming(item, ctx))
          return true;
      }
      if (def.rest && isTransforming(def.rest, ctx))
        return true;
      return false;
    }
    case "record": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "map": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "set": {
      return isTransforming(def.valueType, ctx);
    }
    // inner types
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return isTransforming(def.innerType, ctx);
    case "lazy":
      return isTransforming(def.getter(), ctx);
    case "default": {
      return isTransforming(def.innerType, ctx);
    }
    case "prefault": {
      return isTransforming(def.innerType, ctx);
    }
    case "custom": {
      return false;
    }
    case "transform": {
      return true;
    }
    case "pipe": {
      return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    case "success": {
      return false;
    }
    case "catch": {
      return false;
    }
    default:
      def;
  }
  throw new Error(\`Unknown schema type: \${def.type}\`);
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
var ZodISODateTime = /* @__PURE__ */ \$constructor("ZodISODateTime", (inst, def) => {
  \$ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ \$constructor("ZodISODate", (inst, def) => {
  \$ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ \$constructor("ZodISOTime", (inst, def) => {
  \$ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ \$constructor("ZodISODuration", (inst, def) => {
  \$ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  \$ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => inst.issues.push(issue2)
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => inst.issues.push(...issues2)
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
var ZodError = \$constructor("ZodError", initializer2);
var ZodRealError = \$constructor("ZodError", initializer2, {
  Parent: Error
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/schemas.js
var ZodType = /* @__PURE__ */ \$constructor("ZodType", (inst, def) => {
  \$ZodType.init(inst, def);
  inst.def = def;
  Object.defineProperty(inst, "_def", { value: def });
  inst.check = (...checks) => {
    return inst.clone(
      {
        ...def,
        checks: [
          ...def.checks ?? [],
          ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }
      // { parent: true }
    );
  };
  inst.clone = (def2, params) => clone(inst, def2, params);
  inst.brand = () => inst;
  inst.register = ((reg, meta) => {
    reg.add(inst, meta);
    return inst;
  });
  inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.refine = (check2, params) => inst.check(refine(check2, params));
  inst.superRefine = (refinement) => inst.check(superRefine(refinement));
  inst.overwrite = (fn) => inst.check(_overwrite(fn));
  inst.optional = () => optional(inst);
  inst.nullable = () => nullable(inst);
  inst.nullish = () => optional(nullable(inst));
  inst.nonoptional = (params) => nonoptional(inst, params);
  inst.array = () => array(inst);
  inst.or = (arg) => union([inst, arg]);
  inst.and = (arg) => intersection(inst, arg);
  inst.transform = (tx) => pipe(inst, transform(tx));
  inst.default = (def2) => _default2(inst, def2);
  inst.prefault = (def2) => prefault(inst, def2);
  inst.catch = (params) => _catch2(inst, params);
  inst.pipe = (target) => pipe(inst, target);
  inst.readonly = () => readonly(inst);
  inst.describe = (description) => {
    const cl = inst.clone();
    globalRegistry.add(cl, { description });
    return cl;
  };
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  inst.meta = (...args) => {
    if (args.length === 0) {
      return globalRegistry.get(inst);
    }
    const cl = inst.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  };
  inst.isOptional = () => inst.safeParse(void 0).success;
  inst.isNullable = () => inst.safeParse(null).success;
  return inst;
});
var _ZodString = /* @__PURE__ */ \$constructor("_ZodString", (inst, def) => {
  \$ZodString.init(inst, def);
  ZodType.init(inst, def);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  inst.regex = (...args) => inst.check(_regex(...args));
  inst.includes = (...args) => inst.check(_includes(...args));
  inst.startsWith = (...args) => inst.check(_startsWith(...args));
  inst.endsWith = (...args) => inst.check(_endsWith(...args));
  inst.min = (...args) => inst.check(_minLength(...args));
  inst.max = (...args) => inst.check(_maxLength(...args));
  inst.length = (...args) => inst.check(_length(...args));
  inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
  inst.lowercase = (params) => inst.check(_lowercase(params));
  inst.uppercase = (params) => inst.check(_uppercase(params));
  inst.trim = () => inst.check(_trim());
  inst.normalize = (...args) => inst.check(_normalize(...args));
  inst.toLowerCase = () => inst.check(_toLowerCase());
  inst.toUpperCase = () => inst.check(_toUpperCase());
});
var ZodString = /* @__PURE__ */ \$constructor("ZodString", (inst, def) => {
  \$ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ \$constructor("ZodStringFormat", (inst, def) => {
  \$ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ \$constructor("ZodEmail", (inst, def) => {
  \$ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
var ZodGUID = /* @__PURE__ */ \$constructor("ZodGUID", (inst, def) => {
  \$ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function guid2(params) {
  return _guid(ZodGUID, params);
}
var ZodUUID = /* @__PURE__ */ \$constructor("ZodUUID", (inst, def) => {
  \$ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function uuid2(params) {
  return _uuid(ZodUUID, params);
}
function uuidv4(params) {
  return _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
  return _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
  return _uuidv7(ZodUUID, params);
}
var ZodURL = /* @__PURE__ */ \$constructor("ZodURL", (inst, def) => {
  \$ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
var ZodEmoji = /* @__PURE__ */ \$constructor("ZodEmoji", (inst, def) => {
  \$ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function emoji2(params) {
  return _emoji2(ZodEmoji, params);
}
var ZodNanoID = /* @__PURE__ */ \$constructor("ZodNanoID", (inst, def) => {
  \$ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function nanoid2(params) {
  return _nanoid(ZodNanoID, params);
}
var ZodCUID = /* @__PURE__ */ \$constructor("ZodCUID", (inst, def) => {
  \$ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid3(params) {
  return _cuid(ZodCUID, params);
}
var ZodCUID2 = /* @__PURE__ */ \$constructor("ZodCUID2", (inst, def) => {
  \$ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid22(params) {
  return _cuid2(ZodCUID2, params);
}
var ZodULID = /* @__PURE__ */ \$constructor("ZodULID", (inst, def) => {
  \$ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ulid2(params) {
  return _ulid(ZodULID, params);
}
var ZodXID = /* @__PURE__ */ \$constructor("ZodXID", (inst, def) => {
  \$ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function xid2(params) {
  return _xid(ZodXID, params);
}
var ZodKSUID = /* @__PURE__ */ \$constructor("ZodKSUID", (inst, def) => {
  \$ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ksuid2(params) {
  return _ksuid(ZodKSUID, params);
}
var ZodIPv4 = /* @__PURE__ */ \$constructor("ZodIPv4", (inst, def) => {
  \$ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv42(params) {
  return _ipv4(ZodIPv4, params);
}
var ZodIPv6 = /* @__PURE__ */ \$constructor("ZodIPv6", (inst, def) => {
  \$ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv62(params) {
  return _ipv6(ZodIPv6, params);
}
var ZodCIDRv4 = /* @__PURE__ */ \$constructor("ZodCIDRv4", (inst, def) => {
  \$ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv42(params) {
  return _cidrv4(ZodCIDRv4, params);
}
var ZodCIDRv6 = /* @__PURE__ */ \$constructor("ZodCIDRv6", (inst, def) => {
  \$ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv62(params) {
  return _cidrv6(ZodCIDRv6, params);
}
var ZodBase64 = /* @__PURE__ */ \$constructor("ZodBase64", (inst, def) => {
  \$ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base642(params) {
  return _base64(ZodBase64, params);
}
var ZodBase64URL = /* @__PURE__ */ \$constructor("ZodBase64URL", (inst, def) => {
  \$ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base64url2(params) {
  return _base64url(ZodBase64URL, params);
}
var ZodE164 = /* @__PURE__ */ \$constructor("ZodE164", (inst, def) => {
  \$ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function e1642(params) {
  return _e164(ZodE164, params);
}
var ZodJWT = /* @__PURE__ */ \$constructor("ZodJWT", (inst, def) => {
  \$ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function jwt(params) {
  return _jwt(ZodJWT, params);
}
var ZodCustomStringFormat = /* @__PURE__ */ \$constructor("ZodCustomStringFormat", (inst, def) => {
  \$ZodCustomStringFormat.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function stringFormat(format, fnOrRegex, _params = {}) {
  return _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
var ZodNumber = /* @__PURE__ */ \$constructor("ZodNumber", (inst, def) => {
  \$ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.int = (params) => inst.check(int(params));
  inst.safe = (params) => inst.check(int(params));
  inst.positive = (params) => inst.check(_gt(0, params));
  inst.nonnegative = (params) => inst.check(_gte(0, params));
  inst.negative = (params) => inst.check(_lt(0, params));
  inst.nonpositive = (params) => inst.check(_lte(0, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  inst.step = (value, params) => inst.check(_multipleOf(value, params));
  inst.finite = () => inst;
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ \$constructor("ZodNumberFormat", (inst, def) => {
  \$ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
function float32(params) {
  return _float32(ZodNumberFormat, params);
}
function float64(params) {
  return _float64(ZodNumberFormat, params);
}
function int32(params) {
  return _int32(ZodNumberFormat, params);
}
function uint32(params) {
  return _uint32(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ \$constructor("ZodBoolean", (inst, def) => {
  \$ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ \$constructor("ZodBigInt", (inst, def) => {
  \$ZodBigInt.init(inst, def);
  ZodType.init(inst, def);
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.positive = (params) => inst.check(_gt(BigInt(0), params));
  inst.negative = (params) => inst.check(_lt(BigInt(0), params));
  inst.nonpositive = (params) => inst.check(_lte(BigInt(0), params));
  inst.nonnegative = (params) => inst.check(_gte(BigInt(0), params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  const bag = inst._zod.bag;
  inst.minValue = bag.minimum ?? null;
  inst.maxValue = bag.maximum ?? null;
  inst.format = bag.format ?? null;
});
function bigint2(params) {
  return _bigint(ZodBigInt, params);
}
var ZodBigIntFormat = /* @__PURE__ */ \$constructor("ZodBigIntFormat", (inst, def) => {
  \$ZodBigIntFormat.init(inst, def);
  ZodBigInt.init(inst, def);
});
function int64(params) {
  return _int64(ZodBigIntFormat, params);
}
function uint64(params) {
  return _uint64(ZodBigIntFormat, params);
}
var ZodSymbol = /* @__PURE__ */ \$constructor("ZodSymbol", (inst, def) => {
  \$ZodSymbol.init(inst, def);
  ZodType.init(inst, def);
});
function symbol(params) {
  return _symbol(ZodSymbol, params);
}
var ZodUndefined = /* @__PURE__ */ \$constructor("ZodUndefined", (inst, def) => {
  \$ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
});
function _undefined3(params) {
  return _undefined2(ZodUndefined, params);
}
var ZodNull = /* @__PURE__ */ \$constructor("ZodNull", (inst, def) => {
  \$ZodNull.init(inst, def);
  ZodType.init(inst, def);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodAny = /* @__PURE__ */ \$constructor("ZodAny", (inst, def) => {
  \$ZodAny.init(inst, def);
  ZodType.init(inst, def);
});
function any() {
  return _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ \$constructor("ZodUnknown", (inst, def) => {
  \$ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ \$constructor("ZodNever", (inst, def) => {
  \$ZodNever.init(inst, def);
  ZodType.init(inst, def);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodVoid = /* @__PURE__ */ \$constructor("ZodVoid", (inst, def) => {
  \$ZodVoid.init(inst, def);
  ZodType.init(inst, def);
});
function _void2(params) {
  return _void(ZodVoid, params);
}
var ZodDate = /* @__PURE__ */ \$constructor("ZodDate", (inst, def) => {
  \$ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  const c = inst._zod.bag;
  inst.minDate = c.minimum ? new Date(c.minimum) : null;
  inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
function date3(params) {
  return _date(ZodDate, params);
}
var ZodArray = /* @__PURE__ */ \$constructor("ZodArray", (inst, def) => {
  \$ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst.element = def.element;
  inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
  inst.nonempty = (params) => inst.check(_minLength(1, params));
  inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
  inst.length = (len, params) => inst.check(_length(len, params));
  inst.unwrap = () => inst.element;
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return literal(Object.keys(shape));
}
var ZodObject = /* @__PURE__ */ \$constructor("ZodObject", (inst, def) => {
  \$ZodObject.init(inst, def);
  ZodType.init(inst, def);
  util_exports.defineLazy(inst, "shape", () => def.shape);
  inst.keyof = () => _enum2(Object.keys(inst._zod.def.shape));
  inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall });
  inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never() });
  inst.strip = () => inst.clone({ ...inst._zod.def, catchall: void 0 });
  inst.extend = (incoming) => {
    return util_exports.extend(inst, incoming);
  };
  inst.merge = (other) => util_exports.merge(inst, other);
  inst.pick = (mask) => util_exports.pick(inst, mask);
  inst.omit = (mask) => util_exports.omit(inst, mask);
  inst.partial = (...args) => util_exports.partial(ZodOptional, inst, args[0]);
  inst.required = (...args) => util_exports.required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
  const def = {
    type: "object",
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ \$constructor("ZodUnion", (inst, def) => {
  \$ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ \$constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  \$ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ \$constructor("ZodIntersection", (inst, def) => {
  \$ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodTuple = /* @__PURE__ */ \$constructor("ZodTuple", (inst, def) => {
  \$ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst.rest = (rest) => inst.clone({
    ...inst._zod.def,
    rest
  });
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof \$ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
var ZodRecord = /* @__PURE__ */ \$constructor("ZodRecord", (inst, def) => {
  \$ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType: union([keyType, never()]),
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodMap = /* @__PURE__ */ \$constructor("ZodMap", (inst, def) => {
  \$ZodMap.init(inst, def);
  ZodType.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function map(keyType, valueType, params) {
  return new ZodMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSet = /* @__PURE__ */ \$constructor("ZodSet", (inst, def) => {
  \$ZodSet.init(inst, def);
  ZodType.init(inst, def);
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ \$constructor("ZodEnum", (inst, def) => {
  \$ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(\`Key \${value} not found in enum\`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(\`Key \${value} not found in enum\`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum2(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries, params) {
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ \$constructor("ZodLiteral", (inst, def) => {
  \$ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use \`.values\` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodFile = /* @__PURE__ */ \$constructor("ZodFile", (inst, def) => {
  \$ZodFile.init(inst, def);
  ZodType.init(inst, def);
  inst.min = (size, params) => inst.check(_minSize(size, params));
  inst.max = (size, params) => inst.check(_maxSize(size, params));
  inst.mime = (types, params) => inst.check(_mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
  return _file(ZodFile, params);
}
var ZodTransform = /* @__PURE__ */ \$constructor("ZodTransform", (inst, def) => {
  \$ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        _issue.continue ?? (_issue.continue = true);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ \$constructor("ZodOptional", (inst, def) => {
  \$ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ \$constructor("ZodNullable", (inst, def) => {
  \$ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
var ZodDefault = /* @__PURE__ */ \$constructor("ZodDefault", (inst, def) => {
  \$ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodPrefault = /* @__PURE__ */ \$constructor("ZodPrefault", (inst, def) => {
  \$ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ \$constructor("ZodNonOptional", (inst, def) => {
  \$ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSuccess = /* @__PURE__ */ \$constructor("ZodSuccess", (inst, def) => {
  \$ZodSuccess.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
  return new ZodSuccess({
    type: "success",
    innerType
  });
}
var ZodCatch = /* @__PURE__ */ \$constructor("ZodCatch", (inst, def) => {
  \$ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch2(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodNaN = /* @__PURE__ */ \$constructor("ZodNaN", (inst, def) => {
  \$ZodNaN.init(inst, def);
  ZodType.init(inst, def);
});
function nan(params) {
  return _nan(ZodNaN, params);
}
var ZodPipe = /* @__PURE__ */ \$constructor("ZodPipe", (inst, def) => {
  \$ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodReadonly = /* @__PURE__ */ \$constructor("ZodReadonly", (inst, def) => {
  \$ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodTemplateLiteral = /* @__PURE__ */ \$constructor("ZodTemplateLiteral", (inst, def) => {
  \$ZodTemplateLiteral.init(inst, def);
  ZodType.init(inst, def);
});
function templateLiteral(parts, params) {
  return new ZodTemplateLiteral({
    type: "template_literal",
    parts,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLazy = /* @__PURE__ */ \$constructor("ZodLazy", (inst, def) => {
  \$ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodPromise = /* @__PURE__ */ \$constructor("ZodPromise", (inst, def) => {
  \$ZodPromise.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
  return new ZodPromise({
    type: "promise",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ \$constructor("ZodCustom", (inst, def) => {
  \$ZodCustom.init(inst, def);
  ZodType.init(inst, def);
});
function check(fn) {
  const ch = new \$ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  const ch = check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    return fn(payload.value, payload);
  });
  return ch;
}
function _instanceof(cls, params = {
  error: \`Input not instance of \${cls.name}\`
}) {
  const inst = new ZodCustom({
    type: "custom",
    check: "custom",
    fn: (data) => data instanceof cls,
    abort: true,
    ...util_exports.normalizeParams(params)
  });
  inst._zod.bag.Class = cls;
  return inst;
}
var stringbool = (...args) => _stringbool({
  Pipe: ZodPipe,
  Boolean: ZodBoolean,
  String: ZodString,
  Transform: ZodTransform
}, ...args);
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
function preprocess(fn, schema) {
  return pipe(transform(fn), schema);
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
function setErrorMap(map2) {
  config({
    customError: map2
  });
}
function getErrorMap() {
  return config().customError;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint3,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint3(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodDate, params);
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v4/classic/external.js
config(en_default());

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/schema-deserialize.js
var skippedItem = Symbol("skippedItem");
function defaultOnError(schema, fallback) {
  return schema.catch(fallback);
}
function requiredDefaultOnError(schema, fallback) {
  const schemaWithCatch = schema.catch(fallback);
  return external_exports.unknown().transform((value, context) => {
    if (value !== void 0)
      return schemaWithCatch.parse(value);
    context.addIssue({
      code: "custom",
      message: "Required value is missing"
    });
    return external_exports.NEVER;
  });
}
function stringTag(value, key) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  const tag = value[key];
  return typeof tag === "string" ? tag : void 0;
}
function excludeKnownTags(schema, key, knownTags) {
  return schema.superRefine((value, context) => {
    const tag = stringTag(value, key);
    if (tag !== void 0 && knownTags.includes(tag)) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: \`\${key} \${JSON.stringify(tag)} is reserved by a known variant, but the value does not match that variant's schema\`
      });
    }
  });
}
function preserveCustomPayload(schema, key, knownTags) {
  return external_exports.unknown().transform((value, context) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue2 of result.error.issues) {
        context.addIssue({ ...issue2, input: value });
      }
      return external_exports.NEVER;
    }
    const output = result.data;
    const tag = stringTag(value, key);
    if (tag !== void 0 && !knownTags.includes(tag)) {
      const raw = value;
      for (const [property, rawValue] of Object.entries(raw)) {
        if (property === "__proto__")
          continue;
        if (!Object.hasOwn(output, property))
          output[property] = rawValue;
      }
    }
    return output;
  });
}
function vecSkipError(itemSchema) {
  return external_exports.array(itemSchema.catch(skippedItem)).transform((items) => items.filter((item) => item !== skippedItem));
}

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/schema/zod.gen.js
var zRequestId = union([number2(), string2()]).nullable();
var zSessionId = string2();
var zWriteTextFileRequest = object({
  sessionId: zSessionId,
  path: string2(),
  content: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zReadTextFileRequest = object({
  sessionId: zSessionId,
  path: string2(),
  line: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  limit: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zToolCallId = string2();
var zToolKind = union([
  literal("read"),
  literal("edit"),
  literal("delete"),
  literal("move"),
  literal("search"),
  literal("execute"),
  literal("think"),
  literal("fetch"),
  literal("switch_mode"),
  literal("other")
]);
var zToolCallStatus = union([
  literal("pending"),
  literal("in_progress"),
  literal("completed"),
  literal("failed")
]);
var zRole = union([literal("assistant"), literal("user")]);
var zAnnotations = object({
  audience: defaultOnError(vecSkipError(zRole).nullish(), () => void 0),
  lastModified: defaultOnError(string2().nullish(), () => void 0),
  priority: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTextContent = object({
  annotations: defaultOnError(zAnnotations.nullish(), () => void 0),
  text: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zImageContent = object({
  annotations: defaultOnError(zAnnotations.nullish(), () => void 0),
  data: string2(),
  mimeType: string2(),
  uri: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAudioContent = object({
  annotations: defaultOnError(zAnnotations.nullish(), () => void 0),
  data: string2(),
  mimeType: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zResourceLink = object({
  annotations: defaultOnError(zAnnotations.nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  mimeType: defaultOnError(string2().nullish(), () => void 0),
  name: string2(),
  size: defaultOnError(number2().nullish(), () => void 0),
  title: defaultOnError(string2().nullish(), () => void 0),
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTextResourceContents = object({
  mimeType: defaultOnError(string2().nullish(), () => void 0),
  text: string2(),
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zBlobResourceContents = object({
  blob: string2(),
  mimeType: defaultOnError(string2().nullish(), () => void 0),
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zEmbeddedResourceResource = union([
  zTextResourceContents,
  zBlobResourceContents
]);
var zEmbeddedResource = object({
  annotations: defaultOnError(zAnnotations.nullish(), () => void 0),
  resource: zEmbeddedResourceResource,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zContentBlock = union([
  zTextContent.and(object({
    type: literal("text")
  })),
  zImageContent.and(object({
    type: literal("image")
  })),
  zAudioContent.and(object({
    type: literal("audio")
  })),
  zResourceLink.and(object({
    type: literal("resource_link")
  })),
  zEmbeddedResource.and(object({
    type: literal("resource")
  }))
]);
var zContent = object({
  content: zContentBlock,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDiff = object({
  path: string2(),
  oldText: defaultOnError(string2().nullish(), () => void 0),
  newText: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTerminalId = string2();
var zTerminal = object({
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zToolCallContent = union([
  zContent.and(object({
    type: literal("content")
  })),
  zDiff.and(object({
    type: literal("diff")
  })),
  zTerminal.and(object({
    type: literal("terminal")
  }))
]);
var zToolCallLocation = object({
  path: string2(),
  line: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zToolCallUpdate = object({
  toolCallId: zToolCallId,
  kind: defaultOnError(zToolKind.nullish(), () => void 0),
  status: defaultOnError(zToolCallStatus.nullish(), () => void 0),
  title: defaultOnError(string2().nullish(), () => void 0),
  name: defaultOnError(string2().nullish(), () => void 0),
  content: defaultOnError(vecSkipError(zToolCallContent).nullish(), () => void 0),
  locations: defaultOnError(vecSkipError(zToolCallLocation).nullish(), () => void 0),
  rawInput: defaultOnError(unknown().optional(), () => void 0),
  rawOutput: defaultOnError(unknown().optional(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPermissionOptionId = string2();
var zPermissionOptionKind = union([
  literal("allow_once"),
  literal("allow_always"),
  literal("reject_once"),
  literal("reject_always")
]);
var zPermissionOption = object({
  optionId: zPermissionOptionId,
  name: string2(),
  kind: zPermissionOptionKind,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zRequestPermissionRequest = object({
  sessionId: zSessionId,
  toolCall: zToolCallUpdate,
  options: array(zPermissionOption),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zEnvVariable = object({
  name: string2(),
  value: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCreateTerminalRequest = object({
  sessionId: zSessionId,
  command: string2(),
  args: defaultOnError(vecSkipError(string2()).optional(), () => []),
  env: defaultOnError(vecSkipError(zEnvVariable).optional(), () => []),
  cwd: defaultOnError(string2().nullish(), () => void 0),
  outputByteLimit: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTerminalOutputRequest = object({
  sessionId: zSessionId,
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zReleaseTerminalRequest = object({
  sessionId: zSessionId,
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zWaitForTerminalExitRequest = object({
  sessionId: zSessionId,
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zKillTerminalRequest = object({
  sessionId: zSessionId,
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationSessionScope = object({
  sessionId: zSessionId,
  toolCallId: defaultOnError(zToolCallId.nullish(), () => void 0)
});
var zElicitationRequestScope = object({
  requestId: zRequestId
});
var zElicitationSchemaType = literal("object");
var zStringFormat = union([
  literal("email"),
  literal("uri"),
  literal("date"),
  literal("date-time")
]);
var zEnumOption = object({
  const: string2(),
  title: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zStringPropertySchema = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  minLength: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(),
  maxLength: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(),
  pattern: string2().nullish(),
  format: zStringFormat.nullish(),
  default: defaultOnError(string2().nullish(), () => void 0),
  enum: array(string2()).nullish(),
  oneOf: array(zEnumOption).nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNumberPropertySchema = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  minimum: number2().nullish(),
  maximum: number2().nullish(),
  default: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zIntegerPropertySchema = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  minimum: number2().nullish(),
  maximum: number2().nullish(),
  default: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zBooleanPropertySchema = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  default: defaultOnError(boolean2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zStringMultiSelectItems = object({
  enum: array(string2()),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTitledMultiSelectItems = object({
  anyOf: array(zEnumOption),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMultiSelectItems = preserveCustomPayload(union([
  zStringMultiSelectItems.and(object({
    type: literal("string")
  })),
  excludeKnownTags(object({
    type: string2()
  }), "type", ["string"]),
  zTitledMultiSelectItems
]), "type", ["string"]);
var zMultiSelectPropertySchema = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  description: defaultOnError(string2().nullish(), () => void 0),
  minItems: number2().nullish(),
  maxItems: number2().nullish(),
  items: zMultiSelectItems,
  default: defaultOnError(vecSkipError(string2()).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationPropertySchema = preserveCustomPayload(union([
  zStringPropertySchema.and(object({
    type: literal("string")
  })),
  zNumberPropertySchema.and(object({
    type: literal("number")
  })),
  zIntegerPropertySchema.and(object({
    type: literal("integer")
  })),
  zBooleanPropertySchema.and(object({
    type: literal("boolean")
  })),
  zMultiSelectPropertySchema.and(object({
    type: literal("array")
  })),
  excludeKnownTags(object({
    type: string2()
  }), "type", ["array", "boolean", "integer", "number", "string"])
]), "type", ["array", "boolean", "integer", "number", "string"]);
var zElicitationSchema = object({
  type: defaultOnError(zElicitationSchemaType.optional().default("object"), () => "object"),
  title: defaultOnError(string2().nullish(), () => void 0),
  properties: record(string2(), zElicitationPropertySchema).optional().default({}),
  required: array(string2()).nullish(),
  description: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationFormMode = intersection(union([zElicitationSessionScope, zElicitationRequestScope]), object({
  requestedSchema: zElicitationSchema
}));
var zElicitationId = string2();
var zElicitationUrlMode = intersection(union([zElicitationSessionScope, zElicitationRequestScope]), object({
  elicitationId: zElicitationId,
  url: url()
}));
var zCreateElicitationRequest = preserveCustomPayload(intersection(union([
  zElicitationFormMode.and(object({
    mode: literal("form")
  })),
  zElicitationUrlMode.and(object({
    mode: literal("url")
  })),
  excludeKnownTags(intersection(union([zElicitationSessionScope, zElicitationRequestScope]), object({
    mode: string2()
  })), "mode", ["form", "url"])
]), object({
  message: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
})), "mode", ["form", "url"]);
var zMcpServerAcpId = string2();
var zConnectMcpRequest = object({
  serverId: zMcpServerAcpId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpConnectionId = string2();
var zMessageMcpRequest = object({
  connectionId: zMcpConnectionId,
  method: string2(),
  params: record(string2(), unknown()).nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDisconnectMcpRequest = object({
  connectionId: zMcpConnectionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zExtRequest = unknown();
var zAgentRequest = object({
  id: zRequestId,
  method: string2(),
  params: union([
    zWriteTextFileRequest,
    zReadTextFileRequest,
    zRequestPermissionRequest,
    zCreateTerminalRequest,
    zTerminalOutputRequest,
    zReleaseTerminalRequest,
    zWaitForTerminalExitRequest,
    zKillTerminalRequest,
    zCreateElicitationRequest,
    zConnectMcpRequest,
    zMessageMcpRequest,
    zDisconnectMcpRequest,
    zExtRequest
  ]).nullish()
});
var zProtocolVersion = int().gte(0).lte(65535);
var zPromptCapabilities = object({
  image: defaultOnError(boolean2().optional().default(false), () => false),
  audio: defaultOnError(boolean2().optional().default(false), () => false),
  embeddedContext: defaultOnError(boolean2().optional().default(false), () => false),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpCapabilities = object({
  http: defaultOnError(boolean2().optional().default(false), () => false),
  sse: defaultOnError(boolean2().optional().default(false), () => false),
  acp: defaultOnError(boolean2().optional().default(false), () => false),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionListCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionDeleteCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionAdditionalDirectoriesCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionForkCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionResumeCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionCloseCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionCapabilities = object({
  list: defaultOnError(zSessionListCapabilities.nullish(), () => void 0),
  delete: defaultOnError(zSessionDeleteCapabilities.nullish(), () => void 0),
  additionalDirectories: defaultOnError(zSessionAdditionalDirectoriesCapabilities.nullish(), () => void 0),
  fork: defaultOnError(zSessionForkCapabilities.nullish(), () => void 0),
  resume: defaultOnError(zSessionResumeCapabilities.nullish(), () => void 0),
  close: defaultOnError(zSessionCloseCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zLogoutCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAgentAuthCapabilities = object({
  logout: defaultOnError(zLogoutCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zProvidersCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDocumentDidOpenCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTextDocumentSyncKind = union([
  literal("full"),
  literal("incremental")
]);
var zNesDocumentDidChangeCapabilities = object({
  syncKind: zTextDocumentSyncKind,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDocumentDidCloseCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDocumentDidSaveCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDocumentDidFocusCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDocumentEventCapabilities = object({
  didOpen: defaultOnError(zNesDocumentDidOpenCapabilities.nullish(), () => void 0),
  didChange: defaultOnError(zNesDocumentDidChangeCapabilities.nullish(), () => void 0),
  didClose: defaultOnError(zNesDocumentDidCloseCapabilities.nullish(), () => void 0),
  didSave: defaultOnError(zNesDocumentDidSaveCapabilities.nullish(), () => void 0),
  didFocus: defaultOnError(zNesDocumentDidFocusCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesEventCapabilities = object({
  document: defaultOnError(zNesDocumentEventCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRecentFilesCapabilities = object({
  maxCount: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRelatedSnippetsCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesEditHistoryCapabilities = object({
  maxCount: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesUserActionsCapabilities = object({
  maxCount: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesOpenFilesCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDiagnosticsCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesContextCapabilities = object({
  recentFiles: defaultOnError(zNesRecentFilesCapabilities.nullish(), () => void 0),
  relatedSnippets: defaultOnError(zNesRelatedSnippetsCapabilities.nullish(), () => void 0),
  editHistory: defaultOnError(zNesEditHistoryCapabilities.nullish(), () => void 0),
  userActions: defaultOnError(zNesUserActionsCapabilities.nullish(), () => void 0),
  openFiles: defaultOnError(zNesOpenFilesCapabilities.nullish(), () => void 0),
  diagnostics: defaultOnError(zNesDiagnosticsCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesCapabilities = object({
  events: defaultOnError(zNesEventCapabilities.nullish(), () => void 0),
  context: defaultOnError(zNesContextCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPositionEncodingKind = union([
  literal("utf-16"),
  literal("utf-32"),
  literal("utf-8")
]);
var zAgentCapabilities = object({
  loadSession: defaultOnError(boolean2().optional().default(false), () => false),
  promptCapabilities: defaultOnError(zPromptCapabilities.optional().default({
    image: false,
    audio: false,
    embeddedContext: false
  }), () => ({
    image: false,
    audio: false,
    embeddedContext: false
  })),
  mcpCapabilities: defaultOnError(zMcpCapabilities.optional().default({
    http: false,
    sse: false,
    acp: false
  }), () => ({
    http: false,
    sse: false,
    acp: false
  })),
  sessionCapabilities: defaultOnError(zSessionCapabilities.optional().default({}), () => ({})),
  auth: defaultOnError(zAgentAuthCapabilities.optional().default({}), () => ({})),
  providers: defaultOnError(zProvidersCapabilities.nullish(), () => void 0),
  nes: defaultOnError(zNesCapabilities.nullish(), () => void 0),
  positionEncoding: defaultOnError(zPositionEncodingKind.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthMethodId = string2();
var zAuthEnvVar = object({
  name: string2(),
  label: defaultOnError(string2().nullish(), () => void 0),
  secret: defaultOnError(boolean2().optional().default(true), () => true),
  optional: defaultOnError(boolean2().optional().default(false), () => false),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthMethodEnvVar = object({
  id: zAuthMethodId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  vars: requiredDefaultOnError(vecSkipError(zAuthEnvVar), () => []),
  link: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthMethodTerminal = object({
  id: zAuthMethodId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  args: defaultOnError(vecSkipError(string2()).optional(), () => []),
  env: defaultOnError(record(string2(), string2()).optional(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthMethodAgent = object({
  id: zAuthMethodId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthMethod = union([
  zAuthMethodEnvVar.and(object({
    type: literal("env_var")
  })),
  zAuthMethodTerminal.and(object({
    type: literal("terminal")
  })),
  zAuthMethodAgent
]);
var zImplementation = object({
  name: string2(),
  title: defaultOnError(string2().nullish(), () => void 0),
  version: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zInitializeResponse = object({
  protocolVersion: zProtocolVersion,
  agentCapabilities: defaultOnError(zAgentCapabilities.optional().default({
    loadSession: false,
    promptCapabilities: {
      image: false,
      audio: false,
      embeddedContext: false
    },
    mcpCapabilities: {
      http: false,
      sse: false,
      acp: false
    },
    sessionCapabilities: {},
    auth: {}
  }), () => ({
    loadSession: false,
    promptCapabilities: {
      image: false,
      audio: false,
      embeddedContext: false
    },
    mcpCapabilities: {
      http: false,
      sse: false,
      acp: false
    },
    sessionCapabilities: {},
    auth: {}
  })),
  authMethods: defaultOnError(vecSkipError(zAuthMethod).optional().default([]), () => []),
  agentInfo: defaultOnError(zImplementation.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthenticateResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zProviderId = string2();
var zLlmProtocol = union([
  literal("anthropic"),
  literal("openai"),
  literal("azure"),
  literal("vertex"),
  literal("bedrock"),
  string2()
]);
var zProviderCurrentConfig = object({
  apiType: zLlmProtocol,
  baseUrl: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zProviderInfo = object({
  providerId: zProviderId,
  supported: requiredDefaultOnError(vecSkipError(zLlmProtocol), () => []),
  required: boolean2(),
  current: zProviderCurrentConfig.nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zListProvidersResponse = object({
  providers: array(zProviderInfo),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetProviderResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDisableProviderResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zLogoutResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionModeId = string2();
var zSessionMode = object({
  id: zSessionModeId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionModeState = object({
  currentModeId: zSessionModeId,
  availableModes: requiredDefaultOnError(vecSkipError(zSessionMode), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionConfigId = string2();
var zSessionConfigOptionCategory = union([
  literal("mode"),
  literal("model"),
  literal("model_config"),
  literal("thought_level"),
  string2()
]);
var zSessionConfigValueId = string2();
var zSessionConfigSelectOption = object({
  value: zSessionConfigValueId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionConfigGroupId = string2();
var zSessionConfigSelectGroup = object({
  group: zSessionConfigGroupId,
  name: string2(),
  options: requiredDefaultOnError(vecSkipError(zSessionConfigSelectOption), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionConfigSelectOptions = union([
  array(zSessionConfigSelectOption),
  array(zSessionConfigSelectGroup)
]);
var zSessionConfigSelect = object({
  currentValue: zSessionConfigValueId,
  options: zSessionConfigSelectOptions
});
var zSessionConfigBoolean = object({
  currentValue: boolean2()
});
var zSessionConfigOption = intersection(union([
  zSessionConfigSelect.and(object({
    type: literal("select")
  })),
  zSessionConfigBoolean.and(object({
    type: literal("boolean")
  }))
]), object({
  id: zSessionConfigId,
  name: string2(),
  description: defaultOnError(string2().nullish(), () => void 0),
  category: defaultOnError(zSessionConfigOptionCategory.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
}));
var zNewSessionResponse = object({
  sessionId: zSessionId,
  modes: defaultOnError(zSessionModeState.nullish(), () => void 0),
  configOptions: defaultOnError(vecSkipError(zSessionConfigOption).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zLoadSessionResponse = object({
  modes: defaultOnError(zSessionModeState.nullish(), () => void 0),
  configOptions: defaultOnError(vecSkipError(zSessionConfigOption).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionInfo = object({
  sessionId: zSessionId,
  cwd: string2(),
  additionalDirectories: defaultOnError(vecSkipError(string2()).optional(), () => []),
  title: defaultOnError(string2().nullish(), () => void 0),
  updatedAt: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zListSessionsResponse = object({
  sessions: requiredDefaultOnError(vecSkipError(zSessionInfo), () => []),
  nextCursor: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDeleteSessionResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zForkSessionResponse = object({
  sessionId: zSessionId,
  modes: defaultOnError(zSessionModeState.nullish(), () => void 0),
  configOptions: defaultOnError(vecSkipError(zSessionConfigOption).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zResumeSessionResponse = object({
  modes: defaultOnError(zSessionModeState.nullish(), () => void 0),
  configOptions: defaultOnError(vecSkipError(zSessionConfigOption).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCloseSessionResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetSessionModeResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetSessionConfigOptionResponse = object({
  configOptions: requiredDefaultOnError(vecSkipError(zSessionConfigOption), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zStopReason = union([
  literal("end_turn"),
  literal("max_tokens"),
  literal("max_turn_requests"),
  literal("refusal"),
  literal("cancelled")
]);
var zUsage = object({
  totalTokens: number2(),
  inputTokens: number2(),
  outputTokens: number2(),
  thoughtTokens: defaultOnError(number2().nullish(), () => void 0),
  cachedReadTokens: defaultOnError(number2().nullish(), () => void 0),
  cachedWriteTokens: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPromptResponse = object({
  stopReason: zStopReason,
  usage: defaultOnError(zUsage.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zStartNesResponse = object({
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesSuggestionId = string2();
var zPosition = object({
  line: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }),
  character: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zRange = object({
  start: zPosition,
  end: zPosition,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesTextEdit = object({
  range: zRange,
  newText: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesEditSuggestion = object({
  id: zNesSuggestionId,
  uri: string2(),
  edits: array(zNesTextEdit),
  cursorPosition: defaultOnError(zPosition.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesJumpSuggestion = object({
  id: zNesSuggestionId,
  uri: string2(),
  position: zPosition,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRenameSuggestion = object({
  id: zNesSuggestionId,
  uri: string2(),
  position: zPosition,
  newName: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesSearchAndReplaceSuggestion = object({
  id: zNesSuggestionId,
  uri: string2(),
  search: string2(),
  replace: string2(),
  isRegex: boolean2().nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesSuggestion = union([
  zNesEditSuggestion.and(object({
    kind: literal("edit")
  })),
  zNesJumpSuggestion.and(object({
    kind: literal("jump")
  })),
  zNesRenameSuggestion.and(object({
    kind: literal("rename")
  })),
  zNesSearchAndReplaceSuggestion.and(object({
    kind: literal("searchAndReplace")
  }))
]);
var zSuggestNesResponse = object({
  suggestions: array(zNesSuggestion),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCloseNesResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zExtResponse = unknown();
var zMessageMcpResponse = unknown();
var zErrorCode = union([
  literal(-32700),
  literal(-32600),
  literal(-32601),
  literal(-32602),
  literal(-32603),
  literal(-32800),
  literal(-32e3),
  literal(-32002),
  int().min(-2147483648, {
    error: "Invalid value: Expected int32 to be >= -2147483648"
  }).max(2147483647, {
    error: "Invalid value: Expected int32 to be <= 2147483647"
  })
]);
var zError = object({
  code: zErrorCode,
  message: string2(),
  data: defaultOnError(unknown().optional(), () => void 0)
});
var zAgentResponse = union([
  object({
    id: zRequestId,
    result: union([
      zInitializeResponse,
      zAuthenticateResponse,
      zListProvidersResponse,
      zSetProviderResponse,
      zDisableProviderResponse,
      zLogoutResponse,
      zNewSessionResponse,
      zLoadSessionResponse,
      zListSessionsResponse,
      zDeleteSessionResponse,
      zForkSessionResponse,
      zResumeSessionResponse,
      zCloseSessionResponse,
      zSetSessionModeResponse,
      zSetSessionConfigOptionResponse,
      zPromptResponse,
      zStartNesResponse,
      zSuggestNesResponse,
      zCloseNesResponse,
      zExtResponse,
      zMessageMcpResponse
    ])
  }),
  object({
    id: zRequestId,
    error: zError
  })
]);
var zMessageId = string2();
var zContentChunk = object({
  content: zContentBlock,
  messageId: defaultOnError(zMessageId.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zToolCall = object({
  toolCallId: zToolCallId,
  title: string2(),
  name: defaultOnError(string2().nullish(), () => void 0),
  kind: defaultOnError(zToolKind.optional(), () => void 0),
  status: defaultOnError(zToolCallStatus.optional(), () => void 0),
  content: defaultOnError(vecSkipError(zToolCallContent).optional(), () => []),
  locations: defaultOnError(vecSkipError(zToolCallLocation).optional(), () => []),
  rawInput: defaultOnError(unknown().optional(), () => void 0),
  rawOutput: defaultOnError(unknown().optional(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanEntryPriority = union([
  literal("high"),
  literal("medium"),
  literal("low")
]);
var zPlanEntryStatus = union([
  literal("pending"),
  literal("in_progress"),
  literal("completed")
]);
var zPlanEntry = object({
  content: string2(),
  priority: zPlanEntryPriority,
  status: zPlanEntryStatus,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlan = object({
  entries: requiredDefaultOnError(vecSkipError(zPlanEntry), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanId = string2();
var zPlanItems = object({
  planId: zPlanId,
  entries: requiredDefaultOnError(vecSkipError(zPlanEntry), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanFile = object({
  planId: zPlanId,
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanMarkdown = object({
  planId: zPlanId,
  content: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanUpdateContent = union([
  zPlanItems.and(object({
    type: literal("items")
  })),
  zPlanFile.and(object({
    type: literal("file")
  })),
  zPlanMarkdown.and(object({
    type: literal("markdown")
  }))
]);
var zPlanUpdate = object({
  plan: zPlanUpdateContent,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanRemoved = object({
  planId: zPlanId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zUnstructuredCommandInput = object({
  hint: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAvailableCommandInput = zUnstructuredCommandInput;
var zAvailableCommand = object({
  name: string2(),
  description: string2(),
  input: defaultOnError(zAvailableCommandInput.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAvailableCommandsUpdate = object({
  availableCommands: requiredDefaultOnError(vecSkipError(zAvailableCommand), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCurrentModeUpdate = object({
  currentModeId: zSessionModeId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zConfigOptionUpdate = object({
  configOptions: requiredDefaultOnError(vecSkipError(zSessionConfigOption), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionInfoUpdate = object({
  title: defaultOnError(string2().nullish(), () => void 0),
  updatedAt: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCost = object({
  amount: number2(),
  currency: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zUsageUpdate = object({
  used: number2(),
  size: number2(),
  cost: defaultOnError(zCost.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionUpdate = union([
  zContentChunk.and(object({
    sessionUpdate: literal("user_message_chunk")
  })),
  zContentChunk.and(object({
    sessionUpdate: literal("agent_message_chunk")
  })),
  zContentChunk.and(object({
    sessionUpdate: literal("agent_thought_chunk")
  })),
  zToolCall.and(object({
    sessionUpdate: literal("tool_call")
  })),
  zToolCallUpdate.and(object({
    sessionUpdate: literal("tool_call_update")
  })),
  zPlan.and(object({
    sessionUpdate: literal("plan")
  })),
  zPlanUpdate.and(object({
    sessionUpdate: literal("plan_update")
  })),
  zPlanRemoved.and(object({
    sessionUpdate: literal("plan_removed")
  })),
  zAvailableCommandsUpdate.and(object({
    sessionUpdate: literal("available_commands_update")
  })),
  zCurrentModeUpdate.and(object({
    sessionUpdate: literal("current_mode_update")
  })),
  zConfigOptionUpdate.and(object({
    sessionUpdate: literal("config_option_update")
  })),
  zSessionInfoUpdate.and(object({
    sessionUpdate: literal("session_info_update")
  })),
  zUsageUpdate.and(object({
    sessionUpdate: literal("usage_update")
  }))
]);
var zSessionNotification = object({
  sessionId: zSessionId,
  update: zSessionUpdate,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCompleteElicitationNotification = object({
  elicitationId: zElicitationId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMessageMcpNotification = object({
  connectionId: zMcpConnectionId,
  method: string2(),
  params: defaultOnError(record(string2(), unknown()).nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zExtNotification = unknown();
var zAgentNotification = object({
  method: string2(),
  params: union([
    zSessionNotification,
    zCompleteElicitationNotification,
    zMessageMcpNotification,
    zExtNotification
  ]).nullish()
});
var zFileSystemCapabilities = object({
  readTextFile: defaultOnError(boolean2().optional().default(false), () => false),
  writeTextFile: defaultOnError(boolean2().optional().default(false), () => false),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zBooleanConfigOptionCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSessionConfigOptionsCapabilities = object({
  boolean: defaultOnError(zBooleanConfigOptionCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientSessionCapabilities = object({
  configOptions: defaultOnError(zSessionConfigOptionsCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zPlanCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthCapabilities = object({
  terminal: defaultOnError(boolean2().optional().default(false), () => false),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationFormCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationUrlCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationCapabilities = object({
  form: defaultOnError(zElicitationFormCapabilities.nullish(), () => void 0),
  url: defaultOnError(zElicitationUrlCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesJumpCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRenameCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesSearchAndReplaceCapabilities = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientNesCapabilities = object({
  jump: defaultOnError(zNesJumpCapabilities.nullish(), () => void 0),
  rename: defaultOnError(zNesRenameCapabilities.nullish(), () => void 0),
  searchAndReplace: defaultOnError(zNesSearchAndReplaceCapabilities.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientCapabilities = object({
  fs: defaultOnError(zFileSystemCapabilities.optional().default({ readTextFile: false, writeTextFile: false }), () => ({ readTextFile: false, writeTextFile: false })),
  terminal: defaultOnError(boolean2().optional().default(false), () => false),
  session: defaultOnError(zClientSessionCapabilities.nullish(), () => void 0),
  plan: defaultOnError(zPlanCapabilities.nullish(), () => void 0),
  auth: defaultOnError(zAuthCapabilities.optional().default({ terminal: false }), () => ({ terminal: false })),
  elicitation: defaultOnError(zElicitationCapabilities.nullish(), () => void 0),
  nes: defaultOnError(zClientNesCapabilities.nullish(), () => void 0),
  positionEncodings: defaultOnError(vecSkipError(zPositionEncodingKind).optional(), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zInitializeRequest = object({
  protocolVersion: zProtocolVersion,
  clientCapabilities: defaultOnError(zClientCapabilities.optional().default({
    fs: { readTextFile: false, writeTextFile: false },
    terminal: false,
    auth: { terminal: false }
  }), () => ({
    fs: { readTextFile: false, writeTextFile: false },
    terminal: false,
    auth: { terminal: false }
  })),
  clientInfo: defaultOnError(zImplementation.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAuthenticateRequest = object({
  methodId: zAuthMethodId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zListProvidersRequest = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetProviderRequest = object({
  providerId: zProviderId,
  apiType: zLlmProtocol,
  baseUrl: string2(),
  headers: record(string2(), string2()).optional(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDisableProviderRequest = object({
  providerId: zProviderId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zLogoutRequest = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zHttpHeader = object({
  name: string2(),
  value: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpServerHttp = object({
  name: string2(),
  url: string2(),
  headers: array(zHttpHeader),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpServerSse = object({
  name: string2(),
  url: string2(),
  headers: array(zHttpHeader),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpServerAcp = object({
  name: string2(),
  serverId: zMcpServerAcpId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpServerStdio = object({
  name: string2(),
  command: string2(),
  args: array(string2()),
  env: array(zEnvVariable),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zMcpServer = union([
  zMcpServerHttp.and(object({
    type: literal("http")
  })),
  zMcpServerSse.and(object({
    type: literal("sse")
  })),
  zMcpServerAcp.and(object({
    type: literal("acp")
  })),
  zMcpServerStdio
]);
var zNewSessionRequest = object({
  cwd: string2(),
  additionalDirectories: defaultOnError(vecSkipError(string2()).optional(), () => []),
  mcpServers: requiredDefaultOnError(vecSkipError(zMcpServer), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zLoadSessionRequest = object({
  mcpServers: requiredDefaultOnError(vecSkipError(zMcpServer), () => []),
  cwd: string2(),
  additionalDirectories: defaultOnError(vecSkipError(string2()).optional(), () => []),
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zListSessionsRequest = object({
  cwd: string2().nullish(),
  cursor: string2().nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDeleteSessionRequest = object({
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zForkSessionRequest = object({
  sessionId: zSessionId,
  cwd: string2(),
  additionalDirectories: defaultOnError(vecSkipError(string2()).optional(), () => []),
  mcpServers: defaultOnError(vecSkipError(zMcpServer).optional(), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zResumeSessionRequest = object({
  sessionId: zSessionId,
  cwd: string2(),
  additionalDirectories: defaultOnError(vecSkipError(string2()).optional(), () => []),
  mcpServers: defaultOnError(vecSkipError(zMcpServer).optional(), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCloseSessionRequest = object({
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetSessionModeRequest = object({
  sessionId: zSessionId,
  modeId: zSessionModeId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSetSessionConfigOptionRequest = intersection(union([
  object({
    value: boolean2(),
    type: literal("boolean")
  }),
  object({
    value: zSessionConfigValueId
  })
]), object({
  sessionId: zSessionId,
  configId: zSessionConfigId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
}));
var zPromptRequest = object({
  sessionId: zSessionId,
  prompt: array(zContentBlock),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zWorkspaceFolder = object({
  uri: string2(),
  name: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRepository = object({
  name: string2(),
  owner: string2(),
  remoteUrl: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zStartNesRequest = object({
  workspaceUri: defaultOnError(string2().nullish(), () => void 0),
  workspaceFolders: array(zWorkspaceFolder).nullish(),
  repository: defaultOnError(zNesRepository.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesTriggerKind = union([
  literal("automatic"),
  literal("diagnostic"),
  literal("manual")
]);
var zNesRecentFile = object({
  uri: string2(),
  languageId: string2(),
  text: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesExcerpt = object({
  startLine: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }),
  endLine: int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }),
  text: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRelatedSnippet = object({
  uri: string2(),
  excerpts: array(zNesExcerpt),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesEditHistoryEntry = object({
  uri: string2(),
  diff: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesUserAction = object({
  action: string2(),
  uri: string2(),
  position: zPosition,
  timestampMs: number2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesOpenFile = object({
  uri: string2(),
  languageId: string2(),
  visibleRange: defaultOnError(zRange.nullish(), () => void 0),
  lastFocusedMs: defaultOnError(number2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesDiagnosticSeverity = union([
  literal("error"),
  literal("warning"),
  literal("information"),
  literal("hint")
]);
var zNesDiagnostic = object({
  uri: string2(),
  range: zRange,
  severity: zNesDiagnosticSeverity,
  message: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesSuggestContext = object({
  recentFiles: array(zNesRecentFile).nullish(),
  relatedSnippets: array(zNesRelatedSnippet).nullish(),
  editHistory: array(zNesEditHistoryEntry).nullish(),
  userActions: array(zNesUserAction).nullish(),
  openFiles: array(zNesOpenFile).nullish(),
  diagnostics: array(zNesDiagnostic).nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSuggestNesRequest = object({
  sessionId: zSessionId,
  uri: string2(),
  version: number2(),
  position: zPosition,
  selection: zRange.nullish(),
  triggerKind: zNesTriggerKind,
  context: zNesSuggestContext.nullish(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCloseNesRequest = object({
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientRequest = object({
  id: zRequestId,
  method: string2(),
  params: union([
    zInitializeRequest,
    zAuthenticateRequest,
    zListProvidersRequest,
    zSetProviderRequest,
    zDisableProviderRequest,
    zLogoutRequest,
    zNewSessionRequest,
    zLoadSessionRequest,
    zListSessionsRequest,
    zDeleteSessionRequest,
    zForkSessionRequest,
    zResumeSessionRequest,
    zCloseSessionRequest,
    zSetSessionModeRequest,
    zSetSessionConfigOptionRequest,
    zPromptRequest,
    zStartNesRequest,
    zSuggestNesRequest,
    zCloseNesRequest,
    zMessageMcpRequest,
    zExtRequest
  ]).nullish()
});
var zWriteTextFileResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zReadTextFileResponse = object({
  content: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zSelectedPermissionOutcome = object({
  optionId: zPermissionOptionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zRequestPermissionOutcome = union([
  object({
    outcome: literal("cancelled")
  }),
  zSelectedPermissionOutcome.and(object({
    outcome: literal("selected")
  }))
]);
var zRequestPermissionResponse = object({
  outcome: zRequestPermissionOutcome,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zCreateTerminalResponse = object({
  terminalId: zTerminalId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTerminalExitStatus = object({
  exitCode: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  signal: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTerminalOutputResponse = object({
  output: string2(),
  truncated: boolean2(),
  exitStatus: defaultOnError(zTerminalExitStatus.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zReleaseTerminalResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zWaitForTerminalExitResponse = object({
  exitCode: defaultOnError(int().gte(0).max(4294967295, {
    error: "Invalid value: Expected uint32 to be <= 4294967295"
  }).nullish(), () => void 0),
  signal: defaultOnError(string2().nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zKillTerminalResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zElicitationContentValue = union([
  string2(),
  number2(),
  number2(),
  boolean2(),
  array(string2())
]);
var zElicitationAcceptAction = object({
  content: record(string2(), zElicitationContentValue).nullish()
});
var zCreateElicitationResponse = preserveCustomPayload(intersection(union([
  zElicitationAcceptAction.and(object({
    action: literal("accept")
  })),
  object({
    action: literal("decline")
  }),
  object({
    action: literal("cancel")
  }),
  excludeKnownTags(object({
    action: string2()
  }), "action", ["accept", "cancel", "decline"])
]), object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
})), "action", ["accept", "cancel", "decline"]);
var zConnectMcpResponse = object({
  connectionId: zMcpConnectionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDisconnectMcpResponse = object({
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientResponse = union([
  object({
    id: zRequestId,
    result: union([
      zWriteTextFileResponse,
      zReadTextFileResponse,
      zRequestPermissionResponse,
      zCreateTerminalResponse,
      zTerminalOutputResponse,
      zReleaseTerminalResponse,
      zWaitForTerminalExitResponse,
      zKillTerminalResponse,
      zCreateElicitationResponse,
      zConnectMcpResponse,
      zDisconnectMcpResponse,
      zMessageMcpResponse,
      zExtResponse
    ])
  }),
  object({
    id: zRequestId,
    error: zError
  })
]);
var zCancelNotification = object({
  sessionId: zSessionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDidOpenDocumentNotification = object({
  sessionId: zSessionId,
  uri: string2(),
  languageId: string2(),
  version: number2(),
  text: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zTextDocumentContentChangeEvent = object({
  range: zRange.nullish(),
  text: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDidChangeDocumentNotification = object({
  sessionId: zSessionId,
  uri: string2(),
  version: number2(),
  contentChanges: requiredDefaultOnError(vecSkipError(zTextDocumentContentChangeEvent), () => []),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDidCloseDocumentNotification = object({
  sessionId: zSessionId,
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDidSaveDocumentNotification = object({
  sessionId: zSessionId,
  uri: string2(),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zDidFocusDocumentNotification = object({
  sessionId: zSessionId,
  uri: string2(),
  version: number2(),
  position: zPosition,
  visibleRange: zRange,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zAcceptNesNotification = object({
  sessionId: zSessionId,
  id: zNesSuggestionId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zNesRejectReason = union([
  literal("rejected"),
  literal("ignored"),
  literal("replaced"),
  literal("cancelled")
]);
var zRejectNesNotification = object({
  sessionId: zSessionId,
  id: zNesSuggestionId,
  reason: defaultOnError(zNesRejectReason.nullish(), () => void 0),
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});
var zClientNotification = object({
  method: string2(),
  params: union([
    zCancelNotification,
    zDidOpenDocumentNotification,
    zDidChangeDocumentNotification,
    zDidCloseDocumentNotification,
    zDidSaveDocumentNotification,
    zDidFocusDocumentNotification,
    zAcceptNesNotification,
    zRejectNesNotification,
    zMessageMcpNotification,
    zExtNotification
  ]).nullish()
});
var zCancelRequestNotification = object({
  requestId: zRequestId,
  _meta: defaultOnError(record(string2(), unknown()).nullish(), () => void 0)
});

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/jsonrpc.js
var CANCEL_REQUEST_METHOD = "\$/cancel_request";
function isRequestMessage(value) {
  return isJsonRpcEnvelope(value) && "id" in value && typeof value["method"] === "string" && isJsonRpcId(value["id"]);
}
function isResponseMessage(value) {
  if (!isJsonRpcEnvelope(value) || "method" in value) {
    return false;
  }
  if (!("id" in value) || !isJsonRpcId(value["id"])) {
    return false;
  }
  const hasResult = Object.hasOwn(value, "result");
  const hasError = Object.hasOwn(value, "error");
  if (hasResult === hasError) {
    return false;
  }
  return !hasError || isErrorResponse(value["error"]);
}
function isNotificationMessage(value) {
  return isJsonRpcEnvelope(value) && !("id" in value) && typeof value["method"] === "string";
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isJsonRpcEnvelope(value) {
  return isRecord(value) && value["jsonrpc"] === "2.0";
}
function isJsonRpcId(value) {
  return value === null || typeof value === "string" || typeof value === "number" && Number.isFinite(value);
}
function isResponseShapedMessage(value) {
  return isRecord(value) && !("method" in value) && ("id" in value || "result" in value || "error" in value);
}
function isResponseBatch(batch) {
  let hasValidCall = false;
  let hasValidResponse = false;
  let hasCallShape = false;
  let hasResponseShape = false;
  for (const entry of batch) {
    hasValidCall ||= isRequestMessage(entry) || isNotificationMessage(entry);
    hasValidResponse ||= isResponseMessage(entry);
    if (!isRecord(entry)) {
      continue;
    }
    hasCallShape ||= "method" in entry;
    hasResponseShape ||= "result" in entry || "error" in entry;
  }
  if (hasValidCall) {
    return false;
  }
  if (hasValidResponse) {
    return true;
  }
  return hasResponseShape && !hasCallShape;
}
function cancelRequestId(params) {
  if (!isRecord(params) || !isJsonRpcId(params["requestId"])) {
    return void 0;
  }
  return params["requestId"];
}
function isErrorResponse(value) {
  return isRecord(value) && typeof value["code"] === "number" && Number.isInteger(value["code"]) && typeof value["message"] === "string";
}
var Handled = {
  /**
   * Marks a message as handled.
   */
  yes() {
    return { handled: true };
  },
  /**
   * Leaves a message unhandled so later handlers can process it.
   */
  no(message, retry = false) {
    return { handled: false, message, retry };
  }
};
function rejectedPromise(error40) {
  const promise2 = Promise.reject(error40);
  promise2.catch(() => {
  });
  return promise2;
}
function errorDetails(error40) {
  if (error40 instanceof Error) {
    return error40.message;
  }
  if (typeof error40 === "object" && error40 != null && "message" in error40 && typeof error40.message === "string") {
    return error40.message;
  }
  return void 0;
}
function isZodError(error40) {
  return typeof error40 === "object" && error40 !== null && "name" in error40 && error40.name === "ZodError" && "issues" in error40 && Array.isArray(error40.issues) && "format" in error40 && typeof error40.format === "function";
}
function errorToResult(error40) {
  if (error40 instanceof RequestError) {
    return error40.toResult();
  }
  if (isZodError(error40)) {
    return RequestError.invalidParams(error40.format()).toResult();
  }
  const details = errorDetails(error40);
  try {
    return RequestError.internalError(details ? JSON.parse(details) : {}).toResult();
  } catch {
    return RequestError.internalError({ details }).toResult();
  }
}
function requestCancelledError(reason) {
  if (reason instanceof RequestError && reason.code === -32800) {
    return reason;
  }
  return RequestError.requestCancelled(reason);
}
function errorToRequestResult(error40, signal) {
  const requestCancelled = abortErrorToRequestCancelled(error40, signal);
  return requestCancelled ? requestCancelled.toResult() : errorToResult(error40);
}
function abortErrorToRequestCancelled(error40, signal) {
  if (!signal.aborted || !isAbortError(error40)) {
    return void 0;
  }
  return requestCancelledError(signal.reason);
}
function isAbortError(error40) {
  if (typeof error40 !== "object" || error40 === null) {
    return false;
  }
  const maybeAbortError = error40;
  return maybeAbortError.name === "AbortError" || maybeAbortError.code === "ABORT_ERR";
}
var RequestResponder = class {
  id;
  sendResult;
  signal;
  finishRequest;
  didRespond = false;
  constructor(id, sendResult, signal = new AbortController().signal, finishRequest) {
    this.id = id;
    this.sendResult = sendResult;
    this.signal = signal;
    this.finishRequest = finishRequest;
  }
  /**
   * Whether this request has already received a response.
   */
  get responded() {
    return this.didRespond;
  }
  /**
   * Sends a successful JSON-RPC response.
   */
  respond(response) {
    return this.respondWithResult({ result: response ?? null });
  }
  /**
   * Sends an error JSON-RPC response.
   */
  respondWithError(error40) {
    const errorResponse = error40 instanceof RequestError ? error40.toErrorResponse() : error40;
    return this.respondWithResult({ error: errorResponse });
  }
  /**
   * Sends a complete JSON-RPC result payload.
   */
  respondWithResult(result) {
    if (this.didRespond) {
      return rejectedPromise(new Error("JSON-RPC request already responded"));
    }
    this.didRespond = true;
    return this.sendResult(result).finally(() => {
      this.finishRequest?.();
    });
  }
};
var HandlerRegistration = class {
  disposeHandler;
  active = true;
  constructor(disposeHandler) {
    this.disposeHandler = disposeHandler;
  }
  /**
   * Unregisters the associated handler.
   */
  dispose() {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.disposeHandler();
  }
  /**
   * Supports explicit resource management with \`using\`.
   */
  [Symbol.dispose]() {
    this.dispose();
  }
  /**
   * Returns this registration for call sites that intentionally keep it active.
   */
  runIndefinitely() {
    return this;
  }
};
var ConnectionContext = class {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  /**
   * Sends a request over the connection.
   */
  sendRequest(method, params, mapResponse, options) {
    return this.connection.sendRequest(method, params, mapResponse, options);
  }
  /**
   * Sends a notification over the connection.
   */
  sendNotification(method, params) {
    return this.connection.sendNotification(method, params);
  }
  /**
   * Sends a non-empty JSON-RPC batch in one transport message.
   */
  sendBatch(entries) {
    return this.connection.sendBatch(entries);
  }
  /**
   * Sends a protocol-level request cancellation notification.
   */
  sendCancelRequest(requestId) {
    return this.connection.sendCancelRequest(requestId);
  }
  /**
   * Registers a handler that can be disposed independently.
   */
  addDynamicHandler(handler) {
    return this.connection.addDynamicHandler(handler);
  }
  /**
   * AbortSignal that aborts when the connection closes.
   */
  get signal() {
    return this.connection.signal;
  }
  /**
   * Promise that resolves when the connection closes.
   */
  get closed() {
    return this.connection.closed;
  }
};
var Connection = class {
  pendingResponses = /* @__PURE__ */ new Map();
  incomingRequests = /* @__PURE__ */ new Map();
  nextRequestId = 0;
  staticHandlers = [];
  dynamicHandlers = /* @__PURE__ */ new Set();
  stream;
  writeQueue = Promise.resolve();
  abortController = new AbortController();
  closedPromise;
  retryQueue = [];
  context = new ConnectionContext(this);
  receiveReader;
  allowBatches = true;
  constructor(requestHandlerOrStream, notificationHandlerOrHandlers, streamOrOptions, options) {
    if (typeof requestHandlerOrStream === "function") {
      const requestHandler = requestHandlerOrStream;
      const notificationHandler = notificationHandlerOrHandlers;
      const stream2 = streamOrOptions;
      this.initialize(stream2, [
        ...options?.handlers ?? [],
        this.legacyHandler(requestHandler, notificationHandler)
      ], options);
      return;
    }
    const stream = requestHandlerOrStream;
    const handlers = notificationHandlerOrHandlers;
    const connectionOptions = streamOrOptions;
    this.initialize(stream, [...connectionOptions?.handlers ?? [], ...handlers], connectionOptions);
  }
  /**
   * Creates a builder for configuring a handler-based connection.
   */
  static builder() {
    return new ConnectionBuilder();
  }
  /**
   * Runs an operation while the connection is open, then closes the connection.
   *
   * If the stream closes before \`op\` settles, the returned promise rejects with
   * the connection close reason.
   */
  runUntil(op) {
    let opSettled = false;
    const opPromise = Promise.resolve().then(() => op(this.context)).finally(() => {
      opSettled = true;
    });
    const closedPromise = this.closed.then(() => {
      if (opSettled) {
        return new Promise(() => {
        });
      }
      throw this.closedReason();
    });
    return Promise.race([opPromise, closedPromise]).finally(() => {
      opSettled = true;
      this.close();
    });
  }
  /**
   * Adds a handler after the connection has started.
   *
   * Any messages queued with \`Handled.no(message, true)\` are retried after the
   * handler is added.
   */
  addDynamicHandler(handler) {
    this.dynamicHandlers.add(handler);
    if (this.retryQueue.length > 0) {
      for (const message of this.retryQueue.splice(0)) {
        void this.processIncomingMessage(message).catch((error40) => this.close(error40));
      }
    }
    return new HandlerRegistration(() => {
      this.dynamicHandlers.delete(handler);
    });
  }
  /**
   * AbortSignal that aborts when the connection closes.
   */
  get signal() {
    return this.abortController.signal;
  }
  /**
   * Promise that resolves when the connection closes.
   */
  get closed() {
    return this.closedPromise;
  }
  /** @internal */
  getContext() {
    return this.context;
  }
  /**
   * Sends a JSON-RPC request.
   *
   * \`mapResponse\` can convert the raw result before the returned promise
   * resolves.
   */
  sendRequest(method, params, mapResponse, options = {}) {
    if (this.abortController.signal.aborted) {
      return rejectedPromise(this.closedReason());
    }
    const request = this.prepareRequest(method, params, mapResponse, options);
    const requestSent = this.sendWireMessage(request.message);
    void requestSent.catch(() => {
    });
    if (options.cancellationSignal?.aborted) {
      request.cancel();
    }
    return request.response;
  }
  /**
   * Sends a non-empty JSON-RPC batch in one transport message.
   *
   * Requests and notifications are processed independently by the peer. The
   * returned tuple preserves the input order: request entries resolve to their
   * mapped response, while notification entries resolve to \`undefined\`.
   */
  sendBatch(entries) {
    if (this.abortController.signal.aborted) {
      return rejectedPromise(this.closedReason());
    }
    if (!this.allowBatches) {
      return rejectedPromise(new TypeError("JSON-RPC batches are not supported on this connection"));
    }
    if (entries.length === 0) {
      return rejectedPromise(new TypeError("JSON-RPC batch must contain at least one entry"));
    }
    const messages = [];
    const cancellations = [];
    const outputs = [];
    for (const entry of entries) {
      if (entry.kind === "notification") {
        messages.push({
          jsonrpc: "2.0",
          method: entry.method,
          params: entry.params
        });
        outputs.push(Promise.resolve(void 0));
        continue;
      }
      const request = this.prepareRequest(entry.method, entry.params, entry.mapResponse, entry.options);
      messages.push(request.message);
      outputs.push(request.response);
      cancellations.push({
        signal: entry.options?.cancellationSignal,
        cancel: request.cancel
      });
    }
    const batch = messages;
    const batchSent = this.sendWireMessage(batch);
    for (const cancellation of cancellations) {
      if (cancellation.signal?.aborted) {
        cancellation.cancel();
      }
    }
    const response = Promise.all([batchSent, ...outputs]).then(([, ...resolved]) => resolved);
    response.catch(() => {
    });
    return response;
  }
  /**
   * Sends a protocol-level request cancellation notification.
   */
  sendCancelRequest(requestId) {
    return this.sendNotification(CANCEL_REQUEST_METHOD, { requestId });
  }
  /**
   * Sends a JSON-RPC notification.
   */
  sendNotification(method, params) {
    if (this.abortController.signal.aborted) {
      return rejectedPromise(this.closedReason());
    }
    return this.sendWireMessage({ jsonrpc: "2.0", method, params });
  }
  prepareRequest(method, params, mapResponse, options = {}) {
    const id = this.nextRequestId++;
    let cancel = () => {
    };
    const response = new Promise((resolve, reject) => {
      const pendingResponse = {
        resolve: (value) => {
          try {
            resolve(mapResponse ? mapResponse(value) : value);
          } catch (error40) {
            reject(error40);
          }
        },
        reject
      };
      cancel = () => {
        if (pendingResponse.cancellationSent) {
          return;
        }
        pendingResponse.cancellationSent = true;
        pendingResponse.cleanup?.();
        void this.sendCancelRequest(id).catch(() => {
        });
      };
      options.cancellationSignal?.addEventListener("abort", cancel, {
        once: true
      });
      pendingResponse.cleanup = () => {
        options.cancellationSignal?.removeEventListener("abort", cancel);
      };
      this.pendingResponses.set(id, pendingResponse);
    });
    response.catch(() => {
    });
    return {
      message: { jsonrpc: "2.0", id, method, params },
      response,
      cancel: () => cancel()
    };
  }
  /**
   * Closes the connection and rejects pending requests.
   */
  close(error40) {
    if (this.abortController.signal.aborted) {
      return;
    }
    const closeError = error40 ?? new Error("ACP connection closed");
    this.abortController.abort(closeError);
    for (const pendingResponse of this.pendingResponses.values()) {
      pendingResponse.cleanup?.();
      pendingResponse.reject(closeError);
    }
    this.pendingResponses.clear();
    for (const controller of this.incomingRequests.values()) {
      controller.abort(closeError);
    }
    this.incomingRequests.clear();
    void this.receiveReader?.cancel(closeError).catch(() => {
    });
  }
  initialize(stream, handlers, options) {
    this.stream = stream;
    this.staticHandlers = handlers;
    this.allowBatches = options?.allowBatches ?? true;
    this.closedPromise = new Promise((resolve) => {
      this.abortController.signal.addEventListener("abort", () => resolve());
    });
    void this.receive();
  }
  legacyHandler(requestHandler, notificationHandler) {
    return {
      handleMessage: async (message, cx) => {
        if (message.kind === "request") {
          const result = await requestHandler(message.method, message.params, cx);
          await message.responder.respond(result);
        } else {
          await notificationHandler(message.method, message.params, cx);
        }
        return Handled.yes();
      }
    };
  }
  async receive() {
    let closeError = void 0;
    try {
      const reader = this.stream.readable.getReader();
      this.receiveReader = reader;
      try {
        while (!this.abortController.signal.aborted) {
          const { value: message, done } = await reader.read();
          if (this.abortController.signal.aborted) {
            break;
          }
          if (done) {
            break;
          }
          if (!message) {
            continue;
          }
          this.receiveWireMessage(message);
        }
      } finally {
        if (this.receiveReader === reader) {
          this.receiveReader = void 0;
        }
        reader.releaseLock();
      }
    } catch (error40) {
      closeError = error40;
    } finally {
      this.close(closeError);
    }
  }
  receiveWireMessage(message) {
    if (Array.isArray(message)) {
      if (!this.allowBatches) {
        this.close(new TypeError("JSON-RPC batches are not supported on this connection"));
        return;
      }
      this.receiveBatch(message);
      return;
    }
    if (!isRecord(message)) {
      console.error("Invalid message", { message });
      return;
    }
    this.receiveMessage(message);
  }
  receiveBatch(batch) {
    if (batch.length === 0) {
      void this.sendWireMessage({
        jsonrpc: "2.0",
        id: null,
        error: RequestError.invalidRequest(batch).toErrorResponse()
      }).catch(() => {
      });
      return;
    }
    const responseBatch = isResponseBatch(batch);
    const responseCount = responseBatch ? 0 : batch.reduce((count, message) => count + (isNotificationMessage(message) ? 0 : 1), 0);
    let remaining = responseCount;
    let remainingNotifications = batch.reduce((count, message) => count + (isNotificationMessage(message) ? 1 : 0), 0);
    let responseSent = false;
    const responses = [];
    const sendResponsesIfReady = async () => {
      if (responseSent || remaining !== 0 || remainingNotifications !== 0 || responses.length === 0) {
        return;
      }
      responseSent = true;
      await this.sendWireMessage(responses);
    };
    const collectResponse = async (response) => {
      responses.push(response);
      remaining -= 1;
      await sendResponsesIfReady();
    };
    for (const message of batch) {
      if (responseBatch) {
        if (isResponseShapedMessage(message)) {
          this.receiveMessage(message);
        }
        continue;
      }
      if (!isRequestMessage(message) && !isNotificationMessage(message)) {
        void collectResponse({
          jsonrpc: "2.0",
          id: null,
          error: RequestError.invalidRequest(message).toErrorResponse()
        }).catch(() => {
        });
        continue;
      }
      const processing = this.receiveMessage(message, isRequestMessage(message) ? collectResponse : void 0);
      if (isNotificationMessage(message)) {
        void processing.finally(() => {
          remainingNotifications -= 1;
          void sendResponsesIfReady().catch((error40) => this.close(error40));
        });
      }
    }
  }
  receiveMessage(message, sendResponse) {
    if (this.abortController.signal.aborted) {
      return Promise.resolve();
    }
    if (!isRecord(message)) {
      console.error("Invalid message", { message });
      return Promise.resolve();
    }
    if ("method" in message) {
      if (!("id" in message)) {
        this.handleProtocolNotification(message);
      }
      return this.processIncomingMessage(this.toIncomingMessage(message, sendResponse)).catch((error40) => this.close(error40));
    } else if ("id" in message) {
      this.handleResponse(message);
    } else {
      console.error("Invalid message", { message });
    }
    return Promise.resolve();
  }
  async processIncomingMessage(message) {
    if (this.abortController.signal.aborted) {
      return;
    }
    let current = message;
    let retry = false;
    try {
      for (const handler of [
        ...this.staticHandlers,
        ...this.dynamicHandlers.values()
      ]) {
        if (this.abortController.signal.aborted) {
          return;
        }
        const result = await handler.handleMessage(current, this.context) ?? {
          handled: true
        };
        if (result.handled) {
          return;
        }
        current = result.message ?? current;
        retry = retry || Boolean(result.retry);
      }
      if (retry) {
        this.retryQueue.push(current);
      } else if (current.kind === "request") {
        await current.responder.respondWithError(RequestError.methodNotFound(current.method));
      }
    } catch (error40) {
      if (this.abortController.signal.aborted) {
        return;
      }
      if (current.kind === "request" && !current.responder.responded) {
        await current.responder.respondWithResult(errorToRequestResult(error40, current.responder.signal));
      } else {
        const response = errorToResult(error40);
        if ("error" in response) {
          console.error("Error handling notification", message.raw, response.error);
        }
      }
    }
  }
  toIncomingMessage(message, sendResponse) {
    if ("id" in message) {
      const abortController = new AbortController();
      this.incomingRequests.set(message.id, abortController);
      const finishRequest = () => {
        if (this.incomingRequests.get(message.id) === abortController) {
          this.incomingRequests.delete(message.id);
        }
      };
      return {
        kind: "request",
        method: message.method,
        params: message.params,
        raw: message,
        signal: abortController.signal,
        responder: new RequestResponder(message.id, (result) => {
          const response = {
            jsonrpc: "2.0",
            id: message.id,
            ...result
          };
          return sendResponse ? sendResponse(response) : this.sendWireMessage(response);
        }, abortController.signal, finishRequest)
      };
    }
    return {
      kind: "notification",
      method: message.method,
      params: message.params,
      raw: message
    };
  }
  handleResponse(response) {
    const pendingResponse = this.pendingResponses.get(response.id);
    if (pendingResponse) {
      this.pendingResponses.delete(response.id);
      pendingResponse.cleanup?.();
      if (!isResponseMessage(response)) {
        pendingResponse.reject(RequestError.invalidRequest(response));
      } else if ("result" in response) {
        pendingResponse.resolve(response.result);
      } else {
        const { code, message, data } = response.error;
        pendingResponse.reject(new RequestError(code, message, data));
      }
    } else {
      console.error("Got response to unknown request", response.id);
    }
  }
  handleProtocolNotification(message) {
    if (message.method !== CANCEL_REQUEST_METHOD) {
      return;
    }
    const requestId = cancelRequestId(message.params);
    if (requestId === void 0) {
      return;
    }
    const controller = this.incomingRequests.get(requestId);
    if (!controller || controller.signal.aborted) {
      return;
    }
    controller.abort(RequestError.requestCancelled({ requestId }));
  }
  closedReason() {
    return this.abortController.signal.reason ?? new Error("ACP connection closed");
  }
  async sendWireMessage(message) {
    if (this.abortController.signal.aborted) {
      return rejectedPromise(this.closedReason());
    }
    this.writeQueue = this.writeQueue.then(async () => {
      if (this.abortController.signal.aborted) {
        throw this.closedReason();
      }
      const writer = this.stream.writable.getWriter();
      try {
        await writer.write(message);
      } finally {
        writer.releaseLock();
      }
    }).catch((error40) => {
      this.close(error40);
      throw error40;
    });
    return this.writeQueue;
  }
};
var ConnectionBuilder = class {
  handlers = [];
  connectionName;
  /**
   * Sets a diagnostic name used by handlers created from this builder.
   */
  name(name) {
    this.connectionName = name;
    return this;
  }
  /**
   * Adds a raw JSON-RPC handler to the handler chain.
   */
  withHandler(handler) {
    this.handlers.push(handler);
    return this;
  }
  /**
   * Adds a handler that can inspect every incoming request or notification.
   *
   * Observer callbacks that return void pass the message through to later
   * handlers. Return \`Handled.yes()\` to stop dispatch explicitly.
   */
  onReceiveMessage(handler) {
    return this.withHandler({
      handleMessage: async (message, cx) => await handler(message, cx) ?? Handled.no(message),
      describe: () => this.connectionName ?? "onReceiveMessage"
    });
  }
  /**
   * Adds a typed request handler for one method.
   */
  onReceiveRequest(method, parse3, handler) {
    return this.withHandler({
      handleMessage: async (message, cx) => {
        if (message.kind !== "request" || message.method !== method) {
          return Handled.no(message);
        }
        const request = parse3(message.params);
        return await handler(request, message.responder, cx) ?? Handled.yes();
      },
      describe: () => \`\${this.connectionName ?? "request"}:\${method}\`
    });
  }
  /**
   * Adds a typed notification handler for one method.
   */
  onReceiveNotification(method, parse3, handler) {
    return this.withHandler({
      handleMessage: async (message, cx) => {
        if (message.kind !== "notification" || message.method !== method) {
          return Handled.no(message);
        }
        const notification = parse3(message.params);
        return await handler(notification, cx) ?? Handled.yes();
      },
      describe: () => \`\${this.connectionName ?? "notification"}:\${method}\`
    });
  }
  /**
   * Connects the configured handlers to a stream.
   */
  connect(stream, options) {
    return new Connection(stream, this.handlers, options);
  }
  /**
   * Connects to a stream for the lifetime of \`op\`, then closes the connection.
   */
  connectWith(stream, op, options) {
    return this.connect(stream, options).runUntil(op);
  }
};
var RequestError = class _RequestError extends Error {
  code;
  /**
   * Additional JSON-RPC error data.
   */
  data;
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.name = "RequestError";
    this.data = data;
  }
  /**
   * Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.
   */
  static parseError(data, additionalMessage) {
    return new _RequestError(-32700, \`Parse error\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * The JSON sent is not a valid Request object.
   */
  static invalidRequest(data, additionalMessage) {
    return new _RequestError(-32600, \`Invalid request\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * The method does not exist / is not available.
   */
  static methodNotFound(method) {
    return new _RequestError(-32601, \`"Method not found": \${method}\`, {
      method
    });
  }
  /**
   * Invalid method parameter(s).
   */
  static invalidParams(data, additionalMessage) {
    return new _RequestError(-32602, \`Invalid params\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * Internal JSON-RPC error.
   */
  static internalError(data, additionalMessage) {
    return new _RequestError(-32603, \`Internal error\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * Execution of the request was aborted.
   */
  static requestCancelled(data, additionalMessage) {
    return new _RequestError(-32800, \`Request cancelled\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * Authentication required.
   */
  static authRequired(data, additionalMessage) {
    return new _RequestError(-32e3, \`Authentication required\${additionalMessage ? \`: \${additionalMessage}\` : ""}\`, data);
  }
  /**
   * Resource, such as a file, was not found
   */
  static resourceNotFound(uri) {
    return new _RequestError(-32002, \`Resource not found\${uri ? \`: \${uri}\` : ""}\`, uri && { uri });
  }
  /**
   * Converts this error to a JSON-RPC result object.
   */
  toResult() {
    return {
      error: {
        code: this.code,
        message: this.message,
        data: this.data
      }
    };
  }
  /**
   * Converts this error to a JSON-RPC error response payload.
   */
  toErrorResponse() {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
};

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/line-buffer.js
var newline = 10;
var LineBuffer = class {
  /** Bytes of the current (incomplete) line, carried across chunks. */
  #pending = [];
  /**
   * Consumes a chunk, returning each complete line without its trailing
   * newline.
   */
  push(chunk) {
    const lines = [];
    let start = 0;
    let newlineIndex = chunk.indexOf(newline, start);
    while (newlineIndex !== -1) {
      lines.push(this.#takeLine(chunk.subarray(start, newlineIndex)));
      start = newlineIndex + 1;
      newlineIndex = chunk.indexOf(newline, start);
    }
    if (start < chunk.byteLength) {
      this.#pending.push(start === 0 ? chunk : new Uint8Array(chunk.subarray(start)));
    }
    return lines;
  }
  /**
   * Returns the trailing unterminated line and resets the buffer, or
   * undefined if no bytes are buffered.
   */
  flush() {
    if (this.#pending.length === 0) {
      return void 0;
    }
    return this.#takeLine(new Uint8Array(0));
  }
  #takeLine(tail) {
    if (this.#pending.length === 0) {
      return tail;
    }
    let total = tail.byteLength;
    for (const part of this.#pending) {
      total += part.byteLength;
    }
    const line = new Uint8Array(total);
    let offset = 0;
    for (const part of this.#pending) {
      line.set(part, offset);
      offset += part.byteLength;
    }
    line.set(tail, offset);
    this.#pending = [];
    return line;
  }
};

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/stream.js
function ndJsonStream(output, input) {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  let cancelled = false;
  let inputReader;
  const readable = new ReadableStream({
    async start(controller) {
      const lines = new LineBuffer();
      const enqueueLine = (lineBytes) => {
        const trimmedLine = textDecoder.decode(lineBytes).trim();
        if (trimmedLine) {
          try {
            const message = JSON.parse(trimmedLine);
            if (isRecord(message) || Array.isArray(message)) {
              controller.enqueue(message);
            } else {
              console.warn("Skipping JSON line that is not an object:", trimmedLine);
            }
          } catch (err) {
            console.error("Failed to parse JSON message:", trimmedLine, err);
          }
        }
      };
      const reader = input.getReader();
      inputReader = reader;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (cancelled) {
            return;
          }
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }
          for (const line of lines.push(value)) {
            enqueueLine(line);
            if (cancelled) {
              return;
            }
          }
        }
        if (cancelled) {
          return;
        }
        const lastLine = lines.flush();
        if (lastLine) {
          enqueueLine(lastLine);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        controller.error(err);
        return;
      } finally {
        if (inputReader === reader) {
          inputReader = void 0;
        }
        reader.releaseLock();
      }
      if (cancelled) {
        return;
      }
      controller.close();
    },
    cancel(reason) {
      cancelled = true;
      return inputReader?.cancel(reason);
    }
  });
  const writable = new WritableStream({
    async write(message) {
      const content = JSON.stringify(message) + "\\n";
      const writer = output.getWriter();
      try {
        await writer.write(textEncoder.encode(content));
      } finally {
        writer.releaseLock();
      }
    }
  });
  return { readable, writable };
}

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/schema/guards.gen.js
var zGuardCreateElicitationRequestForm = zElicitationFormMode.and(object({ mode: literal("form") })).and(object({ message: string2() }));
var zGuardCreateElicitationRequestUrl = zElicitationUrlMode.and(object({ mode: literal("url") })).and(object({ message: string2() }));
var zGuardCreateElicitationRequestCustom = union([zElicitationSessionScope, zElicitationRequestScope]).and(object({ message: string2() }));
var zGuardElicitationPropertySchemaString = zStringPropertySchema.and(object({ type: literal("string") }));
var zGuardElicitationPropertySchemaNumber = zNumberPropertySchema.and(object({ type: literal("number") }));
var zGuardElicitationPropertySchemaInteger = zIntegerPropertySchema.and(object({ type: literal("integer") }));
var zGuardElicitationPropertySchemaBoolean = zBooleanPropertySchema.and(object({ type: literal("boolean") }));
var zGuardElicitationPropertySchemaArray = zMultiSelectPropertySchema.and(object({ type: literal("array") }));
var zGuardMultiSelectItemsString = zStringMultiSelectItems.and(object({ type: literal("string") }));
var zGuardCreateElicitationResponseAccept = zElicitationAcceptAction.and(object({ action: literal("accept") }));
var zGuardCreateElicitationResponseDecline = object({
  action: literal("decline")
});
var zGuardCreateElicitationResponseCancel = object({
  action: literal("cancel")
});

// ../../node_modules/.pnpm/@agentclientprotocol+sdk@1.3.0_zod@3.25.76/node_modules/@agentclientprotocol/sdk/dist/acp.js
function ndJsonStream2(output, input) {
  return ndJsonStream(output, input);
}
function emptyObjectResponse(response) {
  return response ?? {};
}
function isStream(value) {
  return typeof value === "object" && value !== null && "readable" in value && "writable" in value;
}
function memoryStreamPair() {
  const leftToRight = new TransformStream();
  const rightToLeft = new TransformStream();
  return [
    {
      readable: rightToLeft.readable,
      writable: leftToRight.writable
    },
    {
      readable: leftToRight.readable,
      writable: rightToLeft.writable
    }
  ];
}
var methods = {
  agent: {
    initialize: AGENT_METHODS.initialize,
    authenticate: AGENT_METHODS.authenticate,
    logout: AGENT_METHODS.logout,
    providers: {
      list: AGENT_METHODS.providers_list,
      set: AGENT_METHODS.providers_set,
      disable: AGENT_METHODS.providers_disable
    },
    session: {
      new: AGENT_METHODS.session_new,
      load: AGENT_METHODS.session_load,
      list: AGENT_METHODS.session_list,
      delete: AGENT_METHODS.session_delete,
      fork: AGENT_METHODS.session_fork,
      resume: AGENT_METHODS.session_resume,
      close: AGENT_METHODS.session_close,
      setMode: AGENT_METHODS.session_set_mode,
      setConfigOption: AGENT_METHODS.session_set_config_option,
      prompt: AGENT_METHODS.session_prompt,
      cancel: AGENT_METHODS.session_cancel
    },
    nes: {
      start: AGENT_METHODS.nes_start,
      suggest: AGENT_METHODS.nes_suggest,
      accept: AGENT_METHODS.nes_accept,
      reject: AGENT_METHODS.nes_reject,
      close: AGENT_METHODS.nes_close
    },
    document: {
      didOpen: AGENT_METHODS.document_did_open,
      didChange: AGENT_METHODS.document_did_change,
      didClose: AGENT_METHODS.document_did_close,
      didSave: AGENT_METHODS.document_did_save,
      didFocus: AGENT_METHODS.document_did_focus
    }
  },
  client: {
    session: {
      requestPermission: CLIENT_METHODS.session_request_permission,
      update: CLIENT_METHODS.session_update
    },
    fs: {
      writeTextFile: CLIENT_METHODS.fs_write_text_file,
      readTextFile: CLIENT_METHODS.fs_read_text_file
    },
    terminal: {
      create: CLIENT_METHODS.terminal_create,
      output: CLIENT_METHODS.terminal_output,
      release: CLIENT_METHODS.terminal_release,
      waitForExit: CLIENT_METHODS.terminal_wait_for_exit,
      kill: CLIENT_METHODS.terminal_kill
    },
    elicitation: {
      create: CLIENT_METHODS.elicitation_create,
      complete: CLIENT_METHODS.elicitation_complete
    }
  },
  protocol: {
    cancelRequest: PROTOCOL_METHODS.cancel_request
  }
};
var startActiveSession = Symbol("startActiveSession");
var AcpContext = class {
  cx;
  currentRequestId;
  /** @internal */
  constructor(cx, currentRequestId) {
    this.cx = cx;
    this.currentRequestId = currentRequestId;
  }
  /**
   * JSON-RPC id of the request currently being handled.
   *
   * This is \`undefined\` for notification handlers and for contexts created
   * outside an inbound request, such as \`connect(...)\` and \`connectWith(...)\`.
   */
  get requestId() {
    return this.currentRequestId;
  }
  /** @internal */
  get connectionContext() {
    return this.cx;
  }
  /** @internal */
  sendRequest(method, params, mapResponse, options) {
    return this.cx.sendRequest(method, params, mapResponse, options);
  }
  /** @internal */
  sendNotification(method, params) {
    return this.cx.sendNotification(method, params);
  }
  /** @internal */
  addDynamicHandler(handler) {
    return this.cx.addDynamicHandler(handler);
  }
};
var AgentContext = class _AgentContext extends AcpContext {
  constructor(cx, requestId) {
    super(cx, requestId);
  }
  /** @internal */
  static create(cx, requestId) {
    return new _AgentContext(cx, requestId);
  }
  request(method, params, options) {
    const spec = clientRequestSpecsByMethod[method];
    return this.sendRequest(method, params, spec?.mapResponse, options);
  }
  notify(method, params) {
    return this.sendNotification(method, params);
  }
};
var ClientContext = class _ClientContext extends AcpContext {
  constructor(cx, requestId) {
    super(cx, requestId);
  }
  /** @internal */
  static create(cx, requestId) {
    return new _ClientContext(cx, requestId);
  }
  /** @internal */
  [startActiveSession](params, options) {
    return this.sendRequest(AGENT_METHODS.session_new, params, (response) => this.attachSession(response), options);
  }
  buildSession(cwdOrRequest) {
    if (typeof cwdOrRequest === "string") {
      return SessionBuilder.create(this, {
        cwd: cwdOrRequest,
        mcpServers: []
      });
    }
    return SessionBuilder.create(this, cwdOrRequest);
  }
  /**
   * Builds active-session helpers around a \`session/new\` response.
   */
  attachSession(response) {
    const updates = new AsyncQueue();
    const closeSignal = this.connectionContext.signal;
    const failUpdatesOnClose = () => {
      updates.fail(closeSignal.reason ?? new Error("ACP connection closed"));
    };
    if (closeSignal.aborted) {
      failUpdatesOnClose();
    } else {
      closeSignal.addEventListener("abort", failUpdatesOnClose);
    }
    const sessionRegistration = sessionUpdateRouter(this.connectionContext).attach(response, updates);
    const closeRegistration = new HandlerRegistration(() => {
      closeSignal.removeEventListener("abort", failUpdatesOnClose);
    });
    return ActiveSession.create(this, response, updates, [
      sessionRegistration,
      closeRegistration
    ]);
  }
  request(method, params, options) {
    const spec = agentRequestSpecsByMethod[method];
    return this.sendRequest(method, params, spec?.mapResponse, options);
  }
  notify(method, params) {
    return this.sendNotification(method, params);
  }
};
var AcpConnectionHandle = class {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  get signal() {
    return this.connection.signal;
  }
  get closed() {
    return this.connection.closed;
  }
  close(error40) {
    this.connection.close(error40);
  }
};
var AgentConnectionHandle = class extends AcpConnectionHandle {
  connectHandlers;
  client;
  didStartConnectHandlers = false;
  constructor(connection, connectHandlers = []) {
    super(connection);
    this.connectHandlers = connectHandlers;
    this.client = AgentContext.create(connection.getContext());
  }
  /** @internal */
  startConnectHandlers() {
    if (this.didStartConnectHandlers) {
      return;
    }
    this.didStartConnectHandlers = true;
    runConnectHandlers(this, this.connectHandlers);
  }
};
var ClientConnectionHandle = class extends AcpConnectionHandle {
  connectHandlers;
  agent;
  didStartConnectHandlers = false;
  constructor(connection, connectHandlers = []) {
    super(connection);
    this.connectHandlers = connectHandlers;
    this.agent = ClientContext.create(connection.getContext());
  }
  /** @internal */
  startConnectHandlers() {
    if (this.didStartConnectHandlers) {
      return;
    }
    this.didStartConnectHandlers = true;
    runConnectHandlers(this, this.connectHandlers);
  }
};
function agentConnection(connection, connectHandlers = []) {
  return new AgentConnectionHandle(connection, connectHandlers);
}
function clientConnection(connection, connectHandlers = []) {
  return new ClientConnectionHandle(connection, connectHandlers);
}
var AsyncQueue = class {
  values = [];
  waiters = [];
  failed = false;
  failure;
  enqueue(value) {
    if (this.failed) {
      return;
    }
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve(value);
    } else {
      this.values.push({ kind: "value", value });
    }
  }
  reject(error40) {
    if (this.failed) {
      return;
    }
    if (this.waiters.length > 0) {
      for (const waiter of this.waiters.splice(0)) {
        waiter.reject(error40);
      }
      return;
    }
    this.values.push({ kind: "error", error: error40 });
  }
  clearErrors() {
    this.values = this.values.filter((entry) => entry.kind === "value");
  }
  fail(error40) {
    if (this.failed) {
      return;
    }
    this.failed = true;
    this.failure = error40;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(error40);
    }
  }
  next() {
    if (this.values.length > 0) {
      const entry = this.values.shift();
      if (entry.kind === "error") {
        return Promise.reject(entry.error);
      }
      return Promise.resolve(entry.value);
    }
    if (this.failed) {
      return Promise.reject(this.failure);
    }
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }
};
function cloneNewSessionRequest(request) {
  return {
    ...request,
    additionalDirectories: request.additionalDirectories ? [...request.additionalDirectories] : void 0,
    mcpServers: [...request.mcpServers]
  };
}
var SessionBuilder = class _SessionBuilder {
  cx;
  request;
  constructor(cx, request) {
    this.cx = cx;
    this.request = cloneNewSessionRequest(request);
  }
  /** @internal */
  static create(cx, request) {
    return new _SessionBuilder(cx, request);
  }
  /**
   * Returns the \`session/new\` request that will be sent.
   *
   * The returned object is a defensive copy, so mutating it does not change the
   * builder.
   */
  toRequest() {
    return cloneNewSessionRequest(this.request);
  }
  /**
   * Replaces the additional workspace roots for this session.
   *
   * \`additionalDirectories\` expand the session's file-system scope without
   * changing \`cwd\`. Each path should be absolute.
   */
  withAdditionalDirectories(additionalDirectories) {
    this.request = {
      ...this.request,
      additionalDirectories: [...additionalDirectories]
    };
    return this;
  }
  /**
   * Adds one MCP server to the \`session/new\` request.
   */
  withMcpServer(mcpServer) {
    this.request = {
      ...this.request,
      mcpServers: [...this.request.mcpServers, mcpServer]
    };
    return this;
  }
  /**
   * Starts the session and returns an \`ActiveSession\` for prompting and reading
   * updates.
   *
   * Call \`dispose()\` on the returned session when you no longer need update
   * routing, or use \`withSession(...)\` to scope disposal automatically.
   */
  async start(options) {
    return this.cx[startActiveSession](this.toRequest(), options);
  }
  /**
   * Starts the session, runs \`op\`, and disposes the active-session update
   * routing when \`op\` finishes or throws.
   */
  async withSession(op) {
    const session = await this.start();
    try {
      return await op(session);
    } finally {
      session.dispose();
    }
  }
};
var ActiveSession = class _ActiveSession {
  cx;
  sessionResponse;
  updates;
  registrations;
  constructor(cx, sessionResponse, updates, registrations) {
    this.cx = cx;
    this.sessionResponse = sessionResponse;
    this.updates = updates;
    this.registrations = registrations;
  }
  /** @internal */
  static create(cx, sessionResponse, updates, registrations) {
    return new _ActiveSession(cx, sessionResponse, updates, registrations);
  }
  /**
   * Session ID returned by \`session/new\`.
   */
  get sessionId() {
    return this.sessionResponse.sessionId;
  }
  /**
   * Mode state returned when the session was created, if the agent provided it.
   */
  get modes() {
    return this.sessionResponse.modes;
  }
  /**
   * Metadata returned when the session was created.
   */
  get meta() {
    return this.sessionResponse._meta;
  }
  /**
   * Full response returned by \`session/new\`.
   */
  get newSessionResponse() {
    return this.sessionResponse;
  }
  /**
   * Sends a prompt to this session.
   *
   * Strings are converted to one text content block. A single content block is
   * wrapped in an array. The returned promise resolves with the final
   * \`PromptResponse\`, and the same completion is also queued as a \`stop\`
   * message for \`nextUpdate()\`.
   */
  prompt(prompt, options) {
    this.updates.clearErrors();
    const response = this.cx.request(AGENT_METHODS.session_prompt, {
      sessionId: this.sessionId,
      prompt: this.promptBlocks(prompt)
    }, options);
    void response.then((value) => {
      this.updates.enqueue({
        kind: "stop",
        response: value,
        stopReason: value.stopReason
      });
    }, (error40) => {
      this.updates.reject(error40);
    });
    return response;
  }
  /**
   * Reads the next update or stop message for this session.
   */
  nextUpdate() {
    return this.updates.next();
  }
  /**
   * Reads text chunks until the current prompt turn stops.
   *
   * Only \`agent_message_chunk\` updates with text content are appended. Other
   * update types are ignored by this helper; use \`nextUpdate()\` when you need
   * tool calls, plans, or the final \`PromptResponse\`.
   */
  async readText() {
    let output = "";
    for (; ; ) {
      const message = await this.nextUpdate();
      if (message.kind === "stop") {
        return output;
      }
      const { update } = message;
      if (update.sessionUpdate === "agent_message_chunk" && update.content.type === "text") {
        output += update.content.text;
      }
    }
  }
  /**
   * Stops routing updates to this active-session helper.
   *
   * This does not close the ACP session on the agent. Use \`ClientContext\`
   * session lifecycle methods when the protocol session itself should be closed
   * or deleted.
   */
  dispose() {
    for (const registration of this.registrations.splice(0)) {
      registration.dispose();
    }
    this.updates.fail(new Error("Active session disposed"));
  }
  /**
   * Supports explicit resource management with \`using\`.
   */
  [Symbol.dispose]() {
    this.dispose();
  }
  promptBlocks(prompt) {
    if (typeof prompt === "string") {
      return [{ type: "text", text: prompt }];
    }
    if (Array.isArray(prompt)) {
      return prompt;
    }
    return [prompt];
  }
};
function parseParams(parser, params) {
  if (!parser) {
    return params;
  }
  if (typeof parser === "function") {
    return parser(params);
  }
  return parser.parse(params);
}
function requestSpec(method, params, mapResponse) {
  return { method, params, mapResponse };
}
function notificationSpec(method, params) {
  return { method, params };
}
function registerAppRequest(builder, spec, context, handler) {
  builder.onReceiveRequest(spec.method, (params) => parseParams(spec.params, params), async (params, responder, cx) => {
    const response = await handler(context(params, cx, responder.signal, responder.id));
    await responder.respond(spec.mapResponse ? spec.mapResponse(response) : response);
  });
}
function registerAppNotification(builder, spec, context, handler) {
  builder.onReceiveNotification(spec.method, (params) => parseParams(spec.params, params), (params, cx) => handler(context(params, cx, cx.signal)));
}
function specsByMethod(specs) {
  const byMethod = {};
  for (const spec of Object.values(specs)) {
    byMethod[spec.method] = spec;
  }
  return byMethod;
}
var agentRequestSpecs = {
  initialize: requestSpec(AGENT_METHODS.initialize, zInitializeRequest),
  newSession: requestSpec(AGENT_METHODS.session_new, zNewSessionRequest),
  loadSession: requestSpec(AGENT_METHODS.session_load, zLoadSessionRequest, emptyObjectResponse),
  unstable_forkSession: requestSpec(AGENT_METHODS.session_fork, zForkSessionRequest),
  listSessions: requestSpec(AGENT_METHODS.session_list, zListSessionsRequest),
  deleteSession: requestSpec(AGENT_METHODS.session_delete, zDeleteSessionRequest, emptyObjectResponse),
  resumeSession: requestSpec(AGENT_METHODS.session_resume, zResumeSessionRequest),
  closeSession: requestSpec(AGENT_METHODS.session_close, zCloseSessionRequest, emptyObjectResponse),
  setSessionMode: requestSpec(AGENT_METHODS.session_set_mode, zSetSessionModeRequest, emptyObjectResponse),
  setSessionConfigOption: requestSpec(AGENT_METHODS.session_set_config_option, zSetSessionConfigOptionRequest),
  authenticate: requestSpec(AGENT_METHODS.authenticate, zAuthenticateRequest, emptyObjectResponse),
  unstable_listProviders: requestSpec(AGENT_METHODS.providers_list, zListProvidersRequest),
  unstable_setProvider: requestSpec(AGENT_METHODS.providers_set, zSetProviderRequest, emptyObjectResponse),
  unstable_disableProvider: requestSpec(AGENT_METHODS.providers_disable, zDisableProviderRequest, emptyObjectResponse),
  logout: requestSpec(AGENT_METHODS.logout, zLogoutRequest, emptyObjectResponse),
  prompt: requestSpec(AGENT_METHODS.session_prompt, zPromptRequest),
  unstable_startNes: requestSpec(AGENT_METHODS.nes_start, zStartNesRequest),
  unstable_suggestNes: requestSpec(AGENT_METHODS.nes_suggest, zSuggestNesRequest),
  unstable_closeNes: requestSpec(AGENT_METHODS.nes_close, zCloseNesRequest, emptyObjectResponse)
};
var agentNotificationSpecs = {
  cancel: notificationSpec(AGENT_METHODS.session_cancel, zCancelNotification),
  unstable_didOpenDocument: notificationSpec(AGENT_METHODS.document_did_open, zDidOpenDocumentNotification),
  unstable_didChangeDocument: notificationSpec(AGENT_METHODS.document_did_change, zDidChangeDocumentNotification),
  unstable_didCloseDocument: notificationSpec(AGENT_METHODS.document_did_close, zDidCloseDocumentNotification),
  unstable_didSaveDocument: notificationSpec(AGENT_METHODS.document_did_save, zDidSaveDocumentNotification),
  unstable_didFocusDocument: notificationSpec(AGENT_METHODS.document_did_focus, zDidFocusDocumentNotification),
  unstable_acceptNes: notificationSpec(AGENT_METHODS.nes_accept, zAcceptNesNotification),
  unstable_rejectNes: notificationSpec(AGENT_METHODS.nes_reject, zRejectNesNotification)
};
var clientRequestSpecs = {
  requestPermission: requestSpec(CLIENT_METHODS.session_request_permission, zRequestPermissionRequest),
  writeTextFile: requestSpec(CLIENT_METHODS.fs_write_text_file, zWriteTextFileRequest, emptyObjectResponse),
  readTextFile: requestSpec(CLIENT_METHODS.fs_read_text_file, zReadTextFileRequest),
  createTerminal: requestSpec(CLIENT_METHODS.terminal_create, zCreateTerminalRequest),
  terminalOutput: requestSpec(CLIENT_METHODS.terminal_output, zTerminalOutputRequest),
  releaseTerminal: requestSpec(CLIENT_METHODS.terminal_release, zReleaseTerminalRequest, emptyObjectResponse),
  waitForTerminalExit: requestSpec(CLIENT_METHODS.terminal_wait_for_exit, zWaitForTerminalExitRequest),
  killTerminal: requestSpec(CLIENT_METHODS.terminal_kill, zKillTerminalRequest, emptyObjectResponse),
  unstable_createElicitation: requestSpec(CLIENT_METHODS.elicitation_create, zCreateElicitationRequest)
};
var clientNotificationSpecs = {
  sessionUpdate: notificationSpec(CLIENT_METHODS.session_update, zSessionNotification),
  unstable_completeElicitation: notificationSpec(CLIENT_METHODS.elicitation_complete, zCompleteElicitationNotification)
};
var agentRequestSpecsByMethod = specsByMethod(agentRequestSpecs);
var agentNotificationSpecsByMethod = specsByMethod(agentNotificationSpecs);
var clientRequestSpecsByMethod = specsByMethod(clientRequestSpecs);
var clientNotificationSpecsByMethod = specsByMethod(clientNotificationSpecs);
function agentRequestContext(params, client2, signal, requestId) {
  return {
    params,
    requestId,
    signal,
    client: client2
  };
}
function agentNotificationContext(params, client2, signal) {
  return {
    params,
    signal,
    client: client2
  };
}
function clientRequestContext(params, agent, signal, requestId) {
  return {
    params,
    requestId,
    signal,
    agent
  };
}
function clientNotificationContext(params, agent, signal) {
  return {
    params,
    signal,
    agent
  };
}
var SessionUpdateRouter = class {
  activeSessions = /* @__PURE__ */ new Map();
  handleMessage(message) {
    if (message.kind !== "notification" || message.method !== CLIENT_METHODS.session_update) {
      return Handled.no(message);
    }
    const notification = zSessionNotification.parse(message.params);
    const update = {
      kind: "session_update",
      notification,
      update: notification.update
    };
    const activeSessions = this.activeSessions.get(notification.sessionId);
    if (activeSessions && activeSessions.size > 0) {
      for (const session of activeSessions) {
        session.enqueue(update);
      }
    }
    return Handled.no(message);
  }
  attach(response, updates) {
    const sessions = this.activeSessions.get(response.sessionId) ?? /* @__PURE__ */ new Set();
    sessions.add(updates);
    this.activeSessions.set(response.sessionId, sessions);
    return new HandlerRegistration(() => {
      sessions.delete(updates);
      if (sessions.size === 0) {
        this.activeSessions.delete(response.sessionId);
      }
    });
  }
};
var sessionUpdateRouters = /* @__PURE__ */ new WeakMap();
function sessionUpdateRouter(cx) {
  let router = sessionUpdateRouters.get(cx);
  if (!router) {
    router = new SessionUpdateRouter();
    sessionUpdateRouters.set(cx, router);
  }
  return router;
}
function runConnectHandlers(connection, handlers) {
  for (const handler of handlers) {
    let result;
    try {
      result = handler(connection);
    } catch (error40) {
      connection.close(error40);
      throw error40;
    }
    void Promise.resolve(result).catch((error40) => {
      connection.close(error40);
    });
  }
}
var appBuilder = Symbol("appBuilder");
var runAgentConnectHandlers = Symbol("runAgentConnectHandlers");
var runClientConnectHandlers = Symbol("runClientConnectHandlers");
var stableConnectionOptions = { allowBatches: false };
var AgentApp = class {
  builder = Connection.builder();
  connectHandlers = [];
  constructor(options = {}) {
    if (options.name) {
      this.builder.name(options.name);
    }
  }
  /** @internal */
  [appBuilder]() {
    return this.builder;
  }
  /** @internal */
  [runAgentConnectHandlers](connection) {
    runConnectHandlers(connection, this.connectHandlers);
  }
  connect(target, options = {}) {
    return this.connectConnection(target, options).connection;
  }
  connectWith(target, op) {
    const { rawConnection, connection } = this.connectConnection(target);
    return rawConnection.runUntil(() => op(connection.client));
  }
  /**
   * Registers a handler that runs when this agent app opens a connection.
   *
   * Use this for connection-scoped work that needs to call client-side ACP
   * methods outside an inbound request handler.
   */
  onConnect(handler) {
    this.connectHandlers.push(handler);
    return this;
  }
  onRequest(method, handlerOrParams, handler) {
    if (handler) {
      return this.request({ method, params: handlerOrParams }, handler);
    }
    const spec = agentRequestSpecsByMethod[method];
    if (!spec) {
      throw new Error(\`Unknown ACP request method '\${method}'. Pass a params parser for custom methods.\`);
    }
    return this.request(spec, handlerOrParams);
  }
  onNotification(method, handlerOrParams, handler) {
    if (handler) {
      return this.notification({ method, params: handlerOrParams }, handler);
    }
    const spec = agentNotificationSpecsByMethod[method];
    if (!spec) {
      throw new Error(\`Unknown ACP notification method '\${method}'. Pass a params parser for custom methods.\`);
    }
    return this.notification(spec, handlerOrParams);
  }
  request(spec, handler) {
    registerAppRequest(this.builder, spec, (params, cx, signal, requestId) => agentRequestContext(params, AgentContext.create(cx, requestId), signal, requestId), handler);
    return this;
  }
  notification(spec, handler) {
    registerAppNotification(this.builder, spec, (params, cx, signal) => agentNotificationContext(params, AgentContext.create(cx), signal), handler);
    return this;
  }
  connectConnection(target, options = {}) {
    if (isStream(target)) {
      const state2 = this.openStreamConnection(target);
      if (!options.deferConnectHandlers) {
        this[runAgentConnectHandlers](state2.connection);
      }
      return state2;
    }
    const [thisStream, peerStream] = memoryStreamPair();
    const peerRawConnection = target[appBuilder]().connect(peerStream, stableConnectionOptions);
    const peerConnection = clientConnection(peerRawConnection);
    const state = this.openStreamConnection(thisStream);
    void state.rawConnection.closed.then(() => peerConnection.close());
    void peerRawConnection.closed.then(() => state.connection.close());
    try {
      target[runClientConnectHandlers](peerConnection);
      this[runAgentConnectHandlers](state.connection);
    } catch (error40) {
      peerConnection.close(error40);
      state.connection.close(error40);
      throw error40;
    }
    return state;
  }
  openStreamConnection(stream) {
    const rawConnection = this.builder.connect(stream, stableConnectionOptions);
    return {
      rawConnection,
      connection: agentConnection(rawConnection, this.connectHandlers)
    };
  }
};
function client(options) {
  return new ClientApp(options);
}
var ClientApp = class {
  builder = Connection.builder();
  connectHandlers = [];
  constructor(options = {}) {
    if (options.name) {
      this.builder.name(options.name);
    }
    this.builder.withHandler({
      handleMessage: (message, cx) => sessionUpdateRouter(cx).handleMessage(message),
      describe: () => "client-session-update-router"
    });
  }
  /** @internal */
  [appBuilder]() {
    return this.builder;
  }
  /** @internal */
  [runClientConnectHandlers](connection) {
    runConnectHandlers(connection, this.connectHandlers);
  }
  connect(target) {
    return this.connectConnection(target).connection;
  }
  connectWith(target, op) {
    const { rawConnection, connection } = this.connectConnection(target);
    return rawConnection.runUntil(() => op(connection.agent));
  }
  /**
   * Registers a handler that runs when this client app opens a connection.
   *
   * Use this for connection-scoped work that needs to call agent-side ACP
   * methods outside an inbound request handler.
   */
  onConnect(handler) {
    this.connectHandlers.push(handler);
    return this;
  }
  onRequest(method, handlerOrParams, handler) {
    if (handler) {
      return this.request({ method, params: handlerOrParams }, handler);
    }
    const spec = clientRequestSpecsByMethod[method];
    if (!spec) {
      throw new Error(\`Unknown ACP request method '\${method}'. Pass a params parser for custom methods.\`);
    }
    return this.request(spec, handlerOrParams);
  }
  onNotification(method, handlerOrParams, handler) {
    if (handler) {
      return this.notification({ method, params: handlerOrParams }, handler);
    }
    const spec = clientNotificationSpecsByMethod[method];
    if (!spec) {
      throw new Error(\`Unknown ACP notification method '\${method}'. Pass a params parser for custom methods.\`);
    }
    return this.notification(spec, handlerOrParams);
  }
  request(spec, handler) {
    registerAppRequest(this.builder, spec, (params, cx, signal, requestId) => clientRequestContext(params, ClientContext.create(cx, requestId), signal, requestId), handler);
    return this;
  }
  notification(spec, handler) {
    registerAppNotification(this.builder, spec, (params, cx, signal) => clientNotificationContext(params, ClientContext.create(cx), signal), handler);
    return this;
  }
  connectConnection(target) {
    if (isStream(target)) {
      const state2 = this.openStreamConnection(target);
      this[runClientConnectHandlers](state2.connection);
      return state2;
    }
    const [thisStream, peerStream] = memoryStreamPair();
    const peerRawConnection = target[appBuilder]().connect(peerStream, stableConnectionOptions);
    const peerConnection = agentConnection(peerRawConnection);
    const state = this.openStreamConnection(thisStream);
    void state.rawConnection.closed.then(() => peerConnection.close());
    void peerRawConnection.closed.then(() => state.connection.close());
    try {
      target[runAgentConnectHandlers](peerConnection);
      this[runClientConnectHandlers](state.connection);
    } catch (error40) {
      peerConnection.close(error40);
      state.connection.close(error40);
      throw error40;
    }
    return state;
  }
  openStreamConnection(stream) {
    const rawConnection = this.builder.connect(stream, stableConnectionOptions);
    return {
      rawConnection,
      connection: clientConnection(rawConnection, this.connectHandlers)
    };
  }
};
var legacyAgentRequestMethods = /* @__PURE__ */ new Set([
  AGENT_METHODS.initialize,
  AGENT_METHODS.authenticate,
  AGENT_METHODS.providers_list,
  AGENT_METHODS.providers_set,
  AGENT_METHODS.providers_disable,
  AGENT_METHODS.session_new,
  AGENT_METHODS.session_load,
  AGENT_METHODS.session_set_mode,
  AGENT_METHODS.session_set_config_option,
  AGENT_METHODS.session_prompt,
  AGENT_METHODS.session_list,
  AGENT_METHODS.session_delete,
  AGENT_METHODS.session_fork,
  AGENT_METHODS.session_resume,
  AGENT_METHODS.session_close,
  AGENT_METHODS.logout,
  AGENT_METHODS.nes_start,
  AGENT_METHODS.nes_suggest,
  AGENT_METHODS.nes_close
]);
var legacyAgentNotificationMethods = /* @__PURE__ */ new Set([
  AGENT_METHODS.session_cancel,
  AGENT_METHODS.nes_accept,
  AGENT_METHODS.nes_reject,
  AGENT_METHODS.document_did_open,
  AGENT_METHODS.document_did_change,
  AGENT_METHODS.document_did_close,
  AGENT_METHODS.document_did_save,
  AGENT_METHODS.document_did_focus
]);
var legacyClientRequestMethods = /* @__PURE__ */ new Set([
  CLIENT_METHODS.session_request_permission,
  CLIENT_METHODS.fs_write_text_file,
  CLIENT_METHODS.fs_read_text_file,
  CLIENT_METHODS.terminal_create,
  CLIENT_METHODS.terminal_output,
  CLIENT_METHODS.terminal_release,
  CLIENT_METHODS.terminal_wait_for_exit,
  CLIENT_METHODS.terminal_kill,
  CLIENT_METHODS.elicitation_create
]);
var legacyClientNotificationMethods = /* @__PURE__ */ new Set([
  CLIENT_METHODS.session_update,
  CLIENT_METHODS.elicitation_complete
]);

// callback-src/providers/cursorAcpEvents.ts
var TOOL_LABELS = {
  read: "Reading file...",
  edit: "Editing file...",
  delete: "Editing file...",
  move: "Editing file...",
  search: "Searching code...",
  execute: "Running command...",
  think: "Thinking...",
  fetch: "Fetching URL...",
  switch_mode: "Switching mode...",
  other: "Using tool..."
};
function toolStepType(kind) {
  if (kind === "execute") return "bash";
  if (kind === "fetch") return "web_fetch";
  if (kind === "think") return "thinking";
  if (kind === "other" || kind === void 0) return "tool";
  return kind;
}
function toolLabel(kind, title) {
  if (kind !== void 0) return TOOL_LABELS[kind] ?? title;
  return title || "Using tool...";
}
function firstLocationPath(locations) {
  const first = locations?.[0];
  return first?.path;
}
function contentText(content) {
  const parts = [];
  for (const item of content) {
    if (item.type === "content" && item.content.type === "text") {
      parts.push(item.content.text);
    } else if (item.type === "diff") {
      parts.push(\`Updated \${item.path}\`);
    }
  }
  return parts.join("\\n").trim();
}
function changedFiles(content) {
  return content.flatMap((item) => item.type === "diff" ? [item.path] : []);
}
function toolResult(update) {
  const content = update.content ?? [];
  const text = contentText(content);
  const files = changedFiles(content);
  const rawText = typeof update.rawOutput === "string" ? update.rawOutput.trim() : "";
  const outputText = text || rawText;
  if (!outputText && files.length === 0 && update.status !== "failed") {
    return void 0;
  }
  return {
    ...outputText ? { output: { text: outputText } } : {},
    ...files.length > 0 ? { files } : {},
    ...update.status === "failed" ? { isError: true } : {}
  };
}
function todoFromPlanEntry(entry) {
  return { content: entry.content, status: entry.status };
}
function textFromContent(content) {
  if (content.type === "text") return content.text;
  if (content.type === "resource" && "text" in content.resource) {
    return content.resource.text;
  }
  return "";
}
var CursorAcpEventAdapter = class {
  activeSessionId = "";
  replaying = false;
  turnActive = false;
  generation = 0;
  activeGeneration = 0;
  lastMessageId = "";
  messageStarted = false;
  finalText = "";
  knownToolIds = /* @__PURE__ */ new Set();
  terminalToolIds = /* @__PURE__ */ new Set();
  emittedEvents = [];
  replayNotificationCount = 0;
  setSession(sessionId) {
    this.activeSessionId = sessionId;
  }
  beginReplay() {
    this.replaying = true;
    this.replayNotificationCount = 0;
  }
  endReplay() {
    this.replaying = false;
  }
  getReplayNotificationCount() {
    return this.replayNotificationCount;
  }
  beginTurn() {
    this.generation += 1;
    this.activeGeneration = this.generation;
    this.turnActive = true;
    this.lastMessageId = "";
    this.messageStarted = false;
    this.finalText = "";
    this.knownToolIds.clear();
    this.terminalToolIds.clear();
    this.emittedEvents.length = 0;
    return this.activeGeneration;
  }
  endTurn(generation) {
    if (generation === this.activeGeneration) this.turnActive = false;
  }
  getFinalText() {
    return this.finalText;
  }
  getEvents() {
    return [...this.emittedEvents];
  }
  record(events) {
    if (this.replaying || !this.turnActive) return [];
    this.emittedEvents.push(...events);
    return events;
  }
  recordToolCompletion(events, toolId) {
    if (this.terminalToolIds.has(toolId)) return [];
    const currentEvents = this.knownToolIds.has(toolId) ? events.filter((event) => event.kind !== "push_step") : events;
    this.knownToolIds.add(toolId);
    this.terminalToolIds.add(toolId);
    return this.record(currentEvents);
  }
  handle(notification) {
    if (notification.sessionId !== this.activeSessionId) return [];
    if (this.replaying) {
      this.replayNotificationCount += 1;
      return [];
    }
    if (!this.turnActive) return [];
    const events = this.mapUpdate(notification.update);
    this.emittedEvents.push(...events);
    return events;
  }
  mapAgentMessage(messageId, content) {
    const text = textFromContent(content);
    if (!text) return [];
    const events = [];
    const isNewMessage = !this.messageStarted || typeof messageId === "string" && messageId.length > 0 && messageId !== this.lastMessageId;
    if (isNewMessage) {
      events.push({ kind: "mark_message_start" });
      if (this.finalText && !this.finalText.endsWith("\\n")) {
        this.finalText += "\\n\\n";
      }
      this.messageStarted = true;
      if (typeof messageId === "string") this.lastMessageId = messageId;
    }
    this.finalText += text;
    events.push({ kind: "stream_text_delta", text });
    return events;
  }
  mapToolCall(tool) {
    if (this.terminalToolIds.has(tool.toolCallId)) return [];
    this.knownToolIds.add(tool.toolCallId);
    const step = {
      type: toolStepType(tool.kind),
      label: toolLabel(tool.kind, tool.title),
      detail: tool.title,
      status: tool.status === "completed" ? "complete" : "active",
      toolUseId: tool.toolCallId,
      ...firstLocationPath(tool.locations) ? { path: firstLocationPath(tool.locations) } : {}
    };
    const events = [
      {
        kind: "push_step",
        trackingId: tool.toolCallId,
        step
      }
    ];
    if (tool.status === "completed" || tool.status === "failed") {
      this.terminalToolIds.add(tool.toolCallId);
      events.push({
        kind: "complete_tool",
        trackingId: tool.toolCallId,
        result: toolResult(tool)
      });
    }
    return events;
  }
  mapToolUpdate(update) {
    if (this.terminalToolIds.has(update.toolCallId)) return [];
    if (update.status !== "completed" && update.status !== "failed") return [];
    this.terminalToolIds.add(update.toolCallId);
    return [
      {
        kind: "complete_tool",
        trackingId: update.toolCallId,
        result: toolResult(update)
      }
    ];
  }
  mapUpdate(update) {
    switch (update.sessionUpdate) {
      case "agent_message_chunk":
        return this.mapAgentMessage(update.messageId, update.content);
      case "agent_thought_chunk": {
        const text = textFromContent(update.content);
        return text ? [{ kind: "update_reasoning", text }] : [];
      }
      case "user_message_chunk":
        return [];
      case "tool_call":
        return this.mapToolCall(update);
      case "tool_call_update":
        return this.mapToolUpdate(update);
      case "plan":
        return [
          { kind: "set_todos", todos: update.entries.map(todoFromPlanEntry) }
        ];
      case "plan_update":
        return update.plan.type === "items" ? [
          {
            kind: "set_todos",
            todos: update.plan.entries.map(todoFromPlanEntry)
          }
        ] : [];
      default:
        return [];
    }
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports2 = {};
__export(external_exports2, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER2,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType2,
  ZodAny: () => ZodAny2,
  ZodArray: () => ZodArray2,
  ZodBigInt: () => ZodBigInt2,
  ZodBoolean: () => ZodBoolean2,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch2,
  ZodDate: () => ZodDate2,
  ZodDefault: () => ZodDefault2,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion2,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum2,
  ZodError: () => ZodError2,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection2,
  ZodIssueCode: () => ZodIssueCode2,
  ZodLazy: () => ZodLazy2,
  ZodLiteral: () => ZodLiteral2,
  ZodMap: () => ZodMap2,
  ZodNaN: () => ZodNaN2,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever2,
  ZodNull: () => ZodNull2,
  ZodNullable: () => ZodNullable2,
  ZodNumber: () => ZodNumber2,
  ZodObject: () => ZodObject2,
  ZodOptional: () => ZodOptional2,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise2,
  ZodReadonly: () => ZodReadonly2,
  ZodRecord: () => ZodRecord2,
  ZodSchema: () => ZodType2,
  ZodSet: () => ZodSet2,
  ZodString: () => ZodString2,
  ZodSymbol: () => ZodSymbol2,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple2,
  ZodType: () => ZodType2,
  ZodUndefined: () => ZodUndefined2,
  ZodUnion: () => ZodUnion2,
  ZodUnknown: () => ZodUnknown2,
  ZodVoid: () => ZodVoid2,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom2,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default2,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap2,
  getParsedType: () => getParsedType2,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap2,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs2(_arg) {
  }
  util2.assertIs = assertIs2;
  function assertNever2(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever2;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object2) => {
    const keys = [];
    for (const key in object2) {
      if (Object.prototype.hasOwnProperty.call(object2, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues2(array2, separator = " | ") {
    return array2.map((val) => typeof val === "string" ? \`'\${val}'\` : val).join(separator);
  }
  util2.joinValues = joinValues2;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType2 = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode2 = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "\$1:");
};
var ZodError2 = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue2) {
      return issue2.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error40) => {
      for (const issue2 of error40.issues) {
        if (issue2.code === "invalid_union") {
          issue2.unionErrors.map(processError);
        } else if (issue2.code === "invalid_return_type") {
          processError(issue2.returnTypeError);
        } else if (issue2.code === "invalid_arguments") {
          processError(issue2.argumentsError);
        } else if (issue2.path.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue2.path.length) {
            const el = issue2.path[i];
            const terminal = i === issue2.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(\`Not a ZodError: \${value}\`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue2) => issue2.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError2.create = (issues) => {
  const error40 = new ZodError2(issues);
  return error40;
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue2, _ctx) => {
  let message;
  switch (issue2.code) {
    case ZodIssueCode2.invalid_type:
      if (issue2.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = \`Expected \${issue2.expected}, received \${issue2.received}\`;
      }
      break;
    case ZodIssueCode2.invalid_literal:
      message = \`Invalid literal value, expected \${JSON.stringify(issue2.expected, util.jsonStringifyReplacer)}\`;
      break;
    case ZodIssueCode2.unrecognized_keys:
      message = \`Unrecognized key(s) in object: \${util.joinValues(issue2.keys, ", ")}\`;
      break;
    case ZodIssueCode2.invalid_union:
      message = \`Invalid input\`;
      break;
    case ZodIssueCode2.invalid_union_discriminator:
      message = \`Invalid discriminator value. Expected \${util.joinValues(issue2.options)}\`;
      break;
    case ZodIssueCode2.invalid_enum_value:
      message = \`Invalid enum value. Expected \${util.joinValues(issue2.options)}, received '\${issue2.received}'\`;
      break;
    case ZodIssueCode2.invalid_arguments:
      message = \`Invalid function arguments\`;
      break;
    case ZodIssueCode2.invalid_return_type:
      message = \`Invalid function return type\`;
      break;
    case ZodIssueCode2.invalid_date:
      message = \`Invalid date\`;
      break;
    case ZodIssueCode2.invalid_string:
      if (typeof issue2.validation === "object") {
        if ("includes" in issue2.validation) {
          message = \`Invalid input: must include "\${issue2.validation.includes}"\`;
          if (typeof issue2.validation.position === "number") {
            message = \`\${message} at one or more positions greater than or equal to \${issue2.validation.position}\`;
          }
        } else if ("startsWith" in issue2.validation) {
          message = \`Invalid input: must start with "\${issue2.validation.startsWith}"\`;
        } else if ("endsWith" in issue2.validation) {
          message = \`Invalid input: must end with "\${issue2.validation.endsWith}"\`;
        } else {
          util.assertNever(issue2.validation);
        }
      } else if (issue2.validation !== "regex") {
        message = \`Invalid \${issue2.validation}\`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode2.too_small:
      if (issue2.type === "array")
        message = \`Array must contain \${issue2.exact ? "exactly" : issue2.inclusive ? \`at least\` : \`more than\`} \${issue2.minimum} element(s)\`;
      else if (issue2.type === "string")
        message = \`String must contain \${issue2.exact ? "exactly" : issue2.inclusive ? \`at least\` : \`over\`} \${issue2.minimum} character(s)\`;
      else if (issue2.type === "number")
        message = \`Number must be \${issue2.exact ? \`exactly equal to \` : issue2.inclusive ? \`greater than or equal to \` : \`greater than \`}\${issue2.minimum}\`;
      else if (issue2.type === "bigint")
        message = \`Number must be \${issue2.exact ? \`exactly equal to \` : issue2.inclusive ? \`greater than or equal to \` : \`greater than \`}\${issue2.minimum}\`;
      else if (issue2.type === "date")
        message = \`Date must be \${issue2.exact ? \`exactly equal to \` : issue2.inclusive ? \`greater than or equal to \` : \`greater than \`}\${new Date(Number(issue2.minimum))}\`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode2.too_big:
      if (issue2.type === "array")
        message = \`Array must contain \${issue2.exact ? \`exactly\` : issue2.inclusive ? \`at most\` : \`less than\`} \${issue2.maximum} element(s)\`;
      else if (issue2.type === "string")
        message = \`String must contain \${issue2.exact ? \`exactly\` : issue2.inclusive ? \`at most\` : \`under\`} \${issue2.maximum} character(s)\`;
      else if (issue2.type === "number")
        message = \`Number must be \${issue2.exact ? \`exactly\` : issue2.inclusive ? \`less than or equal to\` : \`less than\`} \${issue2.maximum}\`;
      else if (issue2.type === "bigint")
        message = \`BigInt must be \${issue2.exact ? \`exactly\` : issue2.inclusive ? \`less than or equal to\` : \`less than\`} \${issue2.maximum}\`;
      else if (issue2.type === "date")
        message = \`Date must be \${issue2.exact ? \`exactly\` : issue2.inclusive ? \`smaller than or equal to\` : \`smaller than\`} \${new Date(Number(issue2.maximum))}\`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode2.custom:
      message = \`Invalid input\`;
      break;
    case ZodIssueCode2.invalid_intersection_types:
      message = \`Intersection results could not be merged\`;
      break;
    case ZodIssueCode2.not_multiple_of:
      message = \`Number must be a multiple of \${issue2.multipleOf}\`;
      break;
    case ZodIssueCode2.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue2);
  }
  return { message };
};
var en_default2 = errorMap;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default2;
function setErrorMap2(map2) {
  overrideErrorMap = map2;
}
function getErrorMap2() {
  return overrideErrorMap;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map2 of maps) {
    errorMessage = map2(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap2();
  const issue2 = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default2 ? void 0 : en_default2
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue2);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error40 = new ZodError2(ctx.common.issues);
        this._error = error40;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(\`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.\`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType2 = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType2(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType2(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType2(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType2(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check2, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check2(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode2.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check2, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check2(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional2.create(this, this._def);
  }
  nullable() {
    return ZodNullable2.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray2.create(this);
  }
  promise() {
    return ZodPromise2.create(this, this._def);
  }
  or(option) {
    return ZodUnion2.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection2.create(this, incoming, this._def);
  }
  transform(transform2) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform: transform2 }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault2({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch2({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly2.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\\s-]{8,}\$/i;
var cuid2Regex = /^[0-9a-z]+\$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}\$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}\$/i;
var nanoidRegex = /^[a-z0-9_-]{21}\$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*\$/;
var durationRegex = /^[-+]?P(?!\$)(?:(?:[-+]?\\d+Y)|(?:[-+]?\\d+[.,]\\d+Y\$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M\$))?(?:(?:[-+]?\\d+W)|(?:[-+]?\\d+[.,]\\d+W\$))?(?:(?:[-+]?\\d+D)|(?:[-+]?\\d+[.,]\\d+D\$))?(?:T(?=[\\d+-])(?:(?:[-+]?\\d+H)|(?:[-+]?\\d+[.,]\\d+H\$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M\$))?(?:[-+]?\\d+(?:[.,]\\d+)?S)?)??\$/;
var emailRegex = /^(?!\\.)(?!.*\\.\\.)([A-Z0-9_'+\\-\\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\\-]*\\.)+[A-Z]{2,}\$/i;
var _emojiRegex = \`^(\\\\p{Extended_Pictographic}|\\\\p{Emoji_Component})+\$\`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\/(3[0-2]|[12]?[0-9])\$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])\$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?\$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?\$/;
var dateRegexSource = \`((\\\\d\\\\d[2468][048]|\\\\d\\\\d[13579][26]|\\\\d\\\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\\\d|30)|(02)-(0[1-9]|1\\\\d|2[0-8])))\`;
var dateRegex = new RegExp(\`^\${dateRegexSource}\$\`);
function timeRegexSource(args) {
  let secondsRegexSource = \`[0-5]\\\\d\`;
  if (args.precision) {
    secondsRegexSource = \`\${secondsRegexSource}\\\\.\\\\d{\${args.precision}}\`;
  } else if (args.precision == null) {
    secondsRegexSource = \`\${secondsRegexSource}(\\\\.\\\\d+)?\`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return \`([01]\\\\d|2[0-3]):[0-5]\\\\d(:\${secondsRegexSource})\${secondsQuantifier}\`;
}
function timeRegex(args) {
  return new RegExp(\`^\${timeRegexSource(args)}\$\`);
}
function datetimeRegex(args) {
  let regex = \`\${dateRegexSource}T\${timeRegexSource(args)}\`;
  const opts = [];
  opts.push(args.local ? \`Z?\` : \`Z\`);
  if (args.offset)
    opts.push(\`([+-]\\\\d{2}:?\\\\d{2})\`);
  regex = \`\${regex}(\${opts.join("|")})\`;
  return new RegExp(\`^\${regex}\$\`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT2(jwt2, alg) {
  if (!jwtRegex.test(jwt2))
    return false;
  try {
    const [header] = jwt2.split(".");
    if (!header)
      return false;
    const base643 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base643));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString2 = class _ZodString2 extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        if (input.data.length < check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            minimum: check2.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        if (input.data.length > check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            maximum: check2.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "length") {
        const tooBig = input.data.length > check2.value;
        const tooSmall = input.data.length < check2.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode2.too_big,
              maximum: check2.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check2.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode2.too_small,
              minimum: check2.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check2.message
            });
          }
          status.dirty();
        }
      } else if (check2.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "regex") {
        check2.regex.lastIndex = 0;
        const testResult = check2.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "trim") {
        input.data = input.data.trim();
      } else if (check2.kind === "includes") {
        if (!input.data.includes(check2.value, check2.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { includes: check2.value, position: check2.position },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check2.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check2.kind === "startsWith") {
        if (!input.data.startsWith(check2.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { startsWith: check2.value },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "endsWith") {
        if (!input.data.endsWith(check2.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: { endsWith: check2.value },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "datetime") {
        const regex = datetimeRegex(check2);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "datetime",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "date",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "time") {
        const regex = timeRegex(check2);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_string,
            validation: "time",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "ip") {
        if (!isValidIP(input.data, check2.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "jwt") {
        if (!isValidJWT2(input.data, check2.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cidr") {
        if (!isValidCidr(input.data, check2.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode2.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode2.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check2) {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to \`.min(1)\`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString2({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString2.create = (params) => {
  return new ZodString2({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder2(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber2 = class _ZodNumber extends ZodType2 {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check2 of this._def.checks) {
      if (check2.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.invalid_type,
            expected: "integer",
            received: "float",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "min") {
        const tooSmall = check2.inclusive ? input.data < check2.value : input.data <= check2.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            minimum: check2.value,
            type: "number",
            inclusive: check2.inclusive,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        const tooBig = check2.inclusive ? input.data > check2.value : input.data >= check2.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            maximum: check2.value,
            type: "number",
            inclusive: check2.inclusive,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "multipleOf") {
        if (floatSafeRemainder2(input.data, check2.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_multiple_of,
            multipleOf: check2.value,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_finite,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber2.create = (params) => {
  return new ZodNumber2({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt2 = class _ZodBigInt extends ZodType2 {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        const tooSmall = check2.inclusive ? input.data < check2.value : input.data <= check2.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            type: "bigint",
            minimum: check2.value,
            inclusive: check2.inclusive,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        const tooBig = check2.inclusive ? input.data > check2.value : input.data >= check2.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            type: "bigint",
            maximum: check2.value,
            inclusive: check2.inclusive,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "multipleOf") {
        if (input.data % check2.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.not_multiple_of,
            multipleOf: check2.value,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode2.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt2.create = (params) => {
  return new ZodBigInt2({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean2 = class extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean2.create = (params) => {
  return new ZodBoolean2({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate2 = class _ZodDate extends ZodType2 {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        if (input.data.getTime() < check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_small,
            message: check2.message,
            inclusive: true,
            exact: false,
            minimum: check2.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        if (input.data.getTime() > check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode2.too_big,
            message: check2.message,
            inclusive: true,
            exact: false,
            maximum: check2.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check2) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate2.create = (params) => {
  return new ZodDate2({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol2.create = (params) => {
  return new ZodSymbol2({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined2.create = (params) => {
  return new ZodUndefined2({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull2.create = (params) => {
  return new ZodNull2({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny2 = class extends ZodType2 {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny2.create = (params) => {
  return new ZodAny2({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown2 = class extends ZodType2 {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown2.create = (params) => {
  return new ZodUnknown2({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever2 = class extends ZodType2 {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode2.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever2.create = (params) => {
  return new ZodNever2({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid2.create = (params) => {
  return new ZodVoid2({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray2 = class _ZodArray extends ZodType2 {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode2.too_big : ZodIssueCode2.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray2.create = (schema, params) => {
  return new ZodArray2({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject2) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional2.create(deepPartialify(fieldSchema));
    }
    return new ZodObject2({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray2) {
    return new ZodArray2({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional2) {
    return ZodOptional2.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable2) {
    return ZodNullable2.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple2) {
    return ZodTuple2.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject2 = class _ZodObject extends ZodType2 {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever2 && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever2) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode2.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(\`Internal ZodObject error: invalid unknownKeys value.\`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue2, ctx) => {
          const defaultError = this._def.errorMap?.(issue2, ctx).message ?? ctx.defaultError;
          if (issue2.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional2) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject2.create = (shape, params) => {
  return new ZodObject2({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject2.strictCreate = (shape, params) => {
  return new ZodObject2({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject2.lazycreate = (shape, params) => {
  return new ZodObject2({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever2.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError2(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError2(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion2.create = (types, params) => {
  return new ZodUnion2({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy2) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral2) {
    return [type.value];
  } else if (type instanceof ZodEnum2) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault2) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined2) {
    return [void 0];
  } else if (type instanceof ZodNull2) {
    return [null];
  } else if (type instanceof ZodOptional2) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable2) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly2) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch2) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion2 = class _ZodDiscriminatedUnion extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(\`A discriminator value for key \\\`\${discriminator}\\\` could not be extracted from all schema options\`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(\`Discriminator property \${String(discriminator)} has duplicate value \${String(value)}\`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues2(a, b) {
  const aType = getParsedType2(a);
  const bType = getParsedType2(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues2(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues2(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection2 = class extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues2(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection2.create = (left, right, params) => {
  return new ZodIntersection2({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple2 = class _ZodTuple extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple2.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple2({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord2 = class _ZodRecord extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType2) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString2.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap2 = class extends ZodType2 {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap2.create = (keyType, valueType, params) => {
  return new ZodMap2({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet2 = class _ZodSet extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode2.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet2.create = (valueType, params) => {
  return new ZodSet2({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType2 {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error40) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap2(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode2.invalid_arguments,
          argumentsError: error40
        }
      });
    }
    function makeReturnsIssue(returns, error40) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap2(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode2.invalid_return_type,
          returnTypeError: error40
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise2) {
      const me = this;
      return OK(async function(...args) {
        const error40 = new ZodError2([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error40.addIssue(makeArgsIssue(args, e));
          throw error40;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error40.addIssue(makeReturnsIssue(result, e));
          throw error40;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError2([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError2([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple2.create(items).rest(ZodUnknown2.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple2.create([]).rest(ZodUnknown2.create()),
      returns: returns || ZodUnknown2.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy2 = class extends ZodType2 {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy2.create = (getter, params) => {
  return new ZodLazy2({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral2 = class extends ZodType2 {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral2.create = (value, params) => {
  return new ZodLiteral2({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum2({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum2 = class _ZodEnum extends ZodType2 {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode2.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum2.create = createZodEnum;
var ZodNativeEnum = class extends ZodType2 {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode2.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode2.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise2 = class extends ZodType2 {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise2.create = (schema, params) => {
  return new ZodPromise2({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType2 {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(\`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.\`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess2, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess2 },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional2.create = (type, params) => {
  return new ZodOptional2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable2.create = (type, params) => {
  return new ZodNullable2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault2.create = (type, params) => {
  return new ZodDefault2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch2 = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError2(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError2(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch2.create = (type, params) => {
  return new ZodCatch2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN2 = class extends ZodType2 {
  _parse(input) {
    const parsedType4 = this._getType(input);
    if (parsedType4 !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode2.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN2.create = (params) => {
  return new ZodNaN2({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType2 {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType2 {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly2 = class extends ZodType2 {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly2.create = (type, params) => {
  return new ZodReadonly2({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom2(check2, _params = {}, fatal) {
  if (check2)
    return ZodAny2.create().superRefine((data, ctx) => {
      const r = check2(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny2.create();
}
var late = {
  object: ZodObject2.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: \`Input not instance of \${cls.name}\`
}) => custom2((data) => data instanceof cls, params);
var stringType = ZodString2.create;
var numberType = ZodNumber2.create;
var nanType = ZodNaN2.create;
var bigIntType = ZodBigInt2.create;
var booleanType = ZodBoolean2.create;
var dateType = ZodDate2.create;
var symbolType = ZodSymbol2.create;
var undefinedType = ZodUndefined2.create;
var nullType = ZodNull2.create;
var anyType = ZodAny2.create;
var unknownType = ZodUnknown2.create;
var neverType = ZodNever2.create;
var voidType = ZodVoid2.create;
var arrayType = ZodArray2.create;
var objectType = ZodObject2.create;
var strictObjectType = ZodObject2.strictCreate;
var unionType = ZodUnion2.create;
var discriminatedUnionType = ZodDiscriminatedUnion2.create;
var intersectionType = ZodIntersection2.create;
var tupleType = ZodTuple2.create;
var recordType = ZodRecord2.create;
var mapType = ZodMap2.create;
var setType = ZodSet2.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy2.create;
var literalType = ZodLiteral2.create;
var enumType = ZodEnum2.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise2.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional2.create;
var nullableType = ZodNullable2.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString2.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber2.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean2.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt2.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate2.create({ ...arg, coerce: true }))
};
var NEVER2 = INVALID;

// callback-src/providers/cursorAcpInteractions.ts
var cursorQuestionOptionSchema = external_exports2.object({
  id: external_exports2.string(),
  label: external_exports2.string()
});
var cursorQuestionSchema = external_exports2.object({
  id: external_exports2.string(),
  prompt: external_exports2.string(),
  options: external_exports2.array(cursorQuestionOptionSchema),
  allowMultiple: external_exports2.boolean().optional()
});
var cursorAskQuestionRequestSchema = external_exports2.object({
  toolCallId: external_exports2.string(),
  title: external_exports2.string().optional(),
  questions: external_exports2.array(cursorQuestionSchema)
});
var cursorTodoSchema = external_exports2.object({
  id: external_exports2.string().optional(),
  content: external_exports2.string().optional(),
  title: external_exports2.string().optional(),
  status: external_exports2.string().optional()
});
var cursorPlanPhaseSchema = external_exports2.object({
  name: external_exports2.string(),
  todos: external_exports2.array(cursorTodoSchema)
});
var cursorCreatePlanRequestSchema = external_exports2.object({
  toolCallId: external_exports2.string(),
  name: external_exports2.string().optional(),
  overview: external_exports2.string().optional(),
  plan: external_exports2.string(),
  todos: external_exports2.array(cursorTodoSchema),
  isProject: external_exports2.boolean().optional(),
  phases: external_exports2.array(cursorPlanPhaseSchema).optional()
});
var cursorUpdateTodosRequestSchema = external_exports2.object({
  toolCallId: external_exports2.string(),
  todos: external_exports2.array(cursorTodoSchema),
  merge: external_exports2.boolean()
});
var cursorSubagentTypeSchema = external_exports2.union([
  external_exports2.enum([
    "unspecified",
    "computer_use",
    "explore",
    "video_review",
    "browser_use",
    "shell",
    "vm_setup_helper"
  ]),
  external_exports2.object({ custom: external_exports2.string() })
]);
var cursorTaskRequestSchema = external_exports2.object({
  toolCallId: external_exports2.string(),
  description: external_exports2.string(),
  prompt: external_exports2.string(),
  subagentType: cursorSubagentTypeSchema,
  model: external_exports2.string().optional(),
  agentId: external_exports2.string().optional(),
  durationMs: external_exports2.number().optional()
});
var cursorGenerateImageRequestSchema = external_exports2.object({
  toolCallId: external_exports2.string(),
  description: external_exports2.string(),
  filePath: external_exports2.string().optional(),
  referenceImagePaths: external_exports2.array(external_exports2.string()).optional()
});
function cursorTodoStatus(status) {
  if (status === "completed" || status === "cancelled") return "completed";
  if (status === "in_progress" || status === "inProgress") {
    return "in_progress";
  }
  return "pending";
}
function cursorTodosToCanonical(todos) {
  const mapped = todos.flatMap((todo) => {
    const content = todo.content?.trim() || todo.title?.trim() || "";
    return content ? [{ content, status: cursorTodoStatus(todo.status) }] : [];
  });
  return mapped.length > 0 ? [{ kind: "set_todos", todos: mapped }] : [];
}
function autoApproveCursorPermission(request) {
  const selected = request.options.find((option) => option.kind === "allow_always") ?? request.options.find((option) => option.kind === "allow_once");
  if (!selected) {
    throw new Error(
      "Cursor requested permission without an allow-always or allow-once option"
    );
  }
  return {
    outcome: { outcome: "selected", optionId: selected.optionId }
  };
}
function questionPayload(request) {
  return JSON.stringify({
    questions: request.questions.map((question) => ({
      question: question.prompt,
      header: request.title ?? "Question",
      multiSelect: question.allowMultiple === true,
      options: question.options.map((option) => ({
        label: option.label,
        description: option.label
      }))
    }))
  });
}
function selectedOptionIds(selectedLabels, question) {
  const labels = question.allowMultiple ? selectedLabels.split(",").map((label) => label.trim()) : [selectedLabels.trim()];
  return labels.flatMap((label) => {
    const option = question.options.find(
      (candidate) => candidate.label === label || candidate.id === label
    );
    return option ? [option.id] : [];
  });
}
async function answerCursorQuestion(request, signal) {
  const answers = await waitForPendingQuestionAnswer(
    request.toolCallId,
    questionPayload(request),
    signal
  );
  if (answers === null || signal.aborted) {
    return { outcome: { outcome: "cancelled" } };
  }
  const translated = request.questions.flatMap((question) => {
    const selected = answers[question.prompt] ?? "";
    const optionIds = selectedOptionIds(selected, question);
    return optionIds.length > 0 ? [{ questionId: question.id, selectedOptionIds: optionIds }] : [];
  });
  if (translated.length !== request.questions.length) {
    return {
      outcome: {
        outcome: "skipped",
        reason: "No valid option was selected for every Cursor question."
      }
    };
  }
  return { outcome: { outcome: "answered", answers: translated } };
}
function acceptCursorPlan(request) {
  const events = cursorTodosToCanonical(request.todos);
  return { response: { outcome: { outcome: "accepted" } }, events };
}
function cursorTaskToCanonical(request) {
  const subagentType = typeof request.subagentType === "string" ? request.subagentType : request.subagentType.custom;
  const detail = [request.description, subagentType, request.model].filter((part) => typeof part === "string" && part.length > 0).join(" \\xB7 ");
  return [
    {
      kind: "push_step",
      trackingId: request.toolCallId,
      step: {
        type: "subtask",
        label: "Running agent...",
        detail,
        status: "active",
        toolUseId: request.toolCallId
      }
    },
    {
      kind: "complete_tool",
      trackingId: request.toolCallId,
      result: request.durationMs === void 0 ? void 0 : { durationMs: request.durationMs }
    }
  ];
}
function cursorGeneratedImageToCanonical(request) {
  return [
    {
      kind: "push_step",
      trackingId: request.toolCallId,
      step: {
        type: "write",
        label: "Generating image...",
        detail: request.description,
        status: "active",
        toolUseId: request.toolCallId,
        ...request.filePath ? { path: request.filePath } : {}
      }
    },
    {
      kind: "complete_tool",
      trackingId: request.toolCallId,
      result: request.filePath ? { files: [request.filePath] } : void 0
    }
  ];
}

// callback-src/providers/cursorAcpRuntime.ts
var STDERR_TAIL_LIMIT = 32e3;
function readCursorAcpMcpServers() {
  if (!existsSync8("/tmp/eva-mcp.json")) return [];
  const parsed = tryParseJson(readFileSync8("/tmp/eva-mcp.json", "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.mcpServers || typeof parsed.mcpServers !== "object" || Array.isArray(parsed.mcpServers)) {
    return [];
  }
  const servers = [];
  for (const [name, value] of Object.entries(parsed.mcpServers)) {
    if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.url !== "string") {
      continue;
    }
    const headers = [];
    if (value.headers && typeof value.headers === "object" && !Array.isArray(value.headers)) {
      for (const [headerName, headerValue] of Object.entries(value.headers)) {
        if (typeof headerValue === "string") {
          headers.push({ name: headerName, value: headerValue });
        }
      }
    }
    servers.push({ type: "http", name, url: value.url, headers });
  }
  return servers;
}
function appendBoundedTail(current, chunk) {
  const combined = current + chunk;
  return combined.length <= STDERR_TAIL_LIMIT ? combined : combined.slice(combined.length - STDERR_TAIL_LIMIT);
}
function cursorCommand2() {
  return existsSync8(CURSOR_BIN_PATH) ? CURSOR_BIN_PATH : "cursor-agent";
}
function combinedPrompt(prompt) {
  return SYSTEM_PROMPT ? \`\${SYSTEM_PROMPT}

\${prompt}\` : prompt;
}
function selectValues(option) {
  if (option.type !== "select") return [];
  const values = [];
  for (const item of option.options) {
    if ("value" in item) {
      values.push(item.value);
      continue;
    }
    for (const nested of item.options) values.push(nested.value);
  }
  return values;
}
async function configureModel(context, setup) {
  const options = setup.configOptions ?? [];
  const modelOption = options.find(
    (option) => option.type === "select" && (option.category === "model" || option.id.toLowerCase().includes("model"))
  );
  if (!modelOption || modelOption.type !== "select") {
    throw new Error(
      \`Cursor ACP did not advertise a model configuration option for \${MODEL}\`
    );
  }
  const available = selectValues(modelOption);
  if (!available.includes(normalizedCursorModel)) {
    throw new Error(
      \`Cursor ACP model \${normalizedCursorModel} is unavailable; advertised values: \${available.join(", ")}\`
    );
  }
  if (modelOption.currentValue === normalizedCursorModel) return;
  await context.request(methods.agent.session.setConfigOption, {
    sessionId: setup.sessionId,
    configId: modelOption.id,
    value: normalizedCursorModel
  });
}
async function startOrRestoreSession(context, capabilities, sessionMode, mcpServers, adapter) {
  const savedSessionId = sessionMode.sessionId?.trim() || "";
  if (sessionMode.mode === "resume" && savedSessionId) {
    adapter.setSession(savedSessionId);
    const canResume = capabilities?.sessionCapabilities?.resume !== void 0 && capabilities.sessionCapabilities.resume !== null;
    if (canResume) {
      const resumed = await context.request(methods.agent.session.resume, {
        sessionId: savedSessionId,
        cwd: WORK_DIR,
        mcpServers
      });
      log("cursor_acp session=resume");
      return {
        sessionId: savedSessionId,
        modes: resumed.modes,
        configOptions: resumed.configOptions
      };
    }
    if (capabilities?.loadSession !== true) {
      throw new Error(
        "Cursor ACP cannot restore the saved session: neither resume nor load is advertised"
      );
    }
    adapter.beginReplay();
    try {
      const loaded = await context.request(methods.agent.session.load, {
        sessionId: savedSessionId,
        cwd: WORK_DIR,
        mcpServers
      });
      log(
        \`cursor_acp session=load replay_updates=\${adapter.getReplayNotificationCount()}\`
      );
      return {
        sessionId: savedSessionId,
        modes: loaded?.modes,
        configOptions: loaded?.configOptions
      };
    } finally {
      adapter.endReplay();
    }
  }
  const created = await context.request(methods.agent.session.new, {
    cwd: WORK_DIR,
    mcpServers
  });
  adapter.setSession(created.sessionId);
  writeCursorAcpSessionState(created.sessionId);
  log("cursor_acp session=new");
  return {
    sessionId: created.sessionId,
    modes: created.modes,
    configOptions: created.configOptions
  };
}
function registerClientHandlers(adapter, emit) {
  return client({ name: "eva-cursor-acp" }).onNotification(methods.client.session.update, async ({ params }) => {
    await emit(adapter.handle(params));
  }).onRequest(
    methods.client.session.requestPermission,
    ({ params }) => autoApproveCursorPermission(params)
  ).onRequest(
    "cursor/ask_question",
    cursorAskQuestionRequestSchema,
    async ({ params, signal }) => await answerCursorQuestion(params, signal)
  ).onRequest(
    "cursor/create_plan",
    cursorCreatePlanRequestSchema,
    async ({ params }) => {
      const accepted = acceptCursorPlan(params);
      await emit(adapter.record(accepted.events));
      return accepted.response;
    }
  ).onNotification(
    "cursor/update_todos",
    cursorUpdateTodosRequestSchema,
    async ({ params }) => {
      const events = cursorTodosToCanonical(params.todos);
      await emit(adapter.record(events));
    }
  ).onNotification(
    "cursor/task",
    cursorTaskRequestSchema,
    async ({ params }) => {
      const events = cursorTaskToCanonical(params);
      await emit(adapter.recordToolCompletion(events, params.toolCallId));
    }
  ).onNotification(
    "cursor/generate_image",
    cursorGenerateImageRequestSchema,
    async ({ params }) => {
      const events = cursorGeneratedImageToCanonical(params);
      await emit(adapter.recordToolCompletion(events, params.toolCallId));
    }
  );
}
async function withCursorAcpSession(options, operation) {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment \\xE2\\u20AC\\u201D Cursor ACP cannot authenticate"
    );
  }
  const child = spawn2(cursorCommand2(), ["acp"], {
    cwd: WORK_DIR,
    env: { ...process.env, HOME: CURSOR_RUNTIME_HOME_DIR },
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (!child.stdin || !child.stdout || !child.stderr) {
    child.kill();
    throw new Error("Cursor ACP child did not expose the required stdio pipes");
  }
  let stderrTail = "";
  let childExitCode = null;
  let childSignal = null;
  child.stderr.on("data", (chunk) => {
    stderrTail = appendBoundedTail(stderrTail, String(chunk));
  });
  child.once("exit", (code, signal) => {
    childExitCode = code;
    childSignal = signal;
  });
  const adapter = new CursorAcpEventAdapter();
  let eventChain = Promise.resolve();
  const emit = (events) => {
    if (events.length === 0) return eventChain;
    eventChain = eventChain.then(async () => {
      applyCanonicalEvents(events);
      await options.onEvents?.(events);
    });
    return eventChain;
  };
  const client2 = registerClientHandlers(adapter, emit);
  const stream = ndJsonStream2(
    Writable.toWeb(child.stdin),
    Readable.toWeb(child.stdout)
  );
  try {
    return await client2.connectWith(stream, async (context) => {
      const initialized = await context.request(methods.agent.initialize, {
        protocolVersion: PROTOCOL_VERSION,
        clientCapabilities: {
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false,
          plan: {}
        },
        clientInfo: { name: "eva", version: "1.0.0" }
      });
      if (initialized.protocolVersion !== PROTOCOL_VERSION) {
        throw new Error(
          \`Cursor negotiated unsupported ACP version \${initialized.protocolVersion}\`
        );
      }
      await context.request(methods.agent.authenticate, {
        methodId: "cursor_login"
      });
      const setup = await startOrRestoreSession(
        context,
        initialized.agentCapabilities,
        options.sessionMode,
        options.mcpServers ?? [],
        adapter
      );
      const sessionId = setup.sessionId;
      await configureModel(context, setup);
      writeCursorAcpSessionState(sessionId);
      let promptInFlight = false;
      const cancel = async () => {
        if (!promptInFlight) return;
        await context.notify(methods.agent.session.cancel, { sessionId });
      };
      return await operation({
        sessionId,
        cancel,
        async prompt(prompt, signal) {
          if (promptInFlight) {
            throw new Error(
              "Cursor ACP received an overlapping prompt for one session"
            );
          }
          promptInFlight = true;
          const promptStartedAt = Date.now();
          const generation = adapter.beginTurn();
          const cancelFromCaller = () => {
            void cancel();
          };
          signal?.addEventListener("abort", cancelFromCaller, { once: true });
          let stopReason = "cancelled";
          try {
            const response = await context.request(
              methods.agent.session.prompt,
              {
                sessionId,
                prompt: [{ type: "text", text: combinedPrompt(prompt) }]
              }
            );
            stopReason = response.stopReason;
            await eventChain;
            return {
              transport: "acp-v1",
              sessionId,
              stopReason,
              result: adapter.getFinalText(),
              events: adapter.getEvents(),
              durationMs: Date.now() - promptStartedAt,
              promptSubmitted: true,
              cancellationAcknowledged: stopReason === "cancelled",
              childExitCode,
              childSignal,
              stderrTail
            };
          } finally {
            signal?.removeEventListener("abort", cancelFromCaller);
            adapter.endTurn(generation);
            promptInFlight = false;
          }
        }
      });
    });
  } finally {
    child.stdin.end();
    if (!child.killed) child.kill();
  }
}
async function runCursorAcpAttempt(options) {
  return await withCursorAcpSession(options, async (session) => {
    return await session.prompt(options.prompt, options.signal);
  });
}
function readCursorPromptFile() {
  return readFileSync8("/tmp/design-prompt.txt", "utf8");
}

// callback-src/providers/cursorAcpResult.ts
function isCursorAcpAttempt(attempt) {
  return "transport" in attempt && attempt.transport === "acp-v1";
}
function cursorAcpFailure(attempt) {
  const hasMedia = attempt.events.some(
    (event) => event.kind === "complete_tool" && event.result?.files !== void 0 && event.result.files.length > 0
  );
  if (attempt.stopReason === "end_turn") {
    return attempt.result.trim() || hasMedia ? null : "Cursor completed the turn without an assistant response.";
  }
  if (attempt.stopReason === "max_tokens") {
    return "Cursor reached the model token limit before completing the turn.";
  }
  if (attempt.stopReason === "max_turn_requests") {
    return "Cursor reached its turn-request limit before completing the turn.";
  }
  if (attempt.stopReason === "refusal") {
    return "Cursor refused the request.";
  }
  return "Cursor cancelled the turn before completion.";
}
function cursorAcpResultEvent(attempt) {
  return {
    result: attempt.result,
    isError: false,
    rawResultEvent: JSON.stringify({
      transport: attempt.transport,
      sessionId: attempt.sessionId,
      stopReason: attempt.stopReason,
      durationMs: attempt.durationMs,
      promptSubmitted: attempt.promptSubmitted,
      cancellationAcknowledged: attempt.cancellationAcknowledged
    })
  };
}

// callback-src/providers/cursorAcpDaemon.ts
var IDLE_EXIT_MS2 = 45 * 60 * 1e3;
var PROMPT_POLL_INTERVAL_MS2 = 50;
var PROMPT_SETTLE_POLL_MS = 250;
var CANCEL_SETTLE_TIMEOUT_MS2 = 3e4;
var NO_EVENT_TIMEOUT_MS = NO_OUTPUT_TIMEOUT_MS * 5;
function sleep3(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function resetTurnState2() {
  callbackState.accumulatedSteps.length = 0;
  callbackState.currentStreamedContent = "";
  callbackState.streamedAssistantTextThisMessage = false;
  callbackState.pendingParagraphBreak = false;
  callbackState.resultEventSeen = false;
  callbackState.rawOutput = "";
  callbackState.lastProcessed = 0;
  callbackState.inFlightToolUses = 0;
  callbackState.pendingQuestionData = "";
  callbackState.todoState.length = 0;
  callbackState.awaitingQuestionAnswer = false;
  callbackState.lastStepType = "thinking";
}
function callbackScriptWentStaleOnDisk2() {
  if (!CALLBACK_SCRIPT_FP) return false;
  try {
    return readFileSync9("/tmp/eva-callback-fp", "utf8").trim() !== CALLBACK_SCRIPT_FP;
  } catch {
    return false;
  }
}
function settledPrompt(attempt) {
  return { kind: "settled", attempt };
}
async function promptPoll() {
  await sleep3(PROMPT_SETTLE_POLL_MS);
  return { kind: "poll" };
}
async function finalizeTurn2(attempt) {
  const failure = cursorAcpFailure(attempt);
  const resultEvent = cursorAcpResultEvent(attempt);
  for (const step of callbackState.accumulatedSteps) step.status = "complete";
  const completionArgs = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success: failure === null,
    result: resultEvent.result,
    error: failure,
    activityLog: serializeSteps(callbackState.accumulatedSteps),
    rawResultEvent: resultEvent.rawResultEvent,
    ...activeTurnIdentityArgs()
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (callbackState.pendingQuestionData) {
    completionArgs.pendingQuestion = callbackState.pendingQuestionData;
  }
  await setFinalizingState();
  await deliverCompletionWithMedia(completionArgs);
  syncCursorStateToPersist();
  log(
    \`cursor_acp daemon turn finalized success=\${failure === null} steps=\${callbackState.accumulatedSteps.length}\`
  );
}
async function failTurn(message) {
  for (const step of callbackState.accumulatedSteps) step.status = "complete";
  const completionArgs = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success: false,
    result: callbackState.currentStreamedContent || null,
    error: message,
    activityLog: serializeSteps(callbackState.accumulatedSteps),
    ...activeTurnIdentityArgs()
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  await setFinalizingState();
  await deliverCompletionWithMedia(completionArgs);
}
function cleanupDaemonMarkers() {
  const paths = resolveDaemonPaths();
  for (const path of [paths.pid, paths.entity, paths.opts]) {
    try {
      unlinkSync3(path);
    } catch {
    }
  }
}
async function runCursorAcpDaemon() {
  if (!CLAIM_MUTATION) {
    log("cursor_acp daemon requires CLAIM_MUTATION");
    process.exit(1);
  }
  const claimMutation = CLAIM_MUTATION;
  const paths = resolveDaemonPaths();
  writeFileSync12(paths.pid, String(process.pid));
  writeFileSync12(paths.entity, ENTITY_ID ?? "");
  writeFileSync12(paths.opts, DAEMON_OPTS_SIG);
  const preflightOk2 = await runPreflightHeartbeat();
  if (!preflightOk2) {
    cleanupDaemonMarkers();
    process.exit(1);
  }
  startStreamingLoops();
  await ensureDaemonGithubToken();
  let daemonExiting2 = false;
  let acceptingClaims = true;
  let activeTurn = false;
  let pendingTurn = null;
  let cancellationKind = "none";
  let cancelRequestedAt = 0;
  let turnStartedAt = 0;
  let lastEventAt = Date.now();
  let lastIdleActivityAt = Date.now();
  let currentSession = null;
  let completionAttempted = false;
  const currentCancellationKind = () => cancellationKind;
  const requestCancellation = async (kind) => {
    if (!activeTurn || cancellationKind !== "none") return;
    cancellationKind = kind;
    cancelRequestedAt = Date.now();
    const session = currentSession;
    if (session === null) return;
    try {
      await session.cancel();
      log(\`cursor_acp daemon cancellation sent kind=\${kind}\`);
    } catch (error40) {
      log(
        \`cursor_acp daemon cancellation failed: \${error40 instanceof Error ? error40.message : String(error40)}\`
      );
    }
  };
  const claimWatcher = async () => {
    while (!daemonExiting2 && acceptingClaims) {
      if (callbackScriptWentStaleOnDisk2()) {
        acceptingClaims = false;
        log("cursor_acp daemon callback script changed; draining current turn");
        break;
      }
      try {
        const claimed = await callConvexWithRetry("mutation", claimMutation, {
          [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
          model: MODEL,
          callbackProtocolVersion: CHAT_TURN_PROTOCOL_VERSION2
        });
        if (readCancelRequested(claimed)) {
          await requestCancellation("server");
        }
        const claimedTurn = readClaimedTurn(claimed);
        if (claimedTurn !== null) {
          await materializeTurnAttachments(claimedTurn);
          lastIdleActivityAt = Date.now();
          if (pendingTurn === null) {
            pendingTurn = claimedTurn;
          } else {
            log(
              "cursor_acp daemon received an extra claimed turn; preserving the first"
            );
          }
        }
      } catch {
      }
      await sleep3(PROMPT_POLL_INTERVAL_MS2);
    }
  };
  const waitForPrompt = async (session, turn) => {
    const promptPromise = session.prompt(turn.prompt).then(settledPrompt);
    while (true) {
      const outcome = await Promise.race([promptPromise, promptPoll()]);
      if (outcome.kind === "settled") return outcome.attempt;
      const now = Date.now();
      if (cancellationKind !== "none" && now - cancelRequestedAt > CANCEL_SETTLE_TIMEOUT_MS2) {
        throw new Error("Cursor ACP did not settle after cancellation");
      }
      if (cancellationKind !== "none") continue;
      const exceededRuntime = now - turnStartedAt > MAX_TOTAL_RUNTIME_MS;
      const stoppedProducingEvents = !callbackState.awaitingQuestionAnswer && now - lastEventAt > NO_EVENT_TIMEOUT_MS;
      if (callbackState.fatalHeartbeatErrorMessage) {
        await requestCancellation("watchdog");
      } else if (exceededRuntime || stoppedProducingEvents) {
        await requestCancellation("watchdog");
      }
    }
  };
  try {
    const sessionMode = prepareCursorSessionState();
    await withCursorAcpSession(
      {
        sessionMode,
        mcpServers: readCursorAcpMcpServers(),
        onEvents: () => {
          lastEventAt = Date.now();
        }
      },
      async (session) => {
        currentSession = session;
        log(
          \`cursor_acp daemon warm entityId=\${ENTITY_ID ?? "none"} sessionId=\${session.sessionId}\`
        );
        const watcher = claimWatcher();
        while (!daemonExiting2) {
          if (!activeTurn && pendingTurn !== null) {
            const turn = pendingTurn;
            pendingTurn = null;
            resetTurnState2();
            setActiveTurnIdentity(turn.identity);
            activeTurn = true;
            cancellationKind = "none";
            completionAttempted = false;
            cancelRequestedAt = 0;
            turnStartedAt = Date.now();
            lastEventAt = turnStartedAt;
            try {
              const attempt = await waitForPrompt(session, turn);
              if (currentCancellationKind() === "server") {
                log(
                  "cursor_acp daemon cancelled turn settled without completion"
                );
              } else if (currentCancellationKind() === "watchdog") {
                completionAttempted = true;
                await failTurn(
                  callbackState.fatalHeartbeatErrorMessage || "Cursor stopped responding before the turn completed."
                );
              } else {
                completionAttempted = true;
                await finalizeTurn2(attempt);
              }
            } catch (error40) {
              const message = error40 instanceof Error ? error40.message : String(error40);
              if (currentCancellationKind() === "server") {
                log(\`cursor_acp daemon cancel settle failed: \${message}\`);
              } else if (completionAttempted) {
                log(\`cursor_acp daemon completion failed: \${message}\`);
              } else {
                completionAttempted = true;
                await failTurn(\`Cursor ACP daemon failed: \${message}\`);
              }
              acceptingClaims = false;
              daemonExiting2 = true;
            } finally {
              setActiveTurnIdentity(null);
              activeTurn = false;
              cancellationKind = "none";
              resetTurnState2();
              lastIdleActivityAt = Date.now();
            }
            continue;
          }
          if (!acceptingClaims && !activeTurn) {
            daemonExiting2 = true;
            break;
          }
          if (!activeTurn && pendingTurn === null && Date.now() - lastIdleActivityAt > IDLE_EXIT_MS2) {
            acceptingClaims = false;
            daemonExiting2 = true;
            log("cursor_acp daemon idle timeout");
            break;
          }
          await sleep3(PROMPT_POLL_INTERVAL_MS2);
        }
        await watcher;
      }
    );
    writeDoneFile("daemon-exit");
  } catch (error40) {
    const message = error40 instanceof Error ? error40.message : String(error40);
    log(\`cursor_acp daemon failed: \${message}\`);
    if (activeTurn && !completionAttempted && currentCancellationKind() !== "server") {
      completionAttempted = true;
      try {
        await failTurn(\`Cursor ACP daemon failed: \${message}\`);
      } catch {
      }
    }
  } finally {
    daemonExiting2 = true;
    setActiveTurnIdentity(null);
    currentSession = null;
    cleanupDaemonMarkers();
    await stopStreamingLoops();
  }
  process.exit(0);
}

// callback-src/providers/attempts.ts
function prepareProviderSessionState() {
  if (PROVIDER === "codex") return prepareCodexSessionState();
  if (PROVIDER === "opencode") return prepareOpencodeSessionState();
  if (PROVIDER === "cursor") return prepareCursorSessionState();
  return prepareClaudeSessionState();
}
function syncProviderStateToPersist(reason) {
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
async function runClaudeAttempt(sessionMode) {
  return await runClaudeSdkAttempt(sessionMode);
}
async function runCodexAttempt(sessionMode) {
  const sessionArg = sessionMode.mode === "resume" && sessionMode.sessionId ? " resume " + JSON.stringify(sessionMode.sessionId) : "";
  const cmd = codexPromptCmd + " | " + codexExecBaseCmd + sessionArg + " -";
  return await runCliAttempt({
    cmd,
    env: { ...process.env, CODEX_HOME: CODEX_RUNTIME_HOME_DIR },
    processLabel: "codex",
    attemptLabel: "runCodexAttempt",
    startupStep: {
      label: "Starting Codex CLI...",
      detail: sessionMode.mode === "resume" ? "Restoring saved context..." : "Launching Codex process..."
    },
    onStdoutText: codexAdapter.onStdoutText
  });
}
async function runOpencodeAttempt(sessionMode) {
  const sessionArg = sessionMode.mode === "resume" && sessionMode.sessionId ? " -s " + JSON.stringify(sessionMode.sessionId) : "";
  const cmd = opencodePromptCmd + " | " + opencodeExecBaseCmd + sessionArg;
  return await runCliAttempt({
    cmd,
    env: { ...process.env },
    processLabel: "opencode",
    attemptLabel: "runOpencodeAttempt",
    startupStep: {
      label: "Starting Opencode CLI...",
      detail: sessionMode.mode === "resume" ? "Restoring saved context..." : "Launching Opencode process..."
    }
  });
}
async function runCursorAttempt(sessionMode) {
  if (!process.env.CURSOR_API_KEY?.trim()) {
    throw new Error(
      "CURSOR_API_KEY is missing in the sandbox environment \\u2014 Cursor CLI cannot authenticate"
    );
  }
  const providerState = readCursorProviderState();
  if (providerState?.transport !== "stream-json") {
    return await runCursorAcpAttempt({
      sessionMode,
      prompt: readCursorPromptFile(),
      mcpServers: readCursorAcpMcpServers()
    });
  }
  const sessionArg = sessionMode.mode === "resume" && sessionMode.sessionId ? " --resume " + JSON.stringify(sessionMode.sessionId) : "";
  const cmd = cursorExecBaseCmd + sessionArg;
  return await runCliAttempt({
    cmd,
    env: { ...process.env, HOME: CURSOR_RUNTIME_HOME_DIR },
    processLabel: "cursor",
    attemptLabel: "runCursorAttempt",
    startupStep: {
      label: "Starting Cursor CLI...",
      detail: sessionMode.mode === "resume" ? "Restoring saved context..." : "Launching Cursor process..."
    }
  });
}
async function runProviderAttempt(sessionMode) {
  if (PROVIDER === "codex") return await runCodexAttempt(sessionMode);
  if (PROVIDER === "opencode") return await runOpencodeAttempt(sessionMode);
  if (PROVIDER === "cursor") return await runCursorAttempt(sessionMode);
  return await runClaudeAttempt(sessionMode);
}

// callback-src/index.ts
process.on("exit", (code) => {
  writeDoneFile("unexpected-exit", {
    exitCode: typeof code === "number" ? code : null
  });
  try {
    if (callbackState.rawLogStream) callbackState.rawLogStream.end();
  } catch {
  }
});
try {
  unlinkSync4(READY_FILE);
} catch {
}
try {
  writeFileSync13("/proc/self/oom_score_adj", "-600");
} catch {
}
callbackState.lastStepType = "thinking";
if (CLAIM_MUTATION) {
  if (PROVIDER === "claude") await runSdkDaemon();
  if (PROVIDER === "cursor") await runCursorAcpDaemon();
}
var preflightOk = await runPreflightHeartbeat();
if (!preflightOk) {
  writeDoneFile("preflight-failed");
  process.exit(1);
}
startStreamingLoops();
for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync9(d)) {
    for (const f of readdirSync3(d)) {
      try {
        unlinkSync4(d + "/" + f);
      } catch {
      }
    }
  } else {
    try {
      mkdirSync7(d, { recursive: true });
    } catch {
    }
  }
}
if (REPO_ID && CONVEX_URL && CONVEX_TOKEN) {
  try {
    const res = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + CONVEX_TOKEN
      },
      body: JSON.stringify({
        path: "github:getInstallationTokenAction",
        args: { repoId: REPO_ID },
        format: "json"
      })
    });
    if (res.ok) {
      const data = await readResponseJson(res);
      if (data && typeof data === "object" && !Array.isArray(data) && data.value && typeof data.value === "object" && !Array.isArray(data.value) && typeof data.value.token === "string") {
        process.env.GITHUB_TOKEN = data.value.token;
        process.env.GH_TOKEN = data.value.token;
      }
    }
  } catch {
  }
}
log(
  "entityId=" + ENTITY_ID + " provider=" + PROVIDER + " model=" + MODEL + " tools=" + ALLOWED_TOOLS + " sessionId=" + (process.env.CLAUDE_SESSION_ID || "none") + " mcp=" + (hasMcpConfig ? "yes" : "no")
);
try {
  const taskCommitBaselineHead = REQUIRE_TASK_COMMIT ? readGitHeadSha() : "";
  if (REQUIRE_TASK_COMMIT) {
    log(
      "task commit gate enabled baselineHead=" + (taskCommitBaselineHead || "unavailable")
    );
  }
  const initialSessionMode = prepareProviderSessionState();
  const firstAttempt = await runProviderAttempt(initialSessionMode);
  await flushStreaming();
  const cursorAcpAttempt = isCursorAcpAttempt(firstAttempt) ? firstAttempt : null;
  const cliAttempt = isCursorAcpAttempt(firstAttempt) ? null : firstAttempt;
  const cursorAcpError = cursorAcpAttempt ? cursorAcpFailure(cursorAcpAttempt) : null;
  const finalCode = cursorAcpAttempt ? cursorAcpError === null ? 0 : 1 : cliAttempt?.code ?? 1;
  const finalTimedOutForNoOutput = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutForNoOutput);
  const finalTimedOutForMaxRuntime = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutForMaxRuntime);
  const finalTimedOutForFirstEvent = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutForFirstEvent);
  const finalTimedOutForFirstAssistant = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutForFirstAssistant);
  const finalTimedOutAfterFirstText = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutAfterFirstText);
  const finalTimedOutForZombie = cursorAcpAttempt ? false : Boolean(cliAttempt?.timedOutForZombie);
  const finalTerminatedBySignal = cursorAcpAttempt ? cursorAcpAttempt.childSignal !== null : Boolean(cliAttempt?.terminatedBySignal);
  const finalToolStallErrorMessage = cursorAcpAttempt ? "" : cliAttempt?.toolStallErrorMessage || "";
  const finalResultEvent = cursorAcpAttempt ? cursorAcpResultEvent(cursorAcpAttempt) : extractResultEvent(cliAttempt?.output ?? "");
  log(
    "firstAttempt result: code=" + finalCode + " transport=" + (cursorAcpAttempt?.transport ?? "legacy") + " isError=" + Boolean(finalResultEvent?.isError) + " hasToolActivity=" + hasToolActivity()
  );
  if (!callbackState.resultEventSeen) {
    syncProviderStateToPersist("post-attempt");
  } else {
    log("skipping post-attempt sync because result-event sync already ran");
  }
  await setFinalizingState();
  const agentWasInterrupted = finalTerminatedBySignal || finalCode === 137 || finalCode === 143;
  const attemptEndedDueToTimeout = finalTimedOutAfterFirstText || finalTimedOutForNoOutput || finalTimedOutForMaxRuntime || finalTimedOutForFirstEvent || finalTimedOutForFirstAssistant || finalTimedOutForZombie || Boolean(finalToolStallErrorMessage);
  const runSucceededWithResult = cursorAcpAttempt ? cursorAcpError === null && !agentWasInterrupted : finalResultEvent != null && !finalResultEvent.isError && !agentWasInterrupted;
  let errorValue = cursorAcpError;
  if (!cursorAcpAttempt && finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (!cursorAcpAttempt && (!runSucceededWithResult && finalCode !== 0 || attemptEndedDueToTimeout && !runSucceededWithResult)) {
    errorValue = appendDiagnosticTail(
      buildErrorMessage(
        finalCode,
        callbackState.fatalHeartbeatErrorMessage,
        finalToolStallErrorMessage,
        finalTimedOutForMaxRuntime,
        finalTimedOutForNoOutput,
        finalTimedOutForFirstEvent,
        finalTimedOutForFirstAssistant,
        finalTimedOutAfterFirstText,
        finalTimedOutForZombie
      )
    );
  }
  const finalResultText = (finalResultEvent?.result ?? "").trim();
  if (finalResultText) {
    let lastIdx = callbackState.accumulatedSteps.length - 1;
    while (lastIdx >= 0 && callbackState.accumulatedSteps[lastIdx].type === "thinking") {
      lastIdx--;
    }
    const candidate = lastIdx >= 0 ? callbackState.accumulatedSteps[lastIdx] : void 0;
    if (candidate && candidate.type === "response") {
      const detail = (candidate.detail ?? "").trim();
      if (detail && (finalResultText === detail || finalResultText.startsWith(detail) || detail.startsWith(finalResultText))) {
        callbackState.accumulatedSteps.splice(lastIdx, 1);
      }
    }
  }
  for (const step of callbackState.accumulatedSteps) step.status = "complete";
  const activityLog = serializeSteps(callbackState.accumulatedSteps);
  let completionSuccess = cursorAcpAttempt ? cursorAcpError === null && !agentWasInterrupted : agentWasInterrupted ? false : finalResultEvent ? !finalResultEvent.isError : finalCode === 0;
  if (attemptEndedDueToTimeout && !runSucceededWithResult) {
    completionSuccess = false;
  }
  if (completionSuccess && REQUIRE_TASK_COMMIT) {
    if (!hasNewTaskCommitSince(taskCommitBaselineHead)) {
      completionSuccess = false;
      const commitGateMessage = "Agent finished without creating a new git commit. Edit the required files, run git add and git commit locally, then try again.";
      errorValue = errorValue ? errorValue + "\\n\\n" + commitGateMessage : commitGateMessage;
      log(
        "completion: rejected \\u2014 no new commit (baseline=" + (taskCommitBaselineHead || "none") + " current=" + (readGitHeadSha() || "none") + ")"
      );
    }
  }
  log(
    "completion: success=" + completionSuccess + " code=" + finalCode + " hasResult=" + Boolean(finalResultEvent) + " error=" + (errorValue ? errorValue.slice(0, 200) : "none") + " steps=" + callbackState.accumulatedSteps.length
  );
  const completionArgs = {
    [ENTITY_ID_FIELD ?? "entityId"]: ENTITY_ID ?? "",
    success: completionSuccess,
    result: finalResultEvent?.result ?? callbackState.rawOutput,
    error: errorValue,
    activityLog,
    ...activeTurnIdentityArgs()
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (finalResultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = finalResultEvent.rawResultEvent;
  }
  if (callbackState.pendingQuestionData) {
    completionArgs.pendingQuestion = callbackState.pendingQuestionData;
  }
  try {
    await deliverCompletionWithMedia(completionArgs);
    syncProviderStateToPersist("completion");
    await stopStreamingLoops();
    writeDoneFile(completionSuccess ? "success" : "error", {
      exitCode: finalCode,
      error: errorValue
    });
  } catch (e) {
    console.error("Failed to send completion:", e);
    syncProviderStateToPersist("completion-error");
    await stopStreamingLoops();
    writeDoneFile("completion-error", {
      exitCode: finalCode,
      error: e instanceof Error ? e.message : String(e)
    });
    process.exit(1);
  }
} catch (err) {
  syncProviderStateToPersist("fatal-error");
  await stopStreamingLoops();
  writeDoneFile("fatal-error", {
    error: err instanceof Error ? err.message : String(err)
  });
  const errorArgs = {
    [ENTITY_ID_FIELD ?? "entityId"]: ENTITY_ID ?? "",
    success: false,
    result: null,
    error: appendDiagnosticTail(
      err instanceof Error ? err.message : "Failed to run " + (PROVIDER === "codex" ? "Codex" : PROVIDER === "opencode" ? "Opencode" : PROVIDER === "cursor" ? "Cursor" : "Claude") + " CLI"
    ),
    activityLog: serializeSteps(callbackState.accumulatedSteps),
    ...activeTurnIdentityArgs()
  };
  if (RUN_ID) errorArgs.runId = RUN_ID;
  try {
    await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", errorArgs);
  } catch {
  }
  process.exit(1);
}
`.trim();
