"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { Sandbox as DesktopSandbox } from "@e2b/desktop";
import { Sandbox as BaseSandbox } from "e2b";
import { quote } from "shell-quote";
import { resolveE2bApiKey } from "./envVarResolver";
import {
  buildGitHubExtraHeader,
  buildGitHubRepoUrl,
  getInstallationToken,
} from "./githubAuth";

const WORKSPACE_DIR = "/workspace/repo";
const SANDBOX_LIFETIME_SECONDS = 3600;
const TEMPLATE_READY_TIMEOUT_ERROR =
  "Sandbox failed to become ready within the timeout period";

async function exec(
  sandbox: BaseSandbox,
  cmd: string,
  timeoutMs = 30_000,
): Promise<string> {
  const resp = await sandbox.commands.run(cmd, {
    timeoutMs,
  });
  if (resp.exitCode !== 0) {
    const output = (resp.stderr || resp.stdout).trim();
    throw new Error(
      output
        ? `Sandbox command failed (exit ${resp.exitCode}): ${output}`
        : `Sandbox command failed with exit code ${resp.exitCode}`,
    );
  }
  return resp.stdout;
}

async function ensureSandboxRunning(
  sandboxId: string,
  apiKey: string,
): Promise<BaseSandbox> {
  const sandbox = await BaseSandbox.connect(sandboxId, { apiKey });
  await sandbox.commands.run("echo 1", { timeoutMs: 5_000 });
  return sandbox;
}

