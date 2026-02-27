import { Sandbox } from "@e2b/desktop";
import { createAppAuth } from "@octokit/auth-app";
import { quote } from "shell-quote";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
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

export async function createBotSandbox(githubToken: string): Promise<Sandbox> {
  return Sandbox.create("desktop", {
    envs: {
      GITHUB_TOKEN: githubToken,
      CLAUDE_CODE_OAUTH_TOKEN: requireEnv("CLAUDE_CODE_OAUTH_TOKEN"),
    },
    timeout: 3600,
  });
}

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return Sandbox.connect(sandboxId);
}

export async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.commands.run("echo 'alive'", { timeoutMs: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function installClaudeCode(sandbox: Sandbox): Promise<void> {
  await sandbox.commands.run("npm install -g @anthropic-ai/claude-code", {
    timeoutMs: 120_000,
  });
}

export async function cloneRepo(
  sandbox: Sandbox,
  githubToken: string,
  owner: string,
  name: string,
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  const result = await sandbox.commands.run(
    `git clone ${repoUrl} ~/workspace`,
    { timeoutMs: 120_000 },
  );
  if (result.exitCode !== 0) {
    const sanitized = (result.stderr || result.stdout || "").replace(
      new RegExp(githubToken, "g"),
      "[REDACTED]",
    );
    throw new Error(`Git clone failed: ${sanitized}`);
  }
}

type ClaudeTool = "Read" | "Glob" | "Grep";

interface ClaudeCLIOptions {
  model?: "opus" | "sonnet" | "haiku";
  allowedTools?: ClaudeTool[];
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
    model = "opus",
    allowedTools = ["Read", "Glob", "Grep"],
    timeout = 300,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  const cmdResult = await sandbox.commands.run(
    `cd ~/workspace && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format json`,
    { timeoutMs: timeout * 1000 },
  );

  return parseClaudeOutput(cmdResult.stdout || "");
}

function parseClaudeOutput(output: string): ClaudeCLIResult {
  try {
    const json = JSON.parse(output.trim());
    const messages: Array<Record<string, string | number | boolean>> =
      Array.isArray(json) ? json : [json];
    const resultMsg = messages.find((m) => m.type === "result");

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

export async function ensureSandbox(
  existingSandboxId: string | undefined,
  githubToken: string,
  owner: string,
  name: string,
): Promise<Sandbox> {
  if (existingSandboxId) {
    const alive = await isSandboxAlive(existingSandboxId);
    if (alive) {
      return getSandbox(existingSandboxId);
    }
  }

  const sandbox = await createBotSandbox(githubToken);
  await installClaudeCode(sandbox);
  await cloneRepo(sandbox, githubToken, owner, name);
  return sandbox;
}
