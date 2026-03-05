"use node";

import { createHash } from "crypto";
import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { Daytona, type Sandbox, type VolumeMount } from "@daytonaio/sdk";
import { quote } from "shell-quote";
import { resolveDaytonaApiKey } from "./envVarResolver";
import {
  buildGitHubExtraHeader,
  buildGitHubRepoUrl,
  getInstallationToken,
} from "./githubAuth";

const WORKSPACE_DIR = "/workspace/repo";
const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 60;
const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 30;
const SNAPSHOT_READY_TIMEOUT_ERROR =
  "Sandbox failed to become ready within the timeout period";
const CLAUDE_VOLUME_MOUNT_PATH = "/home/daytona/.claude";
const VOLUME_READY_TIMEOUT_MS = 45_000;
const VOLUME_READY_POLL_INTERVAL_MS = 1_000;

async function exec(
  sandbox: Sandbox,
  cmd: string,
  timeout = 30,
): Promise<string> {
  const resp = await sandbox.process.executeCommand(
    cmd,
    "/",
    undefined,
    timeout,
  );
  if (resp.exitCode !== 0) {
    const output = resp.result?.trim();
    throw new Error(
      output
        ? `Sandbox command failed (exit ${resp.exitCode}): ${output}`
        : `Sandbox command failed with exit code ${resp.exitCode}`,
    );
  }
  return resp.result;
}

