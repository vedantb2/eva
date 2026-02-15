"use node";

import { Daytona, type Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { quote } from "shell-quote";

type ClaudeModel = "opus" | "sonnet" | "haiku";
type ClaudeTool =
  | "Read"
  | "Write"
  | "Edit"
  | "Bash"
  | "Glob"
  | "Grep"
  | "Skill";

export interface ActivityStep {
  type:
    | "read"
    | "edit"
    | "write"
    | "bash"
    | "search_files"
    | "search_code"
    | "web_fetch"
    | "web_search"
    | "subtask"
    | "notebook"
    | "tool";
  label: string;
  detail?: string;
  status: "complete" | "active";
}

interface CreateSandboxOptions {
  ephemeral?: boolean;
  extraEnvVars?: Record<string, string>;
  networkAllowList?: string;
}

interface BuildClaudeCommandOptions {
  prompt: string;
  model?: ClaudeModel;
  allowedTools?: ClaudeTool[];
  workDir?: string;
  callbackUrl: string;
  callbackToken: string;
}

export const SNAPSHOT_NAME = "eva-snapshot";
export const WORKSPACE_DIR = "/workspace/repo";

let _daytona: Daytona | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function getDaytonaClient(): Daytona {
  if (_daytona) return _daytona;
  _daytona = new Daytona({ apiKey: requireEnv("DAYTONA_API_KEY") });
  return _daytona;
}

export async function createSandbox(
  githubToken: string,
  options?: CreateSandboxOptions,
): Promise<Sandbox> {
  const daytona = getDaytonaClient();
  const sandbox = await daytona.create(
    {
      snapshot: SNAPSHOT_NAME,
      envVars: {
        GITHUB_TOKEN: githubToken,
        CLAUDE_CODE_OAUTH_TOKEN: requireEnv("CLAUDE_CODE_OAUTH_TOKEN"),
        NEXT_PUBLIC_CONVEX_URL: requireEnv("NEXT_PUBLIC_CONVEX_URL"),
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requireEnv(
          "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        ),
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? "development",
        CONVEX_DEPLOYMENT: requireEnv("CONVEX_DEPLOYMENT"),
        ...(options?.extraEnvVars ?? {}),
      },
      autoStopInterval: 15,
      autoDeleteInterval: 30,
      ephemeral: options?.ephemeral ?? false,
      ...(options?.networkAllowList
        ? { networkAllowList: options.networkAllowList }
        : {}),
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

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return getDaytonaClient().get(sandboxId);
}

export async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: requireEnv("GITHUB_APP_ID"),
    privateKey: requireEnv("GITHUB_PRIVATE_KEY"),
    clientId: requireEnv("GITHUB_CLIENT_ID"),
    clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

export async function updateRemoteUrl(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
  workDir = WORKSPACE_DIR,
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  await sandbox.process.executeCommand(
    `cd ${workDir} && git remote set-url origin ${repoUrl}`,
    "/",
    undefined,
    10,
  );
}

export async function syncRepo(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
  workDir = WORKSPACE_DIR,
): Promise<void> {
  await updateRemoteUrl(sandbox, githubToken, owner, name, workDir);
  await sandbox.process.executeCommand(
    `cd ${workDir} && git pull`,
    "/",
    undefined,
    60,
  );
}

export async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
  workDir = WORKSPACE_DIR,
): Promise<{ created: boolean }> {
  const checkResult = await sandbox.process.executeCommand(
    `cd ${workDir} && git ls-remote --heads origin ${branchName}`,
    "/",
    undefined,
    30,
  );
  if (checkResult.result?.includes(branchName)) {
    await sandbox.process.executeCommand(
      `cd ${workDir} && git fetch origin ${branchName} && git checkout ${branchName}`,
      "/",
      undefined,
      30,
    );
    return { created: false };
  }
  await sandbox.process.executeCommand(
    `cd ${workDir} && git checkout -b ${branchName}`,
    "/",
    undefined,
    30,
  );
  return { created: true };
}

export async function getOrCreateSandbox(
  existingSandboxId: string | undefined,
  githubToken: string,
  repoOwner: string,
  repoName: string,
  onSandboxCreated: (sandboxId: string) => Promise<void>,
  ephemeral?: boolean,
): Promise<Sandbox> {
  if (existingSandboxId) {
    try {
      const sandbox = await getSandbox(existingSandboxId);
      await sandbox.process.executeCommand("echo 1", "/", undefined, 5);
      return sandbox;
    } catch {
      // fall through to create
    }
  }

  const sandbox = await createSandbox(githubToken, { ephemeral });
  await syncRepo(sandbox, githubToken, repoOwner, repoName);
  await onSandboxCreated(sandbox.id);
  return sandbox;
}

function shortenPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  if (parts.length <= 3) return parts.join("/");
  return `.../${parts.slice(-2).join("/")}`;
}

function toolCallToStep(
  name: string,
  input: Record<string, unknown>,
): ActivityStep {
  const path = input.file_path ? shortenPath(String(input.file_path)) : "";
  switch (name) {
    case "Read":
      return {
        type: "read",
        label: "Read file",
        detail: path || undefined,
        status: "active",
      };
    case "Glob":
      return {
        type: "search_files",
        label: "Searched files",
        detail: input.pattern ? String(input.pattern) : undefined,
        status: "active",
      };
    case "Grep":
      return {
        type: "search_code",
        label: "Searched code",
        detail: input.pattern ? String(input.pattern) : undefined,
        status: "active",
      };
    case "Write":
      return {
        type: "write",
        label: "Created file",
        detail: path || undefined,
        status: "active",
      };
    case "Edit":
      return {
        type: "edit",
        label: "Edited file",
        detail: path || undefined,
        status: "active",
      };
    case "Bash":
      return {
        type: "bash",
        label: "Ran command",
        detail: input.command ? String(input.command).slice(0, 80) : undefined,
        status: "active",
      };
    case "WebFetch":
      return {
        type: "web_fetch",
        label: "Fetched URL",
        detail: input.url ? String(input.url) : undefined,
        status: "active",
      };
    case "WebSearch":
      return {
        type: "web_search",
        label: "Web search",
        detail: input.query ? String(input.query) : undefined,
        status: "active",
      };
    case "Task":
      return {
        type: "subtask",
        label: "Ran agent",
        detail: input.description
          ? String(input.description).slice(0, 80)
          : input.prompt
            ? String(input.prompt).slice(0, 80)
            : undefined,
        status: "active",
      };
    case "NotebookEdit":
      return {
        type: "notebook",
        label: "Edited notebook",
        detail: input.notebook_path
          ? shortenPath(String(input.notebook_path))
          : undefined,
        status: "active",
      };
    default:
      return { type: "tool", label: `Used ${name}`, status: "active" };
  }
}

export function parseStreamSteps(output: string): ActivityStep[] {
  const steps: ActivityStep[] = [];
  for (const line of output.split("\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const event = JSON.parse(clean) as {
        type?: string;
        message?: {
          content?: Array<{
            type?: string;
            name?: string;
            input?: Record<string, unknown>;
          }>;
        };
      };
      if (event.type !== "assistant") continue;
      for (const block of event.message?.content ?? []) {
        if (block.type !== "tool_use" || !block.name) continue;
        if (steps.length > 0) {
          steps[steps.length - 1].status = "complete";
        }
        steps.push(toolCallToStep(block.name, block.input ?? {}));
      }
    } catch {
      // ignore malformed stream lines
    }
  }
  return steps;
}

export function mergeActivityLog(
  existingJson: string,
  newOutputChunk: string,
  limit = 30,
): string {
  let existingSteps: ActivityStep[] = [];
  if (existingJson) {
    try {
      const parsed = JSON.parse(existingJson) as ActivityStep[];
      if (Array.isArray(parsed)) existingSteps = parsed;
    } catch {
      existingSteps = [];
    }
  }
  const newSteps = parseStreamSteps(newOutputChunk);
  for (const step of newSteps) {
    if (existingSteps.length > 0) {
      existingSteps[existingSteps.length - 1].status = "complete";
    }
    existingSteps.push(step);
  }
  if (existingSteps.length > limit) {
    existingSteps = existingSteps.slice(existingSteps.length - limit);
  }
  return JSON.stringify(existingSteps);
}

export function finalizeActivityLog(activityLogJson: string): string {
  if (!activityLogJson) return "[]";
  try {
    const steps = JSON.parse(activityLogJson) as ActivityStep[];
    if (!Array.isArray(steps)) return "[]";
    for (const step of steps) step.status = "complete";
    return JSON.stringify(steps);
  } catch {
    return "[]";
  }
}

export function parseClaudeResultFromStream(output: string): {
  result: string;
  isError: boolean;
} {
  let parsedResult: { result: string; isError: boolean } | null = null;
  for (const line of output.split("\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = JSON.parse(clean) as {
        type?: string;
        result?: unknown;
        is_error?: boolean;
      };
      if (parsed.type === "result") {
        const rawResult =
          typeof parsed.result === "string"
            ? parsed.result
            : JSON.stringify(parsed.result ?? "");
        parsedResult = { result: rawResult, isError: Boolean(parsed.is_error) };
      }
    } catch {
      // ignore
    }
  }
  return parsedResult ?? { result: output, isError: false };
}

export function buildClaudeCommand(options: BuildClaudeCommandOptions): string {
  const {
    prompt,
    model = "sonnet",
    allowedTools = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    workDir = WORKSPACE_DIR,
    callbackUrl,
    callbackToken,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  const callbackPayload = quote([
    JSON.stringify({
      token: callbackToken,
    }),
  ]);
  const callbackUrlArg = quote([callbackUrl]);

  return [
    `cd ${workDir} && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format stream-json`,
    "_exit=$?",
    `curl -sS -X POST -H 'content-type: application/json' --data ${callbackPayload} ${callbackUrlArg} > /dev/null 2>&1 || true`,
    "exit $_exit",
  ].join(" ; ");
}
