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
const COMPLETION_MUTATION = process.env.COMPLETION_MUTATION;
const MODEL = process.env.CLAUDE_MODEL || "opus";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = "/workspace/repo";
const NO_OUTPUT_TIMEOUT_MS = Number(process.env.CLAUDE_NO_OUTPUT_TIMEOUT_MS || "60000");
const FIRST_EVENT_TIMEOUT_MS = Number(process.env.CLAUDE_FIRST_EVENT_TIMEOUT_MS || "90000");
const NO_OUTPUT_CHECK_INTERVAL_MS = 5000;
const MAX_TOTAL_RUNTIME_MS = Number(process.env.CLAUDE_MAX_TOTAL_RUNTIME_MS || "3000000");
const SCRIPT_STARTED_AT = Date.now();
const CALLBACK_HTTP_TIMEOUT_MS = Number(process.env.CALLBACK_HTTP_TIMEOUT_MS || "15000");
const CALLBACK_HTTP_MAX_RETRIES = Number(process.env.CALLBACK_HTTP_MAX_RETRIES || "4");
const CALLBACK_HTTP_RETRY_BASE_MS = 1000;
const READY_FILE = "/tmp/run-design.ready";
const CLAUDE_BASE_CONFIG_DIR = process.env.CLAUDE_BASE_CONFIG_DIR || "/home/eva/.claude";
const CLAUDE_RUNTIME_CONFIG_DIR = process.env.CLAUDE_RUNTIME_CONFIG_DIR || "/tmp/claude-config";
const CLAUDE_PERSIST_DIR = process.env.CLAUDE_PERSIST_DIR || "/home/eva/.claude-persist";
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

async function callStreamingHeartbeat(entityId, currentActivity) {
  return await callMutation("streaming:set", { entityId, currentActivity });
}

async function markRunFinalizingIfNeeded() {
  if (!RUN_ID || ENTITY_ID_FIELD !== "taskId") {
    return;
  }
  await callMutationWithRetry("taskWorkflow:markRunFinalizing", {
    taskId: ENTITY_ID,
    runId: RUN_ID,
  });
}

function shortenPath(p) {
  const parts = p.replace(/\\\\\\\\/g, "/").split("/");
  if (parts.length <= 4) return parts.join("/");
  return ".../" + parts.slice(-3).join("/");
}

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
    default: return { type: "tool", label: "Using " + name + "...", status: "active" };
  }
}

let lastStepType = "";

const completedLabels = {
  "Starting Claude...": "Started Claude",
  "Claude started...": "Claude started",
  "Thinking...": "Thought",
  "Generating response...": "Generated response",
  "Writing response...": "Wrote response",
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
};

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

function activateClaudeStartedStep() {
  const lastStep = accumulatedSteps[accumulatedSteps.length - 1];
  if (lastStep && lastStep.label === "Starting Claude...") {
    lastStep.label = "Claude started...";
    lastStep.status = "active";
    lastStep.type = "thinking";
    lastStep.detail = undefined;
    lastStepType = "thinking";
    return;
  }
  markLastComplete();
  accumulatedSteps.push({
    type: "thinking",
    label: "Claude started...",
    status: "active",
  });
  lastStepType = "thinking";
}

