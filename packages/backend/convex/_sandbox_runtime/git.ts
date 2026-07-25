"use node";

import type { GenericActionCtx } from "convex/server";
import { quote } from "shell-quote";
import { formatDurationMsShort } from "@eva/shared/duration";
import { getInstallationToken } from "../githubAuth";
import { internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import type { SandboxClient, SandboxHandle } from "../_sandbox/provider";
import {
  execHandle,
  LEGACY_WORKSPACE_DIR,
  WORKSPACE_DIR,
  SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS,
  DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
  ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
  ensureDockerDaemon,
  bootstrapVercelDocker,
  ensureSandboxRunning,
  sleep,
  withTimeout,
  workspaceDirShell,
} from "./helpers";
import { detectPackageManager } from "./devServer";
import { ensureGitCredentialHelper } from "./gitCredentials";
import {
  EVA_ENV_FILE,
  ensureEvaEnvInteractiveHookScript,
  renderEvaEnvFile,
  VERCEL_DEFAULT_EXPOSED_PORTS,
} from "../_sandbox/vercelProvider";
import { buildSandboxLabels } from "../_sandbox/tags";

type ActionCtx = GenericActionCtx<DataModel>;

export type SandboxLifecycle = {
  autoStopInterval: number;
  autoArchiveInterval?: number;
  autoDeleteInterval?: number;
  ephemeral?: boolean;
  labels?: Record<string, string>;
};

export type RepoSyncStrategy =
  | { mode: "all" }
  | { mode: "branches"; branchNames: string[] }
  | { mode: "none" };

const SESSION_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 90,
  // Auto-archive after 1 day; no auto-delete (Daytona default).
  autoArchiveInterval: 1 * 24 * 60,
};

const EPHEMERAL_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 90,
  ephemeral: true,
};

export { SESSION_LIFECYCLE, EPHEMERAL_LIFECYCLE };

const REPO_CLONE_TIMEOUT_SECONDS = 300;
const PNPM_INSTALL_TIMEOUT_SECONDS = 900;
const YARN_INSTALL_TIMEOUT_SECONDS = 900;
const NPM_INSTALL_TIMEOUT_SECONDS = 900;

/** Logs a git-related message with a consistent prefix. */
function logGit(message: string): void {
  console.log(`[daytona][git] ${message}`);
}

/** Checks if an error message indicates a sandbox execution timeout. */
function isSandboxExecTimeout(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("sandbox exec") && lower.includes("timed out")) ||
    lower.includes("command execution timeout")
  );
}

/** Kills stale git processes and removes lock files after a timeout. */
async function cleanupTimedOutGitState(sandbox: SandboxHandle): Promise<void> {
  logGit(
    "cleanupTimedOutGitState: killing stale git processes and removing lock files",
  );
  try {
    const workspaceDir = workspaceDirShell();
    await execHandle(
      sandbox,
      `pkill -9 -f '^git($| )' 2>/dev/null || true; rm -f ${workspaceDir}/.git/index.lock ${workspaceDir}/.git/HEAD.lock ${workspaceDir}/.git/FETCH_HEAD.lock ${workspaceDir}/.git/ORIG_HEAD.lock 2>/dev/null || true`,
      10,
      "/",
    );
    logGit("cleanupTimedOutGitState: cleanup completed");
  } catch (error) {
    logGit(
      `cleanupTimedOutGitState: cleanup failed (best-effort): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Strips GitHub tokens from command strings for safe logging.
 * Matches all GitHub token prefixes (ghs_, ghp_, gho_, ghu_) regardless of URL escaping.
 */
function sanitizeCommand(command: string): string {
  return command.replace(/gh[spou]_[A-Za-z0-9_]+/g, "***");
}

/** Executes a git command, cleaning up lock files on timeout errors. */
async function execGitCommand(
  sandbox: SandboxHandle,
  command: string,
  timeoutSeconds: number,
): Promise<string> {
  const sanitized = sanitizeCommand(command);
  const startedAt = Date.now();
  logGit(`exec [timeout=${timeoutSeconds}s]: ${sanitized}`);
  try {
    const result = await execHandle(sandbox, command, timeoutSeconds);
    logGit(
      `exec completed in ${formatDurationMsShort(Date.now() - startedAt)}: ${sanitized}`,
    );
    return result;
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    logGit(
      `exec failed after ${formatDurationMsShort(elapsed)} [timeout=${timeoutSeconds}s]: ${sanitized} — ${message}`,
    );
    if (isSandboxExecTimeout(message)) {
      await cleanupTimedOutGitState(sandbox);
    }
    throw error;
  }
}

const SDK_TIMEOUT_BUFFER_MS = 15_000;

/** Wraps a Daytona SDK git call with timeout, logging, and stale-process cleanup. */
async function execSdkGitOperation<T>(
  sandbox: SandboxHandle,
  label: string,
  fn: () => Promise<T>,
  timeoutSeconds: number,
): Promise<T> {
  const startedAt = Date.now();
  logGit(`sdk [timeout=${timeoutSeconds}s]: ${label}`);
  try {
    const result = await withTimeout(
      fn(),
      timeoutSeconds * 1000 + SDK_TIMEOUT_BUFFER_MS,
      `sdk ${label} (${timeoutSeconds}s)`,
    );
    logGit(
      `sdk completed in ${formatDurationMsShort(Date.now() - startedAt)}: ${label}`,
    );
    return result;
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    logGit(
      `sdk failed after ${formatDurationMsShort(elapsed)} [timeout=${timeoutSeconds}s]: ${label} — ${message}`,
    );
    if (isSandboxExecTimeout(message)) {
      await cleanupTimedOutGitState(sandbox);
    }
    throw error;
  }
}

/** Wraps a git operation with timing logs and error reporting. */
async function runLoggedGitStep<T>(
  label: string,
  details: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  logGit(`${label} started${details ? ` (${details})` : ""}`);
  try {
    const result = await fn();
    logGit(
      `${label} completed in ${formatDurationMsShort(Date.now() - startedAt)}${details ? ` (${details})` : ""}`,
    );
    return result;
  } catch (error) {
    logGit(
      `${label} failed after ${formatDurationMsShort(Date.now() - startedAt)}${details ? ` (${details})` : ""}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/** Deduplicates and trims branch names, removing empty entries. */
function normalizeBranchNames(branchNames: string[]): string[] {
  const normalized: string[] = [];
  for (const branchName of branchNames) {
    const trimmed = branchName.trim();
    if (trimmed.length === 0 || normalized.includes(trimmed)) {
      continue;
    }
    normalized.push(trimmed);
  }
  return normalized;
}

/** Checks if an error message indicates a missing remote ref. */
function isMissingRemoteRefError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("couldn't find remote ref") ||
    lower.includes("could not find remote ref")
  );
}

function isRetryableGitNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    isSandboxExecTimeout(message) ||
    lower.includes("status code 502") ||
    lower.includes("status code 503") ||
    lower.includes("status code 504") ||
    lower.includes("status code 401") ||
    lower.includes("http 401") ||
    lower.includes("authentication failed") ||
    lower.includes("could not read username") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("socket hang up") ||
    lower.includes("gnutls recv error") ||
    lower.includes("tls connection was non-properly terminated") ||
    lower.includes("remote end hung up unexpectedly") ||
    lower.includes("connection reset by peer") ||
    lower.includes("rpc failed") ||
    lower.includes("early eof") ||
    lower.includes("http/2 stream")
  );
}

