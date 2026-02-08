import { Daytona, Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
// @ts-ignore
import { quote } from "shell-quote";
import { LlmJson } from "@solvers-hub/llm-json";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

export const SNAPSHOT_NAME = "eva-snapshot";

const daytona = new Daytona({ apiKey: serverEnv.DAYTONA_API_KEY });
const llmJson = new LlmJson({ attemptCorrection: true });

export const WORKSPACE_DIR = "/workspace/repo";

export async function createSandbox(
  githubToken: string,
  ephemeral?: boolean,
  extraEnvVars?: Record<string, string>,
  networkAllowList?: string,
): Promise<Sandbox> {
  const sandbox = await daytona.create(
    {
      snapshot: SNAPSHOT_NAME,
      envVars: {
        GITHUB_TOKEN: githubToken,
        CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
        NEXT_PUBLIC_CONVEX_URL: clientEnv.NEXT_PUBLIC_CONVEX_URL,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
          clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        NEXT_PUBLIC_ENV: clientEnv.NEXT_PUBLIC_ENV,
        CLERK_SECRET_KEY: serverEnv.CLERK_SECRET_KEY,
        CONVEX_DEPLOYMENT: serverEnv.CONVEX_DEPLOYMENT,
        ...extraEnvVars,
      },
      autoStopInterval: 15,
      autoDeleteInterval: 30,
      ephemeral: ephemeral ? true : false,
      ...(networkAllowList ? { networkAllowList } : {}),
    },
    {
      timeout: 120,
    },
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
  return daytona.get(sandboxId);
}

const DAYTONA_API_URL = "https://app.daytona.io/api";

async function getToolboxBaseUrl(sandboxId: string): Promise<string> {
  const response = await fetch(
    `${DAYTONA_API_URL}/sandbox/${sandboxId}/toolbox-proxy-url`,
    {
      headers: {
        Authorization: `Bearer ${serverEnv.DAYTONA_API_KEY}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to get toolbox URL: ${response.status}`);
  }
  const data: { url: string } = await response.json();
  return data.url;
}

export async function getPtyWebSocketUrl(
  sandbox: Sandbox,
  ptySessionId: string,
): Promise<string> {
  const [toolboxUrl, previewLink] = await Promise.all([
    getToolboxBaseUrl(sandbox.id),
    sandbox.getPreviewLink(1),
  ]);
  let baseUrl = toolboxUrl;
  if (!baseUrl.endsWith("/")) baseUrl += "/";
  baseUrl += sandbox.id;
  return `${baseUrl.replace(/^http/, "ws")}/process/pty/${ptySessionId}/connect?DAYTONA_SANDBOX_AUTH_KEY=${previewLink.token}`;
}

export async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
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

type ClaudeModel = "opus" | "sonnet" | "haiku";
type ClaudeTool = "Read" | "Write" | "Edit" | "Bash" | "Glob" | "Grep";

interface ClaudeCLIResult {
  result: string;
  isError: boolean;
  activityLog: string;
}

interface StreamingClaudeCLIOptions {
  model?: ClaudeModel;
  allowedTools?: ClaudeTool[];
  workDir?: string;
  timeout?: number;
  outputFormat?: "json" | "text";
  onOutput: (displayLog: string) => Promise<void>;
  flushIntervalMs?: number;
}

function formatToolCall(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Read":
      return `Reading ${input.file_path ?? "file"}`;
    case "Glob":
      return `Searching files: ${input.pattern ?? ""}`;
    case "Grep":
      return `Searching for: ${input.pattern ?? ""}`;
    case "Write":
      return `Writing ${input.file_path ?? "file"}`;
    case "Edit":
      return `Editing ${input.file_path ?? "file"}`;
    case "Bash":
      return `Running: ${String(input.command ?? "").slice(0, 100)}`;
    case "WebFetch":
      return `Fetching ${input.url ?? "URL"}`;
    case "WebSearch":
      return `Searching web: ${input.query ?? ""}`;
    case "Task":
      return `Running subtask: ${String(input.description ?? input.prompt ?? "").slice(0, 80)}`;
    case "NotebookEdit":
      return `Editing notebook: ${input.notebook_path ?? "file"}`;
    default:
      return `Using ${name}`;
  }
}

function formatToolResult(content: unknown): string | null {
  if (typeof content === "string") {
    return content.length > 200 ? content.slice(0, 200) + "..." : content;
  }
  if (Array.isArray(content)) {
    const text = content
      .filter((b: Record<string, unknown>) => b.type === "text" && b.text)
      .map((b: Record<string, unknown>) => String(b.text))
      .join("\n");
    if (!text) return null;
    return text.length > 200 ? text.slice(0, 200) + "..." : text;
  }
  return null;
}

function formatStreamEvent(line: string): string | null {
  try {
    const event = JSON.parse(line);

    if (event.type === "assistant") {
      const parts: string[] = [];
      for (const block of event.message?.content ?? []) {
        if (block.type === "text" && block.text) parts.push(block.text);
        if (block.type === "thinking" && block.thinking)
          parts.push(block.thinking);
        if (block.type === "tool_use")
          parts.push(formatToolCall(block.name, block.input ?? {}));
      }
      return parts.length > 0 ? parts.join("\n") : null;
    }

    if (event.type === "user") {
      const parts: string[] = [];
      for (const block of event.message?.content ?? []) {
        if (block.type === "tool_result") {
          const result = formatToolResult(block.content);
          if (result) parts.push(result);
        }
      }
      return parts.length > 0 ? parts.join("\n") : null;
    }

    return null;
  } catch {
    return null;
  }
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, "");
}

export async function runClaudeCLIStreaming(
  sandbox: Sandbox,
  prompt: string,
  options: StreamingClaudeCLIOptions,
): Promise<ClaudeCLIResult> {
  const {
    model = "sonnet",
    allowedTools = ["Read", "Glob", "Grep"],
    workDir = WORKSPACE_DIR,
    timeout = 300,
    onOutput,
    flushIntervalMs = 500,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  let rawOutput = "";
  let lastProcessed = 0;
  const decoder = new TextDecoder();

  const ptyHandle = await sandbox.process.createPty({
    id: `claude-${Date.now()}`,
    cwd: workDir,
    onData: (data: Uint8Array) => {
      rawOutput += decoder.decode(data, { stream: true });
    },
  });

  await ptyHandle.waitForConnection();

  const interval = setInterval(async () => {
    if (rawOutput.length <= lastProcessed) return;
    const pending = rawOutput.slice(lastProcessed);
    const lastNewline = pending.lastIndexOf("\n");
    if (lastNewline === -1) return;
    lastProcessed += lastNewline + 1;
    let latestActivity: string | null = null;
    for (const line of pending.slice(0, lastNewline).split("\n")) {
      const clean = stripAnsi(line).trim();
      if (!clean) continue;
      const formatted = formatStreamEvent(clean);
      if (formatted) latestActivity = formatted;
    }
    if (latestActivity) await onOutput(latestActivity).catch(() => {});
  }, flushIntervalMs);

  try {
    await ptyHandle.sendInput(
      `echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format stream-json; exit\n`,
    );

    const timeoutId = setTimeout(() => {
      ptyHandle.kill().catch(() => {});
    }, timeout * 1000);

    await ptyHandle.wait();
    clearTimeout(timeoutId);
  } finally {
    clearInterval(interval);
    await ptyHandle.disconnect().catch(() => {});
  }

  let activityLog = "";
  let resultEvent: { result: string; isError: boolean } | null = null;
  for (const line of rawOutput.split("\n")) {
    const clean = stripAnsi(line).trim();
    if (!clean) continue;
    const formatted = formatStreamEvent(clean);
    if (formatted) {
      activityLog += (activityLog ? "\n" : "") + formatted;
    }
    try {
      const parsed = JSON.parse(clean);
      if (parsed.type === "result") {
        const r = parsed.result ?? "";
        resultEvent = {
          result: typeof r === "string" ? r : JSON.stringify(r),
          isError: Boolean(parsed.is_error),
        };
      }
    } catch {}
  }

  if (resultEvent) {
    return { ...resultEvent, activityLog };
  }
  return { result: rawOutput, isError: false, activityLog };
}

export function extractJsonFromText(text: string): string | null {
  const { json } = llmJson.extract(text);
  if (json.length === 0) return null;
  return JSON.stringify(json[0]);
}

interface FileDiff {
  file: string;
  status: string;
  diff: string;
}

export async function captureGitDiff(
  sandbox: Sandbox,
  beforeHead: string,
  workDir = WORKSPACE_DIR,
): Promise<FileDiff[]> {
  const result = await sandbox.process.executeCommand(
    `cd ${workDir} && git diff ${beforeHead}..HEAD`,
    "/",
    undefined,
    30,
  );
  const raw = result.result || "";
  if (!raw.trim()) return [];

  const chunks = raw.split(/(?=^diff --git )/m).filter(Boolean);
  const MAX_TOTAL = 50_000;
  let totalSize = 0;
  const diffs: FileDiff[] = [];

  for (const chunk of chunks) {
    const fileMatch = chunk.match(/^diff --git a\/.+ b\/(.+)$/m);
    if (!fileMatch) continue;

    const file = fileMatch[1];
    let status = "modified";
    if (chunk.includes("--- /dev/null")) status = "added";
    else if (chunk.includes("+++ /dev/null")) status = "deleted";

    if (totalSize + chunk.length > MAX_TOTAL) break;
    totalSize += chunk.length;
    diffs.push({ file, status, diff: chunk });
  }

  return diffs;
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
      const sandbox = await daytona.get(existingSandboxId);
      await sandbox.process.executeCommand("echo 1", "/", undefined, 5);
      return sandbox;
    } catch {
      // Sandbox was deleted/expired, fall through to create a new one
    }
  }
  const sandbox = await createSandbox(githubToken, ephemeral);
  await syncRepo(sandbox, githubToken, repoOwner, repoName);
  await onSandboxCreated(sandbox.id);
  return sandbox;
}