function parseStreamEvent(line) {
  try {
    const event = JSON.parse(line);

    if (event.type === "tool_result") {
      markLastComplete();
      return true;
    }

    if (event.type !== "assistant") return false;
    let added = false;
    for (const block of event.message?.content ?? []) {
      if (block.type === "tool_use") {
        markLastComplete();
        accumulatedSteps.push(toolCallToStep(block.name, block.input ?? {}));
        lastStepType = "tool";
        added = true;
      } else if (block.type === "thinking" && block.thinking) {
        markLastComplete();
        accumulatedSteps.push({ type: "thinking", label: "Thinking...", detail: String(block.thinking), status: "active" });
        lastStepType = "thinking";
        added = true;
      } else if (block.type === "text" && block.text) {
        markLastComplete();
        accumulatedSteps.push({ type: "thinking", label: "Writing response...", detail: String(block.text), status: "active" });
        lastStepType = "thinking";
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
let parsedStreamEventCount = 0;
let realtimeOutputBuffer = "";
let activeClaudeSessionId = process.env.CLAUDE_SESSION_ID || "";
let resultEventSeen = false;

let flushInProgress = false;
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
      const payload = JSON.stringify(accumulatedSteps);
      if (payload === lastSentPayload) return;
      try {
        await callStreamingHeartbeat(STREAMING_ENTITY_ID, payload);
        lastSentPayload = payload;
        lastStreamingSentAt = Date.now();
        consecutiveHeartbeatFailures = 0;
      } catch (e) {
        consecutiveHeartbeatFailures++;
        console.error("flushStreaming failed (consecutive: " + consecutiveHeartbeatFailures + "):", String(e));
      }
    }
  } finally {
    flushInProgress = false;
  }
}

let consecutiveHeartbeatFailures = 0;

let pingInProgress = false;
async function heartbeatPing() {
  if (pingInProgress) return;
  if (Date.now() - lastStreamingSentAt < 10000) return;
  pingInProgress = true;
  try {
    const payload = JSON.stringify(accumulatedSteps);
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await callStreamingHeartbeat(STREAMING_ENTITY_ID, payload);
        lastSentPayload = payload;
        lastStreamingSentAt = Date.now();
        if (consecutiveHeartbeatFailures > 0) {
          console.error("Heartbeat recovered after " + consecutiveHeartbeatFailures + " consecutive failures");
        }
        consecutiveHeartbeatFailures = 0;
        return;
      } catch (e) {
        if (attempt < maxAttempts - 1) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          consecutiveHeartbeatFailures++;
          console.error("Heartbeat failed (consecutive: " + consecutiveHeartbeatFailures + "):", String(e));
        }
      }
    }
  } finally {
    pingInProgress = false;
  }
}

try { unlinkSync(READY_FILE); } catch {}

accumulatedSteps.push({ type: "thinking", label: "Starting Claude...", status: "active" });

let callbackReady = false;
async function initialHeartbeat() {
  let attempt = 0;
  while (attempt <= 1) {
    try {
      await callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps));
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
    lastSentPayload = JSON.stringify(accumulatedSteps);
    lastStreamingSentAt = Date.now();
    callbackReady = true;
    try {
      writeFileSync(READY_FILE, String(Date.now()));
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

async function stopStreamingLoops() {
  if (streamingLoopsStopped) return;
  streamingLoopsStopped = true;
  clearInterval(interval);
  clearInterval(heartbeatInterval);
  await flushStreaming();
}

async function setFinalizingState() {
  markLastComplete();
  accumulatedSteps.push({
    type: "thinking",
    label: "Finalizing response...",
    status: "active",
  });
  lastStepType = "thinking";
  try {
    await callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps));
    lastStreamingSentAt = Date.now();
  } catch {}
}
for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync(d)) {
    for (const f of readdirSync(d)) { try { unlinkSync(d + "/" + f); } catch {} }
  } else {
    try { mkdirSync(d, { recursive: true }); } catch {}
  }
}

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
    await callMutationWithRetry("taskProof:saveMessage", {
      taskId: ENTITY_ID,
      message: "No UI changes",
    }, 3);
  }
}

async function saveProofFailureMessageIfNeeded(message) {
  if (ENTITY_ID_FIELD !== "taskId") {
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

function log(msg) {
  const line = "[callback " + new Date().toISOString() + "] " + msg + "\\n";
  console.error(line.trim());
  try { writeFileSync("/tmp/callback-debug.log", line, { flag: "a" }); } catch {}
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function copyBaseClaudeConfig() {
  if (!existsSync(CLAUDE_BASE_CONFIG_DIR)) {
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
}

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

function hydratePersistedClaudeState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  copyBaseClaudeConfig();
  mkdirSync(CLAUDE_LOCAL_PROJECT_DIR, { recursive: true });
  const hydrateScript =
    "mkdir -p " +
    JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) +
    " " +
    JSON.stringify(CLAUDE_RUNTIME_CONFIG_DIR) +
    "; " +
    "if [ -d " +
    JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) +
    " ]; then " +
    "find " +
    JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) +
    " -maxdepth 1 -type f -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do cp -f \\"$file\\" " +
    JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) +
    "/ || true; done; " +
    "fi; " +
    "if [ -f " +
    JSON.stringify(CLAUDE_PERSIST_STATE_FILE) +
    " ]; then cp -f " +
    JSON.stringify(CLAUDE_PERSIST_STATE_FILE) +
    " " +
    JSON.stringify(CLAUDE_LOCAL_STATE_FILE) +
    " || true; fi";
  runTimedBashSync(hydrateScript, "hydratePersistedClaudeState");
}

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

