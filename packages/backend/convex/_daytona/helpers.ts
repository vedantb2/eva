"use node";
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import {
  resolveDaytonaApiKey,
  resolveProviderAccountCredentials,
  resolveSandboxCredentials,
  resolveSandboxCredentialsOnly,
} from "../envVarResolver";
import type { SandboxClient, SandboxHandle } from "../_sandbox/provider";
import { getSandboxClient } from "../_sandbox/factory";
import { launchScript } from "./launch";

export const WORKSPACE_DIR = "/tmp/repo";
export const LEGACY_WORKSPACE_DIR = "/workspace/repo";

/** Kills prior agent runners without matching the current shell wrapper. */
export const KILL_PRIOR_AGENT_PROCESSES_CMD =
  'pid=$(cat /tmp/run-design.pid 2>/dev/null || true); if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then comm=$(cat "/proc/$pid/comm" 2>/dev/null || true); cmdline=$(tr "\\0" " " < "/proc/$pid/cmdline" 2>/dev/null || true); if [ "$comm" = "node" ]; then case "$cmdline" in *"/tmp/run-design.mjs"*) kill "$pid" 2>/dev/null || true;; esac; fi; fi; ' +
  "pkill -x claude 2>/dev/null || true; " +
  "pkill -x claude-code 2>/dev/null || true; " +
  "pkill -x codex 2>/dev/null || true; " +
  "pkill -x opencode 2>/dev/null || true; " +
  "pkill -x cursor-agent 2>/dev/null || true; " +
  "true";

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
 * Provider-neutral counterpart to {@link exec}: runs a command on a
 * {@link SandboxHandle} and returns stdout, throwing on a non-zero exit. Added
 * alongside `exec` so `_daytona` consumers migrate onto the handle one file at a
 * time; `exec` is removed once the last raw-`Sandbox` caller is converted.
 */
export async function execHandle(
  handle: SandboxHandle,
  cmd: string,
  timeout = 30,
  cwd = WORKSPACE_DIR,
): Promise<string> {
  const clientTimeoutMs = timeout * 1000 + EXEC_CLIENT_TIMEOUT_BUFFER_MS;
  const resp = await withTimeout(
    handle.exec(cmd, { cwd, timeoutSeconds: timeout }),
    clientTimeoutMs,
    `exec (${timeout}s)`,
  );
  if (resp.exitCode !== 0) {
    const output = resp.output?.trim();
    throw new Error(
      output
        ? `Sandbox command failed (exit ${resp.exitCode}): ${output}`
        : `Sandbox command failed with exit code ${resp.exitCode}`,
    );
  }
  return resp.output;
}

/**
 * Ensures the Docker daemon is running inside the sandbox.
 *
 * dockerd is launched as a backgrounded process (not a system service), so it
 * does not survive sandbox auto-stop/resume. This helper is idempotent:
 *   - If `docker info` already succeeds, it's a no-op.
 *   - Otherwise, it cleans up stale sockets/containerd remnants and starts dockerd.
 *
 * Returns whether `docker info` succeeds after the attempt. Callers that need
 * Docker (e.g. seeded Supabase restore) should skip their work when this is false.
 */
