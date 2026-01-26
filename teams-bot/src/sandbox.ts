import { Daytona, Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { quote } from "shell-quote";

const daytona = new Daytona();

export async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!,
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

export async function createBotSandbox(githubToken: string): Promise<Sandbox> {
  return daytona.create({
    envVars: {
      GITHUB_TOKEN: githubToken,
      CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN!,
    },
    autoStopInterval: 60,
  });
}

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return daytona.get(sandboxId);
}

export async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await daytona.get(sandboxId);
    await sandbox.process.executeCommand("echo 'alive'", "/", undefined, 5);
    return true;
  } catch {
    return false;
  }
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
  name: string
): Promise<void> {
  const repoUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${name}.git`;
  const result = await sandbox.process.executeCommand(
    `git clone ${repoUrl} ~/workspace`,
    "/",
    undefined,
    120
  );
  if (result.exitCode !== 0) {
    const sanitized = (result.result || "").replace(
      new RegExp(githubToken, "g"),
      "[REDACTED]"
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
  options: ClaudeCLIOptions = {}
): Promise<ClaudeCLIResult> {
  const {
    model = "opus",
    allowedTools = ["Read", "Glob", "Grep"],
    timeout = 300,
  } = options;

  const escapedPrompt = quote([prompt]);
  const toolsArg =
    allowedTools.length > 0
      ? `--allowedTools "${allowedTools.join(",")}"`
      : "";

  const cmdResult = await sandbox.process.executeCommand(
    `cd ~/workspace && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format json`,
    "/",
    undefined,
    timeout
  );

  return parseClaudeOutput(cmdResult.result || "");
}

function parseClaudeOutput(output: string): ClaudeCLIResult {
  try {
    const json = JSON.parse(output.trim());
    const messages: Array<Record<string, unknown>> = Array.isArray(json)
      ? json
      : [json];
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
  name: string
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
