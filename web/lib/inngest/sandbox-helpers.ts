import { Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
// @ts-ignore
import { quote } from "shell-quote";
import { LlmJson } from "@solvers-hub/llm-json";
import { serverEnv } from "@/env/server";
import { createSandbox, getSandbox, isSandboxAlive } from "./sandbox";

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

export async function configureGit(sandbox: Sandbox): Promise<void> {
  await sandbox.process.executeCommand(
    'git config --global user.name "Eva Agent" && git config --global user.email "agent@Eva.dev"',
    "/",
    undefined,
    10
  );
}

export async function installClaudeCode(sandbox: Sandbox): Promise<void> {
  await sandbox.process.executeCommand(
    "npm install -g @anthropic-ai/claude-code",
    "/",
    undefined,
    120
  );
}

export async function cloneRepo(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
  workDir = "~/workspace"
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  const result = await sandbox.process.executeCommand(
    `git clone ${repoUrl} ${workDir}`,
    "/",
    undefined,
    120
  );
  if (result.exitCode !== 0) {
    const sanitized = (result.result || "").replace(new RegExp(githubToken, "g"), "[REDACTED]");
    throw new Error(`Git clone failed: ${sanitized}`);
  }
}

export async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
  workDir = "~/workspace"
): Promise<{ created: boolean }> {
  const checkResult = await sandbox.process.executeCommand(
    `cd ${workDir} && git ls-remote --heads origin ${branchName}`,
    "/",
    undefined,
    30
  );

  if (checkResult.result?.includes(branchName)) {
    await sandbox.process.executeCommand(
      `cd ${workDir} && git fetch origin ${branchName} && git checkout ${branchName}`,
      "/",
      undefined,
      30
    );
    return { created: false };
  }

  await sandbox.process.executeCommand(
    `cd ${workDir} && git checkout -b ${branchName}`,
    "/",
    undefined,
    30
  );
  return { created: true };
}

export async function updateRemoteUrl(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
  workDir = "~/workspace"
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  await sandbox.process.executeCommand(
    `cd ${workDir} && git remote set-url origin ${repoUrl}`,
    "/",
    undefined,
    10
  );
}

type ClaudeModel = "opus" | "sonnet" | "haiku";
type ClaudeTool = "Read" | "Write" | "Edit" | "Bash" | "Glob" | "Grep";

interface ClaudeCLIOptions {
  model?: ClaudeModel;
  allowedTools?: ClaudeTool[];
  workDir?: string;
  timeout?: number;
  preCommand?: string;
}

interface ClaudeCLIResult {
  result: string;
  isError: boolean;
}

export async function runClaudeCLI(
  sandbox: Sandbox,
  prompt: string,
  options: ClaudeCLIOptions = {}
): Promise<ClaudeCLIResult> {
  const {
    model = "sonnet",
    allowedTools = ["Read", "Glob", "Grep"],
    workDir = "~/workspace",
    timeout = 300,
    preCommand,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg = allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";
  const preCmd = preCommand ? `${preCommand} && ` : "";

  const cmdResult = await sandbox.process.executeCommand(
    `cd ${workDir} && ${preCmd}echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format json`,
    "/",
    undefined,
    timeout
  );

  const output = cmdResult.result || "";
  return parseClaudeOutput(output);
}

export function parseClaudeOutput(output: string): ClaudeCLIResult {
  try {
    const json = JSON.parse(output.trim());
    const messages = Array.isArray(json) ? json : [json];
    const resultMsg = messages.find((m: Record<string, unknown>) => m.type === "result");

    if (resultMsg) {
      const result = resultMsg.result ?? "";
      return { result: typeof result === "string" ? result : JSON.stringify(result), isError: Boolean(resultMsg.is_error) };
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

export async function ensureProjectSandbox(
  projectSandboxId: string | undefined,
  githubToken: string,
  repoOwner: string,
  repoName: string,
  workDir: string,
  onSandboxCreated: (sandboxId: string) => Promise<void>
): Promise<Sandbox> {
  if (projectSandboxId) {
    const alive = await isSandboxAlive(projectSandboxId);
    if (alive) {
      return getSandbox(projectSandboxId);
    }
  }

  const sandbox = await createSandbox(githubToken);
  await installClaudeCode(sandbox);
  await cloneRepo(sandbox, githubToken, repoOwner, repoName, workDir);
  await onSandboxCreated(sandbox.id);
  return sandbox;
}
