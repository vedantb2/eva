"use node";
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveDaytonaApiKey } from "../envVarResolver";
import { launchScript } from "./launch";

export const WORKSPACE_DIR = "/tmp/repo";
export const LEGACY_WORKSPACE_DIR = "/workspace/repo";

/** Returns a shell expression that resolves to the active workspace directory. */
export function workspaceDirShell(): string {
  return `$(if [ -d ${WORKSPACE_DIR} ]; then printf %s ${WORKSPACE_DIR}; elif [ -d ${LEGACY_WORKSPACE_DIR} ]; then printf %s ${LEGACY_WORKSPACE_DIR}; else printf %s ${WORKSPACE_DIR}; fi)`;
}
export const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 60;
export const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 30;

const EXEC_CLIENT_TIMEOUT_BUFFER_MS = 15_000;

/** Executes a shell command on a sandbox and returns stdout, throwing on non-zero exit. */
export async function exec(
  sandbox: Sandbox,
  cmd: string,
  timeout = 30,
): Promise<string> {
  const clientTimeoutMs = timeout * 1000 + EXEC_CLIENT_TIMEOUT_BUFFER_MS;
  const resp = await withTimeout(
    sandbox.process.executeCommand(cmd, "/", undefined, timeout),
    clientTimeoutMs,
    `exec (${timeout}s)`,
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

/** Ensures a sandbox is running, starting it if the initial health check fails. */
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

/** Returns the value of a required environment variable, throwing if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** Creates a new Daytona SDK client with the given API key. */
export function getDaytona(apiKey: string): Daytona {
  return new Daytona({ apiKey });
}

/** Returns a promise that resolves after the specified milliseconds. */
export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const DAYTONA_CREATE_TIMEOUT_MS = 90_000;
export const WARMING_SANDBOX_READY_TIMEOUT_SECONDS = 60;

/** Races a promise against a timeout, throwing if the timeout expires first. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Sandbox ${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Extracts the message from an error, returning a fallback if not an Error instance. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Resolves Daytona client, sandbox env vars, and snapshot name for a repo. */
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
  return {
    daytona,
    sandboxEnvVars: { ...sandboxEnvVars, REPO_ID: repoId },
    snapshotName,
  };
}

/** Retrieves a Daytona sandbox instance by its ID for the given repo. */
export async function getSandbox(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
  sandboxId: string,
): Promise<Sandbox> {
  const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, repoId);
  const daytona = getDaytona(daytonaApiKey);
  return daytona.get(sandboxId);
}

/** Signs sandbox and MCP tokens, then launches the AI agent script on the sandbox. */
export async function signAndLaunchScript(
  ctx: GenericActionCtx<DataModel>,
  sandbox: Sandbox,
  userId: Id<"users">,
  prompt: string,
  completionMutation: string,
  entityIdField: string,
  entityId: string,
  repoId: Id<"githubRepos">,
  opts: {
    model?: string;
    allowedTools?: string;
    systemPrompt?: string;
    extraEnvVars?: Record<string, string>;
    claudeSessionId?: string;
  } = {},
): Promise<void> {
  const launchStartedAt = Date.now();
  console.log(
    `[daytona][launch] signAndLaunchScript started entityId=${entityId} mutation=${completionMutation} repoId=${repoId} sandboxId=${sandbox.id}`,
  );
  const sandboxTokenPromise = ctx
    .runAction(internal.sandboxJwt.signSandboxToken, { userId })
    .then((sandboxToken) => {
      console.log(
        `[daytona][launch] sandbox token minted in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
      );
      return sandboxToken;
    });
  const mcpTokenPromise = ctx
    .runAction(internal.mcpTokenMinter.mintSandboxMcpToken, {
      userId,
      repoId,
    })
    .then((mcpToken) => {
      console.log(
        `[daytona][launch] MCP token minted in ${Date.now() - launchStartedAt}ms entityId=${entityId}`,
      );
      return mcpToken;
    })
    .catch((error) => {
      console.warn(
        `[mcp] Continuing without MCP config: ${errorMessage(error, "Failed to mint MCP token")}`,
      );
      return undefined;
    });

  const [sandboxToken, mcpToken] = await Promise.all([
    sandboxTokenPromise,
    mcpTokenPromise,
  ]);

  const mcpBaseUrl = mcpToken ? (process.env.MCP_BASE_URL ?? "") : "";

  await launchScript(
    sandbox,
    prompt,
    completionMutation,
    entityIdField,
    sandboxToken,
    entityId,
    {
      ...opts,
      extraEnvVars: opts.extraEnvVars,
      mcpToken: mcpToken?.token,
      mcpBaseUrl,
    },
  );
  console.log(
    `[daytona][launch] launchScript completed in ${Date.now() - launchStartedAt}ms entityId=${entityId} sandboxId=${sandbox.id}`,
  );
}
