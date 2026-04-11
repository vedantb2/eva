"use node";

import type {
  CreateSandboxFromSnapshotParams,
  Daytona,
  Sandbox,
  VolumeMount,
} from "@daytonaio/sdk";
import { quote } from "shell-quote";
import {
  buildGitHubRepoUrl,
  getInstallationOctokit,
  getInstallationToken,
} from "../githubAuth";
import {
  exec,
  LEGACY_WORKSPACE_DIR,
  WORKSPACE_DIR,
  SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS,
  DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS,
  DAYTONA_CREATE_TIMEOUT_MS,
  ensureSandboxRunning,
  withTimeout,
  workspaceDirShell,
} from "./helpers";
import { detectPackageManager } from "./devServer";

export type SandboxLifecycle = {
  autoStopInterval: number;
  autoDeleteInterval?: number;
  ephemeral?: boolean;
};

export type RepoSyncStrategy =
  | { mode: "all" }
  | { mode: "branches"; branchNames: string[] }
  | { mode: "none" };

const SESSION_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 15,
  autoDeleteInterval: 60,
};

const EPHEMERAL_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 60,
  ephemeral: true,
};

const WARMING_LIFECYCLE: SandboxLifecycle = {
  autoStopInterval: 10,
  ephemeral: true,
};

export { SESSION_LIFECYCLE, EPHEMERAL_LIFECYCLE, WARMING_LIFECYCLE };

const REPO_CLONE_TIMEOUT_SECONDS = 300;
const PNPM_INSTALL_TIMEOUT_SECONDS = 900;
const YARN_INSTALL_TIMEOUT_SECONDS = 900;
const NPM_INSTALL_TIMEOUT_SECONDS = 900;
const SNAPSHOT_SANDBOX_WITH_VOLUMES_READY_TIMEOUT_SECONDS = 90;

// Daytona built-in snapshot with 4 vCPU, 8 GiB RAM, 10 GiB disk.
// Used as fallback when a repo has no custom snapshot.
const DEFAULT_SNAPSHOT = "daytona-large";