async function ensureDesktopSandboxRunning(
  sandboxId: string,
  apiKey: string,
): Promise<DesktopSandbox> {
  const sandbox = await DesktopSandbox.connect(sandboxId, { apiKey });
  await sandbox.commands.run("echo 1", { timeoutMs: 5_000 });
  return sandbox;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function resolveSandboxContext(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  apiKey: string;
  sandboxEnvVars: Record<string, string>;
  templateName: string | undefined;
}> {
  const { e2bApiKey, sandboxEnvVars } = await resolveE2bApiKey(ctx, repoId);
  const repoSnapshot = await ctx.runQuery(
    internal.repoSnapshots.getRepoSnapshotName,
    { repoId },
  );
  const templateName = repoSnapshot?.snapshotName;
  return { apiKey: e2bApiKey, sandboxEnvVars, templateName };
}

function isTemplateReadyTimeoutError(error: Error): boolean {
  return error.message.includes(TEMPLATE_READY_TIMEOUT_ERROR);
}

async function createDesktopSandbox(
  apiKey: string,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
): Promise<DesktopSandbox> {
  const githubToken = await getInstallationToken(installationId);

  const sandbox = await DesktopSandbox.create("desktop", {
    apiKey,
    envs: {
      ...sandboxEnvVars,
      GITHUB_TOKEN: githubToken,
      INSTALLATION_ID: String(installationId),
    },
    timeoutMs: SANDBOX_LIFETIME_SECONDS * 1000,
    resolution: [1920, 1080],
  });
  await exec(
    sandbox,
    'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
    10_000,
  );
  return sandbox;
}

async function createCliSandbox(
  apiKey: string,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  templateName?: string,
): Promise<BaseSandbox> {
  const githubToken = await getInstallationToken(installationId);

  const opts = {
    apiKey,
    envs: {
      ...sandboxEnvVars,
      GITHUB_TOKEN: githubToken,
      INSTALLATION_ID: String(installationId),
    },
    timeoutMs: SANDBOX_LIFETIME_SECONDS * 1000,
  };
  const sandbox = templateName
    ? await BaseSandbox.create(templateName, opts)
    : await BaseSandbox.create(opts);
  await exec(
    sandbox,
    'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
    10_000,
  );
  return sandbox;
}

async function syncRepo(
  sandbox: BaseSandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  await fetchOrigin(sandbox, installationId, owner, name, undefined, {
    prune: true,
    timeoutMs: 60_000,
  });
}

async function checkoutSessionBranch(
  sandbox: BaseSandbox,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quote([`origin/${branchName}`])} || git checkout -b ${quotedBranch})`,
    30_000,
  );
}

async function cloneAndSetupRepo(
  sandbox: BaseSandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  await exec(
    sandbox,
    `rm -rf ${WORKSPACE_DIR} && git clone ${quote([repoUrl])} ${quote([WORKSPACE_DIR])}`,
    120_000,
  );
  const lockFile = (
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && ls -1 | grep -E '^(pnpm-lock.yaml|yarn.lock)$' | head -n1`,
      5_000,
    )
  ).trim();
  if (lockFile === "pnpm-lock.yaml") {
    await exec(sandbox, `npm install -g pnpm`, 30_000);
    await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 120_000);
  } else if (lockFile === "yarn.lock") {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && yarn install`, 120_000);
  } else {
    await exec(sandbox, `cd ${WORKSPACE_DIR} && npm install`, 120_000);
  }
}

async function createDesktopSandboxAndPrepareRepo(
  apiKey: string,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
): Promise<DesktopSandbox> {
  const sandbox = await createDesktopSandbox(
    apiKey,
    installationId,
    sandboxEnvVars,
  );
  await cloneAndSetupRepo(sandbox, installationId, owner, name);
  return sandbox;
}

async function createCliSandboxAndPrepareRepo(
  apiKey: string,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  templateName?: string,
): Promise<{ sandbox: BaseSandbox; usedTemplate: boolean }> {
  try {
    const sandbox = await createCliSandbox(
      apiKey,
      installationId,
      sandboxEnvVars,
      templateName,
    );
    if (templateName) {
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, usedTemplate: true };
    }
    await cloneAndSetupRepo(sandbox, installationId, owner, name);
    return { sandbox, usedTemplate: false };
  } catch (error) {
    if (
      !templateName ||
      !(error instanceof Error) ||
      !isTemplateReadyTimeoutError(error)
    ) {
      throw error;
    }

    console.warn(
      `[sandbox] Template "${templateName}" failed for ${owner}/${name}; retrying`,
    );
    const sandbox = await createCliSandbox(
      apiKey,
      installationId,
      sandboxEnvVars,
      templateName,
    );
    await syncRepo(sandbox, installationId, owner, name);
    return { sandbox, usedTemplate: true };
  }
}

async function getOrCreateCliSandbox(
  apiKey: string,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  templateName?: string,
): Promise<{ sandbox: BaseSandbox; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      const sandbox = await ensureSandboxRunning(existingSandboxId, apiKey);
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, isNew: false };
    } catch {
      // Sandbox was deleted/expired or sync failed, fall through to create a new one
    }
  }
  const { sandbox } = await createCliSandboxAndPrepareRepo(
    apiKey,
    installationId,
    owner,
    name,
    sandboxEnvVars,
    templateName,
  );
  return { sandbox, isNew: true };
}

async function configureGitHubOrigin(
  sandbox: BaseSandbox,
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
      "git config --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true",
      `git remote set-url origin ${quote([repoUrl])}`,
    ].join(" && "),
    20_000,
  );

  return { authHeader };
}

async function fetchOrigin(
  sandbox: BaseSandbox,
  installationId: number,
  owner: string,
  name: string,
  ref?: string,
  opts?: { prune?: boolean; timeoutMs?: number },
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
    opts?.timeoutMs ?? 60_000,
  );
}

async function setupBranch(
  sandbox: BaseSandbox,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null; git checkout -B ${quotedBranch}`,
    10_000,
  );
  const currentBranch = (
    await exec(
      sandbox,
      `cd ${WORKSPACE_DIR} && git branch --show-current`,
      5_000,
    )
  ).trim();
  if (currentBranch !== branchName) {
    throw new Error(
      `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
    );
  }
  await exec(
    sandbox,
    `cd ${WORKSPACE_DIR} && git push -u origin ${quotedBranch} 2>/dev/null || true`,
    30_000,
  );
}

function buildCallbackScript(
  completionMutation: string,
  entityIdField: string,
): string {
  return `
import { spawn } from "child_process";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_TOKEN = process.env.CONVEX_TOKEN;
const ENTITY_ID = process.env.ENTITY_ID;
const MODEL = process.env.CLAUDE_MODEL || "opus";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep,Skill";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = "${WORKSPACE_DIR}";

async function callMutation(path, args) {
  const res = await fetch(CONVEX_URL + "/api/mutation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CONVEX_TOKEN,
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Convex mutation " + path + " failed: " + res.status + " " + text);
  }
  return res.json();
}

function shortenPath(p) {
  const parts = p.replace(/\\\\\\\\/g, "/").split("/");
  if (parts.length <= 3) return parts.join("/");
  return ".../" + parts.slice(-2).join("/");
}

function toolCallToStep(name, input) {
  const path = input.file_path ? shortenPath(String(input.file_path)) : "";
  switch (name) {
    case "Read": return { type: "read", label: "Reading file...", detail: path || undefined, status: "active" };
    case "Glob": return { type: "search_files", label: "Searching files...", detail: input.pattern ? String(input.pattern) : undefined, status: "active" };
    case "Grep": return { type: "search_code", label: "Searching code...", detail: input.pattern ? String(input.pattern) : undefined, status: "active" };
    case "Write": return { type: "write", label: "Creating file...", detail: path || undefined, status: "active" };
    case "Edit": return { type: "edit", label: "Editing file...", detail: path || undefined, status: "active" };
    case "Bash": return { type: "bash", label: "Running command...", detail: input.command ? String(input.command).slice(0, 80) : undefined, status: "active" };
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
        const preview = String(block.thinking).split("\\n")[0].slice(0, 120);
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
    const stepsToSend = accumulatedSteps.slice(-30);
    try {
      await callMutation("streaming:set", {
        entityId: ENTITY_ID,
        currentActivity: JSON.stringify(stepsToSend),
      });
    } catch {}
  }
}

accumulatedSteps.push({ type: "thinking", label: "Starting Claude...", status: "active" });
callMutation("streaming:set", {
  entityId: ENTITY_ID,
  currentActivity: JSON.stringify(accumulatedSteps),
}).catch(() => {});

const interval = setInterval(flushStreaming, 500);

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
const baseCmd = "cat /tmp/design-prompt.txt | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model " + MODEL + " " + toolsArg + " " + systemArg + " --output-format stream-json";

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
        resultEvent = { result: typeof r === "string" ? r : JSON.stringify(r), isError: Boolean(parsed.is_error) };
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

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      attemptOutput += text;
      rawOutput += text;
    });
    child.stderr.on("data", (chunk) => {
      stderrOutput += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, output: attemptOutput });
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}