function listLocalSessionFiles() {
  if (!existsSync(CLAUDE_LOCAL_PROJECT_DIR)) {
    return [];
  }
  return readdirSync(CLAUDE_LOCAL_PROJECT_DIR)
    .filter((fileName) => fileName.endsWith(".jsonl"))
    .map((fileName) => ({
      fileName,
      sessionId: fileName.slice(0, -6),
      mtimeMs: statSync(CLAUDE_LOCAL_PROJECT_DIR + "/" + fileName).mtimeMs,
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
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
  const localSessionFiles = listLocalSessionFiles();
  const configuredSessionFile = localSessionFiles.find(
    (file) => file.sessionId === configuredSessionId,
  );
  if (configuredSessionFile) {
    return { mode: "resume", sessionId: configuredSessionId };
  }
  return { mode: "session", sessionId: configuredSessionId };
}

function syncClaudeStateToPersist(reason) {
  if (!process.env.CLAUDE_SESSION_ID) {
    return;
  }
  writeClaudeSessionState();
  const syncScript =
    "mkdir -p " +
    JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) +
    " " +
    JSON.stringify(CLAUDE_PERSIST_DIR) +
    "; " +
    "if [ -d " +
    JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) +
    " ]; then " +
    "find " +
    JSON.stringify(CLAUDE_LOCAL_PROJECT_DIR) +
    " -maxdepth 1 -type f -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do timeout " +
    String(CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS) +
    " cp -f \\"$file\\" " +
    JSON.stringify(CLAUDE_PERSIST_PROJECT_DIR) +
    "/ || true; done; " +
    "fi; " +
    "if [ -f " +
    JSON.stringify(CLAUDE_LOCAL_STATE_FILE) +
    " ]; then timeout " +
    String(CLAUDE_SYNC_PER_FILE_TIMEOUT_SECONDS) +
    " cp -f " +
    JSON.stringify(CLAUDE_LOCAL_STATE_FILE) +
    " " +
    JSON.stringify(CLAUDE_PERSIST_STATE_FILE) +
    " || true; fi";
  runTimedBashSync(syncScript, "syncClaudeStateToPersist(" + reason + ")");
}

const toolsArg = ALLOWED_TOOLS ? '--allowedTools "' + ALLOWED_TOOLS + '"' : "";
const systemArg = SYSTEM_PROMPT ? "--append-system-prompt " + JSON.stringify(SYSTEM_PROMPT) : "";
const settingsJson = '{"attribution":{"commit":"","pr":""}}';
const settingsArg = "--settings " + JSON.stringify(settingsJson);
const mcpArg = existsSync("/tmp/eva-mcp.json") ? "--mcp-config /tmp/eva-mcp.json" : "";
const baseCmd = "cat /tmp/design-prompt.txt | claude -p --verbose --dangerously-skip-permissions --model " + MODEL + " " + toolsArg + " " + systemArg + " " + settingsArg + " " + mcpArg + " --output-format stream-json";
log("entityId=" + ENTITY_ID + " model=" + MODEL + " tools=" + ALLOWED_TOOLS + " sessionId=" + (process.env.CLAUDE_SESSION_ID || "none") + " mcp=" + (mcpArg ? "yes" : "no"));

const TOOL_STEP_TYPES = new Set(["read", "search_files", "search_code", "write", "edit", "bash", "tool"]);

function hasToolActivity() {
  return accumulatedSteps.some((step) => TOOL_STEP_TYPES.has(step.type));
}

function extractResultEvent(output) {
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

function handleRealtimeStreamLine(line) {
  const parsed = tryParseJson(line);
  if (!parsed || typeof parsed !== "object") {
    return;
  }
  if (
    parsed.type === "system" &&
    parsed.subtype === "init" &&
    typeof parsed.session_id === "string" &&
    parsed.session_id.trim()
  ) {
    activeClaudeSessionId = parsed.session_id.trim();
    log("captured Claude session id " + activeClaudeSessionId);
    activateClaudeStartedStep();
    callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps)).catch(() => {});
    return;
  }
  if (parsed.type === "result" && !resultEventSeen) {
    resultEventSeen = true;
    syncClaudeStateToPersist("result-event");
  }
}

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

