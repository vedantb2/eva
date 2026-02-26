"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { quote } from "shell-quote";
import { resolveSandboxApiKey } from "./envVarResolver";
import {
  createSandboxProvider,
  type SandboxHandle,
  type SandboxProvider,
} from "./sandboxProvider";
import {
  buildGitHubExtraHeader,
  buildGitHubRepoUrl,
  getInstallationToken,
} from "./githubAuth";

const PRIMARY_WORKSPACE_DIR = "/workspace/repo";
const FALLBACK_WORKSPACE_DIR = "/tmp/repo";
const SNAPSHOT_READY_TIMEOUT_ERROR =
  "Sandbox failed to become ready within the timeout period";
const CLONE_REPO_TIMEOUT_SECONDS = 300;
const INSTALL_DEPENDENCIES_TIMEOUT_SECONDS = 900;

function workspaceCdCommand(): string {
  return `[ -d ${quote([PRIMARY_WORKSPACE_DIR])} ] && cd ${quote([PRIMARY_WORKSPACE_DIR])} || cd ${quote([FALLBACK_WORKSPACE_DIR])}`;
}

async function exec(
  sandbox: SandboxHandle,
  cmd: string,
  timeout = 30,
): Promise<string> {
  const result = await sandbox.executeCommand(cmd, "/", timeout);
  if (result.exitCode !== 0) {
    const output = result.output?.trim();
    throw new Error(
      output
        ? `Sandbox command failed (exit ${result.exitCode}): ${output}`
        : `Sandbox command failed with exit code ${result.exitCode}`,
    );
  }
  return result.output;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const REQUIRED_INFRA_KEYS = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
];

function resolveInfraEnvVars(): Record<string, string> {
  const infraEnvVars: Record<string, string> = {};
  for (const key of REQUIRED_INFRA_KEYS) {
    const val = process.env[key];
    if (val) infraEnvVars[key] = val;
  }
  return infraEnvVars;
}

async function resolveSandboxContext(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  provider: SandboxProvider;
  sandboxEnvVars: Record<string, string>;
  infraEnvVars: Record<string, string>;
  snapshotName: string | undefined;
}> {
  const { sandboxApiKey, sandboxProviderType, sandboxEnvVars } =
    await resolveSandboxApiKey(ctx, repoId);
  const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
  const infraEnvVars = resolveInfraEnvVars();
  const repoSnapshot = await ctx.runQuery(
    internal.repoSnapshots.getRepoSnapshotName,
    { repoId },
  );
  const snapshotName =
    sandboxProviderType === "daytona" ? repoSnapshot?.snapshotName : undefined;
  return { provider, sandboxEnvVars, infraEnvVars, snapshotName };
}

function isSnapshotReadyTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(SNAPSHOT_READY_TIMEOUT_ERROR);
}

async function createSandbox(
  provider: SandboxProvider,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  infraEnvVars: Record<string, string>,
  snapshotName?: string,
): Promise<SandboxHandle> {
  const githubToken = await getInstallationToken(installationId);

  const sandbox = await provider.create({
    template: snapshotName,
    envVars: {
      ...sandboxEnvVars,
      GITHUB_TOKEN: githubToken,
      INSTALLATION_ID: String(installationId),
      ...infraEnvVars,
    },
    timeoutMinutes: 10,
  });
  await exec(
    sandbox,
    'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
    10,
  );
  return sandbox;
}

async function syncRepo(
  sandbox: SandboxHandle,
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
  sandbox: SandboxHandle,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `${workspaceCdCommand()} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quote([`origin/${branchName}`])} || git checkout -b ${quotedBranch})`,
    30,
  );
}

