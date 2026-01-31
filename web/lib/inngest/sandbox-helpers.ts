import { Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
// @ts-ignore
import { quote } from "shell-quote";
import { LlmJson } from "@solvers-hub/llm-json";
import { serverEnv } from "@/env/server";
import {
  createSandbox,
  getSandbox,
  isSandboxAlive,
  WORKSPACE_DIR,
} from "./sandbox";

const llmJson = new LlmJson({ attemptCorrection: true });

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
}

interface ClaudeCLIResult {
  result: string;
  isError: boolean;
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
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  const cmdResult = await sandbox.process.executeCommand(
    `cd ${workDir} && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format json`,
    "/",
    undefined,
    timeout,
  );

  const output = cmdResult.result || "";
  return parseClaudeOutput(output);
}

export function parseClaudeOutput(output: string): ClaudeCLIResult {
  try {
    const json = JSON.parse(output.trim());
    const messages = Array.isArray(json) ? json : [json];
    const resultMsg = messages.find(
      (m: Record<string, unknown>) => m.type === "result",
    );

    if (resultMsg) {
      const result = resultMsg.result ?? "";
      return {
        result: typeof result === "string" ? result : JSON.stringify(result),
        isError: Boolean(resultMsg.is_error),
      };
    }
  } catch {
    // Fall through
  }
  return { result: output.trim(), isError: false };
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

export async function ensureSandbox(
  projectSandboxId: string | undefined,
  githubToken: string,
  repoOwner: string,
  repoName: string,
  onSandboxCreated: (sandboxId: string) => Promise<void>,
  ephemeral?: boolean,
): Promise<Sandbox> {
  if (projectSandboxId) {
    const alive = await isSandboxAlive(projectSandboxId);
    if (alive) {
      return getSandbox(projectSandboxId);
    }
  }

  const sandbox = await createSandbox(githubToken, ephemeral);
  await syncRepo(sandbox, githubToken, repoOwner, repoName);
  await onSandboxCreated(sandbox.id);
  return sandbox;
}
