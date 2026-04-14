"use node";

export const CALLBACK_SCRIPT = `
import { spawn, spawnSync } from "child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_TOKEN = process.env.CONVEX_TOKEN;
const ENTITY_ID = process.env.ENTITY_ID;
const STREAMING_ENTITY_ID = process.env.STREAMING_ENTITY_ID || ENTITY_ID;
const RUN_ID = process.env.RUN_ID || null;
const ENTITY_ID_FIELD = process.env.ENTITY_ID_FIELD;
const TASK_PROOF_CAPTURE_ENABLED =
  process.env.TASK_PROOF_CAPTURE_ENABLED !== "false";
const COMPLETION_MUTATION = process.env.COMPLETION_MUTATION;
const PROVIDER = process.env.AI_PROVIDER || "claude";
const MODEL = process.env.AI_MODEL || process.env.CLAUDE_MODEL || "claude:sonnet";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = existsSync("/tmp/repo")
  ? "/tmp/repo"
  : existsSync("/workspace/repo")
    ? "/workspace/repo"
    : "/tmp/repo";
const NO_OUTPUT_TIMEOUT_MS = Number(process.env.CLAUDE_NO_OUTPUT_TIMEOUT_MS || "60000");
const FIRST_EVENT_TIMEOUT_MS = Number(process.env.CLAUDE_FIRST_EVENT_TIMEOUT_MS || "90000");
const POST_TEXT_STALL_TIMEOUT_MS = Number(process.env.CLAUDE_POST_TEXT_STALL_TIMEOUT_MS || "90000");
const FIRST_ASSISTANT_EVENT_TIMEOUT_MS = Number(process.env.CLAUDE_FIRST_ASSISTANT_EVENT_TIMEOUT_MS || "120000");
const NO_OUTPUT_CHECK_INTERVAL_MS = 5000;
const MAX_TOTAL_RUNTIME_MS = Number(process.env.CLAUDE_MAX_TOTAL_RUNTIME_MS || "3000000");
const SCRIPT_STARTED_AT = Date.now();
const CALLBACK_HTTP_TIMEOUT_MS = Number(process.env.CALLBACK_HTTP_TIMEOUT_MS || "10000");
const CALLBACK_HTTP_MAX_RETRIES = Number(process.env.CALLBACK_HTTP_MAX_RETRIES || "4");
const CALLBACK_HTTP_RETRY_BASE_MS = 1000;
const MAX_CONSECUTIVE_HEARTBEAT_FAILURES = Number(
  process.env.CALLBACK_MAX_CONSECUTIVE_HEARTBEAT_FAILURES || "3",
);
const READY_FILE = "/tmp/run-design.ready";
const CLAUDE_BASE_CONFIG_DIR = process.env.CLAUDE_BASE_CONFIG_DIR || "/home/eva/.claude";
const CLAUDE_RUNTIME_CONFIG_DIR = process.env.CLAUDE_RUNTIME_CONFIG_DIR || "/tmp/claude-config";
const CLAUDE_PERSIST_DIR = process.env.CLAUDE_PERSIST_DIR || "/home/eva/.claude-persist";
const CODEX_RUNTIME_HOME_DIR = process.env.CODEX_RUNTIME_HOME_DIR || "/tmp/codex-home";
const CODEX_PERSIST_DIR = process.env.CODEX_PERSIST_DIR || "/home/eva/.codex-persist";
const CODEX_BIN_PATH = process.env.CODEX_BIN_PATH || "/tmp/codex-cli/bin/codex";
const CODEX_STATE_FILE = "session-state.json";
const CODEX_LOCAL_STATE_FILE = CODEX_RUNTIME_HOME_DIR + "/" + CODEX_STATE_FILE;
const CODEX_PERSIST_STATE_FILE = CODEX_PERSIST_DIR + "/" + CODEX_STATE_FILE;
const CODEX_AUTH_FILE = CODEX_RUNTIME_HOME_DIR + "/auth.json";
const CODEX_PERSIST_AUTH_FILE = CODEX_PERSIST_DIR + "/auth.json";
const CODEX_AUTH_JSON = process.env.CODEX_AUTH_JSON || "";
const CODEX_AUTH_JSON_BASE64 = process.env.CODEX_AUTH_JSON_BASE64 || "";
const CODEX_CONFIG_TOML = process.env.CODEX_CONFIG_TOML || "";
const CODEX_CONFIG_TOML_BASE64 = process.env.CODEX_CONFIG_TOML_BASE64 || "";
const CLAUDE_SESSION_PROJECT_DIR = WORK_DIR.replace(/\\//g, "-");
const CLAUDE_LOCAL_PROJECT_DIR = CLAUDE_RUNTIME_CONFIG_DIR + "/projects/" + CLAUDE_SESSION_PROJECT_DIR;
const CLAUDE_PERSIST_PROJECT_DIR = CLAUDE_PERSIST_DIR + "/projects/" + CLAUDE_SESSION_PROJECT_DIR;
const CLAUDE_STATE_FILE_NAME = "session-state.json";
const CLAUDE_LOCAL_STATE_FILE = CLAUDE_RUNTIME_CONFIG_DIR + "/" + CLAUDE_STATE_FILE_NAME;
const CLAUDE_PERSIST_STATE_FILE = CLAUDE_PERSIST_DIR + "/" + CLAUDE_STATE_FILE_NAME;
const CLAUDE_SYNC_TIMEOUT_MS = Number(process.env.CLAUDE_SYNC_TIMEOUT_MS || "10000");
const CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS = Number(process.env.CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS || "5");

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
if (GH_TOKEN) {
  process.env.GH_TOKEN = GH_TOKEN;
  process.env.GITHUB_TOKEN = GH_TOKEN;
}
process.env.GH_PROMPT_DISABLED = "1";
process.env.GH_NO_UPDATE_NOTIFIER = "1";

/** Wraps fetch with an AbortController timeout. */
async function fetchWithTimeout(url, options, timeoutMs = CALLBACK_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Calculates exponential backoff delay with jitter for retry attempts. */
function buildRetryDelayMs(attempt) {
  const exponential = Math.pow(2, attempt - 1) * CALLBACK_HTTP_RETRY_BASE_MS;
  const jitter = Math.floor(Math.random() * 500);
  return exponential + jitter;
}

/** Calls a Convex mutation via HTTP API. */
async function callMutation(path, args) {
  const headers = { "Content-Type": "application/json" };
  if (CONVEX_TOKEN) headers["Authorization"] = "Bearer " + CONVEX_TOKEN;
  const res = await fetchWithTimeout(CONVEX_URL + "/api/mutation", {
    method: "POST",
    headers,
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Convex mutation " + path + " failed: " + res.status + " " + text);
  }
  return res.json();
}

/** Calls a Convex action via HTTP API. */
async function callAction(path, args) {
  const res = await fetchWithTimeout(CONVEX_URL + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONVEX_TOKEN,
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Convex action " + path + " failed: " + res.status + " " + text);
  }
  return res.json();
}

/** Calls a Convex mutation with automatic retry on failure. */
async function callMutationWithRetry(path, args, maxRetries = CALLBACK_HTTP_MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await callMutation(path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error("callMutation attempt " + attempt + " failed, retrying in " + delayMs + "ms:", String(e));
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/** Calls a Convex action with automatic retry on failure. */
async function callActionWithRetry(path, args, maxRetries = CALLBACK_HTTP_MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await callAction(path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error("callAction attempt " + attempt + " failed, retrying in " + delayMs + "ms:", String(e));
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/** Sends a streaming heartbeat update with current activity and content. */
async function callStreamingHeartbeat(entityId, currentActivity, currentContent, pendingQuestion) {
  const args = {
    entityId,
    currentActivity,
    currentContent,
  };
  if (pendingQuestion) {
    args.pendingQuestion = pendingQuestion;
  }
  return await callMutation("streaming:set", args);
}

/** Shortens a file path to show only the last 3 segments for display. */
function shortenPath(p) {
  const parts = p.replace(/\\\\\\\\/g, "/").split("/");
  if (parts.length <= 4) return parts.join("/");
  return ".../" + parts.slice(-3).join("/");
}

let pendingQuestionData = "";

/** Converts a Claude tool call into a UI progress step object. */
function toolCallToStep(name, input) {
  const path = input.file_path ? shortenPath(String(input.file_path)) : "";
  switch (name) {
    case "Read": return { type: "read", label: "Reading file...", detail: path || undefined, status: "active" };
    case "Glob": return { type: "search_files", label: "Searching files...", detail: input.pattern ? String(input.pattern) : undefined, status: "active" };
    case "Grep": return { type: "search_code", label: "Searching code...", detail: input.pattern ? String(input.pattern) : undefined, status: "active" };
    case "Write": return { type: "write", label: "Creating file...", detail: path || undefined, status: "active" };
    case "Edit": return { type: "edit", label: "Editing file...", detail: path || undefined, status: "active" };
    case "Bash": return { type: "bash", label: "Running command...", detail: input.command ? String(input.command).slice(0, 300) : undefined, status: "active" };
    case "Skill": return { type: "tool", label: "Using Skill...", detail: input.skill ? String(input.skill) : undefined, status: "active" };
    case "WebFetch": return { type: "web_fetch", label: "Fetching URL...", detail: input.url ? String(input.url) : undefined, status: "active" };
    case "WebSearch": return { type: "web_search", label: "Searching web...", detail: input.query ? String(input.query) : undefined, status: "active" };
    case "NotebookEdit": return { type: "notebook", label: "Editing notebook...", detail: input.notebook_path ? shortenPath(String(input.notebook_path)) : undefined, status: "active" };
    case "Agent": return { type: "subtask", label: "Running agent...", detail: input.description ? String(input.description) : undefined, status: "active" };
    case "TodoWrite": return { type: "tool", label: "Updating tasks...", status: "active" };
    case "TodoRead": return { type: "tool", label: "Reading tasks...", status: "active" };
    case "AskUserQuestion": return { type: "question", label: "Asking a question...", status: "active" };
    default: return { type: "tool", label: "Using " + name + "...", status: "active" };
  }
}

/** Extracts the first matching field value from a Codex event item. */
function getCodexFieldValue(item, keys) {
  const sources = [item];
  if (item && typeof item.input === "object" && item.input !== null) {
    sources.push(item.input);
  }
  for (const source of sources) {
    if (!source || typeof source !== "object") {
      continue;
    }
    for (const key of keys) {
      if (typeof source[key] === "string" && source[key].trim()) {
        return source[key].trim();
      }
    }
  }
  return "";
}

/** Extracts the thread ID from a Codex stream event. */
function getCodexThreadId(event) {
  if (typeof event.thread_id === "string" && event.thread_id.trim()) {
    return event.thread_id.trim();
  }
  if (
    event.thread &&
    typeof event.thread === "object" &&
    typeof event.thread.id === "string" &&
    event.thread.id.trim()
  ) {
    return event.thread.id.trim();
  }
  return "";
}

/** Extracts the text content from a Codex agent_message item. */
function getCodexAgentMessageText(item) {
  if (!item || item.type !== "agent_message") {
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
    if (!block || typeof block !== "object") {
      continue;
    }
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

/** Converts a Codex stream item into a UI progress step object. */
function codexItemToStep(item) {
  const itemType =
    item && typeof item.type === "string" && item.type.trim()
      ? item.type.trim()
      : "tool";
  const normalizedType = itemType.toLowerCase();
  const pathValue = getCodexFieldValue(item, [
    "file_path",
    "path",
    "target_file",
    "target_path",
    "notebook_path",
  ]);
  const queryValue = getCodexFieldValue(item, ["query", "pattern", "url"]);
  const commandValue = getCodexFieldValue(item, ["command", "cmd"]);
  const descriptionValue = getCodexFieldValue(item, [
    "description",
    "name",
    "tool",
    "skill",
  ]);
  const normalizedDescription = descriptionValue.toLowerCase();
  const pathDetail = pathValue ? shortenPath(String(pathValue)) : "";

  if (normalizedType === "mcp_tool_call") {
    if (normalizedDescription.includes("fetch_file")) {
      return {
        type: "read",
        label: "Reading file...",
        detail: descriptionValue || undefined,
        status: "active",
      };
    }
    if (
      normalizedDescription.includes("search") ||
      normalizedDescription.includes("list_repositories") ||
      normalizedDescription.includes("list_mcp_resources")
    ) {
      return {
        type: "search_code",
        label: "Searching code...",
        detail: descriptionValue || undefined,
        status: "active",
      };
    }
    return {
      type: "tool",
      label: "Using MCP...",
      detail: descriptionValue || undefined,
      status: "active",
    };
  }

  if (normalizedType.includes("web")) {
    return {
      type: normalizedType.includes("search") ? "web_search" : "web_fetch",
      label: normalizedType.includes("search")
        ? "Searching web..."
        : "Fetching URL...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("read")) {
    return {
      type: "read",
      label: "Reading file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("grep") || normalizedType.includes("search")) {
    return {
      type: normalizedType.includes("file") ? "search_files" : "search_code",
      label: normalizedType.includes("file")
        ? "Searching files..."
        : "Searching code...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("glob") || normalizedType.includes("list")) {
    return {
      type: "search_files",
      label: "Searching files...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("write") || normalizedType.includes("create")) {
    return {
      type: "write",
      label: "Creating file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (
    normalizedType.includes("edit") ||
    normalizedType.includes("patch") ||
    normalizedType.includes("apply")
  ) {
    return {
      type: "edit",
      label: "Editing file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (
    normalizedType.includes("command") ||
    normalizedType.includes("shell") ||
    normalizedType.includes("bash") ||
    normalizedType.includes("exec")
  ) {
    return {
      type: "bash",
      label: "Running command...",
      detail: commandValue || descriptionValue || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("agent")) {
    return {
      type: "subtask",
      label: "Running agent...",
      detail: descriptionValue || undefined,
      status: "active",
    };
  }
  return {
    type: "tool",
    label: "Using " + itemType + "...",
    detail: descriptionValue || pathDetail || queryValue || undefined,
    status: "active",
  };
}

let lastStepType = "";

const completedLabels = {
  "Preparing Claude session...": "Prepared Claude session",
  "Preparing Codex session...": "Prepared Codex session",
  "Starting Claude CLI...": "Started Claude CLI",
  "Starting Codex CLI...": "Started Codex CLI",
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
  "Asking a question...": "Asked a question",
};

/** Marks the last accumulated step as complete and updates its label. */
function markLastComplete() {
  if (accumulatedSteps.length === 0) return;
  const last = accumulatedSteps[accumulatedSteps.length - 1];
  last.status = "complete";
  if (completedLabels[last.label]) {
    last.label = completedLabels[last.label];
  } else if (last.label.startsWith("Using ") && last.label.endsWith("...")) {
    last.label = "Used " + last.label.slice(6, -3);
  }
}

/** Updates or adds a thinking step in the accumulated steps list. */
function updateThinkingStep(label, detail) {
  const lastStep = accumulatedSteps[accumulatedSteps.length - 1];
  if (lastStep && lastStep.type === "thinking" && lastStep.label === label) {
    lastStep.status = "active";
    lastStep.type = "thinking";
    lastStep.detail = detail;
    lastStepType = "thinking";
    return;
  }
  markLastComplete();
  accumulatedSteps.push({
    type: "thinking",
    label,
    detail,
    status: "active",
  });
  lastStepType = "thinking";
}

/** Parses a single JSON stream event line and updates accumulated steps. */
function parseStreamEvent(line) {
  try {
    const event = JSON.parse(line);

    if (PROVIDER === "codex") {
      const threadId = getCodexThreadId(event);
      if (event.type === "thread.started" && threadId) {
        activeCodexThreadId = threadId;
        updateThinkingStep("Starting Codex CLI...", "Restoring saved context...");
        return true;
      }
      if (event.type === "turn.started") {
        updateThinkingStep("Starting Codex CLI...", "Codex is reasoning...");
        return true;
      }
      if (
        event.type === "item.started" &&
        event.item &&
        typeof event.item.type === "string" &&
        event.item.type !== "agent_message"
      ) {
        const step = codexItemToStep(event.item);
        markLastComplete();
        accumulatedSteps.push(step);
        lastStepType = step.type === "thinking" ? "thinking" : "tool";
        return true;
      }
      if (
        event.type === "item.completed" &&
        event.item &&
        event.item.type === "agent_message"
      ) {
        const messageText = getCodexAgentMessageText(event.item);
        if (!messageText) {
          return false;
        }
        appendStreamedContent(messageText);
        updateThinkingStep("Streaming response...", "Receiving reply...");
        return true;
      }
      if (
        (event.type === "item.completed" || event.type === "item.failed") &&
        event.item &&
        typeof event.item.type === "string" &&
        event.item.type !== "agent_message"
      ) {
        markLastComplete();
        return true;
      }
      if (event.type === "turn.completed") {
        markLastComplete();
        accumulatedSteps.push({
          type: "thinking",
          label: "Finalizing response...",
          status: "active",
        });
        return true;
      }
      return false;
    }

    if (event.type === "tool_result") {
      markLastComplete();
      return true;
    }

    if (event.type !== "assistant") return false;
    if (waitingForFirstAssistantEvent) {
      waitingForFirstAssistantEvent = false;
    }
    let added = false;
    for (const block of event.message?.content ?? []) {
      if (block.type === "tool_use") {
        markLastComplete();
        accumulatedSteps.push(toolCallToStep(block.name, block.input ?? {}));
        lastStepType = "tool";
        added = true;
        if (block.name === "AskUserQuestion" && block.input) {
          pendingQuestionData = JSON.stringify(block.input);
        }
      } else if (block.type === "thinking" && block.thinking) {
        markLastComplete();
        accumulatedSteps.push({ type: "thinking", label: "Thinking...", detail: String(block.thinking), status: "active" });
        lastStepType = "thinking";
        added = true;
      } else if (block.type === "text" && block.text) {
        appendStreamedContent(block.text);
        updateThinkingStep("Streaming response...", "Receiving reply...");
        added = true;
      }
    }
    if (!added && lastStepType !== "thinking") {
      markLastComplete();
      accumulatedSteps.push({ type: "thinking", label: "Generating response...", status: "active" });
      lastStepType = "thinking";
      added = true;
    }
    return added;
  } catch { return false; }
}

const accumulatedSteps = [];
try {
  const priorRaw = process.env.PRIOR_STEPS;
  if (priorRaw) {
    const prior = JSON.parse(priorRaw);
    if (Array.isArray(prior)) {
      for (const s of prior) {
        if (s && s.label) accumulatedSteps.push({ ...s, status: "complete" });
      }
    }
  }
} catch {}
let rawOutput = "";
let lastProcessed = 0;
let lastStreamingSentAt = Date.now();
let lastSentPayload = "";
let lastSentContent = "";
let parsedStreamEventCount = 0;
let realtimeOutputBuffer = "";
let activeClaudeSessionId = process.env.CLAUDE_SESSION_ID || "";
let activeCodexThreadId = "";
let resultEventSeen = false;
let activeClaudeSessionMode = "none";
let waitingForFirstAssistantEvent = false;
let claudeInitAt = 0;
let activeAttemptStartedAt = 0;
let firstAssistantEventAt = 0;
let firstTextBlockAt = 0;
let currentStreamedContent = "";
let activeAttemptChild = null;
let fatalHeartbeatErrorMessage = "";
let consecutiveHeartbeatFailures = 0;

/** Builds the serialized streaming payload for the current accumulated steps. */
function buildStreamingPayload() {
  return JSON.stringify(accumulatedSteps);
}

/** Records a successful heartbeat and clears transient heartbeat failure state. */
function markHeartbeatSuccess(payload) {
  lastSentPayload = payload;
  lastSentContent = currentStreamedContent;
  lastStreamingSentAt = Date.now();
  if (consecutiveHeartbeatFailures > 0) {
    console.error(
      "Heartbeat recovered after " +
        consecutiveHeartbeatFailures +
        " consecutive failures",
    );
  }
  consecutiveHeartbeatFailures = 0;
}

/** Records a heartbeat transport failure and aborts the active CLI attempt once failures become persistent. */
function noteHeartbeatFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  consecutiveHeartbeatFailures++;
  console.error(
    "Heartbeat failed (consecutive: " + consecutiveHeartbeatFailures + "):",
    message,
  );
  if (
    !fatalHeartbeatErrorMessage &&
    consecutiveHeartbeatFailures >= MAX_CONSECUTIVE_HEARTBEAT_FAILURES
  ) {
    fatalHeartbeatErrorMessage =
      "Lost streaming heartbeat after " +
      String(consecutiveHeartbeatFailures) +
      " consecutive failures: " +
      message;
    log(fatalHeartbeatErrorMessage);
    if (activeAttemptChild) {
      terminateAttemptProcess(activeAttemptChild);
    }
  }
}

/** Sends a single streaming heartbeat update and records success/failure state. */
async function sendStreamingHeartbeatUpdate(payload) {
  try {
    await callStreamingHeartbeat(
      STREAMING_ENTITY_ID,
      payload,
      currentStreamedContent,
      pendingQuestionData || undefined,
    );
    markHeartbeatSuccess(payload);
    return true;
  } catch (error) {
    noteHeartbeatFailure(error);
    return false;
  }
}

/** Returns milliseconds elapsed since the current attempt started. */
function elapsedAttemptMs() {
  return activeAttemptStartedAt > 0 ? Date.now() - activeAttemptStartedAt : 0;
}

/** Logs byte size and line count of a Claude transcript file for diagnostics. */
function logTranscriptStats(sessionId, label) {
  if (!sessionId) {
    log(label + ": no session id");
    return;
  }
  const transcriptPath = buildClaudeTranscriptPath(
    CLAUDE_LOCAL_PROJECT_DIR,
    sessionId,
  );
  if (!existsSync(transcriptPath)) {
    log(label + ": transcript missing (" + transcriptPath + ")");
    return;
  }
  try {
    const content = readFileSync(transcriptPath, "utf8");
    const lineCount = content.length === 0 ? 0 : content.split("\\n").length;
    const byteSize = statSync(transcriptPath).size;
    log(
      label +
        ": sessionId=" +
        sessionId +
        " bytes=" +
        String(byteSize) +
        " lines=" +
        String(lineCount),
    );
  } catch (error) {
    log(label + ": failed to inspect transcript: " + String(error));
  }
}

/** Builds the file path for a Claude session transcript JSONL file. */
function buildClaudeTranscriptPath(projectDir, sessionId) {
  return projectDir + "/" + sessionId + ".jsonl";
}

/** Copies a file from source to target via bash if the source exists. */
function copyFileIfPresent(sourcePath, targetPath, label) {
  const copyScript =
    "if [ -f " +
    JSON.stringify(sourcePath) +
    " ]; then timeout " +
    String(CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS) +
    " cp -f " +
    JSON.stringify(sourcePath) +
    " " +
    JSON.stringify(targetPath) +
    " || true; fi";
  runTimedBashSync(copyScript, label);
}

/** Recursively copies all entries from one directory to another. */
function copyDirectoryContents(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) {
    return;
  }
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = sourceDir + "/" + entry.name;
    const targetPath = targetDir + "/" + entry.name;
    try {
      cpSync(sourcePath, targetPath, { force: true, recursive: true });
    } catch (error) {
      console.error(
        "Failed to copy " + sourcePath + " to " + targetPath + ":",
        String(error),
      );
    }
  }
}

/** Decodes a base64-encoded string to UTF-8. */
function decodeBase64(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

/** Writes a Codex config file if a raw or base64-encoded value is provided. */
function writeCodexFileIfConfigured(fileName, rawValue, encodedValue) {
  const value = rawValue || (encodedValue ? decodeBase64(encodedValue) : "");
  if (!value) {
    return;
  }
  mkdirSync(CODEX_RUNTIME_HOME_DIR, { recursive: true });
  writeFileSync(CODEX_RUNTIME_HOME_DIR + "/" + fileName, value);
}

/** Builds the Codex runtime config, forcing it to rely on the outer Daytona sandbox. */
function buildCodexRuntimeConfig(rawValue, encodedValue) {
  const configuredValue = rawValue || (encodedValue ? decodeBase64(encodedValue) : "");
  const preservedLines = configuredValue
    ? configuredValue
        .split(/\\r?\\n/)
        .filter((line) => {
          const trimmed = line.trim().toLowerCase();
          return (
            !trimmed.startsWith("sandbox_mode") &&
            !trimmed.startsWith("approval_policy")
          );
        })
    : [];
  const normalizedPreservedLines = preservedLines.filter((line) => line.trim());
  const runtimeLines = [
    'approval_policy = "never"',
    'sandbox_mode = "danger-full-access"',
  ];
  if (normalizedPreservedLines.length > 0) {
    runtimeLines.push(...normalizedPreservedLines);
  }
  return runtimeLines.join("\\n") + "\\n";
}

/** Reads the Codex session state file to get the resume thread ID. */
function readCodexSessionState() {
  const statePath = existsSync(CODEX_LOCAL_STATE_FILE)
    ? CODEX_LOCAL_STATE_FILE
    : existsSync(CODEX_PERSIST_STATE_FILE)
      ? CODEX_PERSIST_STATE_FILE
      : "";
  if (!statePath) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf8"));
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.resumeThreadId === "string" &&
      parsed.resumeThreadId.trim()
    ) {
      return { resumeThreadId: parsed.resumeThreadId.trim() };
    }
  } catch (error) {
    console.error(
      "Failed to read Codex session state from " + statePath + ":",
      String(error),
    );
  }
  return null;
}

/** Writes the active Codex thread ID to the local session state file. */
function writeCodexSessionState() {
  if (!activeCodexThreadId) {
    return;
  }
  mkdirSync(CODEX_RUNTIME_HOME_DIR, { recursive: true });
  writeFileSync(
    CODEX_LOCAL_STATE_FILE,
    JSON.stringify(
      {
        resumeThreadId: activeCodexThreadId,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

/** Restores persisted Codex state and writes auth/config files to the runtime directory. */
function hydratePersistedCodexState() {
  mkdirSync(CODEX_RUNTIME_HOME_DIR, { recursive: true });
  copyFileIfPresent(
    CODEX_PERSIST_STATE_FILE,
    CODEX_LOCAL_STATE_FILE,
    "hydratePersistedCodexState(state)",
  );
  if (!CODEX_AUTH_JSON && !CODEX_AUTH_JSON_BASE64) {
    copyFileIfPresent(
      CODEX_PERSIST_AUTH_FILE,
      CODEX_AUTH_FILE,
      "hydratePersistedCodexState(auth)",
    );
  }
  writeCodexFileIfConfigured("auth.json", CODEX_AUTH_JSON, CODEX_AUTH_JSON_BASE64);
  writeFileSync(
    CODEX_RUNTIME_HOME_DIR + "/config.toml",
    buildCodexRuntimeConfig(CODEX_CONFIG_TOML, CODEX_CONFIG_TOML_BASE64),
  );
}

/** Syncs Codex session state from runtime to the persist volume. */
function syncCodexStateToPersist() {
  writeCodexSessionState();
  mkdirSync(CODEX_PERSIST_DIR, { recursive: true });
  copyFileIfPresent(
    CODEX_LOCAL_STATE_FILE,
    CODEX_PERSIST_STATE_FILE,
    "syncCodexStateToPersist(state)",
  );
  copyFileIfPresent(
    CODEX_AUTH_FILE,
    CODEX_PERSIST_AUTH_FILE,
    "syncCodexStateToPersist(auth)",
  );
}

/** Collects all known Claude session IDs from config, persisted state, and active session. */
function collectClaudeTranscriptSessionIds() {
  const sessionIds = new Set();
  const configuredSessionId = process.env.CLAUDE_SESSION_ID;
  if (configuredSessionId) {
    sessionIds.add(configuredSessionId);
  }
  const persistedState = readClaudeSessionState();
  if (persistedState && persistedState.resumeSessionId) {
    sessionIds.add(persistedState.resumeSessionId);
  }
  const currentSessionId =
    typeof activeClaudeSessionId === "string" ? activeClaudeSessionId.trim() : "";
  if (currentSessionId) {
    sessionIds.add(currentSessionId);
  }
  return Array.from(sessionIds);
}

/** Appends new text to the current streamed content buffer. */
function appendStreamedContent(text) {
  const nextText = String(text);
  if (!nextText) {
    return;
  }
  if (nextText.startsWith(currentStreamedContent)) {
    currentStreamedContent = nextText;
    return;
  }
  currentStreamedContent += nextText;
}

/** Builds the startup progress step label and detail for the Claude CLI. */
function buildClaudeStartupStep() {
  if (waitingForFirstAssistantEvent && claudeInitAt > 0) {
    const elapsedSeconds = Math.max(
      1,
      Math.floor((Date.now() - claudeInitAt) / 1000),
    );
    return activeClaudeSessionMode === "resume"
      ? {
          label: "Restoring Claude session...",
          detail: "Claude started. Restoring saved context... " + elapsedSeconds + "s",
        }
      : {
          label: "Starting Claude CLI...",
          detail: "Claude started. Waiting for first output... " + elapsedSeconds + "s",
        };
  }
  return activeClaudeSessionMode === "resume"
    ? {
        label: "Starting Claude CLI...",
        detail: "Launching Claude with saved session...",
      }
    : {
        label: "Starting Claude CLI...",
        detail: "Launching Claude process...",
      };
}

let flushInProgress = false;
/** Flushes buffered stream events to the streaming heartbeat endpoint. */
async function flushStreaming() {
  if (flushInProgress) return;
  if (rawOutput.length <= lastProcessed) return;
  flushInProgress = true;
  try {
    const pending = rawOutput.slice(lastProcessed);
    const lastNewline = pending.lastIndexOf("\\n");
    if (lastNewline === -1) return;
    lastProcessed += lastNewline + 1;
    let hasNew = false;
    for (const line of pending.slice(0, lastNewline).split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      if (parseStreamEvent(clean)) {
        hasNew = true;
        parsedStreamEventCount++;
      }
    }
    if (hasNew) {
      const payload = buildStreamingPayload();
      if (
        payload === lastSentPayload &&
        currentStreamedContent === lastSentContent
      ) {
        return;
      }
      await sendStreamingHeartbeatUpdate(payload);
    }
  } finally {
    flushInProgress = false;
  }
}

let pingInProgress = false;
/** Sends periodic heartbeat pings to keep the streaming connection alive. */
async function heartbeatPing() {
  if (pingInProgress) return;
  if (Date.now() - lastStreamingSentAt < 10000) return;
  pingInProgress = true;
  try {
    if (waitingForFirstAssistantEvent) {
      const startupStep = buildClaudeStartupStep();
      updateThinkingStep(startupStep.label, startupStep.detail);
    }
    await sendStreamingHeartbeatUpdate(buildStreamingPayload());
  } finally {
    pingInProgress = false;
  }
}

try { unlinkSync(READY_FILE); } catch {}

accumulatedSteps.push({
  type: "thinking",
  label: PROVIDER === "codex" ? "Preparing Codex session..." : "Preparing Claude session...",
  detail: "Initializing callback...",
  status: "active",
});

let callbackReady = false;
/** Sends the initial heartbeat to confirm callback connectivity. */
async function initialHeartbeat() {
  const startedAt = Date.now();
  let attempt = 0;
  while (attempt <= 1) {
    try {
      const payload = buildStreamingPayload();
      await callStreamingHeartbeat(
        STREAMING_ENTITY_ID,
        payload,
        currentStreamedContent,
        pendingQuestionData || undefined,
      );
      markHeartbeatSuccess(payload);
      log(
        "initialHeartbeat succeeded in " +
          String(Date.now() - startedAt) +
          "ms attempts=" +
          String(attempt + 1),
      );
      return;
    } catch (e) {
      attempt++;
      if (attempt > 1) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
await initialHeartbeat()
  .then(() => {
    callbackReady = true;
    try {
      writeFileSync(READY_FILE, String(Date.now()));
      log(
        "ready file written after " +
          String(Date.now() - SCRIPT_STARTED_AT) +
          "ms",
      );
    } catch {}
  })
  .catch((error) => {
    console.error("Callback preflight failed:", String(error));
  });

if (!callbackReady) {
  process.exit(1);
}

const interval = setInterval(flushStreaming, 500);
const heartbeatInterval = setInterval(heartbeatPing, 10000);
let streamingLoopsStopped = false;

/** Stops the flush and heartbeat intervals and performs a final flush. */
async function stopStreamingLoops() {
  if (streamingLoopsStopped) return;
  streamingLoopsStopped = true;
  clearInterval(interval);
  clearInterval(heartbeatInterval);
  await flushStreaming();
}

/** Transitions the UI to a finalizing state and sends a heartbeat update. */
async function setFinalizingState() {
  markLastComplete();
  accumulatedSteps.push({
    type: "thinking",
    label: "Finalizing response...",
    detail: resultEventSeen
      ? "Syncing response and saved session..."
      : PROVIDER === "codex"
        ? "Codex finished. Sending completion..."
        : "Claude finished. Sending completion...",
    status: "active",
  });
  lastStepType = "thinking";
  try {
    await sendStreamingHeartbeatUpdate(buildStreamingPayload());
  } catch {}
}
for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync(d)) {
    for (const f of readdirSync(d)) { try { unlinkSync(d + "/" + f); } catch {} }
  } else {
    try { mkdirSync(d, { recursive: true }); } catch {}
  }
}

/** Uploads and persists task proof media (video or image) if available. */
async function persistTaskProofIfNeeded(videoStorageId, imageStorageId, lastFileName) {
  if (videoStorageId || imageStorageId) {
    if (ENTITY_ID_FIELD === "taskId") {
      const storageId = videoStorageId || imageStorageId;
      await callMutationWithRetry("taskProof:save", {
        taskId: ENTITY_ID,
        storageId,
        fileName: lastFileName,
      }, 3);
      return;
    }
    const mediaArgs = { parentId: ENTITY_ID };
    if (videoStorageId) mediaArgs.videoStorageId = videoStorageId;
    if (imageStorageId) mediaArgs.imageStorageId = imageStorageId;
    await callActionWithRetry("screenshots:attachMedia", mediaArgs, 3);
    return;
  }
  if (ENTITY_ID_FIELD === "taskId") {
    if (!TASK_PROOF_CAPTURE_ENABLED) {
      return;
    }
    await callMutationWithRetry("taskProof:saveMessage", {
      taskId: ENTITY_ID,
      message: "No UI changes",
    }, 3);
  }
}

/** Records a proof failure message for task-scoped executions. */
async function saveProofFailureMessageIfNeeded(message) {
  if (ENTITY_ID_FIELD !== "taskId") {
    return;
  }
  if (!TASK_PROOF_CAPTURE_ENABLED) {
    return;
  }
  try {
    await callMutationWithRetry("taskProof:saveMessage", {
      taskId: ENTITY_ID,
      message,
    }, 2);
  } catch (error) {
    console.error("Failed to record proof persistence error:", error);
  }
}

const REPO_ID = process.env.REPO_ID;
if (REPO_ID && CONVEX_URL && CONVEX_TOKEN) {
  try {
    const res = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CONVEX_TOKEN },
      body: JSON.stringify({ path: "github:getInstallationTokenAction", args: { repoId: REPO_ID }, format: "json" }),
    });
    if (res.ok) {
      const data = await res.json();
      process.env.GITHUB_TOKEN = data.value.token;
    }
  } catch {}
}

/** Logs a timestamped debug message to stderr and the debug log file. */
function log(msg) {
  const line = "[callback " + new Date().toISOString() + "] " + msg + "\\n";
  console.error(line.trim());
  try { writeFileSync("/tmp/callback-debug.log", line, { flag: "a" }); } catch {}
}

/** Attempts to parse a JSON string, returning null on failure. */
function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Copies base Claude config files to the runtime config directory. */
function copyBaseClaudeConfig() {
  const startedAt = Date.now();
  if (!existsSync(CLAUDE_BASE_CONFIG_DIR)) {
    log("copyBaseClaudeConfig skipped: base config dir missing");
    return;
  }
  mkdirSync(CLAUDE_RUNTIME_CONFIG_DIR, { recursive: true });
  for (const entry of readdirSync(CLAUDE_BASE_CONFIG_DIR, { withFileTypes: true })) {
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
    "copyBaseClaudeConfig finished in " +
      String(Date.now() - startedAt) +
      "ms",
  );
}

/** Runs a bash script synchronously with a timeout, returning success status. */
function runTimedBashSync(script, label) {
  const result = spawnSync("bash", ["-lc", script], {
    encoding: "utf8",
    env: { ...process.env },
    timeout: CLAUDE_SYNC_TIMEOUT_MS,
  });
  const timedOut = result.signal === "SIGTERM" || result.signal === "SIGKILL";
  if (result.error || timedOut || result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    log(
      label +
        " failed (status=" +
        String(result.status) +
        ", signal=" +
        String(result.signal || "none") +
        "): " +
        (result.error ? String(result.error) : stderr || stdout || "unknown error"),
    );
    return false;
  }
  return true;
}

/** Restores persisted Claude session state and transcripts to the runtime directory. */
function hydratePersistedClaudeState() {
  const startedAt = Date.now();
  if (!process.env.CLAUDE_SESSION_ID) {
    log("hydratePersistedClaudeState skipped: no Claude session id");
    return;
  }
  copyBaseClaudeConfig();
  mkdirSync(CLAUDE_LOCAL_PROJECT_DIR, { recursive: true });
  const prepareScript =
    "mkdir -p " +
    JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) +
    " " +
    JSON.stringify(CLAUDE_RUNTIME_CONFIG_DIR);
  runTimedBashSync(prepareScript, "hydratePersistedClaudeState(prepare)");
  copyFileIfPresent(
    CLAUDE_PERSIST_STATE_FILE,
    CLAUDE_LOCAL_STATE_FILE,
    "hydratePersistedClaudeState(state)",
  );
  const transcriptSessionIds = collectClaudeTranscriptSessionIds();
  for (const sessionId of transcriptSessionIds) {
    copyFileIfPresent(
      buildClaudeTranscriptPath(CLAUDE_PERSIST_PROJECT_DIR, sessionId),
      buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, sessionId),
      "hydratePersistedClaudeState(" + sessionId + ")",
    );
  }
  log(
    "hydratePersistedClaudeState sessionIds=" +
      (transcriptSessionIds.length > 0
        ? transcriptSessionIds.join(",")
        : "none"),
  );
  log(
    "hydratePersistedClaudeState finished in " +
      String(Date.now() - startedAt) +
      "ms",
  );
}

/** Reads the Claude session state file to get the resume session ID. */
function readClaudeSessionState() {
  if (!existsSync(CLAUDE_LOCAL_STATE_FILE)) {
    return null;
  }
  const parsed = tryParseJson(readFileSync(CLAUDE_LOCAL_STATE_FILE, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const resumeSessionId =
    typeof parsed.resumeSessionId === "string" ? parsed.resumeSessionId.trim() : "";
  if (!resumeSessionId) {
    return null;
  }
  return { resumeSessionId };
}

/** Writes the current Claude session state to the local state file. */
function writeClaudeSessionState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  const resumeSessionId =
    typeof activeClaudeSessionId === "string" && activeClaudeSessionId.trim()
      ? activeClaudeSessionId.trim()
      : process.env.CLAUDE_SESSION_ID;
  if (!resumeSessionId) {
    return;
  }
  mkdirSync(CLAUDE_RUNTIME_CONFIG_DIR, { recursive: true });
  writeFileSync(
    CLAUDE_LOCAL_STATE_FILE,
    JSON.stringify(
      {
        logicalSessionId: process.env.CLAUDE_SESSION_ID,
        resumeSessionId,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

/** Determines whether to start a new session, resume an existing one, or run without sessions. */
function resolveClaudeSessionMode() {
  const configuredSessionId = process.env.CLAUDE_SESSION_ID;
  if (!configuredSessionId) {
    return { mode: "none", sessionId: null };
  }
  const persistedState = readClaudeSessionState();
  if (persistedState) {
    return { mode: "resume", sessionId: persistedState.resumeSessionId };
  }
  if (
    existsSync(
      buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, configuredSessionId),
    )
  ) {
    return { mode: "resume", sessionId: configuredSessionId };
  }
  return { mode: "session", sessionId: configuredSessionId };
}

/** Syncs Claude session state and transcripts from runtime to the persist volume. */
function syncClaudeStateToPersist(reason) {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  writeClaudeSessionState();
  const prepareScript =
    "mkdir -p " +
    JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) +
    " " +
    JSON.stringify(CLAUDE_PERSIST_DIR);
  runTimedBashSync(
    prepareScript,
    "syncClaudeStateToPersist(" + reason + ":prepare)",
  );
  copyFileIfPresent(
    CLAUDE_LOCAL_STATE_FILE,
    CLAUDE_PERSIST_STATE_FILE,
    "syncClaudeStateToPersist(" + reason + ":state)",
  );
  const transcriptSessionIds = collectClaudeTranscriptSessionIds();
  for (const sessionId of transcriptSessionIds) {
    copyFileIfPresent(
      buildClaudeTranscriptPath(CLAUDE_LOCAL_PROJECT_DIR, sessionId),
      buildClaudeTranscriptPath(CLAUDE_PERSIST_PROJECT_DIR, sessionId),
      "syncClaudeStateToPersist(" + reason + ":" + sessionId + ")",
    );
  }
  log(
    "syncClaudeStateToPersist(" +
      reason +
      ") sessionIds=" +
      (transcriptSessionIds.length > 0
        ? transcriptSessionIds.join(",")
        : "none"),
  );
}

const toolsArg = ALLOWED_TOOLS ? '--allowedTools "' + ALLOWED_TOOLS + '"' : "";
const systemArg = SYSTEM_PROMPT ? "--append-system-prompt " + JSON.stringify(SYSTEM_PROMPT) : "";
const settingsJson = '{"attribution":{"commit":"","pr":""}}';
const settingsArg = "--settings " + JSON.stringify(settingsJson);
const mcpArg = existsSync("/tmp/eva-mcp.json") ? "--mcp-config /tmp/eva-mcp.json" : "";
const normalizedClaudeModel = MODEL.startsWith("claude:") ? MODEL.slice("claude:".length) : MODEL;
const normalizedCodexModel = MODEL.startsWith("codex:") ? MODEL.slice("codex:".length) : MODEL;
const codexCommand = existsSync(CODEX_BIN_PATH) ? JSON.stringify(CODEX_BIN_PATH) : "codex";
const codexPromptCmd = SYSTEM_PROMPT
  ? "(printf %s\\\\n\\\\n " + JSON.stringify(SYSTEM_PROMPT) + "; cat /tmp/design-prompt.txt)"
  : "cat /tmp/design-prompt.txt";
const codexExecBaseCmd =
  codexCommand +
  " exec --skip-git-repo-check --full-auto --json --model " +
  JSON.stringify(normalizedCodexModel);
const claudeBaseCmd =
  "cat /tmp/design-prompt.txt | claude -p --verbose --dangerously-skip-permissions --model " +
  normalizedClaudeModel +
  " " +
  toolsArg +
  " " +
  systemArg +
  " " +
  settingsArg +
  " " +
  mcpArg +
  " --output-format stream-json";
log("entityId=" + ENTITY_ID + " provider=" + PROVIDER + " model=" + MODEL + " tools=" + ALLOWED_TOOLS + " sessionId=" + (process.env.CLAUDE_SESSION_ID || "none") + " mcp=" + (mcpArg ? "yes" : "no"));

const TOOL_STEP_TYPES = new Set([
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
]);

/** Checks whether any tool-use steps have been recorded in the accumulated steps. */
function hasToolActivity() {
  return accumulatedSteps.some((step) => TOOL_STEP_TYPES.has(step.type));
}

/** Extracts the final result event from CLI output for both Claude and Codex providers. */
function extractResultEvent(output) {
  if (PROVIDER === "codex") {
    let finalText = "";
    for (const line of output.split("\\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = JSON.parse(clean);
        if (
          parsed.type === "item.completed" &&
          parsed.item &&
          parsed.item.type === "agent_message"
        ) {
          const messageText = getCodexAgentMessageText(parsed.item);
          if (messageText) {
            finalText = messageText;
          }
        }
      } catch {}
    }
    return finalText
      ? {
          result: finalText,
          isError: false,
          rawResultEvent: finalText,
        }
      : null;
  }
  let resultEvent = null;
  for (const line of output.split("\\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = JSON.parse(clean);
      if (parsed.type === "result") {
        const r = parsed.result ?? "";
        resultEvent = {
          result: typeof r === "string" ? r : JSON.stringify(r),
          isError: Boolean(parsed.is_error),
          rawResultEvent: clean,
        };
      }
    } catch {}
  }
  return resultEvent;
}

/** Processes a single realtime stream line for session ID capture and state sync. */
function handleRealtimeStreamLine(line) {
  const parsed = tryParseJson(line);
  if (!parsed || typeof parsed !== "object") {
    return;
  }
  if (PROVIDER === "codex") {
    const threadId = getCodexThreadId(parsed);
    if (parsed.type === "thread.started" && threadId) {
      activeCodexThreadId = threadId;
      writeCodexSessionState();
      return;
    }
    if (parsed.type === "turn.completed" && !resultEventSeen) {
      resultEventSeen = true;
      syncCodexStateToPersist();
    }
    return;
  }
  if (
    parsed.type === "system" &&
    parsed.subtype === "init" &&
    typeof parsed.session_id === "string" &&
    parsed.session_id.trim()
  ) {
    activeClaudeSessionId = parsed.session_id.trim();
    claudeInitAt = Date.now();
    waitingForFirstAssistantEvent = true;
    log(
      "claude init event after " +
        String(elapsedAttemptMs()) +
        "ms sessionId=" +
        activeClaudeSessionId,
    );
    log("captured Claude session id " + activeClaudeSessionId);
    const startupStep = buildClaudeStartupStep();
    updateThinkingStep(startupStep.label, startupStep.detail);
    void sendStreamingHeartbeatUpdate(buildStreamingPayload());
    return;
  }
  if (parsed.type === "assistant") {
    if (firstAssistantEventAt === 0) {
      firstAssistantEventAt = Date.now();
      log(
        "first assistant event after " +
          String(firstAssistantEventAt - activeAttemptStartedAt) +
          "ms",
      );
      updateThinkingStep("Thinking...", "Claude is reasoning...");
    }
    const contentBlocks = Array.isArray(parsed.message?.content)
      ? parsed.message.content
      : [];
    for (const block of contentBlocks) {
      if (block && block.type === "text" && typeof block.text === "string") {
        if (firstTextBlockAt === 0) {
          firstTextBlockAt = Date.now();
          log(
            "first text block after " +
              String(firstTextBlockAt - activeAttemptStartedAt) +
              "ms chars=" +
              String(block.text.length),
          );
        }
        break;
      }
    }
  }
  if (parsed.type === "result" && !resultEventSeen) {
    resultEventSeen = true;
    syncClaudeStateToPersist("result-event");
  }
}

/** Buffers stdout chunks and processes complete lines for realtime event handling. */
function processRealtimeStdoutChunk(text) {
  realtimeOutputBuffer += text;
  while (true) {
    const newlineIndex = realtimeOutputBuffer.indexOf("\\n");
    if (newlineIndex === -1) {
      return;
    }
    const line = realtimeOutputBuffer.slice(0, newlineIndex).trim();
    realtimeOutputBuffer = realtimeOutputBuffer.slice(newlineIndex + 1);
    if (!line) {
      continue;
    }
    handleRealtimeStreamLine(line);
  }
}

/** Builds a descriptive error message based on the CLI exit reason and timeout flags. */
function buildErrorMessage(
  code,
  fatalHeartbeatError,
  timedOutForMaxRuntime,
  timedOutForNoOutput,
  timedOutForFirstEvent,
  timedOutForFirstAssistant,
  timedOutAfterFirstText,
) {
  const cliName = PROVIDER === "codex" ? "Codex CLI" : "Claude CLI";
  if (fatalHeartbeatError) {
    return fatalHeartbeatError;
  }
  if (timedOutForMaxRuntime) {
    return cliName + " terminated after max runtime of " + MAX_TOTAL_RUNTIME_MS + "ms";
  }
  if (timedOutForFirstEvent) {
    return cliName + " produced no parseable stream-json events within " + FIRST_EVENT_TIMEOUT_MS + "ms";
  }
  if (timedOutForFirstAssistant) {
    return cliName + " initialized but produced no assistant response within " + FIRST_ASSISTANT_EVENT_TIMEOUT_MS + "ms — likely MCP initialization or API congestion";
  }
  if (timedOutAfterFirstText) {
    return cliName + " stalled after first text block for " + POST_TEXT_STALL_TIMEOUT_MS + "ms";
  }
  if (timedOutForNoOutput) {
    return cliName + " terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms";
  }
  return cliName + " exited with code " + code;
}

/** Appends stdout and stderr tails to an error message for diagnostics. */
function appendDiagnosticTail(message) {
  const details = [];
  const stdoutTail = rawOutput.slice(-1500).trim();
  const stderrTail = stderrOutput.slice(-1500).trim();
  if (stdoutTail) {
    details.push("stdout tail:\\n" + stdoutTail);
  }
  if (stderrTail) {
    details.push("stderr tail:\\n" + stderrTail);
  }
  if (details.length === 0) {
    return message;
  }
  return message + "\\n\\n" + details.join("\\n\\n");
}

/** Uploads a media file to Convex storage and returns the storage ID. */
async function uploadMediaFile(filePath, mimeType) {
  const urlRes = await callMutationWithRetry("screenshots:generateUploadUrl", {}, 3);
  const fileData = readFileSync(filePath);
  const uploadRes = await fetchWithTimeout(
    urlRes.value,
    {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: fileData,
    },
    30000,
  );
  if (!uploadRes.ok) {
    throw new Error("Upload failed: " + uploadRes.status);
  }
  const uploadJson = await uploadRes.json();
  return uploadJson.storageId;
}

let stderrOutput = "";

/** Hydrates persisted Claude state and resolves the session mode for the current run. */
function prepareClaudeSessionState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    activeClaudeSessionMode = "none";
    updateThinkingStep("Starting Claude CLI...", "Launching Claude process...");
    return { mode: "none", sessionId: null };
  }
  updateThinkingStep("Preparing Claude session...", "Hydrating saved session...");
  hydratePersistedClaudeState();
  const sessionMode = resolveClaudeSessionMode();
  activeClaudeSessionMode = sessionMode.mode;
  updateThinkingStep(
    "Preparing Claude session...",
    sessionMode.mode === "resume"
      ? "Saved session hydrated. Starting Claude..."
      : "Preparing fresh saved session...",
  );
  if (sessionMode.sessionId) {
    activeClaudeSessionId = sessionMode.sessionId;
  }
  logTranscriptStats(
    sessionMode.sessionId,
    sessionMode.mode === "resume"
      ? "resume transcript stats"
      : "session transcript stats",
  );
  log(
    "prepareClaudeSessionState resolved mode=" +
      sessionMode.mode +
      " sessionId=" +
      (sessionMode.sessionId || "none"),
  );
  return sessionMode;
}

/** Hydrates persisted Codex state and resolves the session mode for the current run. */
function prepareCodexSessionState() {
  updateThinkingStep("Preparing Codex session...", "Hydrating saved session...");
  hydratePersistedCodexState();
  const persistedState = readCodexSessionState();
  updateThinkingStep(
    "Preparing Codex session...",
    persistedState
      ? "Saved session hydrated. Starting Codex..."
      : "Preparing fresh Codex session...",
  );
  return persistedState
    ? { mode: "resume", sessionId: persistedState.resumeThreadId }
    : { mode: "none", sessionId: null };
}

/** Prepares session state for the active provider (Claude or Codex). */
function prepareProviderSessionState() {
  return PROVIDER === "codex"
    ? prepareCodexSessionState()
    : prepareClaudeSessionState();
}

/** Resets per-attempt state variables before a new CLI attempt. */
function resetAttemptState() {
  realtimeOutputBuffer = "";
  resultEventSeen = false;
  waitingForFirstAssistantEvent = false;
  claudeInitAt = 0;
  currentStreamedContent = "";
  firstAssistantEventAt = 0;
  firstTextBlockAt = 0;
  fatalHeartbeatErrorMessage = "";
}

/** Sends SIGTERM then SIGKILL to forcefully stop a CLI process. */
function terminateAttemptProcess(child) {
  try {
    child.kill("SIGTERM");
  } catch {}
  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {}
  }, 2000);
}

/** Inspects Codex stdout for agent_message events to track first text block timing. */
function inspectCodexStdout(text) {
  for (const line of text.split("\\n")) {
    const clean = line.trim();
    if (!clean) {
      continue;
    }
    try {
      const parsed = JSON.parse(clean);
      if (
        parsed.type === "item.completed" &&
        parsed.item &&
        parsed.item.type === "agent_message" &&
        getCodexAgentMessageText(parsed.item) &&
        firstTextBlockAt === 0
      ) {
        firstTextBlockAt = Date.now();
      }
    } catch {}
  }
}

/** Spawns a CLI process with timeout monitoring and stdout/stderr capture. */
async function runCliAttempt(options) {
  resetAttemptState();
  activeAttemptStartedAt = Date.now();
  updateThinkingStep(options.startupStep.label, options.startupStep.detail);
  if (options.onStart) {
    options.onStart();
  }
  return await new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", "cd " + WORK_DIR + " && " + options.cmd], {
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    activeAttemptChild = child;
    log(
      options.processLabel +
        " process spawned after " +
        String(elapsedAttemptMs()) +
        "ms pid=" +
        String(child.pid || "unknown"),
    );
    let attemptOutput = "";
    const attemptStartedAt = Date.now();
    const parsedEventsAtStart = parsedStreamEventCount;
    let lastStdoutAt = Date.now();
    let timedOutForNoOutput = false;
    let timedOutForMaxRuntime = false;
    let timedOutForFirstEvent = false;
    let timedOutForFirstAssistant = false;
    let timedOutAfterFirstText = false;
    const noOutputTimer = setInterval(() => {
      if (fatalHeartbeatErrorMessage) {
        terminateAttemptProcess(child);
        return;
      }
      if (Date.now() - SCRIPT_STARTED_AT > MAX_TOTAL_RUNTIME_MS) {
        timedOutForMaxRuntime = true;
        terminateAttemptProcess(child);
        return;
      }
      if (
        parsedStreamEventCount === parsedEventsAtStart &&
        Date.now() - attemptStartedAt > FIRST_EVENT_TIMEOUT_MS
      ) {
        timedOutForFirstEvent = true;
        terminateAttemptProcess(child);
        return;
      }
      if (
        waitingForFirstAssistantEvent &&
        claudeInitAt > 0 &&
        Date.now() - claudeInitAt > FIRST_ASSISTANT_EVENT_TIMEOUT_MS
      ) {
        timedOutForFirstAssistant = true;
        log(
          options.processLabel +
            " stalled waiting for first assistant event for " +
            String(Date.now() - claudeInitAt) +
            "ms after init; terminating process",
        );
        terminateAttemptProcess(child);
        return;
      }
      if (
        firstTextBlockAt > 0 &&
        !resultEventSeen &&
        Date.now() - firstTextBlockAt > POST_TEXT_STALL_TIMEOUT_MS
      ) {
        timedOutAfterFirstText = true;
        log(
          options.processLabel +
            " stalled after first text for " +
            String(Date.now() - firstTextBlockAt) +
            "ms; terminating process",
        );
        terminateAttemptProcess(child);
        return;
      }
      if (Date.now() - lastStdoutAt <= NO_OUTPUT_TIMEOUT_MS) {
        return;
      }
      timedOutForNoOutput = true;
      terminateAttemptProcess(child);
    }, NO_OUTPUT_CHECK_INTERVAL_MS);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      attemptOutput += text;
      rawOutput += text;
      lastStdoutAt = Date.now();
      processRealtimeStdoutChunk(text);
      if (options.onStdoutText) {
        options.onStdoutText(text);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });
    child.on("close", (code) => {
      clearInterval(noOutputTimer);
      activeAttemptChild = null;
      log(
        options.attemptLabel +
          " finished in " +
          elapsedAttemptMs() +
          "ms (code=" +
          code +
          ", timedOutForNoOutput=" +
          timedOutForNoOutput +
          ", timedOutForMaxRuntime=" +
          timedOutForMaxRuntime +
          ", timedOutForFirstEvent=" +
          timedOutForFirstEvent +
          ", timedOutForFirstAssistant=" +
          timedOutForFirstAssistant +
          ", timedOutAfterFirstText=" +
          timedOutAfterFirstText +
          ", outputBytes=" +
          attemptOutput.length +
          ", stderrBytes=" +
          stderrOutput.length +
          ")",
      );
      resolve({
        code: code ?? 1,
        output: attemptOutput,
        timedOutForNoOutput,
        timedOutForMaxRuntime,
        timedOutForFirstEvent,
        timedOutForFirstAssistant,
        timedOutAfterFirstText,
      });
    });
    child.on("error", (err) => {
      clearInterval(noOutputTimer);
      reject(err);
    });
  });
}

/** Runs a single Claude CLI attempt with the resolved session mode. */
async function runClaudeAttempt(sessionMode) {
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
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR,
    },
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
          String(activeAttemptStartedAt - SCRIPT_STARTED_AT) +
          "ms since callback start",
      );
    },
  });
}

/** Runs a single Codex CLI attempt with the resolved session mode. */
async function runCodexAttempt(sessionMode) {
  const sessionArg =
    sessionMode.mode === "resume" && sessionMode.sessionId
      ? " resume " + JSON.stringify(sessionMode.sessionId)
      : "";
  const cmd =
    codexPromptCmd +
    " | " +
    codexExecBaseCmd +
    sessionArg +
    " -";
  const startupStep = {
    label: "Starting Codex CLI...",
    detail:
      sessionMode.mode === "resume"
        ? "Restoring saved context..."
        : "Launching Codex process...",
  };
  return await runCliAttempt({
    cmd,
    env: {
      ...process.env,
      CODEX_HOME: CODEX_RUNTIME_HOME_DIR,
    },
    processLabel: "codex",
    attemptLabel: "runCodexAttempt",
    startupStep,
    onStdoutText: inspectCodexStdout,
  });
}

/** Dispatches a CLI attempt to the active provider (Claude or Codex). */
async function runProviderAttempt(sessionMode) {
  return PROVIDER === "codex"
    ? await runCodexAttempt(sessionMode)
    : await runClaudeAttempt(sessionMode);
}

/** Syncs the active provider session state to the persist volume. */
function syncProviderStateToPersist(reason) {
  if (PROVIDER === "codex") {
    syncCodexStateToPersist();
    return;
  }
  syncClaudeStateToPersist(reason);
}

try {
  const initialSessionMode = prepareProviderSessionState();
  const firstAttempt = await runProviderAttempt(initialSessionMode);
  await flushStreaming();

  let finalCode = firstAttempt.code;
  let finalTimedOutForNoOutput = Boolean(firstAttempt.timedOutForNoOutput);
  let finalTimedOutForMaxRuntime = Boolean(firstAttempt.timedOutForMaxRuntime);
  let finalTimedOutForFirstEvent = Boolean(firstAttempt.timedOutForFirstEvent);
  let finalTimedOutForFirstAssistant = Boolean(firstAttempt.timedOutForFirstAssistant);
  let finalTimedOutAfterFirstText = Boolean(firstAttempt.timedOutAfterFirstText);
  let finalResultEvent = extractResultEvent(firstAttempt.output);
  log(
    "firstAttempt result: code=" +
      firstAttempt.code +
      " isError=" +
      Boolean(finalResultEvent?.isError) +
      " hasToolActivity=" +
      hasToolActivity(),
  );

  if (!resultEventSeen) {
    syncProviderStateToPersist("post-attempt");
  } else {
    log("skipping post-attempt sync because result-event sync already ran");
  }

  await setFinalizingState();

  let errorValue = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (finalCode !== 0) {
    errorValue = appendDiagnosticTail(
      buildErrorMessage(
        finalCode,
        fatalHeartbeatErrorMessage,
        finalTimedOutForMaxRuntime,
        finalTimedOutForNoOutput,
        finalTimedOutForFirstEvent,
        finalTimedOutForFirstAssistant,
        finalTimedOutAfterFirstText,
      ),
    );
  }

  for (const step of accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(accumulatedSteps);

  const completionSuccess = finalResultEvent ? !finalResultEvent.isError : finalCode === 0;
  log("completion: success=" + completionSuccess + " code=" + finalCode + " hasResult=" + Boolean(finalResultEvent) + " error=" + (errorValue ? errorValue.slice(0, 200) : "none") + " steps=" + accumulatedSteps.length);

  const completionArgs = {
    [ENTITY_ID_FIELD]: ENTITY_ID,
    ...(RUN_ID ? { runId: RUN_ID } : {}),
    success: completionSuccess,
    result: finalResultEvent?.result ?? rawOutput,
    error: errorValue,
    activityLog,
    ...(finalResultEvent?.rawResultEvent ? { rawResultEvent: finalResultEvent.rawResultEvent } : {}),
    ...(pendingQuestionData ? { pendingQuestion: pendingQuestionData } : {}),
  };
  try {
    await callMutationWithRetry(COMPLETION_MUTATION, completionArgs);
    let videoStorageId = null;
    let imageStorageId = null;
    let lastFileName = null;
    const recDir = WORK_DIR + "/recordings";
    if (existsSync(recDir)) {
      for (const file of readdirSync(recDir)) {
        if (!/\\.(webm|mp4|mov|avi)$/i.test(file)) continue;
        const fp = recDir + "/" + file;
        const mimeType = file.endsWith(".mp4") ? "video/mp4" : "video/webm";
        try {
          videoStorageId = await uploadMediaFile(fp, mimeType);
          lastFileName = file;
        } catch {}
        try { unlinkSync(fp); } catch {}
      }
    }
    if (!videoStorageId) {
      const ssDir = WORK_DIR + "/screenshots";
      if (existsSync(ssDir)) {
        for (const file of readdirSync(ssDir)) {
          if (!/\\.(png|jpg|jpeg|gif|webp)$/i.test(file)) continue;
          const fp = ssDir + "/" + file;
          const ext = file.split(".").pop().toLowerCase();
          const mimeMap = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
          const mimeType = mimeMap[ext] || "image/png";
          try {
            imageStorageId = await uploadMediaFile(fp, mimeType);
            lastFileName = file;
          } catch {}
          try { unlinkSync(fp); } catch {}
        }
      }
    }
    try {
      await persistTaskProofIfNeeded(videoStorageId, imageStorageId, lastFileName);
    } catch (e) {
      console.error("Failed to persist task proof:", e);
      const proofError =
        e instanceof Error ? e.message : String(e);
      await saveProofFailureMessageIfNeeded(
        "Proof capture failed after completion: " + proofError,
      );
    }
    syncProviderStateToPersist("completion");
    await stopStreamingLoops();
  } catch (e) {
    console.error("Failed to send completion:", e);
    syncProviderStateToPersist("completion-error");
    await stopStreamingLoops();
    process.exit(1);
  }
} catch (err) {
  syncProviderStateToPersist("fatal-error");
  await stopStreamingLoops();
  const errorArgs = {
    [ENTITY_ID_FIELD]: ENTITY_ID,
    ...(RUN_ID ? { runId: RUN_ID } : {}),
    success: false,
    result: null,
    error: appendDiagnosticTail(
      err instanceof Error ? err.message : "Failed to run Claude CLI",
    ),
    activityLog: JSON.stringify(accumulatedSteps),
  };
  try {
    await callMutationWithRetry(COMPLETION_MUTATION, errorArgs);
  } catch {}
}
`.trim();