async function ensureSandboxRunning(
  sandbox: Sandbox,
  timeoutSeconds = DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
): Promise<void> {
  try {
    await exec(sandbox, "echo 1", 5);
    return;
  } catch {
    await sandbox.start(timeoutSeconds);
    await exec(sandbox, "echo 1", 5);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getDaytona(apiKey: string): Daytona {
  return new Daytona({ apiKey });
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function sessionHash(sessionId: Id<"sessions">): string {
  return createHash("sha256").update(String(sessionId)).digest("hex");
}

function sessionVolumeName(sessionId: Id<"sessions">): string {
  return `claude-session-${sessionHash(sessionId).slice(0, 40)}`;
}

function sessionClaudeUuid(sessionId: Id<"sessions">): string {
  const hex = sessionHash(sessionId).slice(0, 32).split("");
  hex[12] = "4";
  const variantNibble = (parseInt(hex[16], 16) & 0x3) | 0x8;
  hex[16] = variantNibble.toString(16);
  return [
    hex.slice(0, 8).join(""),
    hex.slice(8, 12).join(""),
    hex.slice(12, 16).join(""),
    hex.slice(16, 20).join(""),
    hex.slice(20, 32).join(""),
  ].join("-");
}

async function ensureSessionClaudeVolume(
  daytona: Daytona,
  sessionId: Id<"sessions">,
): Promise<VolumeMount[]> {
  const volumeName = sessionVolumeName(sessionId);
  const deadline = Date.now() + VOLUME_READY_TIMEOUT_MS;

  let volume = await daytona.volume.get(volumeName, true);
  while (volume.state !== "ready") {
    if (
      volume.state === "error" ||
      volume.state === "deleted" ||
      volume.state === "deleting" ||
      volume.state === "pending_delete"
    ) {
      throw new Error(
        `Volume '${volumeName}' is in an invalid state. Current state: ${volume.state}`,
      );
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Volume '${volumeName}' did not become ready within ${VOLUME_READY_TIMEOUT_MS}ms. Current state: ${volume.state}`,
      );
    }
    await sleep(VOLUME_READY_POLL_INTERVAL_MS);
    volume = await daytona.volume.get(volumeName);
  }

  return [{ volumeId: volume.id, mountPath: CLAUDE_VOLUME_MOUNT_PATH }];
}

async function resolveSandboxContext(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  daytona: Daytona;
  sandboxEnvVars: Record<string, string>;
  snapshotName: string | undefined;
}> {
  const { daytonaApiKey, sandboxEnvVars } = await resolveDaytonaApiKey(
    ctx,
    repoId,
  );
  const daytona = getDaytona(daytonaApiKey);
  const repoSnapshot = await ctx.runQuery(
    internal.repoSnapshots.getRepoSnapshotName,
    { repoId },
  );
  const snapshotName = repoSnapshot?.snapshotName;
  return { daytona, sandboxEnvVars, snapshotName };
}

function isSnapshotReadyTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(SNAPSHOT_READY_TIMEOUT_ERROR);
}

async function createSandbox(
  daytona: Daytona,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<Sandbox> {
  const timeoutSeconds = snapshotName
    ? SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
    : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;

  const githubToken = await getInstallationToken(installationId);

  const sandbox = await daytona.create(
    {
      ...(snapshotName
        ? { snapshot: snapshotName }
        : { language: "typescript" }),
      ...(volumes ? { volumes } : {}),
      envVars: {
        ...sandboxEnvVars,
        GITHUB_TOKEN: githubToken,
        INSTALLATION_ID: String(installationId),
      },
      autoStopInterval: 30,
      autoDeleteInterval: 45,
    },
    { timeout: timeoutSeconds },
  );
  await exec(
    sandbox,
    'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
    10,
  );
  return sandbox;
}

async function syncRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  await fetchOrigin(sandbox, installationId, owner, name, undefined, {
    prune: true,
    timeoutSeconds: 60,
  });
}

async function checkoutSessionBranch(
  sandbox: Sandbox,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quote([`origin/${branchName}`])} || git checkout -b ${quotedBranch})`,
    30,
  );
}

async function cloneAndSetupRepo(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  await exec(
    sandbox,
    `rm -rf ${WORKSPACE_DIR} && git clone ${quote([repoUrl])} ${quote([WORKSPACE_DIR])}`,
    120,
  );
  const lockFile = (
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && ls -1 | grep -E '^(pnpm-lock.yaml|yarn.lock)$' | head -n1`,
      5,
    )
  ).trim();
  if (lockFile === "pnpm-lock.yaml") {
    await exec(sandbox, `npm install -g pnpm`, 30);
    await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 120);
  } else if (lockFile === "yarn.lock") {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && yarn install`, 120);
  } else {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && npm install`, 120);
  }
}

async function createSandboxAndPrepareRepo(
  daytona: Daytona,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  try {
    const sandbox = await createSandbox(
      daytona,
      installationId,
      sandboxEnvVars,
      snapshotName,
      volumes,
    );
    if (snapshotName) {
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, usedSnapshot: true };
    }
    await cloneAndSetupRepo(sandbox, installationId, owner, name);
    return { sandbox, usedSnapshot: false };
  } catch (error) {
    if (!snapshotName || !isSnapshotReadyTimeoutError(error)) {
      throw error;
    }

    console.warn(
      `[daytona] Snapshot "${snapshotName}" not ready after ${SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS}s for ${owner}/${name}; retrying with same snapshot`,
    );
    const sandbox = await createSandbox(
      daytona,
      installationId,
      sandboxEnvVars,
      snapshotName,
      volumes,
    );
    await syncRepo(sandbox, installationId, owner, name);
    return { sandbox, usedSnapshot: true };
  }
}

async function getOrCreateSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  snapshotName?: string,
  volumes?: VolumeMount[],
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      const sandbox = await daytona.get(existingSandboxId);
      await ensureSandboxRunning(sandbox);
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, isNew: false };
    } catch {
      // Sandbox was deleted/expired or sync failed, fall through to create a new one
    }
  }
  const { sandbox } = await createSandboxAndPrepareRepo(
    daytona,
    installationId,
    owner,
    name,
    sandboxEnvVars,
    snapshotName,
    volumes,
  );
  return { sandbox, isNew: true };
}

async function configureGitHubOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<{ authHeader: string }> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  const authHeader = buildGitHubExtraHeader(githubToken);

  await exec(
    sandbox,
    [
      `cd ${WORKSPACE_DIR}`,
      // Snapshots/reused sandboxes can carry stale GitHub auth headers.
      "git config --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true",
      `git remote set-url origin ${quote([repoUrl])}`,
    ].join(" && "),
    20,
  );

  return { authHeader };
}

async function fetchOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  ref?: string,
  opts?: { prune?: boolean; timeoutSeconds?: number },
): Promise<void> {
  const { authHeader } = await configureGitHubOrigin(
    sandbox,
    installationId,
    owner,
    name,
  );
  const pruneArg = opts?.prune === false ? "" : " --prune";
  const refArg = ref ? ` ${quote([ref])}` : "";
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git -c http.https://github.com/.extraheader=${quote([authHeader])} fetch${pruneArg} origin${refArg}`,
    opts?.timeoutSeconds ?? 60,
  );
}

/**
 * Sets up a git branch in the sandbox — creates it or checks it out if it exists.
 * Stashes dirty state first to prevent checkout failures, then verifies the switch.
 */
async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  // Stash any dirty state from previous executions, then checkout
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null; git checkout -B ${quotedBranch}`,
    10,
  );
  // Verify the branch was actually switched
  const currentBranch = (
    await exec(sandbox, `cd ${WORKSPACE_DIR} && git branch --show-current`, 5)
  ).trim();
  if (currentBranch !== branchName) {
    throw new Error(
      `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
    );
  }
  // Push branch to remote so it exists before Claude starts — makes subsequent pushes fast
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git push -u origin ${quotedBranch} 2>/dev/null || true`,
    30,
  );
}

/**
 * Generic callback handler script that runs inside the Daytona sandbox.
 * Spawns Claude CLI, parses stream-json output, streams activity updates
 * via Convex HTTP API, and calls the specified completion mutation when done.
 *
 * @param completionMutation - The Convex mutation path to call on completion
 *   (e.g. "designWorkflow:handleCompletion", "summarizeWorkflow:handleCompletion")
 * @param entityIdField - The field name for the entity ID in the completion args
 *   (e.g. "designSessionId", "sessionId", "docId")
 */
function buildCallbackScript(
  completionMutation: string,
  entityIdField: string,
): string {
  return `
import { spawn } from "child_process";
import { readFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from "fs";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_TOKEN = process.env.CONVEX_TOKEN;
const ENTITY_ID = process.env.ENTITY_ID;
const STREAMING_ENTITY_ID = process.env.STREAMING_ENTITY_ID || ENTITY_ID;
const ENTITY_TYPE = "${entityIdField}";
const MODEL = process.env.CLAUDE_MODEL || "opus";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep,Skill";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = "${WORKSPACE_DIR}";
const NO_OUTPUT_TIMEOUT_MS = Number(process.env.CLAUDE_NO_OUTPUT_TIMEOUT_MS || "60000");
const NO_OUTPUT_CHECK_INTERVAL_MS = 5000;
const MAX_TOTAL_RUNTIME_MS = Number(process.env.CLAUDE_MAX_TOTAL_RUNTIME_MS || "5400000");
const SCRIPT_STARTED_AT = Date.now();

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
if (GH_TOKEN) {
  process.env.GH_TOKEN = GH_TOKEN;
  process.env.GITHUB_TOKEN = GH_TOKEN;
}
process.env.GH_PROMPT_DISABLED = "1";
process.env.GH_NO_UPDATE_NOTIFIER = "1";

async function callMutation(path, args) {
  const headers = { "Content-Type": "application/json" };
  if (CONVEX_TOKEN) headers["Authorization"] = "Bearer " + CONVEX_TOKEN;
  const res = await fetch(CONVEX_URL + "/api/mutation", {
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
  const res = await fetch(CONVEX_URL + "/api/action", {
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

async function callMutationWithRetry(path, args, maxRetries = 5) {
  let attempt = 0;
  while (true) {
    try {
      return await callMutation(path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.error("callMutation attempt " + attempt + " failed, retrying in " + delayMs + "ms:", String(e));
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
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

    // tool_result events mark the previous tool step as complete
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
      await callMutation("streaming:set", {
        entityId: STREAMING_ENTITY_ID,
        currentActivity: JSON.stringify(accumulatedSteps),
      });
      lastStreamingSentAt = Date.now();
    } catch {}
  }
}

async function heartbeatPing() {
  if (Date.now() - lastStreamingSentAt < 10000) return;
  try {
    await callMutation("streaming:set", {
      entityId: STREAMING_ENTITY_ID,
      currentActivity: JSON.stringify(accumulatedSteps),
    });
    lastStreamingSentAt = Date.now();
  } catch {}
}

// Send initial step immediately so frontend sees progress right away
accumulatedSteps.push({ type: "thinking", label: "Starting Claude...", status: "active" });
callMutation("streaming:set", {
  entityId: STREAMING_ENTITY_ID,
  currentActivity: JSON.stringify(accumulatedSteps),
}).catch(() => {});

const interval = setInterval(flushStreaming, 500);
const heartbeatInterval = setInterval(heartbeatPing, 10000);

// Clear stale media from previous executions so only current run's media gets uploaded
for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync(d)) {
    for (const f of readdirSync(d)) { try { unlinkSync(d + "/" + f); } catch {} }
  } else {
    try { mkdirSync(d, { recursive: true }); } catch {}
  }
}

// Refresh GITHUB_TOKEN right before spawning Claude
const INSTALLATION_ID = process.env.INSTALLATION_ID;
if (INSTALLATION_ID && CONVEX_URL && CONVEX_TOKEN) {
  try {
    const res = await fetch(CONVEX_URL + "/api/action", {
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
const baseCmd = "cat /tmp/design-prompt.txt | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model " + MODEL + " " + toolsArg + " " + systemArg + " " + settingsArg + " --output-format stream-json";

function hasToolActivity() {
  return accumulatedSteps.some((step) =>
    step.type === "read" ||
    step.type === "search_files" ||
    step.type === "search_code" ||
    step.type === "write" ||
    step.type === "edit" ||
    step.type === "bash" ||
    step.type === "tool",
  );
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
    callMutation("streaming:set", {
      entityId: STREAMING_ENTITY_ID,
      currentActivity: JSON.stringify(accumulatedSteps),
    }).catch(() => {});

    const secondAttempt = await runClaudeAttempt(false);
    await flushStreaming();
    finalCode = secondAttempt.code;
    finalTimedOutForNoOutput = Boolean(secondAttempt.timedOutForNoOutput);
    finalTimedOutForMaxRuntime = Boolean(secondAttempt.timedOutForMaxRuntime);
    finalResultEvent = extractResultEvent(secondAttempt.output);
  }

  clearInterval(interval);
  clearInterval(heartbeatInterval);
  await flushStreaming();

  for (const step of accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(accumulatedSteps);

  // Scan for media files, upload to Convex storage, attach to entity
  // If a video exists, skip screenshots (they're intermediate frames during recording)
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
        const urlRes = await callMutation("screenshots:generateUploadUrl", {});
        const uploadUrl = urlRes.value;
        const fileData = readFileSync(fp);
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: fileData,
        });
        const uploadJson = await uploadRes.json();
        videoStorageId = uploadJson.storageId;
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
          const urlRes = await callMutation("screenshots:generateUploadUrl", {});
          const uploadUrl = urlRes.value;
          const fileData = readFileSync(fp);
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: fileData,
          });
          const uploadJson = await uploadRes.json();
          imageStorageId = uploadJson.storageId;
          lastFileName = file;
        } catch {}
        try { unlinkSync(fp); } catch {}
      }
    }
  }
  if (videoStorageId || imageStorageId) {
    try {
      if (ENTITY_TYPE === "taskId") {
        const storageId = videoStorageId || imageStorageId;
        await callMutation("taskProof:save", { taskId: ENTITY_ID, storageId, fileName: lastFileName });
      } else {
        const mediaArgs = { parentId: ENTITY_ID };
        if (videoStorageId) mediaArgs.videoStorageId = videoStorageId;
        if (imageStorageId) mediaArgs.imageStorageId = imageStorageId;
        await callAction("screenshots:attachMedia", mediaArgs);
      }
    } catch {}
  } else if (ENTITY_TYPE === "taskId") {
    try {
      await callMutation("taskProof:saveMessage", { taskId: ENTITY_ID, message: "No UI changes" });
    } catch {}
  }

  const completionArgs = {
    ${entityIdField}: ENTITY_ID,
    success: finalResultEvent ? !finalResultEvent.isError : finalCode === 0,
    result: finalResultEvent?.result ?? rawOutput,
    error: finalResultEvent?.isError
      ? finalResultEvent.result
      : (finalCode !== 0
          ? (finalTimedOutForMaxRuntime
              ? "Claude CLI terminated after max runtime of " + MAX_TOTAL_RUNTIME_MS + "ms"
              : finalTimedOutForNoOutput
              ? "Claude CLI terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms"
              : "Claude CLI exited with code " + finalCode) +
            (stderrOutput ? "\\n" + stderrOutput.slice(-500) : "")
          : null),
    activityLog,
    rawResultEvent: finalResultEvent?.rawResultEvent ?? null,
  };
  try {
    await callMutationWithRetry("${completionMutation}", completionArgs);
  } catch (e) {
    console.error("Failed to send completion:", e);
    process.exit(1);
  }
} catch (err) {
  clearInterval(interval);
  clearInterval(heartbeatInterval);
  const errorArgs = {
    ${entityIdField}: ENTITY_ID,
    success: false,
    result: null,
    error: err instanceof Error ? err.message : "Failed to run Claude CLI",
    activityLog: "[]",
    rawResultEvent: null,
  };
  try {
    await callMutationWithRetry("${completionMutation}", errorArgs);
  } catch {}
}
`.trim();
}

/**
 * Uploads prompt + script to sandbox and fires the script via nohup.
 * Returns immediately — the script calls back to Convex when done.
 */
async function launchScript(
  sandbox: Sandbox,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  convexToken: string,
  entityId: string,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
  } = {},
): Promise<void> {
  // Upload the prompt
  await sandbox.fs.uploadFile(
    Buffer.from(prompt, "utf-8"),
    "/tmp/design-prompt.txt",
  );

  // Upload the callback handler script
  const handlerScript = buildCallbackScript(completionMutation, entityIdField);
  await sandbox.fs.uploadFile(
    Buffer.from(handlerScript, "utf-8"),
    "/tmp/run-design.mjs",
  );

  // Build env vars and fire
  const convexUrl = requireEnv("CONVEX_CLOUD_URL");
  const envParts = [
    `CONVEX_URL=${quote([convexUrl])}`,
    `CONVEX_TOKEN=${quote([convexToken])}`,
    `ENTITY_ID=${quote([entityId])}`,
    `CLAUDE_MODEL=${opts.model ?? "opus"}`,
    `ALLOWED_TOOLS=${quote([opts.allowedTools ?? "Read,Glob,Grep,Skill"])}`,
    `SYSTEM_PROMPT=${quote([opts.systemPrompt ?? ""])}`,
  ];
  if (opts.claudeSessionId) {
    envParts.push(`CLAUDE_SESSION_ID=${quote([opts.claudeSessionId])}`);
  }
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  const envVars = envParts.join(" ");
  await exec(
    sandbox,
    `${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 & echo $! > /tmp/run-design.pid; sleep 1; pid=$(cat /tmp/run-design.pid); if ! kill -0 "$pid" 2>/dev/null; then tail -n 120 /tmp/design.log 2>/dev/null || true; exit 1; fi`,
    20,
  );
}

/**
 * Runs a command on an existing sandbox and returns the output.
 * Used for post-completion operations like capturing git diffs or reading files.
 */
export const warmSnapshotCache = internalAction({
  args: { repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);
      if (!snapshotName) return null;
      const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
        repoId: args.repoId,
      });
      if (!repo) return null;
      const sandbox = await createSandbox(
        daytona,
        repo.installationId,
        sandboxEnvVars,
        snapshotName,
      );
      await sandbox.delete();
      console.log(
        `[daytona] Warmed snapshot cache for ${repo.owner}/${repo.name}`,
      );
    } catch (err) {
      console.error(
        "[daytona] warmSnapshotCache failed (best-effort):",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  },
});

export const runSandboxCommand = internalAction({
  args: {
    sandboxId: v.string(),
    command: v.string(),
    timeoutSeconds: v.optional(v.number()),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);
    return (
      await exec(sandbox, args.command, args.timeoutSeconds ?? 30)
    ).trim();
  },
});

export const getPreviewUrl = action({
  args: {
    sandboxId: v.string(),
    port: v.number(),
    checkReady: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    url: v.string(),
    port: v.number(),
    ready: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);
    // max expiry length allowed is 24 hours
    const signedPreview = await sandbox.getSignedPreviewUrl(args.port, 86400);
    let ready = true;
    if (args.checkReady) {
      try {
        const result = await exec(
          sandbox,
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${args.port}`,
          3,
        );
        const code = parseInt(result.trim() || "0", 10);
        ready = code >= 200 && code < 500;
      } catch {
        ready = false;
      }
    }

    const parsedUrl = new URL(signedPreview.url);
    parsedUrl.protocol = "https:";
    const url = parsedUrl.toString();
    return { url, port: args.port, ready };
  },
});