/** Retries transient git network operations with short backoff. */
async function retryGitNetworkOperation<T>(
  label: string,
  details: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await fn();
      if (attempt > 1) {
        logGit(
          `${label} recovered on retry ${attempt}/${maxAttempts}${details ? ` (${details})` : ""}`,
        );
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldRetry =
        attempt < maxAttempts && isRetryableGitNetworkError(message);
      if (!shouldRetry) {
        throw error;
      }
      const delayMs = 1000 * attempt;
      logGit(
        `${label} retrying in ${delayMs}ms after attempt ${attempt}/${maxAttempts}${details ? ` (${details})` : ""}: ${message}`,
      );
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }
  throw new Error(
    `${label} failed without returning a result${details ? ` (${details})` : ""}`,
  );
}

/** Creates a new sandbox with GitHub auth and git configuration. */
export async function createSandbox(
  client: SandboxClient,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  readyTimeoutSeconds?: number,
  // Fired as soon as Sandbox.create returns — before jq/git/docker setup.
  // Those post-create steps absorb Vercel's first-command boot penalty
  // (seconds–tens of seconds); session UI should not wait on them.
  onSandboxAcquired?: (sandbox: SandboxHandle) => Promise<void>,
): Promise<SandboxHandle> {
  const details = [
    `installation=${installationId}`,
    snapshotName ? `snapshot=${snapshotName}` : "snapshot=none",
    lifecycle.ephemeral ? "ephemeral=true" : "ephemeral=false",
  ].join(", ");
  return await runLoggedGitStep("createSandbox", details, async () => {
    const timeoutSeconds =
      readyTimeoutSeconds ??
      (snapshotName
        ? SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
        : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS);

    // Vercel: create does not need the GitHub token at API time (env is a
    // post-create file write). Overlap token fetch with Sandbox.create, then
    // write the env file AFTER onSandboxAcquired so the UI goes active before
    // the first-command boot penalty.
    // Daytona: envVars are baked into create, so the token must be ready first.
    const tokenPromise = getInstallationToken(installationId);
    const githubToken =
      client.kind === "vercel" ? undefined : await tokenPromise;

    // The adapter defaults an absent snapshot to daytona-large (Daytona) — non-
    // snapshot Daytona sandboxes (cpu=1, mem=1GB) have broken outbound
    // networking. Vercel has no such requirement.
    const sandbox = await client.create({
      snapshot: snapshotName,
      ports:
        client.kind === "vercel"
          ? [...VERCEL_DEFAULT_EXPOSED_PORTS]
          : undefined,
      envVars: {
        // VNC_RESOLUTION is read by the snapshot's ComputerUse plugin at startup
        // (Xvfb + x11vnc). Setting it here makes the desktop start at 1920x1080
        // natively — overriding the snapshot Dockerfile's 1280x720 default — so
        // we don't have to rely on a post-start xrandr resize.
        VNC_RESOLUTION: "1920x1080",
        ...sandboxEnvVars,
        ...(githubToken !== undefined
          ? {
              GITHUB_TOKEN: githubToken,
              INSTALLATION_ID: String(installationId),
            }
          : {}),
      },
      lifecycle: {
        autoStopMinutes: lifecycle.autoStopInterval,
        autoArchiveMinutes: lifecycle.autoArchiveInterval,
        autoDeleteMinutes: lifecycle.autoDeleteInterval,
        ephemeral: lifecycle.ephemeral,
        // Stamp Eva tags when ENVIRONMENT is set (Vercel dashboard/CLI filter).
        // Max 5 on Vercel — buildSandboxLabels caps + merges caller overrides.
        // Without ENVIRONMENT, labels pass through unchanged (seed-prep only).
        labels: buildSandboxLabels({
          ephemeral: lifecycle.ephemeral,
          labels: lifecycle.labels,
          repoId: sandboxEnvVars.REPO_ID,
        }),
      },
      readyTimeoutSeconds: timeoutSeconds,
    });
    logGit(
      `createSandbox: created id=${sandbox.id}, cpu=${sandbox.cpu}, memory=${sandbox.memory}, disk=${sandbox.disk}`,
    );
    // Outer callers only see the returned handle. If post-create setup throws
    // before return, their `sandbox` var stays unset and they cannot delete —
    // so orphans must be cleaned up here.
    try {
      if (onSandboxAcquired) {
        await onSandboxAcquired(sandbox);
      }
      if (client.kind === "vercel") {
        const token = await tokenPromise;
        await runLoggedGitStep("createSandbox.writeEvaEnv", sandbox.id, () =>
          sandbox.writeFile(
            EVA_ENV_FILE,
            renderEvaEnvFile({
              VNC_RESOLUTION: "1920x1080",
              ...sandboxEnvVars,
              GITHUB_TOKEN: token,
              INSTALLATION_ID: String(installationId),
            }),
          ),
        );
        // Belt-and-suspenders for login shells; tmux Console already sources
        // eva-env. Never fail create over this hook.
        try {
          await runLoggedGitStep(
            "createSandbox.ensureEvaEnvInteractiveHook",
            sandbox.id,
            () =>
              execHandle(sandbox, ensureEvaEnvInteractiveHookScript(), 30, "/"),
          );
        } catch (hookError) {
          console.warn(
            `[daytona][git] createSandbox.ensureEvaEnvInteractiveHook failed on ${sandbox.id} (continuing): ${hookError instanceof Error ? hookError.message : String(hookError)}`,
          );
        }
      }

      const appSlug = process.env.GITHUB_APP_SLUG;
      const botUserId = process.env.GITHUB_BOT_USER_ID;
      if (!appSlug || !botUserId) {
        throw new Error(
          "GITHUB_APP_SLUG and GITHUB_BOT_USER_ID must be set in Convex env",
        );
      }
      // Fresh Vercel node24 sandboxes ship without `jq`, which the git credential
      // helper (git-credential-eva) shells out to on every authenticated
      // fetch/push. Without it, syncRepo/fetchBaseBranch fail with exit 128
      // ("jq: command not found") before the seed toolchain stage ever runs.
      // Daytona bakes jq into its base Image, so this is a no-op there.
      // Timed individually (vs. one blanket log) so slow session creates can be
      // attributed to a specific step from Convex logs alone.
      if (client.kind === "vercel") {
        await runLoggedGitStep("createSandbox.ensureJq", sandbox.id, () =>
          execHandle(
            sandbox,
            "command -v jq >/dev/null 2>&1 || sudo dnf install -y jq >/dev/null 2>&1 || true",
            120,
          ),
        );
      }
      await runLoggedGitStep(
        "createSandbox.gitConfig",
        sandbox.id,
        async () => {
          await execHandle(
            sandbox,
            `git config --global user.name "${appSlug}[bot]" && git config --global user.email "${botUserId}+${appSlug}[bot]@users.noreply.github.com"`,
            10,
          );
          // Snapshot-restored /tmp/repo is owned by vercel-sandbox; session git
          // commands run as a different uid and hit "dubious ownership" without this.
          await execHandle(
            sandbox,
            "git config --global --add safe.directory '*'",
            10,
          );
          // Agents (esp. Cursor ship skills) often run `git pull` without
          // --rebase/--no-rebase; modern git fatals on divergent branches unless
          // a default is set. Rebase keeps session history linear when they do.
          await execHandle(sandbox, "git config --global pull.rebase true", 10);
        },
      );

      // Start Docker daemon if available (for Docker-in-Docker / Supabase local
      // dev). Idempotent — also re-invoked from ensureSandboxRunning on resume
      // since dockerd doesn't survive auto-stop. Both helpers already fast-path
      // on an already-running daemon (`docker info` check first); the timing
      // wrapper just makes that fast path visible in logs instead of assumed.
      if (client.kind === "vercel") {
        await runLoggedGitStep(
          "createSandbox.bootstrapDocker",
          sandbox.id,
          () => bootstrapVercelDocker(sandbox),
        );
      } else {
        await runLoggedGitStep(
          "createSandbox.ensureDockerDaemon",
          sandbox.id,
          () => ensureDockerDaemon(sandbox),
        );
      }

      return sandbox;
    } catch (error) {
      console.warn(
        `[daytona][git] createSandbox: post-create setup failed for ${sandbox.id}; deleting orphan: ${error instanceof Error ? error.message : String(error)}`,
      );
      try {
        await sandbox.delete();
      } catch (deleteError) {
        console.warn(
          `[daytona][git] createSandbox: orphan delete failed for ${sandbox.id}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
        );
      }
      throw error;
    }
  });
}

/** Returns the bare HTTPS remote URL for a GitHub repo (no embedded token). */
function bareGitHubRepoUrl(owner: string, name: string): string {
  return `https://github.com/${owner}/${name}.git`;
}

/**
 * Fetches refs from the GitHub remote origin, optionally pruning stale refs.
 * Always fetches full history (no --depth) — shallow clones cause issues with rebasing, blame, and merges.
 *
 * Auth comes from the eva git credential helper installed at sandbox
 * bootstrap; the remote URL no longer carries a token.
 */
export async function fetchOrigin(
  sandbox: SandboxHandle,
  owner: string,
  name: string,
  ref?: string,
  opts?: {
    prune?: boolean;
    timeoutSeconds?: number;
    retryAttempts?: number;
  },
): Promise<void> {
  const details = `${owner}/${name}, ref=${ref ?? "all"}, prune=${
    opts?.prune === false ? "false" : "true"
  }`;
  await runLoggedGitStep("fetchOrigin", details, async () => {
    const repoUrl = bareGitHubRepoUrl(owner, name);
    const workspaceDir = workspaceDirShell();
    const pruneArg = opts?.prune === false ? "" : " --prune";
    const refArg = ref ? ` ${quote([ref])}` : "";
    await retryGitNetworkOperation(
      "fetchOrigin",
      details,
      async () => {
        await execGitCommand(
          sandbox,
          `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && GIT_TERMINAL_PROMPT=0 git fetch --no-tags${pruneArg} origin${refArg}`,
          opts?.timeoutSeconds ?? 240,
        );
      },
      opts?.retryAttempts,
    );
  });
}

/**
 * Fetches specific branch refs from origin, falling back to individual fetches on missing refs.
 * Always fetches full history (no --depth) — shallow clones cause issues with rebasing, blame, and merges.
 *
 * Auth comes from the eva git credential helper installed at sandbox
 * bootstrap; the remote URL no longer carries a token.
 */
export async function fetchBranchRefs(
  sandbox: SandboxHandle,
  owner: string,
  name: string,
  branchNames: string[],
  opts?: {
    prune?: boolean;
    timeoutSeconds?: number;
    retryAttempts?: number;
  },
): Promise<string[]> {
  const details = `${owner}/${name}, branches=${branchNames.join(",")}, timeout=${opts?.timeoutSeconds ?? 240}`;
  return await runLoggedGitStep("fetchBranchRefs", details, async () => {
    const normalized = normalizeBranchNames(branchNames);
    if (normalized.length === 0) {
      return [];
    }
    const repoUrl = bareGitHubRepoUrl(owner, name);
    const pruneArg = opts?.prune === false ? "" : " --prune";
    const timeoutSeconds = opts?.timeoutSeconds ?? 240;
    const workspaceDir = workspaceDirShell();
    const refspecs = normalized.map(
      (b) => `+refs/heads/${b}:refs/remotes/origin/${b}`,
    );
    const refspecArgs = refspecs.map((r) => quote([r])).join(" ");
    const setupAndFetch = `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && GIT_TERMINAL_PROMPT=0 git fetch --no-tags${pruneArg} origin`;
    return await retryGitNetworkOperation(
      "fetchBranchRefs",
      details,
      async () => {
        try {
          await execGitCommand(
            sandbox,
            `${setupAndFetch} ${refspecArgs}`,
            timeoutSeconds,
          );
          return normalized;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (!isMissingRemoteRefError(message)) {
            throw error;
          }
          const fetchedBranches: string[] = [];
          for (const [index, refspec] of refspecs.entries()) {
            try {
              await execGitCommand(
                sandbox,
                `${setupAndFetch} ${quote([refspec])}`,
                timeoutSeconds,
              );
              const fetchedBranch = normalized[index];
              if (fetchedBranch) {
                fetchedBranches.push(fetchedBranch);
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              if (!isMissingRemoteRefError(msg)) {
                throw e;
              }
            }
          }
          return fetchedBranches;
        }
      },
      opts?.retryAttempts,
    );
  });
}

/** Syncs the sandbox repo with the remote using the given strategy. */
export async function syncRepo(
  sandbox: SandboxHandle,
  owner: string,
  name: string,
  strategy: RepoSyncStrategy,
): Promise<void> {
  const details =
    strategy.mode === "branches"
      ? `${owner}/${name}, strategy=branches(${strategy.branchNames.join(",")})`
      : `${owner}/${name}, strategy=${strategy.mode}`;
  await runLoggedGitStep("syncRepo", details, async () => {
    if (strategy.mode === "none") {
      return;
    }
    if (strategy.mode === "all") {
      await fetchOrigin(sandbox, owner, name, undefined, {
        prune: true,
        timeoutSeconds: 180,
      });
      return;
    }
    await fetchBranchRefs(sandbox, owner, name, strategy.branchNames, {
      prune: false,
      timeoutSeconds: 120,
    });
  });
}

/** Checks whether the remote tracking ref origin/<branch> exists (SDK branches() only lists local). */
async function remoteTrackingBranchExists(
  sandbox: SandboxHandle,
  branch: string,
): Promise<boolean> {
  const workspaceDir = workspaceDirShell();
  const result = (
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && git rev-parse --verify --quiet refs/remotes/origin/${quote([branch])} >/dev/null 2>&1 && printf yes || printf no`,
      10,
    )
  ).trim();
  return result === "yes";
}

/** Resolves the best available base ref: prefers origin/<base>, falls back to local, then HEAD. */
export async function resolveBaseTarget(
  sandbox: SandboxHandle,
  baseBranch: string,
): Promise<{ ref: string; source: "remote" | "local" | "head" }> {
  if (await remoteTrackingBranchExists(sandbox, baseBranch)) {
    return { ref: `origin/${baseBranch}`, source: "remote" };
  }
  // Check local branches via SDK
  const branchList = await execSdkGitOperation(
    sandbox,
    `branches`,
    () => sandbox.git.branches(WORKSPACE_DIR),
    10,
  );
  if (branchList.branches.includes(baseBranch)) {
    return { ref: baseBranch, source: "local" };
  }
  return { ref: "HEAD", source: "head" };
}

/** Resolves the best local starting ref for a working branch. */
async function resolveBranchStartTarget(
  sandbox: SandboxHandle,
  branchName: string,
  baseBranch: string,
): Promise<{
  ref: string;
  source: "localBranch" | "remoteBranch" | "base";
}> {
  if (await remoteTrackingBranchExists(sandbox, branchName)) {
    return { ref: `origin/${branchName}`, source: "remoteBranch" };
  }
  // Check local branches via SDK
  const branchList = await execSdkGitOperation(
    sandbox,
    `branches`,
    () => sandbox.git.branches(WORKSPACE_DIR),
    10,
  );
  if (branchList.branches.includes(branchName)) {
    return { ref: branchName, source: "localBranch" };
  }
  const { ref } = await resolveBaseTarget(sandbox, baseBranch);
  return { ref, source: "base" };
}

/** Checks out a session branch, creating it from a remote or base ref if needed. */
export async function checkoutSessionBranch(
  sandbox: SandboxHandle,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const details = `branch=${branchName}, base=${baseBranch}`;
  await runLoggedGitStep("checkoutSessionBranch", details, async () => {
    // Check if branch already exists locally via SDK
    const branchList = await execSdkGitOperation(
      sandbox,
      `branches`,
      () => sandbox.git.branches(WORKSPACE_DIR),
      10,
    );
    if (branchList.branches.includes(branchName)) {
      // Branch exists locally — check if we're already on it
      const workspaceDir = workspaceDirShell();
      const currentBranch = (
        await execGitCommand(
          sandbox,
          `cd ${workspaceDir} && git branch --show-current`,
          5,
        )
      ).trim();
      if (currentBranch === branchName) {
        // Already on the branch — nothing to do
        logGit(
          `checkoutSessionBranch: already on ${branchName}, skipping checkout`,
        );
        return;
      }
      // Checkout using git command (more reliable than SDK for existing branches)
      const quotedBranch = quote([branchName]);
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git checkout ${quotedBranch}`,
        20,
      );
      return;
    }
    // Branch doesn't exist locally — create from remote tracking or base ref
    const { ref: baseTarget } = await resolveBaseTarget(sandbox, baseBranch);
    const quotedBranch = quote([branchName]);
    const quotedRemoteBranch = quote([`origin/${branchName}`]);
    const quotedBase = quote([baseTarget]);
    const workspaceDir = workspaceDirShell();
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && (git checkout -b ${quotedBranch} ${quotedRemoteBranch} || git checkout -b ${quotedBranch} ${quotedBase})`,
      30,
    );
  });
}

/** Checks out a base branch, preferring remote refs but falling back to local snapshot refs. */
export async function checkoutFetchedBaseBranch(
  sandbox: SandboxHandle,
  baseBranch: string,
  timeoutSeconds = 30,
): Promise<void> {
  const details = `base=${baseBranch}`;
  await runLoggedGitStep("checkoutFetchedBaseBranch", details, async () => {
    const quotedBranch = quote([baseBranch]);
    const { ref: baseTarget, source } = await resolveBaseTarget(
      sandbox,
      baseBranch,
    );
    const quotedBase = quote([baseTarget]);
    const workspaceDir = workspaceDirShell();
    logGit(`checkoutFetchedBaseBranch: using base source=${source}`);
    if (source === "remote") {
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quotedBase}) && git merge --ff-only ${quotedBase}`,
        timeoutSeconds,
      );
      return;
    }
    if (source === "local") {
      // SDK checkoutBranch — simple checkout, no startpoint needed.
      // Uses WORKSPACE_DIR directly (SDK needs a real path, not a shell expression).
      await execSdkGitOperation(
        sandbox,
        `checkoutBranch ${baseBranch}`,
        () => sandbox.git.checkoutBranch(WORKSPACE_DIR, baseBranch),
        timeoutSeconds,
      );
      return;
    }
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && git checkout -B ${quotedBranch} ${quotedBase}`,
      timeoutSeconds,
    );
  });
}

/**
 * Resets tracked files from a snapshot worktree.
 *
 * Seeded runtime snapshots carry /tmp/.startup-commands-done and may also carry
 * untracked local-service state used to restore stopped databases. In that case
 * preserve untracked files; deleting them makes the sandbox skip seeding while
 * starting from an empty DB.
 */
export async function normalizeSnapshotWorktree(
  sandbox: SandboxHandle,
): Promise<void> {
  const workspaceDir = workspaceDirShell();
  await runLoggedGitStep(
    "normalizeSnapshotWorktree",
    WORKSPACE_DIR,
    async () => {
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git reset --hard HEAD && if [ -f /tmp/.startup-commands-done ]; then echo "seeded snapshot marker found; preserving untracked runtime state"; else git clean -fd; fi`,
        60,
      );
    },
  );
}