function buildErrorMessage(
  code,
  timedOutForMaxRuntime,
  timedOutForNoOutput,
  timedOutForFirstEvent,
) {
  if (timedOutForMaxRuntime) {
    return "Claude CLI terminated after max runtime of " + MAX_TOTAL_RUNTIME_MS + "ms";
  }
  if (timedOutForFirstEvent) {
    return "Claude CLI produced no parseable stream-json events within " + FIRST_EVENT_TIMEOUT_MS + "ms";
  }
  if (timedOutForNoOutput) {
    return "Claude CLI terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms";
  }
  return "Claude CLI exited with code " + code;
}

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

function prepareClaudeSessionState() {
  if (!process.env.CLAUDE_SESSION_ID) {
    return { mode: "none", sessionId: null };
  }
  hydratePersistedClaudeState();
  const sessionMode = resolveClaudeSessionMode();
  if (sessionMode.sessionId) {
    activeClaudeSessionId = sessionMode.sessionId;
  }
  log(
    "prepareClaudeSessionState resolved mode=" +
      sessionMode.mode +
      " sessionId=" +
      (sessionMode.sessionId || "none"),
  );
  return sessionMode;
}

async function runClaudeAttempt(sessionMode) {
  realtimeOutputBuffer = "";
  resultEventSeen = false;
  const sessionArg =
    sessionMode.mode === "session" && sessionMode.sessionId
      ? " --session-id " + JSON.stringify(sessionMode.sessionId)
      : sessionMode.mode === "resume" && sessionMode.sessionId
        ? " --resume " + JSON.stringify(sessionMode.sessionId)
        : "";
  const cmd = baseCmd + sessionArg;
  log(
    "runClaudeAttempt started (mode=" +
      sessionMode.mode +
      ", sessionArg=" +
      (sessionArg || "none") +
      ")",
  );
  const attemptStartTime = Date.now();
  return await new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", "cd " + WORK_DIR + " && " + cmd], {
      env: {
        ...process.env,
        CLAUDE_CONFIG_DIR: CLAUDE_RUNTIME_CONFIG_DIR,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let attemptOutput = "";
    const attemptStartedAt = Date.now();
    const parsedEventsAtStart = parsedStreamEventCount;
    let lastStdoutAt = Date.now();
    let timedOutForNoOutput = false;
    let timedOutForMaxRuntime = false;
    let timedOutForFirstEvent = false;
    const noOutputTimer = setInterval(() => {
      if (Date.now() - SCRIPT_STARTED_AT > MAX_TOTAL_RUNTIME_MS) {
        timedOutForMaxRuntime = true;
        try { child.kill("SIGTERM"); } catch {}
        setTimeout(() => {
          try { child.kill("SIGKILL"); } catch {}
        }, 2000);
        return;
      }
      if (
        parsedStreamEventCount === parsedEventsAtStart &&
        Date.now() - attemptStartedAt > FIRST_EVENT_TIMEOUT_MS
      ) {
        timedOutForFirstEvent = true;
        try { child.kill("SIGTERM"); } catch {}
        setTimeout(() => {
          try { child.kill("SIGKILL"); } catch {}
        }, 2000);
        return;
      }
      if (Date.now() - lastStdoutAt <= NO_OUTPUT_TIMEOUT_MS) {
        return;
      }
      timedOutForNoOutput = true;
      try { child.kill("SIGTERM"); } catch {}
      setTimeout(() => {
        try { child.kill("SIGKILL"); } catch {}
      }, 2000);
    }, NO_OUTPUT_CHECK_INTERVAL_MS);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      attemptOutput += text;
      rawOutput += text;
      lastStdoutAt = Date.now();
      processRealtimeStdoutChunk(text);
    });
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });
    child.on("close", (code) => {
      clearInterval(noOutputTimer);
      log("runClaudeAttempt finished in " + (Date.now() - attemptStartTime) + "ms (code=" + code + ", timedOutForNoOutput=" + timedOutForNoOutput + ", timedOutForMaxRuntime=" + timedOutForMaxRuntime + ", timedOutForFirstEvent=" + timedOutForFirstEvent + ", outputBytes=" + attemptOutput.length + ", stderrBytes=" + stderrOutput.length + ")");
      resolve({
        code: code ?? 1,
        output: attemptOutput,
        timedOutForNoOutput,
        timedOutForMaxRuntime,
        timedOutForFirstEvent,
      });
    });
    child.on("error", (err) => {
      clearInterval(noOutputTimer);
      reject(err);
    });
  });
}