/**
 * Generic sandbox setup + script launch action for all workflows.
 * Reuses or creates a sandbox, syncs repo, and fires the callback script.
 */
export const setupAndExecute = internalAction({
  args: {
    entityId: v.string(),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.optional(v.id("githubRepos")),
    sessionPersistenceId: v.optional(v.id("sessions")),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    if (!args.repoId) {
      throw new Error("repoId is required for setupAndExecute");
    }

    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts = args.sessionPersistenceId
      ? await ensureSessionClaudeVolume(daytona, args.sessionPersistenceId)
      : undefined;
    const claudeSessionId = args.sessionPersistenceId
      ? sessionClaudeUuid(args.sessionPersistenceId)
      : undefined;

    const { sandbox } = await (args.ephemeral
      ? createSandboxAndPrepareRepo(
          daytona,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          snapshotName,
          sessionVolumeMounts,
        )
      : getOrCreateSandbox(
          daytona,
          args.existingSandboxId,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          snapshotName,
          sessionVolumeMounts,
        ));

    if (args.baseBranch) {
      await fetchOrigin(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        args.baseBranch,
        { prune: false, timeoutSeconds: 30 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git checkout ${quote([args.baseBranch])} && git pull --ff-only origin ${quote([args.baseBranch])}`,
        30,
      );
    }

    if (args.branchName) {
      await setupBranch(sandbox, args.branchName);
    }

    if (args.startDesktop) {
      await startDesktopWithChrome(sandbox);
    }

    const sandboxToken = await ctx.runAction(
      internal.sandboxJwt.signSandboxToken,
      { userId: args.userId },
    );

    await launchScript(
      sandbox,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      sandboxToken,
      args.entityId,
      {
        model: args.model,
        allowedTools: args.allowedTools,
        systemPrompt: args.systemPrompt,
        extraEnvVars: sandboxEnvVars,
        claudeSessionId,
      },
    );

    return { sandboxId: sandbox.id };
  },
});

/**
 * Launches the callback script on an already-running sandbox.
 * Used by design sessions where the sandbox is started separately.
 */
export const launchOnExistingSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandboxToken = await ctx.runAction(
      internal.sandboxJwt.signSandboxToken,
      { userId: args.userId },
    );
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

    await launchScript(
      sandbox,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      sandboxToken,
      args.entityId,
      {
        model: args.model,
        allowedTools: args.allowedTools,
        systemPrompt: args.systemPrompt,
      },
    );

    return null;
  },
});

/**
 * Launches a code audit in an existing sandbox via nohup (fire-and-forget).
 * Reuses buildCallbackScript/launchScript — streaming activity updates are
 * harmlessly ignored since the task is already marked complete by this point.
 */
export const launchAudit = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandboxToken = await ctx.runAction(
      internal.sandboxJwt.signSandboxToken,
      { userId: args.userId },
    );
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

    await launchScript(
      sandbox,
      args.prompt,
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      sandboxToken,
      args.taskId,
      {
        model: "haiku",
        extraEnvVars: { STREAMING_ENTITY_ID: `audit-${args.taskId}` },
      },
    );

    return null;
  },
});

function buildSessionAuditPrompt(diff: string): string {
  return `You are a code auditor. Analyze this git diff and produce a JSON audit with 3 sections.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
1. **accessibility**: WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.
2. **testing**: Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.
3. **codeReview**: Implementation quality — correctness, bugs, security, error handling, naming, code style.

Return ONLY valid JSON in this exact format:
{
  "accessibility": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "testing": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "codeReview": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "summary": "1-2 sentence overall assessment"
}

## Git Diff:
${diff.slice(0, 30000)}`;
}

export const runSessionAudit = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    auditId: v.id("sessionAudits"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const session = await ctx.runQuery(internal.sessions.getInternal, {
        id: args.sessionId,
      });
      if (!session) {
        throw new Error("Session not found");
      }

      const sandboxToken = await ctx.runAction(
        internal.sandboxJwt.signSandboxToken,
        { userId: args.userId },
      );
      const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
      const daytona = getDaytona(daytonaApiKey);
      const sandbox = await daytona.get(args.sandboxId);

      const diffRaw = await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        30,
      );

      if (!diffRaw.trim()) {
        await ctx.runMutation(internal.sessionAudits.fail, {
          id: args.auditId,
          error: "No changes detected",
        });
        return null;
      }

      await launchScript(
        sandbox,
        buildSessionAuditPrompt(diffRaw),
        "sessionAudits:handleCompletion",
        "sessionId",
        sandboxToken,
        String(args.sessionId),
        {
          model: "haiku",
          claudeSessionId: sessionClaudeUuid(args.sessionId),
        },
      );
    } catch (err) {
      await ctx.runMutation(internal.sessionAudits.fail, {
        id: args.auditId,
        error: err instanceof Error ? err.message : "Audit failed",
      });
    }
    return null;
  },
});

export const killSandboxProcess = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    try {
      const sandbox = await daytona.get(args.sandboxId);
      await exec(
        sandbox,
        "pkill -f 'claude-code' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
        10,
      );
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    try {
      const sandbox = await daytona.get(args.sandboxId);
      await sandbox.delete();
    } catch {
      // Sandbox may already be deleted or expired
    }
    return null;
  },
});

export const stopSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) {
      return null;
    }
    if (session.status !== "closed" || session.sandboxId !== args.sandboxId) {
      return null;
    }

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    try {
      const sandbox = await daytona.get(args.sandboxId);
      await sandbox.stop();
    } catch {}
    return null;
  },
});

export const toggleCodeServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

    if (args.action === "start") {
      await exec(
        sandbox,
        `pgrep -f 'code-server.*8080' > /dev/null 2>&1 || code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${WORKSPACE_DIR} > /tmp/code-server.log 2>&1 &`,
        10,
      );
    } else {
      await exec(sandbox, "pkill -f code-server || true", 10);
    }

    return null;
  },
});

const CHROME_LAUNCH_CMD =
  "mkdir -p ~/.config/google-chrome/Default && " +
  "touch ~/.config/google-chrome/'First Run' && " +
  "(pgrep -f google-chrome > /dev/null 2>&1 || " +
  "DISPLAY=:1 nohup google-chrome-stable " +
  "--no-sandbox --disable-dev-shm-usage --start-maximized --window-size=1920,1080 " +
  "--remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-sync " +
  "> /tmp/chrome.log 2>&1 &)";

async function startDesktopWithChrome(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.computerUse.start();
    try {
      await exec(
        sandbox,
        "for i in 1 2 3 4 5 6 7 8 9 10; do DISPLAY=:1 xdpyinfo > /dev/null 2>&1 && break; sleep 1; done",
        15,
      );
    } catch {
      // Non-fatal: continue and hope display is ready
    }
    try {
      await exec(sandbox, "DISPLAY=:1 xrandr --fb 1920x1080", 10);
    } catch {
      try {
        await exec(
          sandbox,
          'DISPLAY=:1 xrandr --newmode "1920x1080" 0 1920 1920 1920 1920 1080 1080 1080 1080 && ' +
            'DISPLAY=:1 xrandr --addmode screen "1920x1080" && ' +
            'DISPLAY=:1 xrandr --output screen --mode "1920x1080"',
          10,
        );
      } catch {
        // Non-fatal: desktop still works at default 1024x768
      }
    }
    try {
      await sandbox.process.executeCommand(
        `bash -c "${CHROME_LAUNCH_CMD}"`,
        "/",
        undefined,
        5,
      );
    } catch {
      // Non-fatal: Chrome launch failure shouldn't break the desktop
    }
  } catch {
    // Non-fatal: entire desktop startup failure shouldn't block the workflow
  }
}

export const toggleDesktopServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

    if (args.action === "start") {
      await sandbox.computerUse.start();
      try {
        await exec(sandbox, "DISPLAY=:1 xrandr --fb 1920x1080", 10);
      } catch {
        try {
          await exec(
            sandbox,
            'DISPLAY=:1 xrandr --newmode "1920x1080" 0 1920 1920 1920 1920 1080 1080 1080 1080 && ' +
              'DISPLAY=:1 xrandr --addmode screen "1920x1080" && ' +
              'DISPLAY=:1 xrandr --output screen --mode "1920x1080"',
            10,
          );
        } catch {
          // Non-fatal: desktop still works at default 1024x768
        }
      }
    } else {
      await sandbox.computerUse.stop();
    }

    return null;
  },
});

export const launchChromeInDesktop = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

    try {
      await sandbox.process.executeCommand(
        `bash -c "${CHROME_LAUNCH_CMD}"`,
        "/",
        undefined,
        5,
      );
    } catch {
      // Non-fatal: Chrome launch failure shouldn't break the desktop
    }

    return null;
  },
});

async function detectPackageManager(sandbox: Sandbox): Promise<string> {
  const lockFile = (
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && ls -1 | grep -E '^(pnpm-lock.yaml|yarn.lock)$' | head -n1`,
      5,
    )
  ).trim();
  if (lockFile === "pnpm-lock.yaml") return "pnpm";
  if (lockFile === "yarn.lock") return "yarn";
  return "npm";
}

async function detectDevPort(
  sandbox: Sandbox,
  rootDir: string,
): Promise<number> {
  const dir = rootDir ? `${WORKSPACE_DIR}/${rootDir}` : WORKSPACE_DIR;
  try {
    const raw = await exec(
      sandbox,
      `cat ${dir}/package.json 2>/dev/null || echo "{}"`,
      5,
    );
    const pkg: Record<string, unknown> = JSON.parse(raw);
    const scripts =
      pkg.scripts && typeof pkg.scripts === "object"
        ? (pkg.scripts as Record<string, unknown>)
        : {};
    const devScript = typeof scripts.dev === "string" ? scripts.dev : "";

    const portMatch = devScript.match(/(?:--port|--p|-p|PORT=)\s*(\d+)/);
    if (portMatch && portMatch[1]) {
      return parseInt(portMatch[1], 10);
    }

    const deps: Record<string, unknown> =
      pkg.dependencies && typeof pkg.dependencies === "object"
        ? (pkg.dependencies as Record<string, unknown>)
        : {};
    const devDeps: Record<string, unknown> =
      pkg.devDependencies && typeof pkg.devDependencies === "object"
        ? (pkg.devDependencies as Record<string, unknown>)
        : {};
    const allDeps = { ...deps, ...devDeps };
    if ("next" in allDeps) return 3000;
    if ("nuxt" in allDeps) return 3000;
    if ("vite" in allDeps) return 5173;
    if ("@angular/core" in allDeps) return 4200;
  } catch {
    // couldn't read package.json
  }
  return 3000;
}

async function startSessionServices(
  sandbox: Sandbox,
  rootDir: string,
): Promise<{ port: number; devCommand: string }> {
  const pm = await detectPackageManager(sandbox);
  const port = await detectDevPort(sandbox, rootDir);
  const dir = rootDir ? `${WORKSPACE_DIR}/${rootDir}` : WORKSPACE_DIR;
  const devCommand = `cd ${dir} && PORT=${port} ${pm} run dev`;
  return { port, devCommand };
}

export const startSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startSessionSandbox");
      }

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";

      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await ensureSandboxRunning(sandbox);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await checkoutSessionBranch(sandbox, args.branchName);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
            devPort,
            devCommand,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const prepared = await createSandboxAndPrepareRepo(
        daytona,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        snapshotName,
        await ensureSessionClaudeVolume(daytona, args.sessionId),
      );
      const sandbox = prepared.sandbox;
      await fetchOrigin(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        args.branchName,
        { prune: false, timeoutSeconds: 30 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git checkout ${quote([args.branchName])} 2>/dev/null || git checkout -b ${quote([args.branchName])} ${quote([`origin/${args.branchName}`])} && git pull --ff-only origin ${quote([args.branchName])}`,
        30,
      );
      const { port: devPort, devCommand } = await startSessionServices(
        sandbox,
        rootDir,
      );

      await ctx.runMutation(internal.sessions.sandboxReady, {
        sessionId: args.sessionId,
        sandboxId: sandbox.id,
        branchName: args.branchName,
        isNew: true,
        usedSnapshot: prepared.usedSnapshot,
        devPort,
        devCommand,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      await ctx.runMutation(internal.sessions.sandboxError, {
        sessionId: args.sessionId,
        error: message,
      });
    }
    return null;
  },
});

export const startDesignSandbox = internalAction({
  args: {
    designSessionId: v.id("designSessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startDesignSandbox");
      }

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";

      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await exec(sandbox, "echo 1", 5);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await setupBranch(sandbox, args.branchName);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
          await ctx.runMutation(internal.designSessions.sandboxReady, {
            designSessionId: args.designSessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
            devPort,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const prepared = await createSandboxAndPrepareRepo(
        daytona,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        snapshotName,
      );
      const sandbox = prepared.sandbox;
      await setupBranch(sandbox, args.branchName);
      if (prepared.usedSnapshot) {
        await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 120);
      }
      const { port: devPort, devCommand } = await startSessionServices(
        sandbox,
        rootDir,
      );
      await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);

      await ctx.runMutation(internal.designSessions.sandboxReady, {
        designSessionId: args.designSessionId,
        sandboxId: sandbox.id,
        branchName: args.branchName,
        isNew: true,
        devPort,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      await ctx.runMutation(internal.designSessions.sandboxError, {
        designSessionId: args.designSessionId,
        error: message,
      });
    }
    return null;
  },
});
