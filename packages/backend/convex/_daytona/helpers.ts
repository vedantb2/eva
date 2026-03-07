"use node";

import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveDaytonaApiKey } from "../envVarResolver";
import { launchScript } from "./launch";

export const WORKSPACE_DIR = "/workspace/repo";
export const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 60;
export const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 30;
export const SNAPSHOT_READY_TIMEOUT_ERROR =
  "Sandbox failed to become ready within the timeout period";

export async function exec(
  sandbox: Sandbox,
  cmd: string,
  timeout = 30,
): Promise<string> {
  const resp = await sandbox.process.executeCommand(
    cmd,
    "/",
    undefined,
    timeout,
  );
  if (resp.exitCode !== 0) {
    const output = resp.result?.trim();
    throw new Error(
      output
        ? `Sandbox command failed (exit ${resp.exitCode}): ${output}`
        : `Sandbox command failed with exit code ${resp.exitCode}`,
    );
  }
  return resp.result;
}

export async function ensureSandboxRunning(
  sandbox: Sandbox,
  timeoutSeconds = DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
): Promise<void> {
  try {
    await exec(sandbox, "echo 1", 5);
    return;
  } catch {
    await sandbox.start(timeoutSeconds);
    await exec(sandbox, "echo 1", 5);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getDaytona(apiKey: string): Daytona {
  return new Daytona({ apiKey });
}

export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isSnapshotReadyTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(SNAPSHOT_READY_TIMEOUT_ERROR);
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function resolveSandboxContext(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  daytona: Daytona;
  sandboxEnvVars: Record<string, string>;
  snapshotName: string | undefined;
}> {
  const { daytonaApiKey, sandboxEnvVars } = await resolveDaytonaApiKey(
    ctx,
    repoId,
  );
  const daytona = getDaytona(daytonaApiKey);
  const repoSnapshot = await ctx.runQuery(
    internal.repoSnapshots.getRepoSnapshotName,
    { repoId },
  );
  const snapshotName = repoSnapshot?.snapshotName;
  return { daytona, sandboxEnvVars, snapshotName };
}

export async function getSandbox(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
  sandboxId: string,
): Promise<Sandbox> {
  const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, repoId);
  const daytona = getDaytona(daytonaApiKey);
  return daytona.get(sandboxId);
}

export async function signAndLaunchScript(
  ctx: GenericActionCtx<DataModel>,
  sandbox: Sandbox,
  userId: Id<"users">,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  entityId: string,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
  } = {},
): Promise<void> {
  const sandboxToken = await ctx.runAction(
    internal.sandboxJwt.signSandboxToken,
    { userId },
  );
  await launchScript(
    sandbox,
    prompt,
    completionMutation,
    entityIdField,
    sandboxToken,
    entityId,
    opts,
  );
}