try {
  const firstAttempt = await runClaudeAttempt(true);
  await flushStreaming();

  let finalCode = firstAttempt.code;
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
      entityId: ENTITY_ID,
      currentActivity: JSON.stringify(accumulatedSteps.slice(-30)),
    }).catch(() => {});

    const secondAttempt = await runClaudeAttempt(false);
    await flushStreaming();
    finalCode = secondAttempt.code;
    finalResultEvent = extractResultEvent(secondAttempt.output);
  }

  clearInterval(interval);
  await flushStreaming();

  for (const step of accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(accumulatedSteps);

  try {
    await callMutation("${completionMutation}", {
      ${entityIdField}: ENTITY_ID,
      success: finalResultEvent ? !finalResultEvent.isError : finalCode === 0,
      result: finalResultEvent?.result ?? rawOutput,
      error: finalResultEvent?.isError ? finalResultEvent.result : (finalCode !== 0 ? "Claude CLI exited with code " + finalCode + (stderrOutput ? "\\n" + stderrOutput.slice(-500) : "") : null),
      activityLog,
    });
  } catch (e) {
    console.error("Failed to send completion:", e);
    process.exit(1);
  }
} catch (err) {
  clearInterval(interval);
  try {
    await callMutation("${completionMutation}", {
      ${entityIdField}: ENTITY_ID,
      success: false,
      result: null,
      error: err instanceof Error ? err.message : "Failed to run Claude CLI",
      activityLog: "[]",
    });
  } catch {}
}
`.trim();
}

async function launchScript(
  sandbox: BaseSandbox,
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
  await sandbox.files.write("/tmp/design-prompt.txt", prompt);

  const handlerScript = buildCallbackScript(completionMutation, entityIdField);
  await sandbox.files.write("/tmp/run-design.mjs", handlerScript);

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
  await sandbox.commands.run(
    `${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 &`,
    { timeoutMs: 10_000 },
  );
}

export const runSandboxCommand = internalAction({
  args: {
    sandboxId: v.string(),
    command: v.string(),
    timeoutSeconds: v.optional(v.number()),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    const sandbox = await BaseSandbox.connect(args.sandboxId, {
      apiKey: e2bApiKey,
    });
    return (
      await exec(sandbox, args.command, (args.timeoutSeconds ?? 30) * 1000)
    ).trim();
  },
});

export const getDesktopStreamUrl = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    const sandbox = await DesktopSandbox.connect(args.sandboxId, {
      apiKey: e2bApiKey,
    });
    await sandbox.stream.start({ requireAuth: true });
    const authKey = sandbox.stream.getAuthKey();
    const streamUrl = sandbox.stream.getUrl({ authKey });

    return { url: streamUrl };
  },
});

export const getServiceUrl = action({
  args: {
    sandboxId: v.string(),
    port: v.number(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    url: v.string(),
    port: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    const sandbox = await BaseSandbox.connect(args.sandboxId, {
      apiKey: e2bApiKey,
    });
    const hostUrl = sandbox.getHost(args.port);

    return { url: `https://${hostUrl}`, port: args.port };
  },
});