/** Copies baked sandbox config files into the codebase root after git cleanup. */
export async function copySandboxConfigFilesToWorkspace(
  sandbox: SandboxHandle,
  options?: { force?: boolean },
): Promise<void> {
  const workspaceDir = workspaceDirShell();
  const markerGuard =
    options?.force === true
      ? ""
      : 'if [ -f /tmp/.startup-commands-done ]; then echo "startup commands already ran; skipping sandbox-config copy"; exit 0; fi; ';
  await runLoggedGitStep(
    "copySandboxConfigFilesToWorkspace",
    WORKSPACE_DIR,
    async () => {
      await execGitCommand(
        sandbox,
        `${markerGuard}if [ -d /home/eva/sandbox-config ] && find /home/eva/sandbox-config -mindepth 1 -maxdepth 1 | read first; then cp -a /home/eva/sandbox-config/. ${workspaceDir}/; fi`,
        30,
      );
    },
  );
}

/** Installs project dependencies using the detected package manager. */
async function installDependencies(
  sandbox: SandboxHandle,
  pm: string,
): Promise<void> {
  const workspaceDir = workspaceDirShell();
  if (pm === "pnpm") {
    await execHandle(
      sandbox,
      `npm install -g pnpm && cd ${workspaceDir} && pnpm install`,
      PNPM_INSTALL_TIMEOUT_SECONDS,
    );
  } else if (pm === "yarn") {
    await execHandle(
      sandbox,
      `cd ${workspaceDir} && yarn install`,
      YARN_INSTALL_TIMEOUT_SECONDS,
    );
  } else {
    await execHandle(
      sandbox,
      `cd ${workspaceDir} && npm install`,
      NPM_INSTALL_TIMEOUT_SECONDS,
    );
  }
}