try {
  const initialSessionMode = prepareClaudeSessionState();
  const firstAttempt = await runClaudeAttempt(initialSessionMode);
  await flushStreaming();

  let finalCode = firstAttempt.code;
  let finalTimedOutForNoOutput = Boolean(firstAttempt.timedOutForNoOutput);
  let finalTimedOutForMaxRuntime = Boolean(firstAttempt.timedOutForMaxRuntime);
  let finalTimedOutForFirstEvent = Boolean(firstAttempt.timedOutForFirstEvent);
  let finalResultEvent = extractResultEvent(firstAttempt.output);
  const shouldRetryWithoutSession =
    initialSessionMode.mode !== "none" &&
    (firstAttempt.code !== 0 || Boolean(finalResultEvent?.isError)) &&
    !hasToolActivity();

  log("firstAttempt result: code=" + firstAttempt.code + " isError=" + Boolean(finalResultEvent?.isError) + " hasToolActivity=" + hasToolActivity() + " shouldRetry=" + shouldRetryWithoutSession);

  if (shouldRetryWithoutSession) {
    const firstAttemptStderr = stderrOutput.slice(-2000).trim();
    const firstAttemptStdout = firstAttempt.output.slice(-1000).trim();
    log("session-retry stderr: " + (firstAttemptStderr || "(empty)"));
    log("session-retry stdout tail: " + (firstAttemptStdout || "(empty)"));
    stderrOutput = "";
    markLastComplete();
    accumulatedSteps.push({
      type: "thinking",
      label: "Retrying without saved session...",
      status: "active",
    });
    callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps)).catch(() => {});

    const secondAttempt = await runClaudeAttempt({
      mode: "none",
      sessionId: null,
    });
    await flushStreaming();
    finalCode = secondAttempt.code;
    finalTimedOutForNoOutput = Boolean(secondAttempt.timedOutForNoOutput);
    finalTimedOutForMaxRuntime = Boolean(secondAttempt.timedOutForMaxRuntime);
    finalTimedOutForFirstEvent = Boolean(secondAttempt.timedOutForFirstEvent);
    finalResultEvent = extractResultEvent(secondAttempt.output);
  }

  syncClaudeStateToPersist("post-attempt");

  await setFinalizingState();
  try {
    await markRunFinalizingIfNeeded();
  } catch (e) {
    console.error("Failed to mark run finalizing:", e);
  }

  let errorValue = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (finalCode !== 0) {
    errorValue = appendDiagnosticTail(
      buildErrorMessage(
        finalCode,
        finalTimedOutForMaxRuntime,
        finalTimedOutForNoOutput,
        finalTimedOutForFirstEvent,
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
    syncClaudeStateToPersist("completion");
    await stopStreamingLoops();
  } catch (e) {
    console.error("Failed to send completion:", e);
    syncClaudeStateToPersist("completion-error");
    await stopStreamingLoops();
    process.exit(1);
  }
} catch (err) {
  syncClaudeStateToPersist("fatal-error");
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
