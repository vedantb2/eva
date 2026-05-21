"use node";
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { resolveDaytonaApiKey } from "../envVarResolver";
import { launchScript } from "./launch";

export const WORKSPACE_DIR = "/tmp/repo";
export const LEGACY_WORKSPACE_DIR = "/workspace/repo";

/** Config file shape returned by getConfigFilesForSnapshot. */
export type SandboxConfigFile = {
  fileName: string;
  chunkUrls: Array<string | null>;
};

/**
 * Filters config files to those with all chunk URLs available.
 * Skips any file with a missing chunk URL — concatenating partial chunks would corrupt the file.
 */
export function filterDownloadableConfigFiles(
  files: SandboxConfigFile[],
): Array<{ fileName: string; chunkUrls: string[] }> {
  const result: Array<{ fileName: string; chunkUrls: string[] }> = [];
  for (const f of files) {
    if (f.chunkUrls.length === 0) continue;
    if (f.chunkUrls.some((u) => u === null)) continue;
    const validUrls = f.chunkUrls.filter((u): u is string => u !== null);
    result.push({ fileName: f.fileName, chunkUrls: validUrls });
  }
  return result;
}

/**
 * Builds shell commands to download a config file. Single-chunk files use a
 * straight `curl -o`. Multi-chunk files download each chunk to /tmp, concatenate
 * with `cat` into the destination, then remove the chunk temp files.
 * `destDir` is optional; when omitted, files land in the caller's cwd.
 */
export function buildConfigFileDownloadCommands(
  file: {
    fileName: string;
    chunkUrls: string[];
  },
  destDir?: string,
): string[] {
  const destPath = destDir
    ? `${destDir.replace(/\/$/, "")}/${file.fileName}`
    : file.fileName;
  if (file.chunkUrls.length === 1) {
    return [
      `curl -fSL --retry 3 --retry-delay 5 -o '${destPath}' '${file.chunkUrls[0]}'`,
    ];
  }
  const downloadCmds = file.chunkUrls.map(
    (url, i) =>
      `curl -fSL --retry 3 --retry-delay 5 -o '/tmp/${file.fileName}.chunk-${i}' '${url}'`,
  );
  const chunkPaths = file.chunkUrls
    .map((_, i) => `'/tmp/${file.fileName}.chunk-${i}'`)
    .join(" ");
  return [
    ...downloadCmds,
    `cat ${chunkPaths} > '${destPath}'`,
    `rm ${chunkPaths}`,
  ];
}

/** Returns a shell expression that resolves to the active workspace directory. */
export function workspaceDirShell(): string {
  return `$(if [ -d ${WORKSPACE_DIR} ]; then printf %s ${WORKSPACE_DIR}; elif [ -d ${LEGACY_WORKSPACE_DIR} ]; then printf %s ${LEGACY_WORKSPACE_DIR}; else printf %s ${WORKSPACE_DIR}; fi)`;
}
export const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 60;
export const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 30;
// Daytona rehydrates an archived sandbox's filesystem from cold object storage,
// which can take several minutes depending on size. The 60s default is fine for
// a stopped→started fast resume, but trips a noisy timeout on archived thaws.
export const ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS = 600;

const EXEC_CLIENT_TIMEOUT_BUFFER_MS = 15_000;