/**
 * Clones a GitHub repo into the sandbox and optionally installs dependencies.
 *
 * The eva git credential helper is installed before the clone so the SDK
 * call can use a bare HTTPS URL — no token in the URL, no token in process
 * args.
 */
export async function cloneAndSetupRepo(
  ctx: ActionCtx,
  sandbox: SandboxHandle,
  installationId: number,
  owner: string,
  name: string,
  shouldInstallDeps: boolean,
  onProgress?: (label: string) => Promise<void>,
): Promise<void> {
  const details = `${owner}/${name}, installDeps=${shouldInstallDeps}`;
  await runLoggedGitStep("cloneAndSetupRepo", details, async () => {
    if (onProgress) await onProgress("Cloning repository...");
    const githubToken = await getInstallationToken(installationId);
    const repoUrl = `https://github.com/${owner}/${name}.git`;

    // SDK clone doesn't clean target dir — pre-clean workspace directories
    await execHandle(
      sandbox,
      `rm -rf ${quote([WORKSPACE_DIR])} ${quote([LEGACY_WORKSPACE_DIR])}`,
      30,
    );

    const maxCloneAttempts = 3;
    for (let attempt = 1; attempt <= maxCloneAttempts; attempt += 1) {
      try {
        await execSdkGitOperation(
          sandbox,
          `clone ${owner}/${name}`,
          () =>
            sandbox.git.clone(
              repoUrl,
              WORKSPACE_DIR,
              "x-access-token",
              githubToken,
            ),
          REPO_CLONE_TIMEOUT_SECONDS,
        );
        if (attempt > 1) {
          logGit(
            `cloneAndSetupRepo: clone recovered on attempt ${attempt}/${maxCloneAttempts} for ${owner}/${name}`,
          );
        }
        break;
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }
        const shouldRetry =
          attempt < maxCloneAttempts &&
          isRetryableGitNetworkError(error.message);
        if (!shouldRetry) {
          throw error;
        }
        const delayMs = attempt * 2000;
        logGit(
          `cloneAndSetupRepo: clone retrying in ${delayMs}ms after attempt ${attempt}/${maxCloneAttempts} for ${owner}/${name}: ${error.message}`,
        );
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }

    // Install the credential helper after the clone so subsequent fetches /
    // pushes (here and from inside the sandbox) auth without URL tokens. The
    // initial SDK clone still uses an explicit token because the helper
    // can't be wired up before the .git directory exists.
    await ensureGitCredentialHelper(ctx, sandbox, installationId);

    if (!shouldInstallDeps) {
      return;
    }
    if (onProgress) await onProgress("Installing dependencies...");
    const pm = await detectPackageManager(sandbox);
    logGit(
      `installDependencies: detected package manager "${pm}" for ${owner}/${name}`,
    );
    await installDependencies(sandbox, pm);
  });
}