/** Formats a duration in milliseconds as a human-readable string. */
function formatDurationMs(durationMs: number): string {
  return `${durationMs}ms`;
}

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
async function cleanupTimedOutGitState(sandbox: Sandbox): Promise<void> {
  logGit(
    "cleanupTimedOutGitState: killing stale git processes and removing lock files",
  );
  try {
    const workspaceDir = workspaceDirShell();
    await sandbox.process.executeCommand(
      `pkill -9 -f '^git($| )' 2>/dev/null || true; rm -f ${workspaceDir}/.git/index.lock ${workspaceDir}/.git/HEAD.lock ${workspaceDir}/.git/FETCH_HEAD.lock ${workspaceDir}/.git/ORIG_HEAD.lock 2>/dev/null || true`,
      "/",
      undefined,
      10,
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
  sandbox: Sandbox,
  command: string,
  timeoutSeconds: number,
): Promise<string> {
  const sanitized = sanitizeCommand(command);
  const startedAt = Date.now();
  logGit(`exec [timeout=${timeoutSeconds}s]: ${sanitized}`);
  try {
    const result = await exec(sandbox, command, timeoutSeconds);
    logGit(
      `exec completed in ${formatDurationMs(Date.now() - startedAt)}: ${sanitized}`,
    );
    return result;
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    logGit(
      `exec failed after ${formatDurationMs(elapsed)} [timeout=${timeoutSeconds}s]: ${sanitized} — ${message}`,
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
      `${label} completed in ${formatDurationMs(Date.now() - startedAt)}${details ? ` (${details})` : ""}`,
    );
    return result;
  } catch (error) {
    logGit(
      `${label} failed after ${formatDurationMs(Date.now() - startedAt)}${details ? ` (${details})` : ""}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/** Checks whether a branch exists on the remote GitHub repository. */
export async function remoteBranchExists(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  branchName: string,
  timeoutSeconds = 30,
): Promise<boolean> {
  const details = `${owner}/${name}, branch=${branchName}`;
  return await runLoggedGitStep("remoteBranchExists", details, async () => {
    const githubToken = await getInstallationToken(installationId);
    const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
    const workspaceDir = workspaceDirShell();
    const output = await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && git ls-remote --heads origin ${quote([`refs/heads/${branchName}`])}`,
      timeoutSeconds,
    );
    return output.trim().length > 0;
  });
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

/** Creates a branch-specific repo sync strategy from a list of branch names. */
export function createBranchSyncStrategy(
  branchNames: string[],
): RepoSyncStrategy {
  const normalized = normalizeBranchNames(branchNames);
  if (normalized.length === 0) {
    return { mode: "none" };
  }
  return {
    mode: "branches",
    branchNames: normalized,
  };
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
): Promise<T> {
  const maxAttempts = 3;
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

/** Creates a new Daytona sandbox with GitHub auth and git configuration. */
export async function createSandbox(
  daytona: Daytona,
  installationId: number,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  volumes?: VolumeMount[],
  readyTimeoutSeconds?: number,
): Promise<Sandbox> {
  const details = [
    `installation=${installationId}`,
    snapshotName ? `snapshot=${snapshotName}` : "snapshot=none",
    lifecycle.ephemeral ? "ephemeral=true" : "ephemeral=false",
    `volumes=${volumes?.length ?? 0}`,
  ].join(", ");
  return await runLoggedGitStep("createSandbox", details, async () => {
    const timeoutSeconds =
      readyTimeoutSeconds ??
      (snapshotName
        ? volumes && volumes.length > 0
          ? SNAPSHOT_SANDBOX_WITH_VOLUMES_READY_TIMEOUT_SECONDS
          : SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
        : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS);

    const githubToken = await getInstallationToken(installationId);

    const commonParams = {
      ...(volumes ? { volumes } : {}),
      envVars: {
        ...sandboxEnvVars,
        GITHUB_TOKEN: githubToken,
        INSTALLATION_ID: String(installationId),
      },
      autoStopInterval: lifecycle.autoStopInterval,
      ...(lifecycle.autoDeleteInterval !== undefined
        ? { autoDeleteInterval: lifecycle.autoDeleteInterval }
        : {}),
      ...(lifecycle.ephemeral ? { ephemeral: true } : {}),
    };

    // Use the repo's custom snapshot, or fall back to daytona-large (4 vCPU / 8 GiB / 10 GiB).
    // Non-snapshot sandboxes (cpu=1, mem=1GB) have broken outbound networking.
    const createParams: CreateSandboxFromSnapshotParams = {
      ...commonParams,
      snapshot: snapshotName ?? DEFAULT_SNAPSHOT,
    };

    const sandbox = await withTimeout(
      daytona.create(createParams, { timeout: timeoutSeconds }),
      readyTimeoutSeconds
        ? timeoutSeconds * 1000 + 30_000
        : DAYTONA_CREATE_TIMEOUT_MS,
      "create",
    );
    logGit(
      `createSandbox: created id=${sandbox.id}, cpu=${sandbox.cpu}, memory=${sandbox.memory}, disk=${sandbox.disk}`,
    );

    await exec(
      sandbox,
      'git config --global user.name "Eva" && git config --global user.email "48868398+vedantb2@users.noreply.github.com"',
      10,
    );
    return sandbox;
  });
}

/** Sets the git remote origin URL to an authenticated GitHub URL. */
export async function configureGitHubOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const details = `${owner}/${name}`;
  await runLoggedGitStep("configureGitHubOrigin", details, async () => {
    const githubToken = await getInstallationToken(installationId);
    const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
    const workspaceDir = workspaceDirShell();

    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])}`,
      20,
    );
  });
}

/** Fetches refs from the GitHub remote origin, optionally pruning stale refs. */
export async function fetchOrigin(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  ref?: string,
  opts?: { prune?: boolean; timeoutSeconds?: number; shallow?: boolean },
): Promise<void> {
  const details = `${owner}/${name}, ref=${ref ?? "all"}, prune=${
    opts?.prune === false ? "false" : "true"
  }, shallow=${opts?.shallow === true ? "true" : "false"}`;
  await runLoggedGitStep("fetchOrigin", details, async () => {
    const githubToken = await getInstallationToken(installationId);
    const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
    const workspaceDir = workspaceDirShell();
    const pruneArg = opts?.prune === false ? "" : " --prune";
    const depthArg = opts?.shallow === true ? " --depth 1" : "";
    const refArg = ref ? ` ${quote([ref])}` : "";
    await retryGitNetworkOperation("fetchOrigin", details, async () => {
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && git fetch --no-tags${pruneArg}${depthArg} origin${refArg}`,
        opts?.timeoutSeconds ?? 240,
      );
    });
  });
}

