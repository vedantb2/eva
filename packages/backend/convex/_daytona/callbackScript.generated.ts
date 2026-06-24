"use node";

export const CALLBACK_SCRIPT = `// callback-src/index.ts
import {
  existsSync as existsSync6,
  mkdirSync as mkdirSync7,
  readdirSync as readdirSync2,
  unlinkSync,
  writeFileSync as writeFileSync10
} from "fs";

// callback-src/config.ts
import { existsSync } from "fs";
var CONVEX_URL = process.env.CONVEX_URL;
var CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || CONVEX_URL;
var CONVEX_TOKEN = process.env.CONVEX_TOKEN;
var STREAMING_HMAC = process.env.STREAMING_HMAC || "";
var ENTITY_ID = process.env.ENTITY_ID;
var STREAMING_ENTITY_ID = process.env.STREAMING_ENTITY_ID || ENTITY_ID;
var RUN_ID = process.env.RUN_ID || null;
var ENTITY_ID_FIELD = process.env.ENTITY_ID_FIELD;
var TASK_PROOF_CAPTURE_ENABLED = process.env.TASK_PROOF_CAPTURE_ENABLED !== "false";
var COMPLETION_MUTATION = process.env.COMPLETION_MUTATION;
var REQUIRE_TASK_COMMIT = process.env.REQUIRE_TASK_COMMIT === "true";
var PROVIDER = process.env.AI_PROVIDER || "claude";
var MODEL = process.env.AI_MODEL || process.env.CLAUDE_MODEL || "claude:sonnet";
var ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep";
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
var CURSOR_API_KEY = process.env.CURSOR_API_KEY || "";
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
var toolsArg = ALLOWED_TOOLS ? '--allowedTools "' + ALLOWED_TOOLS + '"' : "";
var systemArg = SYSTEM_PROMPT ? "--append-system-prompt " + JSON.stringify(SYSTEM_PROMPT) : "";
var settingsJson = '{"attribution":{"commit":"","pr":""}}';
var settingsArg = "--settings " + JSON.stringify(settingsJson);
var mcpArg = existsSync("/tmp/eva-mcp.json") ? "--mcp-config /tmp/eva-mcp.json" : "";
var normalizedClaudeModel = MODEL.startsWith("claude:") ? MODEL.slice("claude:".length) : MODEL;
var normalizedCodexModel = MODEL.startsWith("codex:") ? MODEL.slice("codex:".length) : MODEL;
var normalizedOpencodeModel = MODEL.startsWith("opencode:") ? MODEL.slice("opencode:".length) : MODEL;
var normalizedCursorModel = MODEL.startsWith("cursor:") ? MODEL.slice("cursor:".length) : MODEL;
var codexCommand = existsSync(CODEX_BIN_PATH) ? JSON.stringify(CODEX_BIN_PATH) : "codex";
var opencodeCommand = existsSync(OPENCODE_BIN_PATH) ? JSON.stringify(OPENCODE_BIN_PATH) : "opencode";
var cursorCommand = existsSync(CURSOR_BIN_PATH) ? JSON.stringify(CURSOR_BIN_PATH) : "cursor-agent";
var codexPromptCmd = SYSTEM_PROMPT ? "(printf %s\\\\n\\\\n " + JSON.stringify(SYSTEM_PROMPT) + "; cat /tmp/design-prompt.txt)" : "cat /tmp/design-prompt.txt";
var opencodePromptCmd = codexPromptCmd;
var codexExecBaseCmd = codexCommand + " exec --skip-git-repo-check --full-auto --json --model " + JSON.stringify(normalizedCodexModel);
var opencodeExecBaseCmd = opencodeCommand + " run --format json --model " + JSON.stringify(normalizedOpencodeModel);
var cursorPromptExpr = SYSTEM_PROMPT ? '"\$(printf %s\\\\n\\\\n ' + JSON.stringify(SYSTEM_PROMPT) + '; cat /tmp/design-prompt.txt)"' : '"\$(cat /tmp/design-prompt.txt)"';
var cursorExecBaseCmd = cursorCommand + " -p " + cursorPromptExpr + " --force --trust --workspace " + JSON.stringify(WORK_DIR) + " --model " + JSON.stringify(normalizedCursorModel) + " --output-format stream-json --approve-mcps";
var claudeBaseCmd = "cat /tmp/design-prompt.txt | claude -p --verbose --dangerously-skip-permissions --model " + normalizedClaudeModel + " " + toolsArg + " " + systemArg + " " + settingsArg + " " + mcpArg + " --output-format stream-json";
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
  "question"
]);
var CODEX_PRICING_PER_MILLION = {
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
  "Using Skill...": "Used Skill",
  "Fetching URL...": "Fetched URL",
  "Searching web...": "Searched web",
  "Editing notebook...": "Edited notebook",
  "Running agent...": "Ran agent",
  "Updating tasks...": "Updated tasks",
  "Reading tasks...": "Read tasks",
  "Asking a question...": "Asked a question"
};

// callback-src/http/convexClient.ts
function narrowJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const items = [];
    for (const item of value) {
      const n = narrowJsonValue(item);
      if (n === null && item !== null) return null;
      items.push(n);
    }
    return items;
  }
  const obj = {};
  for (const [k, v] of Object.entries(value)) {
    const n = narrowJsonValue(v);
    if (n === null && v !== null) return null;
    obj[k] = n;
  }
  return obj;
}
async function fetchWithTimeout(url, options, timeoutMs = CALLBACK_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
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
  const json = await res.json();
  return narrowJsonValue(json) ?? null;
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
  return await callConvex("mutation", "streaming:touch", { entityId });
}
async function callStreamingHeartbeatOnce(entityId, currentActivity, currentContent, pendingQuestion) {
  if (CONVEX_SITE_URL && STREAMING_HMAC) {
    const body = new URLSearchParams();
    body.set("entityId", entityId);
    body.set("hmac", STREAMING_HMAC);
    body.set("currentActivity", currentActivity);
    body.set("currentContent", currentContent || "");
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
    currentContent
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
  const detail = value.detail;
  return {
    type,
    label,
    detail: typeof detail === "string" ? detail : void 0,
    status: "complete"
  };
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
  activeAttemptChild: null,
  fatalHeartbeatErrorMessage: "",
  consecutiveHeartbeatFailures: 0,
  heartbeatFailureStreakStartedAt: 0,
  inFlightToolUses: 0,
  codexToolItemIds: /* @__PURE__ */ new Set(),
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
var accumulatedSteps = callbackState.accumulatedSteps;

// callback-src/session/claudeSession.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "fs";

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
function narrowJsonValue2(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const items = [];
    for (const item of value) {
      if (typeof item !== "object" && typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean" && item !== null) {
        return null;
      }
      const narrowed = narrowJsonValue2(item);
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
    const narrowed = narrowJsonValue2(entry);
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
    return narrowJsonValue2(parsed);
  } catch {
    return null;
  }
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
    } catch (error) {
      log("copyBaseClaudeConfig skipped " + entry.name + ": " + String(error));
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
  } catch (error) {
    log(label + ": failed to inspect transcript: " + String(error));
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

// callback-src/session/claudeSession.ts
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
  if (!existsSync3(CLAUDE_LOCAL_STATE_FILE)) {
    return null;
  }
  const parsed = tryParseJson(readFileSync2(CLAUDE_LOCAL_STATE_FILE, "utf8"));
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
  writeFileSync2(
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
function resolveClaudeSessionMode() {
  const configuredSessionId = process.env.CLAUDE_SESSION_ID;
  if (!configuredSessionId) {
    return { mode: "none", sessionId: null };
  }
  const persistedState = readClaudeSessionState();
  if (persistedState) {
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  if (existsSync3(
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

// callback-src/parse/toolSteps.ts
function opencodeToolToStep(part) {
  const tool = typeof part.tool === "string" ? part.tool : "tool";
  const stateObj = part.state && typeof part.state === "object" && !Array.isArray(part.state) ? part.state : null;
  const input = stateObj && "input" in stateObj && stateObj.input && typeof stateObj.input === "object" && !Array.isArray(stateObj.input) ? stateObj.input : {};
  const path = typeof input.filePath === "string" ? shortenPath(input.filePath) : typeof input.file_path === "string" ? shortenPath(input.file_path) : typeof input.path === "string" ? shortenPath(input.path) : "";
  switch (tool) {
    case "read":
      return {
        type: "read",
        label: "Reading file...",
        detail: path || void 0,
        status: "active"
      };
    case "glob":
      return {
        type: "search_files",
        label: "Searching files...",
        detail: typeof input.pattern === "string" ? input.pattern : void 0,
        status: "active"
      };
    case "grep":
      return {
        type: "search_code",
        label: "Searching code...",
        detail: typeof input.pattern === "string" ? input.pattern : void 0,
        status: "active"
      };
    case "write":
      return {
        type: "write",
        label: "Creating file...",
        detail: path || void 0,
        status: "active"
      };
    case "edit":
      return {
        type: "edit",
        label: "Editing file...",
        detail: path || void 0,
        status: "active"
      };
    case "bash":
      return {
        type: "bash",
        label: "Running command...",
        detail: typeof input.command === "string" ? input.command.slice(0, 300) : void 0,
        status: "active"
      };
    case "webfetch":
      return {
        type: "web_fetch",
        label: "Fetching URL...",
        detail: typeof input.url === "string" ? input.url : void 0,
        status: "active"
      };
    case "websearch":
      return {
        type: "web_search",
        label: "Searching web...",
        detail: typeof input.query === "string" ? input.query : void 0,
        status: "active"
      };
    case "task":
      return {
        type: "subtask",
        label: "Running agent...",
        detail: typeof input.description === "string" ? input.description : void 0,
        status: "active"
      };
    case "todowrite":
    case "todoread":
      return { type: "tool", label: "Updating tasks...", status: "active" };
    default:
      return {
        type: "tool",
        label: "Using " + tool + "...",
        status: "active"
      };
  }
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
  if (tool.includes("read")) {
    return {
      type: "read",
      label: "Reading file...",
      detail: path || void 0,
      status: "active"
    };
  }
  if (tool.includes("write") || tool.includes("create")) {
    return {
      type: "write",
      label: "Creating file...",
      detail: path || void 0,
      status: "active"
    };
  }
  if (tool.includes("edit") || tool.includes("patch") || tool.includes("apply") || tool.includes("replace") || tool.includes("strreplace")) {
    return {
      type: "edit",
      label: "Editing file...",
      detail: path || void 0,
      status: "active"
    };
  }
  if (tool.includes("delete") || tool.includes("remove")) {
    return {
      type: "edit",
      label: "Deleting file...",
      detail: path || void 0,
      status: "active"
    };
  }
  if (tool.includes("glob") || tool.includes("list") || tool === "ls") {
    return {
      type: "search_files",
      label: "Searching files...",
      detail: query || path || void 0,
      status: "active"
    };
  }
  if (tool.includes("grep") || tool.includes("search")) {
    return {
      type: tool.includes("file") ? "search_files" : "search_code",
      label: tool.includes("file") ? "Searching files..." : "Searching code...",
      detail: query || path || void 0,
      status: "active"
    };
  }
  if (tool.includes("bash") || tool.includes("shell") || tool.includes("exec") || tool.includes("command") || tool.includes("terminal")) {
    return {
      type: "bash",
      label: "Running command...",
      detail: command ? command.slice(0, 300) : void 0,
      status: "active"
    };
  }
  if (tool.includes("webfetch") || tool.includes("web_fetch") || tool.includes("fetch") && !tool.includes("search")) {
    return {
      type: "web_fetch",
      label: "Fetching URL...",
      detail: query || void 0,
      status: "active"
    };
  }
  if (tool.includes("websearch") || tool.includes("web_search")) {
    return {
      type: "web_search",
      label: "Searching web...",
      detail: query || void 0,
      status: "active"
    };
  }
  if (tool.includes("todo")) {
    return { type: "tool", label: "Updating tasks...", status: "active" };
  }
  if (tool.includes("mcp")) {
    const server = pickString([
      "server",
      "serverName",
      "server_name",
      "toolName",
      "tool_name"
    ]);
    return {
      type: "tool",
      label: server ? "Using MCP " + server + "..." : "Using MCP tool...",
      status: "active"
    };
  }
  const fallbackName = displayName || kind || "tool";
  return {
    type: "tool",
    label: "Using " + fallbackName + "...",
    status: "active"
  };
}
function toolCallToStep(name, input) {
  const path = typeof input.file_path === "string" ? shortenPath(String(input.file_path)) : "";
  switch (name) {
    case "Read":
      return {
        type: "read",
        label: "Reading file...",
        detail: path || void 0,
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
    case "Write":
      return {
        type: "write",
        label: "Creating file...",
        detail: path || void 0,
        status: "active"
      };
    case "Edit":
      return {
        type: "edit",
        label: "Editing file...",
        detail: path || void 0,
        status: "active"
      };
    case "Bash":
    case "bash":
      return {
        type: "bash",
        label: "Running command...",
        detail: typeof input.command === "string" ? String(input.command).slice(0, 300) : void 0,
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
        status: "active"
      };
    case "Agent":
      return {
        type: "subtask",
        label: "Running agent...",
        detail: typeof input.description === "string" ? String(input.description) : void 0,
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
  if (normalizedType === "mcp_tool_call") {
    if (normalizedDescription.includes("fetch_file")) {
      return {
        type: "read",
        label: "Reading file...",
        detail: descriptionValue || void 0,
        status: "active"
      };
    }
    if (normalizedDescription.includes("search") || normalizedDescription.includes("list_repositories") || normalizedDescription.includes("list_mcp_resources")) {
      return {
        type: "search_code",
        label: "Searching code...",
        detail: descriptionValue || void 0,
        status: "active"
      };
    }
    return {
      type: "tool",
      label: "Using MCP...",
      detail: descriptionValue || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("web")) {
    return {
      type: normalizedType.includes("search") ? "web_search" : "web_fetch",
      label: normalizedType.includes("search") ? "Searching web..." : "Fetching URL...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("read")) {
    return {
      type: "read",
      label: "Reading file...",
      detail: pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("grep") || normalizedType.includes("search")) {
    return {
      type: normalizedType.includes("file") ? "search_files" : "search_code",
      label: normalizedType.includes("file") ? "Searching files..." : "Searching code...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("glob") || normalizedType.includes("list")) {
    return {
      type: "search_files",
      label: "Searching files...",
      detail: queryValue || pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("write") || normalizedType.includes("create")) {
    return {
      type: "write",
      label: "Creating file...",
      detail: pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("edit") || normalizedType.includes("patch") || normalizedType.includes("apply")) {
    return {
      type: "edit",
      label: "Editing file...",
      detail: pathDetail || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("command") || normalizedType.includes("shell") || normalizedType.includes("bash") || normalizedType.includes("exec")) {
    return {
      type: "bash",
      label: "Running command...",
      detail: commandValue || descriptionValue || void 0,
      status: "active"
    };
  }
  if (normalizedType.includes("agent")) {
    return {
      type: "subtask",
      label: "Running agent...",
      detail: descriptionValue || void 0,
      status: "active"
    };
  }
  return {
    type: "tool",
    label: "Using " + itemType + "...",
    detail: descriptionValue || pathDetail || queryValue || void 0,
    status: "active"
  };
}

// callback-src/providers/claude.ts
function claudeParseLine(event) {
  const events = [];
  if (event.type === "tool_result") {
    const toolUseId = typeof event.tool_use_id === "string" && event.tool_use_id.trim() ? event.tool_use_id.trim() : void 0;
    events.push({ kind: "complete_tool", trackingId: toolUseId });
    return events;
  }
  if (event.type === "user") {
    const message2 = event.message && typeof event.message === "object" && !Array.isArray(event.message) ? event.message : null;
    const content2 = message2 && Array.isArray(message2.content) ? message2.content : [];
    for (const block of content2) {
      if (!block || typeof block !== "object" || Array.isArray(block)) continue;
      if (block.type === "tool_result" && typeof block.tool_use_id === "string" && block.tool_use_id.trim()) {
        events.push({
          kind: "complete_tool",
          trackingId: block.tool_use_id.trim()
        });
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
  let added = false;
  const message = event.message && typeof event.message === "object" && !Array.isArray(event.message) ? event.message : null;
  const content = message && Array.isArray(message.content) ? message.content : [];
  for (const block of content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    if (block.type === "tool_use" && typeof block.name === "string") {
      const input = block.input && typeof block.input === "object" && !Array.isArray(block.input) ? block.input : {};
      const step = toolCallToStep(block.name, input);
      const trackingId = typeof block.id === "string" && block.id.trim() ? block.id.trim() : void 0;
      events.push(
        trackingId ? { kind: "push_step", step, trackingId } : { kind: "push_step", step }
      );
      if (block.name === "AskUserQuestion" && block.input) {
        events.push({
          kind: "set_pending_question",
          data: JSON.stringify(block.input)
        });
      }
      added = true;
    } else if (block.type === "thinking" && "thinking" in block && block.thinking) {
      events.push({
        kind: "push_step",
        step: {
          type: "thinking",
          label: "Thinking...",
          detail: String(block.thinking),
          status: "active"
        }
      });
      added = true;
    } else if (block.type === "text" && "text" in block && block.text) {
      events.push({ kind: "append_text", text: String(block.text) });
      added = true;
    }
  }
  if (!added && callbackState.lastStepType !== "thinking") {
    events.push({
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Generating response...",
        status: "active"
      }
    });
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
      updateThinkingStep("Thinking...", "Claude is reasoning...");
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
import { mkdirSync as mkdirSync4, writeFileSync as writeFileSync4 } from "fs";

// callback-src/session/createSessionStore.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "fs";
function createSessionStore(config) {
  const readSessionState = () => {
    const statePath = existsSync4(config.localStateFile) ? config.localStateFile : existsSync4(config.persistStateFile) ? config.persistStateFile : "";
    if (!statePath) {
      return null;
    }
    try {
      const parsed = JSON.parse(readFileSync3(statePath, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      const value = parsed[config.resumeField];
      if (typeof value === "string" && value.trim()) {
        if (config.resumeField === "resumeThreadId") {
          return { resumeThreadId: value.trim() };
        }
        return { resumeSessionId: value.trim() };
      }
    } catch (error) {
      console.error(
        "Failed to read session state from " + statePath + ":",
        String(error)
      );
    }
    return null;
  };
  const writeSessionState = () => {
    const activeId = config.getActiveId();
    if (!activeId) {
      return;
    }
    mkdirSync3(config.runtimeHomeDir, { recursive: true });
    const payload = {
      [config.resumeField]: activeId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeFileSync3(config.localStateFile, JSON.stringify(payload, null, 2));
  };
  const hydratePersistedState = (label) => {
    mkdirSync3(config.runtimeHomeDir, { recursive: true });
    copyFileIfPresent(
      config.persistStateFile,
      config.localStateFile,
      label + "(state)"
    );
  };
  const syncStateToPersist = (label) => {
    writeSessionState();
    mkdirSync3(config.persistDir, { recursive: true });
    copyFileIfPresent(
      config.localStateFile,
      config.persistStateFile,
      label + "(state)"
    );
  };
  const resolveResumeId = () => {
    const persisted = readSessionState();
    if (!persisted) return null;
    if (config.resumeField === "resumeThreadId") {
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
  writeFileSync4(CODEX_RUNTIME_HOME_DIR + "/" + fileName, value);
}
function buildCodexRuntimeConfig(rawValue, encodedValue) {
  const configuredValue = rawValue || (encodedValue ? decodeBase64(encodedValue) : "");
  const preservedLines = configuredValue ? configuredValue.split(/\\r?\\n/).filter((line) => {
    const trimmed = line.trim().toLowerCase();
    return !trimmed.startsWith("sandbox_mode") && !trimmed.startsWith("approval_policy");
  }) : [];
  const normalizedPreservedLines = preservedLines.filter((line) => line.trim());
  const runtimeLines = [
    'approval_policy = "never"',
    'sandbox_mode = "danger-full-access"'
  ];
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
  writeFileSync4(
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
    if (typeof event.item.id === "string") {
      events.push({ kind: "complete_tool", trackingId: event.item.id });
    } else {
      events.push({ kind: "mark_last_complete" });
    }
    return events;
  }
  if (event.type === "turn.completed") {
    events.push({
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Finalizing response...",
        status: "active"
      }
    });
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
import { existsSync as existsSync5, mkdirSync as mkdirSync5, readFileSync as readFileSync4, writeFileSync as writeFileSync5 } from "fs";
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
  store2.syncStateToPersist("syncCursorStateToPersist");
}
function hydratePersistedCursorState() {
  store2.hydratePersistedState("hydratePersistedCursorState");
  if (existsSync5("/tmp/eva-mcp.json")) {
    try {
      const raw = readFileSync4("/tmp/eva-mcp.json", "utf8");
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
      writeFileSync5(
        cursorDir + "/mcp.json",
        JSON.stringify(cursorMcp, null, 2)
      );
    } catch (error) {
      console.error(
        "Failed to translate MCP config for Cursor:",
        String(error)
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
    let added = false;
    for (const block of contentBlocks) {
      if (block && typeof block === "object" && !Array.isArray(block) && block.type === "text" && typeof block.text === "string" && block.text) {
        events.push({ kind: "append_text", text: block.text });
        added = true;
      }
    }
    if (!added && callbackState.lastStepType !== "thinking") {
      events.push({
        kind: "push_step",
        step: {
          type: "thinking",
          label: "Generating response...",
          status: "active"
        }
      });
    }
    return events;
  }
  if (event.type === "tool_call" && event.subtype === "started" && event.tool_call && typeof event.tool_call === "object" && !Array.isArray(event.tool_call)) {
    events.push({ kind: "push_step", step: cursorToolToStep(event.tool_call) });
    return events;
  }
  if (event.type === "tool_call" && event.subtype === "completed") {
    events.push({ kind: "complete_tool" });
    return events;
  }
  if (event.type === "result") {
    events.push({
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Finalizing response...",
        status: "active"
      }
    });
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
import { mkdirSync as mkdirSync6, writeFileSync as writeFileSync6 } from "fs";
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
    writeFileSync6(OPENCODE_AUTH_FILE, authJson);
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
  if (event.type === "step_start") {
    events.push({
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Thinking...",
        detail: "Opencode is reasoning...",
        status: "active"
      }
    });
    return events;
  }
  if (event.type === "text" && event.part && typeof event.part === "object" && !Array.isArray(event.part) && typeof event.part.text === "string" && event.part.text) {
    events.push({ kind: "append_text", text: event.part.text });
    return events;
  }
  if (event.type === "tool_use" && event.part && typeof event.part === "object") {
    const state = "state" in event.part && event.part.state && typeof event.part.state === "object" && !Array.isArray(event.part.state) ? event.part.state : {};
    const status = typeof state.status === "string" ? state.status : "";
    if (status === "running") {
      events.push({ kind: "push_step", step: opencodeToolToStep(event.part) });
      return events;
    }
    if (status === "completed" || status === "error") {
      events.push({ kind: "complete_tool" });
      return events;
    }
    return events;
  }
  if (event.type === "step_finish") {
    const reason = event.part && typeof event.part === "object" && !Array.isArray(event.part) && typeof event.part.reason === "string" ? event.part.reason : "";
    if (reason === "stop") {
      events.push({
        kind: "push_step",
        step: {
          type: "thinking",
          label: "Finalizing response...",
          status: "active"
        }
      });
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
function markLastComplete() {
  if (callbackState.accumulatedSteps.length === 0) return;
  const last = callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1];
  last.status = "complete";
  if (completedLabels[last.label]) {
    last.label = completedLabels[last.label];
  } else if (last.label.startsWith("Using ") && last.label.endsWith("...")) {
    last.label = "Used " + last.label.slice(6, -3);
  }
}
function updateThinkingStep(label, detail) {
  const lastStep = callbackState.accumulatedSteps[callbackState.accumulatedSteps.length - 1];
  if (lastStep && lastStep.type === "thinking" && lastStep.label === label) {
    lastStep.status = "active";
    lastStep.type = "thinking";
    lastStep.detail = detail;
    callbackState.lastStepType = "thinking";
    return;
  }
  markLastComplete();
  callbackState.accumulatedSteps.push({
    type: "thinking",
    label,
    detail,
    status: "active"
  });
  callbackState.lastStepType = "thinking";
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
        markLastComplete();
        callbackState.accumulatedSteps.push(ev.step);
        callbackState.lastStepType = ev.step.type === "thinking" ? "thinking" : "tool";
        if (ev.step.type !== "thinking") {
          if (ev.trackingId) callbackState.codexToolItemIds.add(ev.trackingId);
          callbackState.inFlightToolUses++;
        }
        break;
      case "complete_tool":
        markLastComplete();
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
        appendStreamedContent(ev.text);
        updateThinkingStep("Streaming response...", "Receiving reply...");
        break;
      case "set_pending_question":
        callbackState.pendingQuestionData = ev.data;
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
    return applyCanonicalEvents(parseToCanonical(event, PROVIDER));
  } catch {
    return false;
  }
}
function appendStreamedContent(text) {
  const nextText = String(text);
  if (!nextText) {
    return;
  }
  if (nextText.startsWith(callbackState.currentStreamedContent)) {
    callbackState.currentStreamedContent = nextText;
    return;
  }
  callbackState.currentStreamedContent += nextText;
}

// callback-src/runtime/heartbeats.ts
import { writeFileSync as writeFileSync7 } from "fs";

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
  return JSON.stringify(callbackState.accumulatedSteps);
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
function noteHeartbeatFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
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
  } catch (error) {
    noteHeartbeatFailure(error instanceof Error ? error : String(error));
    return false;
  }
}
async function flushStreaming() {
  if (callbackState.flushInProgress) return;
  if (callbackState.rawOutput.length <= callbackState.lastProcessed) return;
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
    if (hasNew) {
      const payload = buildStreamingPayload();
      if (payload === callbackState.lastSentPayload && callbackState.currentStreamedContent === callbackState.lastSentContent) {
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
  } catch (error) {
    noteHeartbeatFailure(error instanceof Error ? error : String(error));
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
  }, 500);
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
  callbackState.accumulatedSteps.push({
    type: "thinking",
    label: "Finalizing response...",
    detail: callbackState.resultEventSeen ? "Syncing response and saved session..." : PROVIDER === "codex" ? "Codex finished. Sending completion..." : PROVIDER === "opencode" ? "Opencode finished. Sending completion..." : PROVIDER === "cursor" ? "Cursor finished. Sending completion..." : "Claude finished. Sending completion...",
    status: "active"
  });
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
      writeFileSync7(READY_FILE, String(Date.now()));
      log(
        "ready file written after " + String(Date.now() - SCRIPT_STARTED_AT) + "ms"
      );
    } catch {
    }
    return true;
  } catch (error) {
    console.error("Callback preflight failed:", String(error));
    return false;
  }
}

// callback-src/runtime/completion.ts
import { readFileSync as readFileSync5, writeFileSync as writeFileSync8 } from "fs";
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
      ...extras || {}
    };
    writeFileSync8(DONE_FILE, JSON.stringify(payload));
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
  return cliName + " exited with code " + code;
}
function appendDiagnosticTail(message) {
  const details = [];
  const stdoutTail = callbackState.rawOutput.slice(-1500).trim();
  const stderrTail = callbackState.stderrOutput.slice(-1500).trim();
  if (stdoutTail) details.push("stdout tail:\\n" + stdoutTail);
  if (stderrTail) details.push("stderr tail:\\n" + stderrTail);
  if (details.length === 0) return message;
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
  const fileData = readFileSync5(filePath);
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
  const uploadJson = await uploadRes.json();
  if (uploadJson && typeof uploadJson === "object" && !Array.isArray(uploadJson) && typeof uploadJson.storageId === "string") {
    return uploadJson.storageId;
  }
  throw new Error("Missing storageId in upload response");
}
async function persistTaskProofIfNeeded(videoStorageId, imageStorageId, lastFileName) {
  if (videoStorageId || imageStorageId) {
    if (ENTITY_ID_FIELD === "taskId") {
      const storageId = videoStorageId || imageStorageId;
      await callConvexWithRetry(
        "mutation",
        "taskProof:save",
        {
          taskId: ENTITY_ID ?? "",
          storageId: storageId ?? "",
          fileName: lastFileName ?? ""
        },
        3
      );
      return;
    }
    const mediaArgs = { parentId: ENTITY_ID ?? "" };
    if (videoStorageId) mediaArgs.videoStorageId = videoStorageId;
    if (imageStorageId) mediaArgs.imageStorageId = imageStorageId;
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
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      { taskId: ENTITY_ID ?? "", message: "No UI changes" },
      3
    );
  }
}
async function saveProofFailureMessageIfNeeded(message) {
  if (ENTITY_ID_FIELD !== "taskId") return;
  if (!TASK_PROOF_CAPTURE_ENABLED) return;
  try {
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      { taskId: ENTITY_ID ?? "", message },
      2
    );
  } catch (error) {
    console.error("Failed to record proof persistence error:", error);
  }
}
function hasToolActivity() {
  return callbackState.accumulatedSteps.some((step) => TOOL_STEP_TYPES.has(step.type));
}

// callback-src/runtime/cliAttempt.ts
import { spawn } from "child_process";
import { writeFileSync as writeFileSync9 } from "fs";

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

// callback-src/runtime/cliAttempt.ts
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
    child.on("close", (code) => {
      clearInterval(noOutputTimer);
      callbackState.activeAttemptChild = null;
      log(
        options.attemptLabel + " finished in " + elapsedAttemptMs() + "ms (code=" + code + ", timedOutForNoOutput=" + timedOutForNoOutput + ", timedOutForMaxRuntime=" + timedOutForMaxRuntime + ", timedOutForFirstEvent=" + timedOutForFirstEvent + ", timedOutForFirstAssistant=" + timedOutForFirstAssistant + ", timedOutAfterFirstText=" + timedOutAfterFirstText + ", timedOutForZombie=" + timedOutForZombie + ", toolStallError=" + (toolStallErrorMessage || "none") + ", outputBytes=" + attemptOutput.length + ", stderrBytes=" + callbackState.stderrOutput.length + ")"
      );
      resolve({
        code: code ?? 1,
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
  const sessionArg = sessionMode.mode === "session" && sessionMode.sessionId ? " --session-id " + JSON.stringify(sessionMode.sessionId) : sessionMode.mode === "resume" && sessionMode.sessionId ? " --resume " + JSON.stringify(sessionMode.sessionId) : "";
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
        "runClaudeAttempt started (mode=" + sessionMode.mode + ", sessionArg=" + (sessionArg || "none") + ")"
      );
      log(
        "spawning claude after " + String(callbackState.activeAttemptStartedAt - SCRIPT_STARTED_AT) + "ms since callback start"
      );
    }
  });
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
  unlinkSync(READY_FILE);
} catch {
}
try {
  writeFileSync10("/proc/self/oom_score_adj", "-600");
} catch {
}
callbackState.accumulatedSteps.push({
  type: "thinking",
  label: PROVIDER === "codex" ? "Preparing Codex session..." : PROVIDER === "opencode" ? "Preparing Opencode session..." : PROVIDER === "cursor" ? "Preparing Cursor session..." : "Preparing Claude session...",
  detail: "Initializing callback...",
  status: "active"
});
var preflightOk = await runPreflightHeartbeat();
if (!preflightOk) {
  writeDoneFile("preflight-failed");
  process.exit(1);
}
startStreamingLoops();
for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync6(d)) {
    for (const f of readdirSync2(d)) {
      try {
        unlinkSync(d + "/" + f);
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
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data) && data.value && typeof data.value === "object" && !Array.isArray(data.value) && typeof data.value.token === "string") {
        process.env.GITHUB_TOKEN = data.value.token;
        process.env.GH_TOKEN = data.value.token;
      }
    }
  } catch {
  }
}
log(
  "entityId=" + ENTITY_ID + " provider=" + PROVIDER + " model=" + MODEL + " tools=" + ALLOWED_TOOLS + " sessionId=" + (process.env.CLAUDE_SESSION_ID || "none") + " mcp=" + (mcpArg ? "yes" : "no")
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
  let finalCode = firstAttempt.code;
  let finalTimedOutForNoOutput = Boolean(firstAttempt.timedOutForNoOutput);
  let finalTimedOutForMaxRuntime = Boolean(firstAttempt.timedOutForMaxRuntime);
  let finalTimedOutForFirstEvent = Boolean(firstAttempt.timedOutForFirstEvent);
  let finalTimedOutForFirstAssistant = Boolean(
    firstAttempt.timedOutForFirstAssistant
  );
  let finalTimedOutAfterFirstText = Boolean(
    firstAttempt.timedOutAfterFirstText
  );
  let finalTimedOutForZombie = Boolean(firstAttempt.timedOutForZombie);
  const finalToolStallErrorMessage = firstAttempt.toolStallErrorMessage || "";
  let finalResultEvent = extractResultEvent(firstAttempt.output);
  log(
    "firstAttempt result: code=" + firstAttempt.code + " isError=" + Boolean(finalResultEvent?.isError) + " hasToolActivity=" + hasToolActivity()
  );
  if (!callbackState.resultEventSeen) {
    syncProviderStateToPersist("post-attempt");
  } else {
    log("skipping post-attempt sync because result-event sync already ran");
  }
  await setFinalizingState();
  const attemptEndedDueToTimeout = finalTimedOutAfterFirstText || finalTimedOutForNoOutput || finalTimedOutForMaxRuntime || finalTimedOutForFirstEvent || finalTimedOutForFirstAssistant || finalTimedOutForZombie || Boolean(finalToolStallErrorMessage);
  const runSucceededWithResult = finalResultEvent !== void 0 && !finalResultEvent.isError;
  let errorValue = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (!runSucceededWithResult && finalCode !== 0 || attemptEndedDueToTimeout && !runSucceededWithResult) {
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
  for (const step of callbackState.accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(callbackState.accumulatedSteps);
  let completionSuccess = finalResultEvent ? !finalResultEvent.isError : finalCode === 0;
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
    activityLog
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (finalResultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = finalResultEvent.rawResultEvent;
  }
  if (callbackState.pendingQuestionData) {
    completionArgs.pendingQuestion = callbackState.pendingQuestionData;
  }
  try {
    await callConvexWithRetry(
      "mutation",
      COMPLETION_MUTATION ?? "",
      completionArgs
    );
    let videoStorageId = null;
    let imageStorageId = null;
    let lastFileName = null;
    const recDir = WORK_DIR + "/recordings";
    if (existsSync6(recDir)) {
      for (const file of readdirSync2(recDir)) {
        if (!/\\.(webm|mp4|mov|avi)\$/i.test(file)) continue;
        const fp = recDir + "/" + file;
        const mimeType = file.endsWith(".mp4") ? "video/mp4" : "video/webm";
        try {
          videoStorageId = await uploadMediaFile(fp, mimeType);
          lastFileName = file;
        } catch {
        }
        try {
          unlinkSync(fp);
        } catch {
        }
      }
    }
    if (!videoStorageId) {
      const ssDir = WORK_DIR + "/screenshots";
      if (existsSync6(ssDir)) {
        for (const file of readdirSync2(ssDir)) {
          if (!/\\.(png|jpg|jpeg|gif|webp)\$/i.test(file)) continue;
          const fp = ssDir + "/" + file;
          const ext = file.split(".").pop()?.toLowerCase() ?? "png";
          const mimeMap = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            webp: "image/webp"
          };
          const mimeType = mimeMap[ext] || "image/png";
          try {
            imageStorageId = await uploadMediaFile(fp, mimeType);
            lastFileName = file;
          } catch {
          }
          try {
            unlinkSync(fp);
          } catch {
          }
        }
      }
    }
    try {
      await persistTaskProofIfNeeded(
        videoStorageId,
        imageStorageId,
        lastFileName
      );
    } catch (e) {
      console.error("Failed to persist task proof:", e);
      const proofError = e instanceof Error ? e.message : String(e);
      await saveProofFailureMessageIfNeeded(
        "Proof capture failed after completion: " + proofError
      );
    }
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
    activityLog: JSON.stringify(callbackState.accumulatedSteps)
  };
  if (RUN_ID) errorArgs.runId = RUN_ID;
  try {
    await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", errorArgs);
  } catch {
  }
  process.exit(1);
}
`.trim();
