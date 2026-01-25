import { Sandbox } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { serverEnv } from "@/env/server";

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
}

interface ClaudeCLIResult {
  raw: string;
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
    timeout = 0,
  } = options;

  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const toolsArg = allowedTools.length > 0 ? `--allowedTools "${allowedTools.join(",")}"` : "";

  const cmdResult = await sandbox.process.executeCommand(
    `cd ${workDir} && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model ${model} ${toolsArg} --output-format json`,
    "/",
    undefined,
    timeout
  );

  const output = cmdResult.result || "";
  return parseClaudeOutput(output);
}

export function parseClaudeOutput(output: string): ClaudeCLIResult {
  const trimmed = output.trim();

  try {
    const jsonResponse = JSON.parse(trimmed);
    if (jsonResponse.type === "result" && typeof jsonResponse.result === "string") {
      return {
        raw: output,
        result: jsonResponse.result,
        isError: jsonResponse.is_error || false,
      };
    }
    return {
      raw: output,
      result: trimmed,
      isError: false,
    };
  } catch {
    return {
      raw: output,
      result: trimmed,
      isError: false,
    };
  }
}

export function extractJsonFromText(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed.type === "result" && typeof parsed.result === "string") {
      return extractJsonFromText(parsed.result);
    }
    if (parsed.question || parsed.title || parsed.requirementsMet || parsed.summary || parsed.tasks) {
      return text;
    }
  } catch {
    // Not valid JSON, continue
  }

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const content = codeBlockMatch[1].trim();
    try {
      JSON.parse(content);
      return content;
    } catch {
      // Continue to other methods
    }
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    const candidate = text.slice(braceStart, braceEnd + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === "object" && parsed !== null) {
        return candidate;
      }
    } catch {
      // Continue
    }
  }

  const jsonMatch = text.match(/\{\s*"(?:question|title|requirementsMet|summary|tasks)"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[0]);
      return jsonMatch[0];
    } catch {
      // Continue
    }
  }

  return null;
}