async function cloneAndSetupRepo(
  sandbox: SandboxHandle,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const githubToken = await getInstallationToken(installationId);
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  await exec(
    sandbox,
    `if mkdir -p /workspace 2>/dev/null; then TARGET=${quote([PRIMARY_WORKSPACE_DIR])}; else TARGET=${quote([FALLBACK_WORKSPACE_DIR])}; fi && mkdir -p ${quote([FALLBACK_WORKSPACE_DIR])} && rm -rf "$TARGET" && git clone ${quote([repoUrl])} "$TARGET"`,
    CLONE_REPO_TIMEOUT_SECONDS,
  );
  const lockFile = (
    await exec(
      sandbox,
      `${workspaceCdCommand()} && ls -1 | grep -E '^(pnpm-lock.yaml|yarn.lock)$' | head -n1`,
      5,
    )
  ).trim();
  if (lockFile === "pnpm-lock.yaml") {
    await exec(sandbox, `npm install -g pnpm`, 120);
    await exec(
      sandbox,
      `${workspaceCdCommand()} && pnpm install`,
      INSTALL_DEPENDENCIES_TIMEOUT_SECONDS,
    );
  } else if (lockFile === "yarn.lock") {
    await exec(
      sandbox,
      `${workspaceCdCommand()} && yarn install`,
      INSTALL_DEPENDENCIES_TIMEOUT_SECONDS,
    );
  } else {
    await exec(
      sandbox,
      `${workspaceCdCommand()} && npm install`,
      INSTALL_DEPENDENCIES_TIMEOUT_SECONDS,
    );
  }
}

async function createSandboxAndPrepareRepo(
  provider: SandboxProvider,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  infraEnvVars: Record<string, string>,
  snapshotName?: string,
): Promise<{ sandbox: SandboxHandle; usedSnapshot: boolean }> {
  try {
    const sandbox = await createSandbox(
      provider,
      installationId,
      sandboxEnvVars,
      infraEnvVars,
      snapshotName,
    );
    if (snapshotName) {
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, usedSnapshot: true };
    }
    await cloneAndSetupRepo(sandbox, installationId, owner, name);
    return { sandbox, usedSnapshot: false };
  } catch (error) {
    if (!snapshotName) {
      throw error;
    }

    if (isSnapshotReadyTimeoutError(error)) {
      console.warn(
        `[sandbox] Snapshot "${snapshotName}" not ready for ${owner}/${name}; falling back to language sandbox`,
      );
    } else {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[sandbox] Snapshot "${snapshotName}" failed for ${owner}/${name} (${reason}); falling back to language sandbox`,
      );
    }
    const sandbox = await createSandbox(
      provider,
      installationId,
      sandboxEnvVars,
      infraEnvVars,
      undefined,
    );
    await cloneAndSetupRepo(sandbox, installationId, owner, name);
    return { sandbox, usedSnapshot: false };
  }
}

async function getOrCreateSandbox(
  provider: SandboxProvider,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  infraEnvVars: Record<string, string>,
  snapshotName?: string,
): Promise<{ sandbox: SandboxHandle; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      const sandbox = await provider.get(existingSandboxId);
      await exec(sandbox, "echo 1", 5);
      await syncRepo(sandbox, installationId, owner, name);
      return { sandbox, isNew: false };
    } catch {
      // Sandbox was deleted/expired or sync failed, fall through to create a new one
    }
  }
  const { sandbox } = await createSandboxAndPrepareRepo(
    provider,
    installationId,
    owner,
    name,
    sandboxEnvVars,
    infraEnvVars,
    snapshotName,
  );
  return { sandbox, isNew: true };
}

async function configureGitHubOrigin(
  sandbox: SandboxHandle,
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
      workspaceCdCommand(),
      "git config --unset-all http.https://github.com/.extraheader >/dev/null 2>&1 || true",
      `git remote set-url origin ${quote([repoUrl])}`,
    ].join(" && "),
    20,
  );

  return { authHeader };
}

async function fetchOrigin(
  sandbox: SandboxHandle,
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
    `${workspaceCdCommand()} && git -c http.https://github.com/.extraheader=${quote([authHeader])} fetch${pruneArg} origin${refArg}`,
    opts?.timeoutSeconds ?? 60,
  );
}

