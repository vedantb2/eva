import { Daytona, Sandbox } from "@daytonaio/sdk";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { SNAPSHOT_NAME } from "./snapshots";

const daytona = new Daytona();

export const WORKSPACE_DIR = "/workspace/repo";

export function getSandboxEnvVars(githubToken: string): Record<string, string> {
  return {
    GITHUB_TOKEN: githubToken,
    CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
    NEXT_PUBLIC_CONVEX_URL: clientEnv.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ENV: clientEnv.NEXT_PUBLIC_ENV,
    CLERK_SECRET_KEY: serverEnv.CLERK_SECRET_KEY,
    CONVEX_DEPLOYMENT: serverEnv.CONVEX_DEPLOYMENT,
  };
}

export async function createSandbox(
  githubToken: string,
  extraEnvVars?: Record<string, string>
): Promise<Sandbox> {
  const sandbox = await daytona.create({
    snapshot: SNAPSHOT_NAME,
    envVars: { ...getSandboxEnvVars(githubToken), ...extraEnvVars },
    autoStopInterval: 60,
  });
  await sandbox.process.executeCommand(
    'git config --global user.name "Eva Agent" && git config --global user.email "agent@Eva.dev"',
    "/",
    undefined,
    10
  );
  return sandbox;
}

export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return daytona.get(sandboxId);
}

export async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await daytona.get(sandboxId);
    await sandbox.process.executeCommand("echo 'sandbox alive'", "/", undefined, 5);
    return true;
  } catch {
    return false;
  }
}