export const setupAndExecute = internalAction({
  args: {
    entityId: v.string(),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
    convexToken: v.string(),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    if (!args.repoId) {
      throw new Error("repoId is required for setupAndExecute");
    }

    const { apiKey, sandboxEnvVars, templateName } =
      await resolveSandboxContext(ctx, args.repoId);

    const { sandbox } = await (args.ephemeral
      ? createCliSandboxAndPrepareRepo(
          apiKey,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          templateName,
        )
      : getOrCreateCliSandbox(
          apiKey,
          args.existingSandboxId,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          templateName,
        ));

    if (args.baseBranch) {
      await fetchOrigin(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        args.baseBranch,
        { prune: false, timeoutMs: 30_000 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git checkout ${quote([args.baseBranch])} && git reset --hard ${quote([`origin/${args.baseBranch}`])}`,
        30_000,
      );
    }

    if (args.branchName) {
      await setupBranch(sandbox, args.branchName);
    }

    await launchScript(
      sandbox,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      args.convexToken,
      args.entityId,
      {
        model: args.model,
        allowedTools: args.allowedTools,
        systemPrompt: args.systemPrompt,
        extraEnvVars: sandboxEnvVars,
      },
    );

    return { sandboxId: sandbox.sandboxId };
  },
});

export const launchOnExistingSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    convexToken: v.string(),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    const sandbox = await BaseSandbox.connect(args.sandboxId, {
      apiKey: e2bApiKey,
    });

    await launchScript(
      sandbox,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      args.convexToken,
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

export const launchAudit = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    convexToken: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    const sandbox = await BaseSandbox.connect(args.sandboxId, {
      apiKey: e2bApiKey,
    });

    await launchScript(
      sandbox,
      args.prompt,
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      args.convexToken,
      args.taskId,
      { model: "haiku" },
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
    convexToken: v.string(),
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

      const { e2bApiKey } = await resolveE2bApiKey(ctx, session.repoId);
      const sandbox = await BaseSandbox.connect(args.sandboxId, {
        apiKey: e2bApiKey,
      });

      const diffRaw = await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        30_000,
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
        args.convexToken,
        String(args.sessionId),
        { model: "haiku" },
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

export const killSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    try {
      const sandbox = await BaseSandbox.connect(args.sandboxId, {
        apiKey: e2bApiKey,
      });
      await sandbox.kill();
    } catch {
      // Sandbox may already be deleted or expired
    }
    return null;
  },
});

export const pauseSandbox = internalAction({
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

    const { e2bApiKey } = await resolveE2bApiKey(ctx, args.repoId);
    try {
      const sandbox = await BaseSandbox.connect(args.sandboxId, {
        apiKey: e2bApiKey,
      });
      await sandbox.betaPause();
    } catch {}
    return null;
  },
});

async function startDesktopStream(sandbox: DesktopSandbox): Promise<void> {
  await sandbox.stream.start({ requireAuth: true });
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

      const { apiKey, sandboxEnvVars } = await resolveSandboxContext(
        ctx,
        args.repoId,
      );

      if (args.existingSandboxId) {
        try {
          const sandbox = await ensureDesktopSandboxRunning(
            args.existingSandboxId,
            apiKey,
          );
          await startDesktopStream(sandbox);
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
          });
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await checkoutSessionBranch(sandbox, args.branchName);
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const sandbox = await createDesktopSandboxAndPrepareRepo(
        apiKey,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
      );
      await fetchOrigin(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        args.branchName,
        { prune: false, timeoutMs: 30_000 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git checkout ${quote([args.branchName])}`,
        30_000,
      );
      await startDesktopStream(sandbox);

      await ctx.runMutation(internal.sessions.sandboxReady, {
        sessionId: args.sessionId,
        sandboxId: sandbox.sandboxId,
        branchName: args.branchName,
        isNew: true,
        usedSnapshot: false,
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

      const { apiKey, sandboxEnvVars } = await resolveSandboxContext(
        ctx,
        args.repoId,
      );

      if (args.existingSandboxId) {
        try {
          const sandbox = await ensureDesktopSandboxRunning(
            args.existingSandboxId,
            apiKey,
          );
          await startDesktopStream(sandbox);
          await ctx.runMutation(internal.designSessions.sandboxReady, {
            designSessionId: args.designSessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
          });
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await setupBranch(sandbox, args.branchName);
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const sandbox = await createDesktopSandboxAndPrepareRepo(
        apiKey,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
      );
      await setupBranch(sandbox, args.branchName);
      await startDesktopStream(sandbox);

      await ctx.runMutation(internal.designSessions.sandboxReady, {
        designSessionId: args.designSessionId,
        sandboxId: sandbox.sandboxId,
        branchName: args.branchName,
        isNew: true,
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