async function setupBranch(
  sandbox: SandboxHandle,
  branchName: string,
): Promise<void> {
  const quotedBranch = quote([branchName]);
  await exec(
    sandbox,
    `${workspaceCdCommand()} && git stash --include-untracked 2>/dev/null; git checkout -B ${quotedBranch}`,
    10,
  );
  const currentBranch = (
    await exec(
      sandbox,
      `${workspaceCdCommand()} && git branch --show-current`,
      5,
    )
  ).trim();
  if (currentBranch !== branchName) {
    throw new Error(
      `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
    );
  }
  await exec(
    sandbox,
    `${workspaceCdCommand()} && git push -u origin ${quotedBranch} 2>/dev/null || true`,
    30,
  );
}

function buildCallbackScript(
  completionMutation: string,
  entityIdField: string,
): string {
  return `
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_TOKEN = process.env.CONVEX_TOKEN;
const ENTITY_ID = process.env.ENTITY_ID;
const MODEL = process.env.CLAUDE_MODEL || "opus";
const ALLOWED_TOOLS = process.env.ALLOWED_TOOLS || "Read,Glob,Grep,Skill";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";
const WORK_DIR = existsSync("${PRIMARY_WORKSPACE_DIR}") ? "${PRIMARY_WORKSPACE_DIR}" : "${FALLBACK_WORKSPACE_DIR}";

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

const prompt = readFileSync("/tmp/design-prompt.txt", "utf8");

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

// Send initial step immediately so frontend sees progress right away
accumulatedSteps.push({ type: "thinking", label: "Starting Claude...", status: "active" });
callMutation("streaming:set", {
  entityId: ENTITY_ID,
  currentActivity: JSON.stringify(accumulatedSteps),
}).catch(() => {});

const interval = setInterval(flushStreaming, 500);

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

const escapedPrompt = JSON.stringify(prompt);
const toolsArg = ALLOWED_TOOLS ? '--allowedTools "' + ALLOWED_TOOLS + '"' : "";
const systemArg = SYSTEM_PROMPT ? "--append-system-prompt " + JSON.stringify(SYSTEM_PROMPT) : "";
const cmd = "echo " + escapedPrompt + " | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model " + MODEL + " " + toolsArg + " " + systemArg + " --output-format stream-json";

const child = spawn("bash", ["-c", "cd " + WORK_DIR + " && " + cmd], {
  env: { ...process.env },
  stdio: ["pipe", "pipe", "pipe"],
});

let stderrOutput = "";
child.stdout.on("data", (chunk) => { rawOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { stderrOutput += chunk.toString(); });

child.on("close", async (code) => {
  clearInterval(interval);
  await flushStreaming();

  for (const step of accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(accumulatedSteps);

  let resultEvent = null;
  for (const line of rawOutput.split("\\n")) {
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

  try {
    await callMutation("${completionMutation}", {
      ${entityIdField}: ENTITY_ID,
      success: resultEvent ? !resultEvent.isError : code === 0,
      result: resultEvent?.result ?? rawOutput,
      error: resultEvent?.isError ? resultEvent.result : (code !== 0 ? "Claude CLI exited with code " + code : null),
      activityLog,
    });
  } catch (e) {
    console.error("Failed to send completion:", e);
    process.exit(1);
  }
});

child.on("error", async (err) => {
  clearInterval(interval);
  try {
    await callMutation("${completionMutation}", {
      ${entityIdField}: ENTITY_ID,
      success: false,
      result: null,
      error: err.message,
      activityLog: "[]",
    });
  } catch {}
});
`.trim();
}

async function launchScript(
  sandbox: SandboxHandle,
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
  } = {},
): Promise<void> {
  await sandbox.uploadFile(
    Buffer.from(prompt, "utf-8"),
    "/tmp/design-prompt.txt",
  );

  const handlerScript = buildCallbackScript(completionMutation, entityIdField);
  await sandbox.uploadFile(
    Buffer.from(handlerScript, "utf-8"),
    "/tmp/run-design.mjs",
  );

  const convexUrl = requireEnv("CONVEX_CLOUD_URL");
  const envParts = [
    `CONVEX_URL=${quote([convexUrl])}`,
    `CONVEX_TOKEN=${quote([convexToken])}`,
    `ENTITY_ID=${quote([entityId])}`,
    `CLAUDE_MODEL=${opts.model ?? "opus"}`,
    `ALLOWED_TOOLS=${quote([opts.allowedTools ?? "Read,Glob,Grep,Skill"])}`,
    `SYSTEM_PROMPT=${quote([opts.systemPrompt ?? ""])}`,
  ];
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  const envVars = envParts.join(" ");
  await sandbox.executeCommand(
    `${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 &`,
    "/",
    10,
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
    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    const sandbox = await provider.get(args.sandboxId);
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

    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    const sandbox = await provider.get(args.sandboxId);
    const previewResult = await sandbox.getPreviewUrl(args.port, 3600);

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

    return { url: previewResult.url, port: args.port, ready };
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

    const { provider, sandboxEnvVars, infraEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);

    const { sandbox } = await (args.ephemeral
      ? createSandboxAndPrepareRepo(
          provider,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          infraEnvVars,
          snapshotName,
        )
      : getOrCreateSandbox(
          provider,
          args.existingSandboxId,
          args.installationId,
          args.repoOwner,
          args.repoName,
          sandboxEnvVars,
          infraEnvVars,
          snapshotName,
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
        `${workspaceCdCommand()} && git checkout ${quote([args.baseBranch])} && git reset --hard ${quote([`origin/${args.baseBranch}`])}`,
        30,
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

    return { sandboxId: sandbox.id };
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
    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    const sandbox = await provider.get(args.sandboxId);

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
    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    const sandbox = await provider.get(args.sandboxId);

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

      const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
        ctx,
        session.repoId,
      );
      const provider = createSandboxProvider(
        sandboxProviderType,
        sandboxApiKey,
      );
      const sandbox = await provider.get(args.sandboxId);

      const diffRaw = await exec(
        sandbox,
        `${workspaceCdCommand()} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
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

export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    try {
      const sandbox = await provider.get(args.sandboxId);
      await sandbox.delete();
    } catch {
      // Sandbox may already be deleted or expired
    }
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

    const { sandboxApiKey, sandboxProviderType } = await resolveSandboxApiKey(
      ctx,
      args.repoId,
    );
    const provider = createSandboxProvider(sandboxProviderType, sandboxApiKey);
    const sandbox = await provider.get(args.sandboxId);

    if (args.action === "start") {
      await exec(
        sandbox,
        `WORK_DIR=$(if [ -d ${quote([PRIMARY_WORKSPACE_DIR])} ]; then echo ${quote([PRIMARY_WORKSPACE_DIR])}; else echo ${quote([FALLBACK_WORKSPACE_DIR])}; fi) && code-server --port 8080 --auth none --bind-addr 0.0.0.0 "$WORK_DIR" > /tmp/code-server.log 2>&1 &`,
        10,
      );
    } else {
      await exec(sandbox, "pkill -f code-server || true", 10);
    }

    return null;
  },
});

async function startSessionServices(sandbox: SandboxHandle): Promise<void> {
  await exec(
    sandbox,
    `${workspaceCdCommand()} && pnpm dev > /dev/null 2>&1 &`,
    10,
  );
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

      const { provider, sandboxEnvVars, infraEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      if (args.existingSandboxId) {
        try {
          const sandbox = await provider.get(args.existingSandboxId);
          await exec(sandbox, "echo 1", 5);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await checkoutSessionBranch(sandbox, args.branchName);
          await startSessionServices(sandbox);
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const prepared = await createSandboxAndPrepareRepo(
        provider,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        infraEnvVars,
        snapshotName,
      );
      const sandbox = prepared.sandbox;
      if (prepared.usedSnapshot) {
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
          `${workspaceCdCommand()} && git reset --hard ${quote([`origin/${args.branchName}`])} && pnpm install`,
          INSTALL_DEPENDENCIES_TIMEOUT_SECONDS,
        );
      } else {
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
          `${workspaceCdCommand()} && git checkout ${quote([args.branchName])}`,
          30,
        );
      }
      await startSessionServices(sandbox);

      await ctx.runMutation(internal.sessions.sandboxReady, {
        sessionId: args.sessionId,
        sandboxId: sandbox.id,
        branchName: args.branchName,
        isNew: true,
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

      const { provider, sandboxEnvVars, infraEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      if (args.existingSandboxId) {
        try {
          const sandbox = await provider.get(args.existingSandboxId);
          await exec(sandbox, "echo 1", 5);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await setupBranch(sandbox, args.branchName);
          await exec(
            sandbox,
            `${workspaceCdCommand()} && pnpm dev > /dev/null 2>&1 &`,
            10,
          );
          await ctx.runMutation(internal.designSessions.sandboxReady, {
            designSessionId: args.designSessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const prepared = await createSandboxAndPrepareRepo(
        provider,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        infraEnvVars,
        snapshotName,
      );
      const sandbox = prepared.sandbox;
      await setupBranch(sandbox, args.branchName);
      if (prepared.usedSnapshot) {
        await exec(
          sandbox,
          `${workspaceCdCommand()} && pnpm install`,
          INSTALL_DEPENDENCIES_TIMEOUT_SECONDS,
        );
      }
      await exec(
        sandbox,
        `${workspaceCdCommand()} && pnpm dev > /dev/null 2>&1 &`,
        10,
      );

      await ctx.runMutation(internal.designSessions.sandboxReady, {
        designSessionId: args.designSessionId,
        sandboxId: sandbox.id,
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