export async function detectPackageManager(
  sandbox: Sandbox,
  workDir = WORKSPACE_DIR,
): Promise<"pnpm" | "yarn" | "npm"> {
  const check = await sandbox.process.executeCommand(
    `ls ${workDir}/pnpm-lock.yaml ${workDir}/yarn.lock 2>/dev/null`,
    "/",
    undefined,
    5,
  );
  const output = check.result || "";
  if (output.includes("pnpm-lock.yaml")) return "pnpm";
  if (output.includes("yarn.lock")) return "yarn";
  return "npm";
}

// TODO: move agent-browser install to eva-snapshot, then remove this function
export async function installScreenshotBrowser(
  sandbox: Sandbox,
): Promise<void> {
  const result = await sandbox.process.executeCommand(
    "npm install -g agent-browser 2>&1 && agent-browser install 2>&1",
    "/",
    undefined,
    120,
  );
  if (result.exitCode !== 0) {
    throw new Error(
      `agent-browser install failed: ${(result.result || "").slice(-400)}`,
    );
  }
}
// TODO: end snapshot section

export async function takeWebScreenshot(
  sandbox: Sandbox,
  url: string,
  outputPath: string,
): Promise<void> {
  const result = await sandbox.process.executeCommand(
    `agent-browser open "${url}" && agent-browser screenshot "${outputPath}" && agent-browser close`,
    "/",
    undefined,
    60,
  );
  if (result.exitCode !== 0) {
    throw new Error(`Screenshot failed: ${(result.result || "").slice(-400)}`);
  }
}