export async function ensureDockerDaemon(
  sandbox: SandboxHandle,
): Promise<boolean> {
  try {
    await execHandle(sandbox, "docker info >/dev/null 2>&1", 5);
    console.log(
      `[daytona] ensureDockerDaemon: Docker daemon already running on ${sandbox.id}`,
    );
    return true;
  } catch {
    // Not running (or docker not installed) — try to start it below.
  }

  // Prefer the shared bootstrap first. On Vercel resume the older Daytona-style
  // restart below often fails (wasting ~1s) before this same bootstrap succeeds.
  if (await bootstrapVercelDocker(sandbox)) {
    return true;
  }

  try {
    // Cleanup before restart: kill any half-alive dockerd/containerd, then
    // remove their pidfiles AND sockets. After Daytona auto-stop/resume, both
    // pidfiles survive but their PIDs map to unrelated processes in the new
    // boot — dockerd/containerd refuse to start while a pidfile claims a
    // running peer, so we must delete them.
    await execHandle(
      sandbox,
      [
        "command -v docker >/dev/null 2>&1 || sudo dnf install -y docker 2>/dev/null || true",
        "sudo pkill -9 containerd 2>/dev/null",
        "sudo pkill -9 dockerd 2>/dev/null",
        "sleep 1",
        "sudo rm -f /var/run/docker.pid /var/run/docker.sock /run/docker/containerd/containerd.pid /run/docker/containerd/containerd.sock /run/docker/containerd/containerd.sock.ttrpc /run/docker/containerd/containerd-debug.sock 2>/dev/null",
        "sudo systemctl start docker 2>/dev/null || true",
        "sudo setsid dockerd </dev/null >/tmp/dockerd.log 2>&1 &",
        "for i in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 1; done",
        "sudo chmod 666 /var/run/docker.sock 2>/dev/null || true",
        "docker info >/dev/null 2>&1",
      ].join("; "),
      90,
    );
    console.log(
      `[daytona] ensureDockerDaemon: Docker daemon started on ${sandbox.id}`,
    );
    return true;
  } catch {
    console.log(
      `[daytona] ensureDockerDaemon: Docker not available on ${sandbox.id} (old snapshot or not installed)`,
    );
  }

  return false;
}

/**
 * Vercel-specific dockerd bootstrap. Fresh/restored Vercel sandboxes ship docker
 * from the seeded snapshot but never auto-start dockerd — mirrors the seed-run
 * docker-bootstrap stage in snapshotActions.ts.
 */
