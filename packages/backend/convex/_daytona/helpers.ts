"use node";

import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveDaytonaApiKey } from "../envVarResolver";

export const WORKSPACE_DIR = "/workspace/repo";
export const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 60;
export const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 30;
export const SNAPSHOT_READY_TIMEOUT_ERROR =
  "Sandbox failed to become ready within the timeout period";
export const DAYTONA_GET_TIMEOUT_MS = 30_000;
export const DAYTONA_CREATE_TIMEOUT_PADDING_MS = 15_000;
export const SANDBOX_UPLOAD_TIMEOUT_MS = 30_000;
export const SETUP_WALL_CLOCK_TIMEOUT_MS = 420_000;
export const SETUP_MAX_ATTEMPTS = 3;

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

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  if (timeoutMs <= 0) {
    throw new Error(`${label} timed out after ${timeoutMs}ms`);
  }
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

export async function ensureSandboxRunning(
  sandbox: Sandbox,
  timeoutSeconds = DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
): Promise<void> {
  try {
    await exec(sandbox, "echo 1", 5);
    return;
  } catch {
    await withTimeout(
      sandbox.start(timeoutSeconds),
      timeoutSeconds * 1000 + 10_000,
      "sandbox.start",
    );
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

export function isSnapshotReadyTimeoutError<T>(error: T): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(SNAPSHOT_READY_TIMEOUT_ERROR);
}

export function errorMessage<T>(error: T, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
  }
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
  return withTimeout(
    daytona.get(sandboxId),
    DAYTONA_GET_TIMEOUT_MS,
    `daytona.get(${sandboxId})`,
  );
}
