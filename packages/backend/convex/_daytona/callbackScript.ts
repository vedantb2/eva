"use node";

export const CALLBACK_SCRIPT = `
import { spawn } from "child_process";
import { readFileSync, unlinkSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_TOKEN = process.env.CONVEX_TOKEN;
const ENTITY_ID = process.env.ENTITY_ID;
const STREAMING_ENTITY_ID = process.env.STREAMING_ENTITY_ID || ENTITY_ID;
const RUN_ID = process.env.RUN_ID || null;
const ENTITY_ID_FIELD = process.env.ENTITY_ID_FIELD;
const COMPLETION_MUTATION = process.env.COMPLETION_MUTATION;
const MODEL = process.env.CLAUDE_MODEL || "opus";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep,Skill";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = "/workspace/repo";
const NO_OUTPUT_TIMEOUT_MS = Number(process.env.CLAUDE_NO_OUTPUT_TIMEOUT_MS || "60000");
const NO_OUTPUT_CHECK_INTERVAL_MS = 5000;
const MAX_TOTAL_RUNTIME_MS = Number(process.env.CLAUDE_MAX_TOTAL_RUNTIME_MS || "3000000");
const SCRIPT_STARTED_AT = Date.now();
const CALLBACK_HTTP_TIMEOUT_MS = Number(process.env.CALLBACK_HTTP_TIMEOUT_MS || "15000");
const CALLBACK_HTTP_MAX_RETRIES = Number(process.env.CALLBACK_HTTP_MAX_RETRIES || "4");
const CALLBACK_HTTP_RETRY_BASE_MS = 1000;
const READY_FILE = "/tmp/run-design.ready";
const STREAMING_HMAC = process.env.STREAMING_HMAC || "";
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || "";

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
  if (!CONVEX_SITE_URL || !STREAMING_HMAC) {
    return await callMutation("streaming:set", { entityId, currentActivity });
  }
  const res = await fetchWithTimeout(CONVEX_SITE_URL + "/api/streaming/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityId, hmac: STREAMING_HMAC, currentActivity }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Streaming heartbeat failed: " + res.status + " " + text);
  }
  return res.json();
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
    default: return { type: "tool", label: "Using " + name + "...", status: "active" };
  }
}

let lastStepType = "";

const completedLabels = {
  "Starting Claude...": "Started Claude",
  "Thinking...": "Thought",
  "Generating response...": "Generated response",
  "Finalizing response...": "Finalized response",
  "Reading file...": "Read file",
  "Searching files...": "Searched files",
  "Searching code...": "Searched code",
  "Creating file...": "Created file",
  "Editing file...": "Edited file",
  "Running command...": "Ran command",
  "Using Skill...": "Used Skill",
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
        const preview = String(block.thinking).split("\\n")[0].slice(0, 500);
        accumulatedSteps.push({ type: "thinking", label: "Thinking...", detail: preview, status: "active" });
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

async function flushStreaming() {
  if (rawOutput.length <= lastProcessed) return;
  const pending = rawOutput.slice(lastProcessed);
  const lastNewline = pending.lastIndexOf("\\n");
  if (lastNewline === -1) return;
  lastProcessed += lastNewline + 1;
  let hasNew = false;
  for (const line of pending.slice(0, lastNewline).split("\\n")) {
    const clean = line.trim();
    if (!clean) continue;
    if (parseStreamEvent(clean)) hasNew = true;
  }
  if (hasNew) {
    try {
      await callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps));
      lastStreamingSentAt = Date.now();
      consecutiveHeartbeatFailures = 0;
    } catch (e) {
      consecutiveHeartbeatFailures++;
      console.error("flushStreaming failed (consecutive: " + consecutiveHeartbeatFailures + "):", String(e));
    }
  }
}

let consecutiveHeartbeatFailures = 0;

async function heartbeatPing() {
  if (Date.now() - lastStreamingSentAt < 10000) return;
  let attempt = 0;
  while (attempt <= 1) {
    try {
      await callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps));
      lastStreamingSentAt = Date.now();
      if (consecutiveHeartbeatFailures > 0) {
        console.error("Heartbeat recovered after " + consecutiveHeartbeatFailures + " consecutive failures");
      }
      consecutiveHeartbeatFailures = 0;
      return;
    } catch (e) {
      attempt++;
      if (attempt > 1) {
        consecutiveHeartbeatFailures++;
        console.error("Heartbeat failed (consecutive: " + consecutiveHeartbeatFailures + "):", String(e));
      }
    }
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

const INSTALLATION_ID = process.env.INSTALLATION_ID;
if (INSTALLATION_ID && CONVEX_URL && CONVEX_TOKEN) {
  try {
    const res = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CONVEX_TOKEN },
      body: JSON.stringify({ path: "github:getInstallationTokenAction", args: { installationId: Number(INSTALLATION_ID) }, format: "json" }),
    });
    if (res.ok) {
      const data = await res.json();
      process.env.GITHUB_TOKEN = data.value.token;
    }
  } catch {}
}

const toolsArg = ALLOWED_TOOLS ? '--allowedTools "' + ALLOWED_TOOLS + '"' : "";
const systemArg = SYSTEM_PROMPT ? "--append-system-prompt " + JSON.stringify(SYSTEM_PROMPT) : "";
const settingsJson = '{"attribution":{"commit":"","pr":""}}';
const settingsArg = "--settings " + JSON.stringify(settingsJson);
const mcpArg = existsSync("/tmp/eva-mcp.json") ? "--mcp-config /tmp/eva-mcp.json" : "";
const baseCmd = "cat /tmp/design-prompt.txt | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model " + MODEL + " " + toolsArg + " " + systemArg + " " + settingsArg + " " + mcpArg + " --output-format stream-json";

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

function buildErrorMessage(code, timedOutForMaxRuntime, timedOutForNoOutput) {
  if (timedOutForMaxRuntime) {
    return "Claude CLI terminated after max runtime of " + MAX_TOTAL_RUNTIME_MS + "ms";
  }
  if (timedOutForNoOutput) {
    return "Claude CLI terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms";
  }
  return "Claude CLI exited with code " + code;
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

async function runClaudeAttempt(includeSessionId) {
  const sessionArg =
    includeSessionId && process.env.CLAUDE_SESSION_ID
      ? " --session-id " + JSON.stringify(process.env.CLAUDE_SESSION_ID)
      : "";
  const cmd = baseCmd + sessionArg;
  return await new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", "cd " + WORK_DIR + " && " + cmd], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let attemptOutput = "";
    let lastStdoutAt = Date.now();
    let timedOutForNoOutput = false;
    let timedOutForMaxRuntime = false;
    const noOutputTimer = setInterval(() => {
      if (Date.now() - SCRIPT_STARTED_AT > MAX_TOTAL_RUNTIME_MS) {
        timedOutForMaxRuntime = true;
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
    });
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });
    child.on("close", (code) => {
      clearInterval(noOutputTimer);
      resolve({
        code: code ?? 1,
        output: attemptOutput,
        timedOutForNoOutput,
        timedOutForMaxRuntime,
      });
    });
    child.on("error", (err) => {
      clearInterval(noOutputTimer);
      reject(err);
    });
  });
}

try {
  const firstAttempt = await runClaudeAttempt(true);
  await flushStreaming();

  let finalCode = firstAttempt.code;
  let finalTimedOutForNoOutput = Boolean(firstAttempt.timedOutForNoOutput);
  let finalTimedOutForMaxRuntime = Boolean(firstAttempt.timedOutForMaxRuntime);
  let finalResultEvent = extractResultEvent(firstAttempt.output);
  const shouldRetryWithoutSession =
    Boolean(process.env.CLAUDE_SESSION_ID) &&
    (firstAttempt.code !== 0 || Boolean(finalResultEvent?.isError)) &&
    !hasToolActivity();

  if (shouldRetryWithoutSession) {
    markLastComplete();
    accumulatedSteps.push({
      type: "thinking",
      label: "Retrying without saved session...",
      status: "active",
    });
    callStreamingHeartbeat(STREAMING_ENTITY_ID, JSON.stringify(accumulatedSteps)).catch(() => {});

    const secondAttempt = await runClaudeAttempt(false);
    await flushStreaming();
    finalCode = secondAttempt.code;
    finalTimedOutForNoOutput = Boolean(secondAttempt.timedOutForNoOutput);
    finalTimedOutForMaxRuntime = Boolean(secondAttempt.timedOutForMaxRuntime);
    finalResultEvent = extractResultEvent(secondAttempt.output);
  }

  await setFinalizingState();

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
  if (videoStorageId || imageStorageId) {
    try {
      if (ENTITY_ID_FIELD === "taskId") {
        const storageId = videoStorageId || imageStorageId;
        await callMutationWithRetry("taskProof:save", { taskId: ENTITY_ID, storageId, fileName: lastFileName }, 3);
      } else {
        const mediaArgs = { parentId: ENTITY_ID };
        if (videoStorageId) mediaArgs.videoStorageId = videoStorageId;
        if (imageStorageId) mediaArgs.imageStorageId = imageStorageId;
        await callActionWithRetry("screenshots:attachMedia", mediaArgs, 3);
      }
    } catch {}
  } else if (ENTITY_ID_FIELD === "taskId") {
    try {
      await callMutationWithRetry("taskProof:saveMessage", { taskId: ENTITY_ID, message: "No UI changes" }, 3);
    } catch {}
  }

  let errorValue = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (finalCode !== 0) {
    errorValue = buildErrorMessage(finalCode, finalTimedOutForMaxRuntime, finalTimedOutForNoOutput);
    if (stderrOutput) errorValue += "\\n" + stderrOutput.slice(-500);
  }

  for (const step of accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(accumulatedSteps);

  const completionArgs = {
    [ENTITY_ID_FIELD]: ENTITY_ID,
    ...(RUN_ID ? { runId: RUN_ID } : {}),
    success: finalResultEvent ? !finalResultEvent.isError : finalCode === 0,
    result: finalResultEvent?.result ?? rawOutput,
    error: errorValue,
    activityLog,
    ...(finalResultEvent?.rawResultEvent ? { rawResultEvent: finalResultEvent.rawResultEvent } : {}),
  };
  try {
    await callMutationWithRetry(COMPLETION_MUTATION, completionArgs);
    await stopStreamingLoops();
  } catch (e) {
    console.error("Failed to send completion:", e);
    await stopStreamingLoops();
    process.exit(1);
  }
} catch (err) {
  await stopStreamingLoops();
  const errorArgs = {
    [ENTITY_ID_FIELD]: ENTITY_ID,
    ...(RUN_ID ? { runId: RUN_ID } : {}),
    success: false,
    result: null,
    error: err instanceof Error ? err.message : "Failed to run Claude CLI",
    activityLog: "[]",
  };
  try {
    await callMutationWithRetry(COMPLETION_MUTATION, errorArgs);
  } catch {}
}
`.trim();