/** Fetches specific branch refs from origin, falling back to individual fetches on missing refs. */
export async function fetchBranchRefs(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
  branchNames: string[],
  opts?: { prune?: boolean; timeoutSeconds?: number; shallow?: boolean },
): Promise<string[]> {
  const details = `${owner}/${name}, branches=${branchNames.join(",")}, timeout=${opts?.timeoutSeconds ?? 240}, shallow=${opts?.shallow === true ? "true" : "false"}`;
  return await runLoggedGitStep("fetchBranchRefs", details, async () => {
    const normalized = normalizeBranchNames(branchNames);
    if (normalized.length === 0) {
      return [];
    }
    const githubToken = await getInstallationToken(installationId);
    const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
    const pruneArg = opts?.prune === false ? "" : " --prune";
    const depthArg = opts?.shallow ? " --depth=1" : "";
    const timeoutSeconds = opts?.timeoutSeconds ?? 240;
    const workspaceDir = workspaceDirShell();
    const refspecs = normalized.map(
      (b) => `+refs/heads/${b}:refs/remotes/origin/${b}`,
    );
    const refspecArgs = refspecs.map((r) => quote([r])).join(" ");
    const setupAndFetch = `cd ${workspaceDir} && git config --unset-all http.https://github.com/.extraheader 2>/dev/null; git remote set-url origin ${quote([repoUrl])} && git fetch --no-tags${depthArg}${pruneArg} origin`;
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
    );
  });
}

/** Syncs the sandbox repo with the remote using the given strategy. */
export async function syncRepo(
  sandbox: Sandbox,
  installationId: number,
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
      await fetchOrigin(sandbox, installationId, owner, name, undefined, {
        prune: true,
        timeoutSeconds: 180,
      });
      return;
    }
    await fetchBranchRefs(
      sandbox,
      installationId,
      owner,
      name,
      strategy.branchNames,
      {
        prune: false,
        timeoutSeconds: 60,
        shallow: true,
      },
    );
  });
}

/** Resolves the best available base ref: prefers origin/<base>, falls back to local, then HEAD. */
export async function resolveBaseTarget(
  sandbox: Sandbox,
  baseBranch: string,
): Promise<{ ref: string; source: "remote" | "local" | "head" }> {
  const workspaceDir = workspaceDirShell();
  const quotedRemoteRef = quote([`refs/remotes/origin/${baseBranch}`]);
  const quotedLocalRef = quote([`refs/heads/${baseBranch}`]);
  const output = (
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && if git rev-parse --verify --quiet ${quotedRemoteRef} >/dev/null; then printf remote; elif git rev-parse --verify --quiet ${quotedLocalRef} >/dev/null; then printf local; else printf head; fi`,
      10,
    )
  ).trim();
  if (output === "remote") {
    return { ref: `origin/${baseBranch}`, source: "remote" };
  }
  if (output === "local") {
    return { ref: baseBranch, source: "local" };
  }
  return { ref: "HEAD", source: "head" };
}

/** Checks out a session branch, creating it from a remote or base ref if needed. */
export async function checkoutSessionBranch(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const details = `branch=${branchName}, base=${baseBranch}`;
  await runLoggedGitStep("checkoutSessionBranch", details, async () => {
    const { ref: baseTarget } = await resolveBaseTarget(sandbox, baseBranch);
    const quotedBranch = quote([branchName]);
    const quotedRemoteBranch = quote([`origin/${branchName}`]);
    const quotedBase = quote([baseTarget]);
    const workspaceDir = workspaceDirShell();
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && (git stash --include-untracked 2>/dev/null || true) && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quotedRemoteBranch} || git checkout -b ${quotedBranch} ${quotedBase})`,
      30,
    );
  });
}

/** Checks out a base branch, preferring remote refs but falling back to local snapshot refs. */
export async function checkoutFetchedBaseBranch(
  sandbox: Sandbox,
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
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git checkout ${quotedBranch}`,
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

/** Resets the snapshot worktree to a clean state via hard reset and clean. */
export async function normalizeSnapshotWorktree(
  sandbox: Sandbox,
): Promise<void> {
  const workspaceDir = workspaceDirShell();
  await runLoggedGitStep(
    "normalizeSnapshotWorktree",
    WORKSPACE_DIR,
    async () => {
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git reset --hard HEAD && git clean -fd`,
        60,
      );
    },
  );
}