export async function bootstrapVercelDocker(
  sandbox: SandboxHandle,
): Promise<boolean> {
  try {
    await execHandle(sandbox, "docker info >/dev/null 2>&1", 5);
    return true;
  } catch {
    // Not running — bootstrap below.
  }

  const script = [
    "set -e",
    'echo "bootstrap-docker:start"',
    "command -v docker >/dev/null 2>&1 || sudo dnf install -y docker",
    "sudo pkill -9 dockerd 2>/dev/null || true",
    "sudo pkill -9 containerd 2>/dev/null || true",
    "sudo rm -f /var/run/docker.pid /var/run/docker.sock /run/docker/containerd/containerd.pid /run/docker/containerd/containerd.sock /run/docker/containerd/containerd.sock.ttrpc /run/docker/containerd/containerd-debug.sock 2>/dev/null || true",
    "sudo systemctl start docker 2>/dev/null || true",
    "sudo setsid dockerd </dev/null >/tmp/dockerd.log 2>&1 &",
    "for i in $(seq 1 90); do",
    "  docker info >/dev/null 2>&1 && break",
    "  sleep 1",
    "done",
    "sudo chmod 666 /var/run/docker.sock 2>/dev/null || true",
    "docker info >/dev/null 2>&1 || { tail -30 /tmp/dockerd.log 2>/dev/null || true; exit 1; }",
    'echo "bootstrap-docker:ok"',
  ].join("\n");

  try {
    await sandbox.writeFile("/tmp/bootstrap-docker.sh", script);
    await execHandle(
      sandbox,
      "chmod +x /tmp/bootstrap-docker.sh && bash /tmp/bootstrap-docker.sh",
      180,
    );
    console.log(
      `[daytona] bootstrapVercelDocker: Docker daemon started on ${sandbox.id}`,
    );
    return true;
  } catch (error) {
    console.log(
      `[daytona] bootstrapVercelDocker failed on ${sandbox.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
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
  sandbox: SandboxHandle,
  options: {
    timeoutSeconds?: number;
    onRestoring?: () => Promise<void>;
    /** When true, skip dockerd bootstrap — caller runs it after unlocking the UI. */
    skipDocker?: boolean;
    /**
     * When true, skip the post-start `echo 1` exec probe. start() already
     * verifies the provider reports the session running; the first REAL exec
     * pays the same warmup the probe would, so on latency-sensitive paths
     * (session resume early-ready) the probe only delays the UI unlock —
     * observed ~14s on Vercel resumes. Callers that follow up with their own
     * commands (git checkout, services) get equivalent failure surfacing.
     */
    skipExecProbe?: boolean;
  } = {},
): Promise<void> {
  const defaultTimeout =
    options.timeoutSeconds ?? DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;
  const startedAt = Date.now();

  // Refresh first. On a stopped Vercel sandbox, probing with exec waits ~20s for
  // the SDK's auto-resume path to time out before we ever call start() — skip
  // that probe when state already says we need a resume.
  let knownState: string | null = null;
  try {
    await sandbox.refresh();
    knownState = sandbox.state;
  } catch (refreshErr) {
    console.log(
      `[daytona] ensureSandboxRunning: initial refresh failed (${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}); falling back to exec probe`,
    );
  }

  const needsStart =
    knownState !== null && knownState !== "running" && knownState !== "unknown";

  if (!needsStart) {
    try {
      console.log(
        `[daytona] ensureSandboxRunning: checking if sandbox ${sandbox.id} is running...`,
      );
      await execHandle(sandbox, "echo 1", 5);
      console.log(
        `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} already running (${Date.now() - startedAt}ms)`,
      );
      if (!options.skipDocker) {
        await ensureDockerDaemon(sandbox);
      }
      return;
    } catch (e) {
      console.log(
        `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} not running, starting... (check took ${Date.now() - startedAt}ms, error: ${e instanceof Error ? e.message : String(e)})`,
      );
    }
  } else {
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} state=${knownState}, starting without exec probe`,
    );
  }

  let startTimeout = defaultTimeout;
  const state = knownState ?? sandbox.state;
  if (state === "archived" || state === "restoring") {
    startTimeout = Math.max(
      startTimeout,
      ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
    );
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} is ${state}, extending start timeout to ${startTimeout}s`,
    );
    if (options.onRestoring) await options.onRestoring();
  } else if (
    (state === "stopped" || state === "starting") &&
    options.onRestoring
  ) {
    // Vercel maps stopped→stopped (not archived). Surface progress while
    // start() waits on the first exec that resumes the snapshot.
    console.log(
      `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} is ${state}, waiting for resume`,
    );
    await options.onRestoring();
  }

  const startStartedAt = Date.now();
  await sandbox.start(startTimeout);
  console.log(
    `[daytona] ensureSandboxRunning: sandbox.start() completed in ${Date.now() - startStartedAt}ms`,
  );
  if (!options.skipExecProbe) {
    await execHandle(sandbox, "echo 1", 5);
  }
  console.log(
    `[daytona] ensureSandboxRunning: sandbox ${sandbox.id} now running (total ${Date.now() - startedAt}ms${options.skipExecProbe ? ", exec probe skipped" : ""})`,
  );

  // dockerd doesn't run as a system service, so it's lost on auto-stop/resume.
  // Re-check (and restart if needed) on every ensureSandboxRunning call unless
  // the caller wants to unlock the UI first (session reuse early-ready).
  if (!options.skipDocker) {
    await ensureDockerDaemon(sandbox);
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

/**
 * Cheap client-only resolve for resume/reuse. Does not decrypt the full env map
 * or load snapshot metadata — those are only needed on the create path.
 */
export async function resolveSandboxClientOnly(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<SandboxClient> {
  const startedAt = Date.now();
  const credentials = await resolveSandboxCredentialsOnly(ctx, repoId);
  const client = getSandboxClient(credentials);
  console.log(
    `[daytona] resolveSandboxClientOnly repoId=${repoId} kind=${client.kind} elapsed=${Date.now() - startedAt}ms`,
  );
  return client;
}

/** Resolves the provider client, sandbox env vars, and snapshot name for a repo. */
export async function resolveSandboxContext(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<{
  client: SandboxClient;
  sandboxEnvVars: Record<string, string>;
  snapshotName: string | undefined;
}> {
  const startedAt = Date.now();
  const { credentials, sandboxEnvVars } = await resolveSandboxCredentials(
    ctx,
    repoId,
  );
  const client = getSandboxClient(credentials);
  const repoSnapshot = await ctx.runQuery(
    internal.repoSnapshots.getRepoSnapshotName,
    { repoId },
  );
  const snapshotName = repoSnapshot?.snapshotName;
  console.log(
    `[daytona] resolveSandboxContext repoId=${repoId} kind=${client.kind} elapsed=${Date.now() - startedAt}ms`,
  );
  return {
    client,
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

/**
 * Provider-neutral counterpart to {@link getSandbox}: resolves the repo's
 * configured provider (via the `SANDBOX_PROVIDER` flag) and returns a
 * {@link SandboxHandle} for the sandbox. Consumers migrate from `getSandbox`
 * onto this one file at a time; `getSandbox` is removed at the end of the rewire.
 */
export async function getSandboxHandle(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
  sandboxId: string,
): Promise<SandboxHandle> {
  const { credentials } = await resolveSandboxCredentials(ctx, repoId);
  return getSandboxClient(credentials).get(sandboxId);
}

/** Signs sandbox and MCP tokens, then launches the AI agent script on the sandbox. */
export async function signAndLaunchScript(
  ctx: GenericActionCtx<DataModel>,
  sandbox: SandboxHandle,
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
    // When set, the entity owner's provider account credentials are decrypted
    // and layered over `extraEnvVars`, overriding the shared team credential.
    // Resolved here — the single launch choke point — so every caller only
    // threads the id. Ownership is checked against credentialOwnerUserId
    // (entity createdBy), not the launcher `userId` (MCP/auth).
    providerAccountId?: Id<"userProviderAccounts">;
    /** Entity owner (`createdBy`); defaults to `userId` when omitted. */
    credentialOwnerUserId?: Id<"users">;
  } = {},
): Promise<void> {
  const launchStartedAt = Date.now();
  console.log(
    `[daytona][launch] signAndLaunchScript started entityId=${entityId} mutation=${completionMutation} repoId=${repoId} sandboxId=${sandbox.id}`,
  );

  // Layer the selected owner account's credentials last so they win over the
  // team credential baked into the sandbox env. resolveProviderAccountCredentials
  // returns {} (no override) if the account is missing, not owned by the entity
  // owner, or the wrong provider for the model.
  const credentialOwnerUserId = opts.credentialOwnerUserId ?? userId;
  let extraEnvVars = opts.extraEnvVars;
  if (opts.providerAccountId) {
    const accountEnv = await resolveProviderAccountCredentials(
      ctx,
      opts.providerAccountId,
      credentialOwnerUserId,
      opts.model,
    );
    if (Object.keys(accountEnv).length > 0) {
      extraEnvVars = { ...extraEnvVars, ...accountEnv };
      console.log(
        `[daytona][launch] applied user provider account override entityId=${entityId} keys=${Object.keys(accountEnv).join(",")}`,
      );
    }
  }
  // Mint the sandbox auth token and MCP token in a single node action. This
  // replaces three separate runAction hops across two "use node" isolates, which
  // cold-started Node twice and dominated launch latency (~3s).
  const { sandboxToken, mcpToken } = await ctx.runAction(
    internal.sandboxJwt.mintSandboxSessionTokens,
    {
      userId,
      repoId,
      enableMcp: opts.enableMcp !== false,
      entityId,
      ...(entityIdField === "sessionId"
        ? { entityKind: "session" as const }
        : {}),
    },
  );
  console.log(
    `[daytona][launch] sandbox + MCP tokens minted in ${Date.now() - launchStartedAt}ms entityId=${entityId} (mcp=${mcpToken ? "yes" : "no"})`,
  );

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
      extraEnvVars,
      mcpToken: mcpToken?.token,
      mcpBaseUrl,
    },
  );
  console.log(
    `[daytona][launch] launchScript completed in ${Date.now() - launchStartedAt}ms entityId=${entityId} sandboxId=${sandbox.id}`,
  );
}
