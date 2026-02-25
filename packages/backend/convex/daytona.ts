"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import { quote } from "shell-quote";
import { decryptValue } from "./encryption";

const SNAPSHOT_NAME = "eva-snapshot";
const WORKSPACE_DIR = "/workspace/repo";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getDaytona(apiKey: string): Daytona {
  return new Daytona({ apiKey });
}

const REQUIRED_INFRA_KEYS = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_ENV",
];

function resolveInfraEnvVars(): Record<string, string> {
  const infraEnvVars: Record<string, string> = {};
  for (const key of REQUIRED_INFRA_KEYS) {
    const val = process.env[key];
    if (val) infraEnvVars[key] = val;
  }
  return infraEnvVars;
}

async function resolveTeamEnvVars(
  ctx: GenericActionCtx<DataModel>,
  repoId: string,
): Promise<Record<string, string>> {
  const teamId = await ctx.runQuery(internal.githubRepos.getTeamIdForRepo, {
    repoId,
  });

  if (!teamId) return {};

  const vars = await ctx.runQuery(internal.teamEnvVars.getForSandbox, {
    teamId,
  });

  const teamEnvVars: Record<string, string> = {};
  for (const v of vars) {
    teamEnvVars[v.key] = decryptValue(v.value);
  }

  return teamEnvVars;
}

async function resolveDaytonaApiKey(
  ctx: GenericActionCtx<DataModel>,
  repoId: string,
): Promise<string> {
  const teamEnvVars = await resolveTeamEnvVars(ctx, repoId);

  const repoVars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
    repoId,
  });
  const repoEnvVars: Record<string, string> = {};
  for (const v of repoVars) {
    repoEnvVars[v.key] = decryptValue(v.value);
  }

  const mergedEnvVars = { ...teamEnvVars, ...repoEnvVars };
  const apiKey = mergedEnvVars.DAYTONA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DAYTONA_API_KEY not found in team or repo environment variables. Please add it to your team or repo env vars.",
    );
  }

  return apiKey;
}

async function createSandbox(
  daytona: Daytona,
  githubToken: string,
  mergedEnvVars: Record<string, string>,
  infraEnvVars: Record<string, string>,
  snapshotName?: string,
): Promise<Sandbox> {
  const sandbox = await daytona.create(
    {
      snapshot: snapshotName ?? SNAPSHOT_NAME,
      envVars: {
        ...mergedEnvVars,
        GITHUB_TOKEN: githubToken,
        ...infraEnvVars,
      },
      autoStopInterval: 10,
      autoDeleteInterval: 15,
    },
    { timeout: 120 },
  );
  await sandbox.process.executeCommand(
    'git config --global user.name "Eva Agent" && git config --global user.email "agent@Eva.dev"',
    "/",
    undefined,
    10,
  );
  return sandbox;
}

async function syncRepo(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  await sandbox.process.executeCommand(
    `cd ${WORKSPACE_DIR} && git remote set-url origin ${repoUrl}`,
    "/",
    undefined,
    10,
  );
  await sandbox.process.executeCommand(
    `cd ${WORKSPACE_DIR} && git pull`,
    "/",
    undefined,
    60,
  );
}

async function getOrCreateSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  githubToken: string,
  owner: string,
  name: string,
  mergedEnvVars: Record<string, string>,
  infraEnvVars: Record<string, string>,
  snapshotName?: string,
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  if (existingSandboxId) {
    try {
      const sandbox = await daytona.get(existingSandboxId);
      await sandbox.process.executeCommand("echo 1", "/", undefined, 5);
      await syncRepo(sandbox, githubToken, owner, name);
      return { sandbox, isNew: false };
    } catch {
      // Sandbox was deleted/expired or sync failed, fall through to create a new one
    }
  }
  const sandbox = await createSandbox(
    daytona,
    githubToken,
    mergedEnvVars,
    infraEnvVars,
    snapshotName,
  );
  await syncRepo(sandbox, githubToken, owner, name);
  return { sandbox, isNew: true };
}

/**
 * Sets up a git branch in the sandbox — creates it or checks it out if it exists.
 * Stashes dirty state first to prevent checkout failures, then verifies the switch.
 */