/** Installs project dependencies using the detected package manager. */
async function installDependencies(
  sandbox: Sandbox,
  pm: string,
): Promise<void> {
  const workspaceDir = workspaceDirShell();
  if (pm === "pnpm") {
    await exec(
      sandbox,
      `npm install -g pnpm && cd ${workspaceDir} && pnpm install`,
      PNPM_INSTALL_TIMEOUT_SECONDS,
    );
  } else if (pm === "yarn") {
    await exec(
      sandbox,
      `cd ${workspaceDir} && yarn install`,
      YARN_INSTALL_TIMEOUT_SECONDS,
    );
  } else {
    await exec(
      sandbox,
      `cd ${workspaceDir} && npm install`,
      NPM_INSTALL_TIMEOUT_SECONDS,
    );
  }
}

/** Downloads a repo archive for fast no-sync ephemeral bootstrap and initializes a local git repo. */
async function downloadRepoArchive(
  sandbox: Sandbox,
  installationId: number,
  owner: string,
  name: string,
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  const repo = await octokit.rest.repos.get({ owner, repo: name });
  const defaultBranch = repo.data.default_branch;
  const githubToken = await getInstallationToken(installationId);
  const archiveUrl = `https://api.github.com/repos/${owner}/${name}/tarball/${encodeURIComponent(defaultBranch)}`;
  const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
  logGit(
    `downloadRepoArchive: bootstrapping ${owner}/${name} from defaultBranch=${defaultBranch}`,
  );
  await exec(
    sandbox,
    `rm -rf ${quote([WORKSPACE_DIR])} ${quote([LEGACY_WORKSPACE_DIR])} /tmp/repo.tar.gz && mkdir -p ${quote([WORKSPACE_DIR])} && curl -fsSL -H ${quote([`Authorization: Bearer ${githubToken}`])} -H ${quote(["Accept: application/vnd.github+json"])} ${quote([archiveUrl])} -o /tmp/repo.tar.gz && tar -xzf /tmp/repo.tar.gz --strip-components=1 -C ${quote([WORKSPACE_DIR])} && rm -f /tmp/repo.tar.gz && cd ${quote([WORKSPACE_DIR])} && git init -b ${quote([defaultBranch])} && git remote add origin ${quote([repoUrl])} && git add -A && git commit --allow-empty -m "Initial checkout"`,
    180,
  );
}