/** Sets up a working branch from the best available local ref with no pre-merge git choreography. */
export async function setupBranch(
  sandbox: SandboxHandle,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const details = `branch=${branchName}, base=${baseBranch}`;
  await runLoggedGitStep("setupBranch", details, async () => {
    const { ref: startTarget, source } = await resolveBranchStartTarget(
      sandbox,
      branchName,
      baseBranch,
    );
    logGit(
      `setupBranch: using start source=${source} ref=${startTarget} for branch=${branchName}`,
    );
    const quotedBranch = quote([branchName]);
    const quotedStartTarget = quote([startTarget]);
    const workspaceDir = workspaceDirShell();
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && git checkout -B ${quotedBranch} ${quotedStartTarget}`,
      15,
    );
  });
}

/**
 * Pushes the current branch to origin with retry logic.
 *
 * Auth comes from the eva git credential helper installed at sandbox
 * bootstrap; the remote URL no longer carries a token.
 */
export async function pushBranchToOrigin(
  sandbox: SandboxHandle,
  owner: string,
  name: string,
  branchName: string,
  opts?: {
    timeoutSeconds?: number;
    retryAttempts?: number;
  },
): Promise<void> {
  const details = `${owner}/${name}, branch=${branchName}`;
  await runLoggedGitStep("pushBranchToOrigin", details, async () => {
    const workspaceDir = workspaceDirShell();
    const quotedBranch = quote([branchName]);
    const repoUrl = bareGitHubRepoUrl(owner, name);
    await retryGitNetworkOperation(
      "pushBranchToOrigin",
      details,
      async () => {
        await execGitCommand(
          sandbox,
          `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && GIT_TERMINAL_PROMPT=0 git push -u origin ${quotedBranch}`,
          opts?.timeoutSeconds ?? 60,
        );
      },
      opts?.retryAttempts ?? 2,
    );
  });
}

/**
 * Detects Daytona errors meaning the named snapshot is unusable in a way a
 * rebuild would fix (terminal `error` / `build_failed` states from
 * snapshotWorkflow). Caller falls back to creating the sandbox without the
 * snapshot — slower setup, but the run can still proceed.
 */
function isSnapshotUnusableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Snapshot\s+\S+\s+is\s+(error|build_failed)/i.test(msg);
}

/** Creates a sandbox and prepares the repo by cloning or syncing from a snapshot. */
export async function createSandboxAndPrepareRepo(
  ctx: ActionCtx,
  client: SandboxClient,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  onSandboxAcquired?: (sandbox: SandboxHandle) => Promise<void>,
  onProgress?: (label: string) => Promise<void>,
  syncStrategy: RepoSyncStrategy = { mode: "all" },
  // Override the SDK create-ready wait. Large seeded snapshots (~10GB) take
  // well over the 30s default to start, so callers that boot from them (seeded
  // snapshot builds) pass a longer value to avoid spurious create timeouts +
  // the orphaned sandboxes they leave server-side.
  readyTimeoutSeconds?: number,
  // When true, skip `pnpm/yarn install` during a fresh clone. Used by
  // createSeedPrepSandbox: the launchSeedRun buildCommands run pnpm install
  // inside the detached seed script, so installing here wastes 10–15 minutes
  // and reliably trips Convex's 600s per-action ceiling on providers (Vercel)
  // that don't have it pre-baked into their base snapshot.
  skipInstallDeps = false,
): Promise<{ sandbox: SandboxHandle; usedSnapshot: boolean }> {
  let sandbox: SandboxHandle | undefined;
  try {
    const details = `${owner}/${name}, snapshot=${snapshotName ?? "none"}, syncStrategy=${syncStrategy.mode}`;
    return await runLoggedGitStep(
      "createSandboxAndPrepareRepo",
      details,
      async () => {
        if (onProgress) await onProgress("Creating sandbox...");
        let effectiveSnapshot = snapshotName;
        try {
          sandbox = await createSandbox(
            client,
            installationId,
            sandboxEnvVars,
            lifecycle,
            effectiveSnapshot,
            readyTimeoutSeconds,
            onSandboxAcquired,
          );
        } catch (err) {
          if (effectiveSnapshot && isSnapshotUnusableError(err)) {
            logGit(
              `createSandboxAndPrepareRepo: snapshot ${effectiveSnapshot} is in error state — falling back to default snapshot + git clone (${err instanceof Error ? err.message : String(err)})`,
            );
            if (onProgress)
              await onProgress("Snapshot unavailable — cloning instead...");
            effectiveSnapshot = undefined;
            sandbox = await createSandbox(
              client,
              installationId,
              sandboxEnvVars,
              lifecycle,
              undefined,
              readyTimeoutSeconds,
              onSandboxAcquired,
            );
          } else {
            throw err;
          }
        }
        if (effectiveSnapshot) {
          // Deliberately no `installDependencies`/pnpm install on this path:
          // a seeded/base snapshot already carries node_modules from the seed
          // build (launchSeedRun's buildCommands), and normalizeSnapshotWorktree
          // preserves untracked files (skips `git clean -fd`) whenever the
          // seed marker is present, so node_modules survives the reset below.
          // Re-installing here would cost minutes on every session create.
          await normalizeSnapshotWorktree(sandbox);
          // The snapshot was baked with a stale token in its git config /
          // remotes. Install the credential helper before any git network op
          // so syncRepo (and later in-sandbox `git pull`) authenticate cleanly.
          await ensureGitCredentialHelper(ctx, sandbox, installationId);
          if (syncStrategy.mode !== "none") {
            if (onProgress) await onProgress("Syncing repository...");
            await syncRepo(sandbox, owner, name, syncStrategy);
          }
          await copySandboxConfigFilesToWorkspace(sandbox, { force: true });
          return { sandbox, usedSnapshot: true };
        }
        if (lifecycle.ephemeral && syncStrategy.mode === "none") {
          await cloneAndSetupRepo(
            ctx,
            sandbox,
            installationId,
            owner,
            name,
            false,
            onProgress,
          );
          return { sandbox, usedSnapshot: false };
        }
        await cloneAndSetupRepo(
          ctx,
          sandbox,
          installationId,
          owner,
          name,
          !lifecycle.ephemeral && !skipInstallDeps,
          onProgress,
        );
        if (syncStrategy.mode !== "none") {
          if (onProgress) await onProgress("Syncing repository...");
          await syncRepo(sandbox, owner, name, syncStrategy);
        }
        return { sandbox, usedSnapshot: false };
      },
    );
  } catch (error) {
    if (sandbox) {
      try {
        await sandbox.delete();
      } catch {}
      // Best-effort cleanup of the credential-helper row. No-op if absent.
      await ctx.runMutation(internal.sandboxGitCredentials.deleteBySandboxId, {
        sandboxId: sandbox.id,
      });
    }
    throw error;
  }
}

/** Resumes an existing sandbox or creates a new one with repo setup. */
export async function getOrCreateSandbox(
  ctx: ActionCtx,
  client: SandboxClient,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  onProgress?: (label: string) => Promise<void>,
  syncStrategy: RepoSyncStrategy = { mode: "all" },
): Promise<{ sandbox: SandboxHandle; isNew: boolean }> {
  const details = `${owner}/${name}, existingSandboxId=${existingSandboxId ?? "none"}, snapshot=${snapshotName ?? "none"}, syncStrategy=${syncStrategy.mode}`;
  return await runLoggedGitStep("getOrCreateSandbox", details, async () => {
    if (existingSandboxId) {
      const resumed = await tryResumeSandbox(
        ctx,
        client,
        existingSandboxId,
        installationId,
        owner,
        name,
        syncStrategy,
        onProgress,
      );
      if (resumed) return { sandbox: resumed, isNew: false };
    }
    const { sandbox } = await createSandboxAndPrepareRepo(
      ctx,
      client,
      installationId,
      owner,
      name,
      sandboxEnvVars,
      lifecycle,
      snapshotName,
      undefined,
      onProgress,
      syncStrategy,
    );
    return { sandbox, isNew: true };
  });
}

/**
 * Heuristic: does this Daytona error mean the sandbox is genuinely gone
 * (deleted, archived, expired) — i.e. safe to fall through to creating a new one?
 *
 * We deliberately stay narrow. The previous implementation swallowed every
 * error and silently created a new sandbox, which orphaned the old one in
 * common races (e.g. user clicking Start while a stop is mid-flight — the
 * sandbox is in a transitional state, `start()` rejects, and we'd happily
 * burn a fresh sandbox + lose the old one's dev server / terminal state).
 */
function isSandboxMissingError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("no such") ||
    msg.includes("404") ||
    msg.includes("deleted") ||
    msg.includes("archived")
  );
}

/**
 * Attempts to resume an existing sandbox. Returns the sandbox on success,
 * `null` if the sandbox is genuinely gone (caller should create a new one),
 * or throws on persistent transient errors.
 *
 * Retries with backoff to ride through transitional Daytona states (e.g.
 * sandbox is mid-stop when Start is clicked). Only "missing" errors short-
 * circuit to a new sandbox; everything else surfaces, so we never silently
 * abandon a recoverable sandbox.
 */
async function tryResumeSandbox(
  ctx: ActionCtx,
  client: SandboxClient,
  existingSandboxId: string,
  installationId: number,
  owner: string,
  name: string,
  syncStrategy: RepoSyncStrategy,
  onProgress?: (label: string) => Promise<void>,
): Promise<SandboxHandle | null> {
  const maxAttempts = 4;
  const backoffMs = [2000, 4000, 8000];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onProgress) await onProgress("Resuming sandbox...");
      const sandbox = await client.get(existingSandboxId);
      await ensureSandboxRunning(sandbox, {
        timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
        // Explicit user start (Start clicked / new run on a reused sandbox):
        // wait out a stop still snapshotting and resume, instead of refusing.
        resumeAfterStop: true,
        onRestoring: onProgress
          ? () =>
              onProgress(
                client.kind === "vercel"
                  ? "Resuming sandbox..."
                  : "Restoring sandbox from cold storage (can take up to 10 minutes)...",
              )
          : undefined,
      });
      // Self-heal: rotate the per-sandbox secret and (re)install the helper on
      // every resume so the in-sandbox `git pull` works without a stale token
      // and so sandboxes that pre-date this change pick up the helper.
      await ensureGitCredentialHelper(ctx, sandbox, installationId);
      if (syncStrategy.mode !== "none") {
        if (onProgress) await onProgress("Syncing repository...");
        await syncRepo(sandbox, owner, name, syncStrategy);
      }
      return sandbox;
    } catch (err) {
      if (isSandboxMissingError(err)) {
        logGit(
          `getOrCreateSandbox: resume failed because sandbox is gone — will create new one (${err instanceof Error ? err.message : String(err)})`,
        );
        return null;
      }
      if (attempt === maxAttempts) throw err;
      const delay = backoffMs[attempt - 1] ?? 8000;
      logGit(
        `getOrCreateSandbox: resume attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms — ${err instanceof Error ? err.message : String(err)}`,
      );
      await sleep(delay);
    }
  }
  return null;
}
