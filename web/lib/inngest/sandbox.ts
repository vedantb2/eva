import { Daytona, Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
// @ts-ignore
import { quote } from "shell-quote";
import { LlmJson } from "@solvers-hub/llm-json";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

export const SNAPSHOT_NAME = "eva-snapshot";

const daytona = new Daytona();
const llmJson = new LlmJson({ attemptCorrection: true });

export const WORKSPACE_DIR = "/workspace/repo";

export async function createSandbox(
  githubToken: string,
  ephemeral?: boolean,
  extraEnvVars?: Record<string, string>,
): Promise<Sandbox> {
  const sandbox = await daytona.create({
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
  });
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

interface ClaudeCLIOptions {
  model?: ClaudeModel;
  allowedTools?: ClaudeTool[];
  workDir?: string;
  timeout?: number;
  outputFormat?: "json" | "text";
}

interface ClaudeCLIResult {
  result: string;
  isError: boolean;
  activityLog: string;
}

export async function runClaudeCLI(
  sandbox: Sandbox,
  prompt: string,
  options: ClaudeCLIOptions = {},
): Promise<ClaudeCLIResult> {
  const {
    model = "sonnet",
    allowedTools = ["Read", "Glob", "Grep"],
    workDir = WORKSPACE_DIR,
    timeout = 300,
    outputFormat,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  const cmdResult = await sandbox.process.executeCommand(
    `cd ${workDir} && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model ${model} ${toolsArg} ${outputFormat === "json" ? "--output-format json" : ""}`,
    "/",
    undefined,
    timeout,
  );

  const output = (cmdResult.result || "").trim();

  try {
    const json = JSON.parse(output);
    const messages = Array.isArray(json) ? json : [json];
    const resultMsg = messages.find(
      (m: Record<string, unknown>) => m.type === "result",
    );

    if (resultMsg) {
      const result = resultMsg.result ?? "";
      return {
        result: typeof result === "string" ? result : JSON.stringify(result),
        isError: Boolean(resultMsg.is_error),
        activityLog: "",
      };
    }
  } catch {
    // Fall through
  }
  return { result: output, isError: false, activityLog: "" };
}

interface StreamingClaudeCLIOptions extends ClaudeCLIOptions {
  onOutput: (displayLog: string) => Promise<void>;
  flushIntervalMs?: number;
}

function formatToolCall(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Read": return `Reading ${input.file_path ?? "file"}`;
    case "Glob": return `Searching files: ${input.pattern ?? ""}`;
    case "Grep": return `Searching for: ${input.pattern ?? ""}`;
    case "Write": return `Writing ${input.file_path ?? "file"}`;
    case "Edit": return `Editing ${input.file_path ?? "file"}`;
    case "Bash": return `Running: ${String(input.command ?? "").slice(0, 100)}`;
    case "WebFetch": return `Fetching ${input.url ?? "URL"}`;
    case "WebSearch": return `Searching web: ${input.query ?? ""}`;
    case "Task": return `Running subtask: ${String(input.description ?? input.prompt ?? "").slice(0, 80)}`;
    case "NotebookEdit": return `Editing notebook: ${input.notebook_path ?? "file"}`;
    default: return `Using ${name}`;
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
        if (block.type === "thinking" && block.thinking) parts.push(block.thinking);
        if (block.type === "tool_use") parts.push(formatToolCall(block.name, block.input ?? {}));
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
  let displayLog = "";
  let lastProcessed = 0;
  const decoder = new TextDecoder();

  // PTY streams raw bytes via onData — just accumulate, don't process here
  // (fires too often for mutations, and chunks don't align to JSON lines)
  const ptyHandle = await sandbox.process.createPty({
    id: `claude-${Date.now()}`,
    cwd: workDir,
    onData: (data: Uint8Array) => {
      rawOutput += decoder.decode(data, { stream: true });
    },
  });

  await ptyHandle.waitForConnection();

  // Every 500ms: process only complete lines, parse stream-json, flush to caller
  const interval = setInterval(async () => {
    if (rawOutput.length <= lastProcessed) return;
    const pending = rawOutput.slice(lastProcessed);
    // Only process up to last newline — skip incomplete lines at the end
    const lastNewline = pending.lastIndexOf("\n");
    if (lastNewline === -1) return;
    lastProcessed += lastNewline + 1;
    let changed = false;
    for (const line of pending.slice(0, lastNewline).split("\n")) {
      const clean = stripAnsi(line).trim();
      if (!clean) continue;
      const formatted = formatStreamEvent(clean);
      if (formatted) {
        displayLog += (displayLog ? "\n" : "") + formatted;
        changed = true;
      }
    }
    if (changed) await onOutput(displayLog).catch(() => {});
  }, flushIntervalMs);

  try {
    // "; exit" closes the shell when Claude finishes, causing wait() to resolve
    await ptyHandle.sendInput(
      `echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format stream-json; exit\n`,
    );

    // Kill the PTY if it exceeds the timeout
    const timeoutId = setTimeout(() => {
      ptyHandle.kill().catch(() => {});
    }, timeout * 1000);

    await ptyHandle.wait();
    clearTimeout(timeoutId);
  } finally {
    clearInterval(interval);
    await ptyHandle.disconnect().catch(() => {});
  }

  // Re-parse all output for final activity log and result extraction
  displayLog = "";
  const lines = rawOutput.split("\n");
  for (const line of lines) {
    const clean = stripAnsi(line).trim();
    if (!clean) continue;
    const formatted = formatStreamEvent(clean);
    if (formatted) {
      displayLog += (displayLog ? "\n" : "") + formatted;
    }
  }

  // Find the result message (last stream-json line with type "result")
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(stripAnsi(lines[i]).trim());
      if (parsed.type === "result") {
        const result = parsed.result ?? "";
        return {
          result: typeof result === "string" ? result : JSON.stringify(result),
          isError: Boolean(parsed.is_error),
          activityLog: displayLog,
        };
      }
    } catch {
      continue;
    }
  }
  return { result: rawOutput, isError: false, activityLog: displayLog };
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