async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
): Promise<void> {
  // Stash any dirty state from previous executions, then checkout
  await sandbox.process.executeCommand(
    `cd ${WORKSPACE_DIR} && git stash --include-untracked 2>/dev/null; git checkout -B ${branchName}`,
    "/",
    undefined,
    10,
  );
  // Verify the branch was actually switched
  const check = await sandbox.process.executeCommand(
    `cd ${WORKSPACE_DIR} && git branch --show-current`,
    "/",
    undefined,
    5,
  );
  const currentBranch = (check.result ?? "").trim();
  if (currentBranch !== branchName) {
    throw new Error(
      `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
    );
  }
  // Push branch to remote so it exists before Claude starts — makes subsequent pushes fast
  await sandbox.process.executeCommand(
    `cd ${WORKSPACE_DIR} && git push -u origin ${branchName} 2>/dev/null || true`,
    "/",
    undefined,
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
import { readFileSync } from "fs";

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
  if (opts.extraEnvVars) {
    for (const [key, val] of Object.entries(opts.extraEnvVars)) {
      envParts.push(`${key}=${quote([val])}`);
    }
  }
  const envVars = envParts.join(" ");
  await sandbox.process.executeCommand(
    `${envVars} nohup node /tmp/run-design.mjs > /tmp/design.log 2>&1 &`,
    "/",
    undefined,
    10,
  );
}

/**
 * Runs a command on an existing sandbox and returns the output.
 * Used for post-completion operations like capturing git diffs or reading files.
 */
export const runSandboxCommand = internalAction({
  args: {
    sandboxId: v.string(),
    command: v.string(),
    timeoutSeconds: v.optional(v.number()),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);
    const resp = await sandbox.process.executeCommand(
      args.command,
      "/",
      undefined,
      args.timeoutSeconds ?? 30,
    );
    return (resp.result ?? "").trim();
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

    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);
    const signedPreview = await sandbox.getSignedPreviewUrl(args.port, 3600);

    let ready = true;
    if (args.checkReady) {
      try {
        const check = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${args.port}`,
          "/",
          undefined,
          3,
        );
        const code = parseInt(check.result?.trim() || "0", 10);
        ready = code >= 200 && code < 500;
      } catch {
        ready = false;
      }
    }

    return { url: signedPreview.url, port: args.port, ready };
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
    githubToken: v.string(),
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

    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const infraEnvVars = resolveInfraEnvVars();

    const teamEnvVars: Record<string, string> = {};
    const repoEnvVars: Record<string, string> = {};
    if (args.repoId) {
      const teamVars = await resolveTeamEnvVars(ctx, args.repoId);
      Object.assign(teamEnvVars, teamVars);

      const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
        repoId: args.repoId,
      });
      for (const v of vars) {
        repoEnvVars[v.key] = decryptValue(v.value);
      }
    }

    const mergedEnvVars = { ...teamEnvVars, ...repoEnvVars };
    delete mergedEnvVars.DAYTONA_API_KEY;

    let repoSnapshotName: string | undefined;
    if (args.repoId) {
      const repoSnapshot = await ctx.runQuery(
        internal.repoSnapshots.getRepoSnapshotName,
        { repoId: args.repoId },
      );
      if (repoSnapshot) {
        repoSnapshotName = repoSnapshot.snapshotName;
      }
    }

    let sandbox: Sandbox;

    if (args.ephemeral) {
      sandbox = await createSandbox(
        daytona,
        args.githubToken,
        mergedEnvVars,
        infraEnvVars,
        repoSnapshotName,
      );
      await syncRepo(sandbox, args.githubToken, args.repoOwner, args.repoName);
    } else {
      const result = await getOrCreateSandbox(
        daytona,
        args.existingSandboxId,
        args.githubToken,
        args.repoOwner,
        args.repoName,
        mergedEnvVars,
        infraEnvVars,
        repoSnapshotName,
      );
      sandbox = result.sandbox;
    }

    if (args.baseBranch) {
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git fetch origin ${args.baseBranch} && git checkout ${args.baseBranch} && git pull origin ${args.baseBranch}`,
        "/",
        undefined,
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
        extraEnvVars: mergedEnvVars,
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
    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

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
    convexToken: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(args.sandboxId);

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
      const session = await ctx.runQuery(internal.sessions.get, {
        sessionId: args.sessionId,
      });
      if (!session) {
        throw new Error("Session not found");
      }

      const daytonaApiKey = await resolveDaytonaApiKey(ctx, session.repoId);
      const daytona = getDaytona(daytonaApiKey);
      const sandbox = await daytona.get(args.sandboxId);

      const result = await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        "/",
        undefined,
        30,
      );
      const diffRaw = result.result;

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
    const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
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

export const startSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    githubToken: v.string(),
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

      const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
      const daytona = getDaytona(daytonaApiKey);
      const infraEnvVars = resolveInfraEnvVars();

      const teamEnvVars: Record<string, string> = {};
      const repoEnvVars: Record<string, string> = {};
      if (args.repoId) {
        const teamVars = await resolveTeamEnvVars(ctx, args.repoId);
        Object.assign(teamEnvVars, teamVars);

        const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
          repoId: args.repoId,
        });
        for (const v of vars) {
          repoEnvVars[v.key] = decryptValue(v.value);
        }
      }

      const mergedEnvVars = { ...teamEnvVars, ...repoEnvVars };
      delete mergedEnvVars.DAYTONA_API_KEY;

      let repoSnapshotName: string | undefined;
      if (args.repoId) {
        const repoSnapshot = await ctx.runQuery(
          internal.repoSnapshots.getRepoSnapshotName,
          { repoId: args.repoId },
        );
        if (repoSnapshot) {
          repoSnapshotName = repoSnapshot.snapshotName;
        }
      }

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await sandbox.process.executeCommand("echo 1", "/", undefined, 5);
          await sandbox.process.executeCommand(
            `cd ${WORKSPACE_DIR} && pnpm dev > /dev/null 2>&1 &`,
            "/",
            undefined,
            10,
          );
          await sandbox.process.executeCommand(
            `code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${WORKSPACE_DIR} > /tmp/code-server.log 2>&1 &`,
            "/",
            undefined,
            10,
          );
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

      const sandbox = await createSandbox(
        daytona,
        args.githubToken,
        mergedEnvVars,
        infraEnvVars,
        repoSnapshotName,
      );
      const repoUrl = `https://x-access-token:${args.githubToken}@github.com/${args.repoOwner}/${args.repoName}.git`;
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git remote set-url origin ${repoUrl}`,
        "/",
        undefined,
        10,
      );
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git fetch origin && git reset --hard origin/${args.branchName} && pnpm install`,
        "/",
        undefined,
        120,
      );
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && pnpm dev > /dev/null 2>&1 &`,
        "/",
        undefined,
        10,
      );
      await sandbox.process.executeCommand(
        `code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${WORKSPACE_DIR} > /tmp/code-server.log 2>&1 &`,
        "/",
        undefined,
        10,
      );

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
    githubToken: v.string(),
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

      const daytonaApiKey = await resolveDaytonaApiKey(ctx, args.repoId);
      const daytona = getDaytona(daytonaApiKey);
      const infraEnvVars = resolveInfraEnvVars();

      const teamEnvVars: Record<string, string> = {};
      const repoEnvVars: Record<string, string> = {};
      if (args.repoId) {
        const teamVars = await resolveTeamEnvVars(ctx, args.repoId);
        Object.assign(teamEnvVars, teamVars);

        const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
          repoId: args.repoId,
        });
        for (const v of vars) {
          repoEnvVars[v.key] = decryptValue(v.value);
        }
      }

      const mergedEnvVars = { ...teamEnvVars, ...repoEnvVars };
      delete mergedEnvVars.DAYTONA_API_KEY;

      let repoSnapshotName: string | undefined;
      if (args.repoId) {
        const repoSnapshot = await ctx.runQuery(
          internal.repoSnapshots.getRepoSnapshotName,
          { repoId: args.repoId },
        );
        if (repoSnapshot) {
          repoSnapshotName = repoSnapshot.snapshotName;
        }
      }

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await sandbox.process.executeCommand("echo 1", "/", undefined, 5);
          await syncRepo(
            sandbox,
            args.githubToken,
            args.repoOwner,
            args.repoName,
          );
          await setupBranch(sandbox, args.branchName);
          await sandbox.process.executeCommand(
            `cd ${WORKSPACE_DIR} && pnpm dev > /dev/null 2>&1 &`,
            "/",
            undefined,
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

      const sandbox = await createSandbox(
        daytona,
        args.githubToken,
        mergedEnvVars,
        infraEnvVars,
        repoSnapshotName,
      );
      await syncRepo(sandbox, args.githubToken, args.repoOwner, args.repoName);
      await setupBranch(sandbox, args.branchName);
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && pnpm install`,
        "/",
        undefined,
        120,
      );
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && pnpm dev > /dev/null 2>&1 &`,
        "/",
        undefined,
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