/** Executes a shell command on a sandbox and returns stdout, throwing on non-zero exit. */
export async function exec(
  sandbox: Sandbox,
  cmd: string,
  timeout = 30,
  cwd = WORKSPACE_DIR,
): Promise<string> {
  const clientTimeoutMs = timeout * 1000 + EXEC_CLIENT_TIMEOUT_BUFFER_MS;
  const resp = await withTimeout(
    sandbox.process.executeCommand(cmd, cwd, undefined, timeout),
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

/**
 * Ensures the Docker daemon is running inside the sandbox.
 *
 * dockerd is launched as a backgrounded process (not a system service), so it
 * does not survive sandbox auto-stop/resume. This helper is idempotent:
 *   - If `docker info` already succeeds, it's a no-op.
 *   - Otherwise, it cleans up stale sockets/containerd remnants and starts dockerd.
 *
 * Failures are non-fatal — older snapshots without Docker installed log and continue.
 */
export async function ensureDockerDaemon(sandbox: Sandbox): Promise<void> {
  try {
    await exec(sandbox, "docker info >/dev/null 2>&1", 5);
    console.log(
      `[daytona] ensureDockerDaemon: Docker daemon already running on ${sandbox.id}`,
    );
    return;
  } catch {
    // Not running (or docker not installed) — try to start it below.
  }
  try {
    // Cleanup before restart: kill any half-alive dockerd/containerd, then
    // remove their pidfiles AND sockets. After Daytona auto-stop/resume, both
    // pidfiles survive but their PIDs map to unrelated processes in the new
    // boot — dockerd/containerd refuse to start while a pidfile claims a
    // running peer, so we must delete them.
    await exec(
      sandbox,
      [
        "sudo pkill -9 containerd 2>/dev/null",
        "sudo pkill -9 dockerd 2>/dev/null",
        "sleep 1",
        "sudo rm -f /var/run/docker.pid /var/run/docker.sock /run/docker/containerd/containerd.pid /run/docker/containerd/containerd.sock /run/docker/containerd/containerd.sock.ttrpc /run/docker/containerd/containerd-debug.sock 2>/dev/null",
        // setsid + </dev/null detaches dockerd from the exec session so it
        // survives after the command returns.
        "sudo setsid dockerd </dev/null >/dev/null 2>&1 &",
        "sleep 4 && docker info >/dev/null 2>&1",
      ].join("; "),
      20,
    );
    console.log(
      `[daytona] ensureDockerDaemon: Docker daemon started on ${sandbox.id}`,
    );
  } catch {
    console.log(
      `[daytona] ensureDockerDaemon: Docker not available on ${sandbox.id} (old snapshot or not installed)`,
    );
  }
}

/**
 * Ensures a sandbox is running, starting it if the initial health check fails.
 *
 * If the sandbox is archived (or already mid-thaw), `sandbox.start()` needs the
 * extended `ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS` because Daytona has to
 * rehydrate the filesystem from cold storage. The optional `onRestoring`
 * callback fires once that state is detected so callers can surface a more
 * useful progress label instead of the generic "Resuming sandbox...".
 */
export async function ensureSandboxRunning(
  sandbox: Sandbox,
  options: {
    timeoutSeconds?: number;
    onRestoring?: () => Promise<void>;
  } = {},
): Promise<void> {
  const defaultTimeout =
    options.timeoutSeconds ?? DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;
  const startedAt = Date.now();
  try {
    console.log(
      `[daytona] ensureSandboxRunning: checking if sandbox ${sandbox.id} is running...`,
    );
    await exec(sandbox, "echo 1", 5);
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} already running (${Date.now() - startedAt}ms)`,
    );
  } catch (e) {
    const checkDuration = Date.now() - startedAt;
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} not running, starting... (check took ${checkDuration}ms, error: ${e instanceof Error ? e.message : String(e)})`,
    );
    let startTimeout = defaultTimeout;
    try {
      await sandbox.refreshData();
      const state = sandbox.state;
      if (state === "archived" || state === "restoring") {
        startTimeout = Math.max(
          startTimeout,
          ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
        );
        console.log(
          `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} is ${state}, extending start timeout to ${startTimeout}s`,
        );
        if (options.onRestoring) await options.onRestoring();
      }
    } catch (refreshErr) {
      console.log(
        `[daytona] ensureSandboxRunning: refreshData failed (${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}); using default ${defaultTimeout}s timeout`,
      );
    }
    const startStartedAt = Date.now();
    await sandbox.start(startTimeout);
    console.log(
      `[daytona] ensureSandboxRunning: sandbox.start() completed in ${Date.now() - startStartedAt}ms`,
    );
    await exec(sandbox, "echo 1", 5);
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} now running (total ${Date.now() - startedAt}ms)`,
    );
  }
  // dockerd doesn't run as a system service, so it's lost on auto-stop/resume.
  // Re-check (and restart if needed) on every ensureSandboxRunning call.
  await ensureDockerDaemon(sandbox);
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
    enableMcp?: boolean;
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
  const mcpTokenPromise =
    opts.enableMcp === false
      ? Promise.resolve(undefined)
      : ctx
          .runAction(internal.mcp.tokenMinter.mintSandboxMcpToken, {
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

  const mcpBaseUrl = mcpToken ? (process.env.CONVEX_SITE_URL ?? "") : "";

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