/** Clones a GitHub repo into the sandbox and optionally installs dependencies. */
export async function cloneAndSetupRepo(
  sandbox: Sandbox,
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
    const repoUrl = buildGitHubRepoUrl(owner, name, githubToken);
    const cloneCommand = `rm -rf ${quote([WORKSPACE_DIR])} ${quote([LEGACY_WORKSPACE_DIR])} && GIT_TERMINAL_PROMPT=0 git clone --depth 1 --single-branch --no-tags ${quote([repoUrl])} ${quote([WORKSPACE_DIR])}`;
    const maxCloneAttempts = 3;
    for (let attempt = 1; attempt <= maxCloneAttempts; attempt += 1) {
      try {
        await execGitCommand(sandbox, cloneCommand, REPO_CLONE_TIMEOUT_SECONDS);
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

/** Sets up a working branch from the best available local base ref. */
export async function setupBranch(
  sandbox: Sandbox,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const details = `branch=${branchName}, base=${baseBranch}`;
  await runLoggedGitStep("setupBranch", details, async () => {
    const { ref: baseTarget, source } = await resolveBaseTarget(
      sandbox,
      baseBranch,
    );
    logGit(`setupBranch: using base source=${source} for branch=${branchName}`);
    const quotedBranch = quote([branchName]);
    const quotedRemote = quote([`origin/${branchName}`]);
    const quotedBase = quote([baseTarget]);
    const workspaceDir = workspaceDirShell();
    await execGitCommand(
      sandbox,
      `cd ${workspaceDir} && (git stash --include-untracked 2>/dev/null || true) && (git checkout ${quotedBranch} || git checkout -b ${quotedBranch} ${quotedRemote} || git checkout -b ${quotedBranch} ${quotedBase})`,
      15,
    );
    const currentBranch = (
      await execGitCommand(
        sandbox,
        `cd ${workspaceDir} && git branch --show-current`,
        5,
      )
    ).trim();
    if (currentBranch !== branchName) {
      throw new Error(
        `Failed to switch to branch ${branchName}, currently on: ${currentBranch}`,
      );
    }
    // Only merge base into branch if we found a real base ref (not HEAD fallback)
    const mergeCmd =
      source !== "head"
        ? `(git merge --ff-only ${quotedRemote} 2>/dev/null || true) && (git merge ${quotedBase} --no-edit --allow-unrelated-histories || git merge --abort 2>/dev/null || true)`
        : `(git merge --ff-only ${quotedRemote} 2>/dev/null || true)`;
    await execGitCommand(sandbox, `cd ${workspaceDir} && ${mergeCmd}`, 30);
  });
}

/** Creates a sandbox and prepares the repo by cloning or syncing from a snapshot. */
export async function createSandboxAndPrepareRepo(
  daytona: Daytona,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  volumes?: VolumeMount[],
  onSandboxAcquired?: (sandbox: Sandbox) => Promise<void>,
  onProgress?: (label: string) => Promise<void>,
  syncStrategy: RepoSyncStrategy = { mode: "all" },
): Promise<{ sandbox: Sandbox; usedSnapshot: boolean }> {
  let sandbox: Sandbox | undefined;
  try {
    const details = `${owner}/${name}, snapshot=${snapshotName ?? "none"}, syncStrategy=${syncStrategy.mode}`;
    return await runLoggedGitStep(
      "createSandboxAndPrepareRepo",
      details,
      async () => {
        if (onProgress) await onProgress("Creating sandbox...");
        sandbox = await createSandbox(
          daytona,
          installationId,
          sandboxEnvVars,
          lifecycle,
          snapshotName,
          volumes,
        );
        if (onSandboxAcquired) {
          await onSandboxAcquired(sandbox);
        }
        if (snapshotName) {
          await normalizeSnapshotWorktree(sandbox);
          if (syncStrategy.mode !== "none") {
            if (onProgress) await onProgress("Syncing repository...");
            await syncRepo(sandbox, installationId, owner, name, syncStrategy);
          }
          return { sandbox, usedSnapshot: true };
        }
        if (lifecycle.ephemeral && syncStrategy.mode === "none") {
          const activeSandbox = sandbox;
          if (onProgress) await onProgress("Downloading repository...");
          await runLoggedGitStep(
            "downloadRepoArchive",
            `${owner}/${name}`,
            async () => {
              await downloadRepoArchive(
                activeSandbox,
                installationId,
                owner,
                name,
              );
            },
          );
          return { sandbox: activeSandbox, usedSnapshot: false };
        }
        await cloneAndSetupRepo(
          sandbox,
          installationId,
          owner,
          name,
          !lifecycle.ephemeral,
          onProgress,
        );
        if (syncStrategy.mode !== "none") {
          if (onProgress) await onProgress("Syncing repository...");
          await syncRepo(sandbox, installationId, owner, name, syncStrategy);
        }
        return { sandbox, usedSnapshot: false };
      },
    );
  } catch (error) {
    if (sandbox) {
      try {
        await sandbox.delete();
      } catch {}
    }
    throw error;
  }
}

/** Resumes an existing sandbox or creates a new one with repo setup. */
export async function getOrCreateSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  installationId: number,
  owner: string,
  name: string,
  sandboxEnvVars: Record<string, string>,
  lifecycle: SandboxLifecycle,
  snapshotName?: string,
  volumes?: VolumeMount[],
  onProgress?: (label: string) => Promise<void>,
  syncStrategy: RepoSyncStrategy = { mode: "all" },
): Promise<{ sandbox: Sandbox; isNew: boolean }> {
  const details = `${owner}/${name}, existingSandboxId=${existingSandboxId ?? "none"}, snapshot=${snapshotName ?? "none"}, syncStrategy=${syncStrategy.mode}`;
  return await runLoggedGitStep("getOrCreateSandbox", details, async () => {
    if (existingSandboxId) {
      try {
        if (onProgress) await onProgress("Resuming sandbox...");
        const sandbox = await daytona.get(existingSandboxId);
        await ensureSandboxRunning(sandbox);
        if (syncStrategy.mode !== "none") {
          if (onProgress) await onProgress("Syncing repository...");
          await syncRepo(sandbox, installationId, owner, name, syncStrategy);
        }
        return { sandbox, isNew: false };
      } catch {
        // Sandbox was deleted/expired or sync failed, fall through to create a new one
      }
    }
    const { sandbox } = await createSandboxAndPrepareRepo(
      daytona,
      installationId,
      owner,
      name,
      sandboxEnvVars,
      lifecycle,
      snapshotName,
      volumes,
      undefined,
      onProgress,
      syncStrategy,
    );
    return { sandbox, isNew: true };
  });
}
