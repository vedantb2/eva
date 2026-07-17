"use node";

import { v } from "convex/values";
import { formatDurationMsShort } from "@conductor/shared/duration";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { DataModel, Id, Doc } from "../_generated/dataModel";
import {
  execHandle,
  resolveSandboxContext,
  resolveSandboxClientOnly,
  getDaytona,
  ensureSandboxRunning,
  ensureDockerDaemon,
  ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
  errorMessage,
  sleep,
  workspaceDirShell,
} from "./helpers";
import { resolveDaytonaApiKey } from "../envVarResolver";
import {
  setupBranch,
  checkoutSessionBranch,
  createSandboxAndPrepareRepo,
  fetchBranchRefs,
  resolveBaseTarget,
  copySandboxConfigFilesToWorkspace,
  SESSION_LIFECYCLE,
} from "./git";
import { ensureGitCredentialHelper } from "./gitCredentials";
import {
  unwrapDaytonaSandbox,
  wrapDaytonaSandbox,
} from "../_sandbox/daytonaProvider";
import type { SandboxClient, SandboxHandle } from "../_sandbox/provider";
import { ensureSessionPersistenceVolumes } from "./volumes";
import { resolveExistingSandboxId } from "../_sandbox/resolveExistingSandboxId";
import {
  detectPackageManager,
  resetDevTerminalForResume,
  startSessionServices,
  launchDevServerInBackground,
} from "./devServer";
import type { Daytona, Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import { startDesktopWithChrome } from "./desktop";

/** Per-app dev server overrides loaded from the githubRepos doc. */
function devOverrides(
  repo: Doc<"githubRepos"> | null,
): { devPort?: number; devCommand?: string } | undefined {
  if (!repo) return undefined;
  if (repo.devPort === undefined && repo.devCommand === undefined)
    return undefined;
  return { devPort: repo.devPort, devCommand: repo.devCommand };
}

/** Logs a session-scoped message with the daytona/sessions prefix. */
function logSession(message: string): void {
  console.log(`[daytona][sessions] ${message}`);
}

/** Runs an async step with timing logs and error reporting. */
async function runLoggedSessionStep<T>(
  label: string,
  details: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  logSession(`${label} started${details ? ` (${details})` : ""}`);
  try {
    const result = await fn();
    logSession(
      `${label} completed in ${formatDurationMsShort(Date.now() - startedAt)}${details ? ` (${details})` : ""}`,
    );
    return result;
  } catch (error) {
    console.error(
      `[daytona][sessions] ${label} failed after ${formatDurationMsShort(Date.now() - startedAt)}${details ? ` (${details})` : ""}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/** Checks whether a git error message indicates a transient/retryable failure. */
function isRetryableSessionGitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("sandbox exec") && lower.includes("timed out")) ||
    lower.includes("command execution timeout") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("socket hang up") ||
    lower.includes("network") ||
    lower.includes("status code 502") ||
    lower.includes("status code 503") ||
    lower.includes("status code 504") ||
    lower.includes("gnutls recv error") ||
    lower.includes("tls connection was non-properly terminated") ||
    lower.includes("remote end hung up unexpectedly") ||
    lower.includes("http/2 stream") ||
    lower.includes("early eof") ||
    lower.includes("connection reset by peer") ||
    lower.includes("rpc failed")
  );
}

/** Resolves and logs the base ref target for a session branch. */
async function resolveSessionBaseRef(
  sandbox: SandboxHandle,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const { source } = await resolveBaseTarget(sandbox, baseBranch);
  logSession(
    `resolveSessionBaseRef source=${source} (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
}

/** Checks out a session branch with automatic retry on transient git errors. */
async function checkoutSessionBranchWithRetry(
  sandbox: SandboxHandle,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await checkoutSessionBranch(sandbox, branchName, baseBranch);
      if (attempt > 1) {
        logSession(
          `checkoutSessionBranchWithRetry recovered on retry ${attempt}/${maxAttempts} (branch=${branchName}, base=${baseBranch})`,
        );
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canRetry =
        attempt < maxAttempts && isRetryableSessionGitError(message);
      if (!canRetry) {
        throw error;
      }
      const delayMs = 1000 * attempt;
      logSession(
        `checkoutSessionBranchWithRetry retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts}, branch=${branchName}, base=${baseBranch}): ${message}`,
      );
      await sleep(delayMs);
    }
  }
}

/**
 * Thrown by a resume/start when the user has requested a stop mid-flight. The
 * start action catches it, ensures the (possibly woken) VM is stopped, and
 * defers the terminal status to the stop flow — so a Stop that races a Start
 * never leaves a live orphan VM, a stuck `stopping` row, or a false
 * "Sandbox Error" for what was really a stop.
 */
class SandboxStartAbortedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxStartAbortedError";
  }
}

/** True once the user has requested this session stop/close (Stop clicked). */
async function sessionStopRequested(
  ctx: GenericActionCtx<DataModel>,
  sessionId: Id<"sessions">,
): Promise<boolean> {
  const session = await ctx.runQuery(internal.sessions.getInternal, {
    id: sessionId,
  });
  return (
    !session || session.status === "stopping" || session.status === "closed"
  );
}

/** True once the user has requested this task's sandbox stop/close. */
async function taskStopRequested(
  ctx: GenericActionCtx<DataModel>,
  taskId: Id<"agentTasks">,
): Promise<boolean> {
  const task = await ctx.runQuery(internal.agentTasks.getInternal, {
    id: taskId,
  });
  return (
    !task ||
    task.reviewTaskSandboxStatus === "stopping" ||
    task.reviewTaskSandboxStatus === "closed"
  );
}

/** True once the user has requested this project's sandbox stop/close. */
async function projectStopRequested(
  ctx: GenericActionCtx<DataModel>,
  projectId: Id<"projects">,
): Promise<boolean> {
  const project = await ctx.runQuery(internal.projects.getInternal, {
    id: projectId,
  });
  return (
    !project ||
    project.reviewProjectSandboxStatus === "stopping" ||
    project.reviewProjectSandboxStatus === "closed"
  );
}

/** True once the user has requested this design session's sandbox stop/close. */
async function designStopRequested(
  ctx: GenericActionCtx<DataModel>,
  designSessionId: Id<"designSessions">,
): Promise<boolean> {
  const session = await ctx.runQuery(internal.designSessions.getInternal, {
    id: designSessionId,
  });
  return (
    !session || session.status === "stopping" || session.status === "closed"
  );
}

/**
 * Shared resume ordering for reused sandboxes across session/task/project
 * reuse flows. Owns the drift-prone sequence so a fix lands in one place, not
 * four: wait for the VM (skipping docker + the ~14s post-resume exec probe),
 * unlock the UI via `onEarlyReady` as soon as it reports running, then start
 * docker, self-heal the git credential helper, and check out the branch.
 *
 * Callers supply the entity-specific progress message (`onRestoring`), the
 * early-ready mutation (`onEarlyReady`), and a `shouldAbort` predicate that
 * reports the user's stop intent. `shouldAbort` is polled before waking the VM
 * and before each post-wake exec, so a Stop that races this resume aborts
 * (throwing {@link SandboxStartAbortedError}) instead of running commands
 * against a stopping sandbox (which 422s) or resurrecting a stopped one.
 */
async function resumeReusedSandbox(
  ctx: GenericActionCtx<DataModel>,
  handle: SandboxHandle,
  opts: {
    installationId: number;
    branchName: string;
    baseBranch: string;
    onRestoring: () => Promise<void>;
    onEarlyReady: () => Promise<void>;
    shouldAbort?: () => Promise<boolean>;
  },
): Promise<void> {
  const abortIfStopRequested = async (): Promise<void> => {
    if (opts.shouldAbort && (await opts.shouldAbort())) {
      throw new SandboxStartAbortedError(
        `resume aborted: stop requested for sandbox ${handle.id}`,
      );
    }
  };
  // Don't wake a VM the user has already asked to stop.
  await abortIfStopRequested();
  await ensureSandboxRunning(handle, {
    timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
    skipDocker: true,
    // Skip the ~14s post-resume exec probe: start() already verified the
    // session reports running, and the git steps right after early-ready
    // surface any real failure.
    skipExecProbe: true,
    onRestoring: opts.onRestoring,
  });
  // A Stop may have landed while start() was waking the VM — bail before the
  // exec steps rather than run commands against a now-stopping sandbox.
  await abortIfStopRequested();
  // Unlock chat/tabs as soon as the VM is up — docker/git/services continue.
  await opts.onEarlyReady();
  await ensureDockerDaemon(handle);
  await abortIfStopRequested();
  // Self-heal: rotate the per-sandbox secret + reinstall the helper every
  // resume so in-sandbox `git pull` and any subsequent fetch authenticate
  // without relying on a stale URL-embedded token.
  await ensureGitCredentialHelper(ctx, handle, opts.installationId);
  await checkoutSessionBranchWithRetry(
    handle,
    opts.branchName,
    opts.baseBranch,
  );
}

/** Syncs remote refs for session restore, falling back to base branch if session branch is missing. */
async function syncSessionRefsForRestore(
  sandbox: SandboxHandle,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  let fetchedSessionBranches: string[] = [];
  try {
    fetchedSessionBranches = await fetchBranchRefs(
      sandbox,
      repoOwner,
      repoName,
      [branchName],
      {
        prune: false,
        timeoutSeconds: 60,
        retryAttempts: 1,
      },
    );
  } catch (error) {
    logSession(
      `syncSessionRefsForRestore session branch fetch failed, continuing with local snapshot refs (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  logSession(
    `syncSessionRefsForRestore fetched session branch candidates=${fetchedSessionBranches.join(",") || "none"} (repo=${repoOwner}/${repoName}, branch=${branchName})`,
  );
  if (fetchedSessionBranches.includes(branchName)) {
    logSession(
      `syncSessionRefsForRestore fetched existing remote session branch (repo=${repoOwner}/${repoName}, branch=${branchName})`,
    );
    return;
  }
  logSession(
    `syncSessionRefsForRestore remote session branch missing, falling back to base branch restore (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
  await resolveSessionBaseRef(
    sandbox,
    repoOwner,
    repoName,
    branchName,
    baseBranch,
  );
}

/** Fetches both base and design branch refs for initial design session setup. */
async function syncDesignRefsForSetup(
  sandbox: SandboxHandle,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const fetchedBranches = await fetchBranchRefs(
    sandbox,
    repoOwner,
    repoName,
    [baseBranch, branchName],
    {
      prune: false,
      timeoutSeconds: 240,
      retryAttempts: 1,
    },
  );
  const designBranchExists = fetchedBranches.includes(branchName);
  logSession(
    `syncDesignRefsForSetup fetched branch candidates=${fetchedBranches.join(",") || "none"} (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
  logSession(
    designBranchExists
      ? `syncDesignRefsForSetup fetched base and existing design branch (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`
      : `syncDesignRefsForSetup fetched base branch only (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
}

/** Installs project dependencies after snapshot restore, with retry on transient failures. */
async function installSnapshotDependenciesWithRetry(
  sandbox: SandboxHandle,
  rootDir: string,
): Promise<void> {
  const maxAttempts = 3;
  const pm = await detectPackageManager(sandbox, rootDir);
  const workspaceRoot = workspaceDirShell();
  const dir = rootDir ? `${workspaceRoot}/${rootDir}` : workspaceRoot;
  // pnpm workspaces must install from the lockfile root (usually the repo root),
  // not from a nested app rootDirectory that only has package.json.
  const installCwd = pm === "pnpm" ? workspaceRoot : dir;
  const installCommand =
    pm === "pnpm"
      ? `npm install -g pnpm && cd ${installCwd} && pnpm install`
      : pm === "yarn"
        ? `cd ${installCwd} && yarn install`
        : `cd ${installCwd} && npm install`;
  const timeoutSeconds = pm === "pnpm" ? 240 : 180;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await execHandle(sandbox, installCommand, timeoutSeconds);
      if (attempt > 1) {
        logSession(
          `installSnapshotDependenciesWithRetry recovered on retry ${attempt}/${maxAttempts} (rootDir=${rootDir || "."}, pm=${pm})`,
        );
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canRetry =
        attempt < maxAttempts && isRetryableSessionGitError(message);
      if (!canRetry) {
        throw error;
      }
      const delayMs = 1000 * attempt;
      logSession(
        `installSnapshotDependenciesWithRetry retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts}, rootDir=${rootDir || "."}, pm=${pm}): ${message}`,
      );
      await sleep(delayMs);
    }
  }
}

function isSandboxGoneMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("does not exist") ||
    lower.includes("no such") ||
    lower.includes("404") ||
    lower.includes("deleted")
  );
}

type TryReuseSandboxOptions = {
  fallbackOnPrepareError?: boolean;
};

/**
 * Attempts to reuse an existing sandbox by running a preparation function on it.
 * Only a missing/deleted sandbox should fall through to creating a replacement;
 * failed preparation on a found sandbox usually means the old filesystem is
 * still the user's source of truth and must not be silently abandoned.
 *
 * `label` prefixes the diagnostic logs so the Daytona and provider-neutral
 * wrappers below stay distinguishable in the logs.
 */
async function tryReuseSandboxWith<T>(
  label: string,
  get: (id: string) => Promise<T>,
  existingSandboxId: string | undefined,
  prepareFn: (sandbox: T) => Promise<void>,
  options?: TryReuseSandboxOptions,
): Promise<T | null> {
  if (!existingSandboxId) return null;
  let sandbox: T;
  try {
    sandbox = await get(existingSandboxId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSandboxGoneMessage(message)) {
      logSession(
        `${label} found missing sandbox ${existingSandboxId}; creating replacement`,
      );
      return null;
    }
    throw error;
  }

  try {
    await prepareFn(sandbox);
  } catch (error) {
    if (options?.fallbackOnPrepareError === false) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    logSession(
      `${label} preparation failed for ${existingSandboxId}; creating replacement: ${message}`,
    );
    return null;
  }

  return sandbox;
}

/** Reuse a raw Daytona sandbox by id (see {@link tryReuseSandboxWith}). */
function tryReuseSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  prepareFn: (sandbox: Sandbox) => Promise<void>,
  options?: TryReuseSandboxOptions,
): Promise<Sandbox | null> {
  return tryReuseSandboxWith(
    "tryReuseSandbox",
    (id) => daytona.get(id),
    existingSandboxId,
    prepareFn,
    options,
  );
}

/** Reuse a provider-neutral sandbox handle by id (see {@link tryReuseSandboxWith}). */
function tryReuseSandboxHandle(
  client: SandboxClient,
  existingSandboxId: string | undefined,
  prepareFn: (sandbox: SandboxHandle) => Promise<void>,
  options?: TryReuseSandboxOptions,
): Promise<SandboxHandle | null> {
  return tryReuseSandboxWith(
    "tryReuseSandboxHandle",
    (id) => client.get(id),
    existingSandboxId,
    prepareFn,
    options,
  );
}

/**
 * Lazily resolves a Daytona client for a repo, memoizing the result so
 * repeated Daytona-only steps (reuse, persistence volumes) within one
 * preparation call share a single resolution. Callers must only invoke the
 * returned function inside a `client.kind !== "vercel"` branch — resolving a
 * Daytona API key on a Vercel-configured repo would throw for no reason.
 */
function createLazyDaytonaClient(
  ctx: GenericActionCtx<DataModel>,
  repoId: Id<"githubRepos">,
): () => Promise<Daytona> {
  let daytonaPromise: Promise<Daytona> | undefined;
  return () => {
    if (!daytonaPromise) {
      daytonaPromise = resolveDaytonaApiKey(ctx, repoId).then((result) =>
        getDaytona(result.daytonaApiKey),
      );
    }
    return daytonaPromise;
  };
}

type SessionSandboxPreparationArgs = {
  sessionId: Id<"sessions">;
  existingSandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  repoId: Id<"githubRepos">;
  startDesktop: boolean;
};

type PreparedSessionSandbox = {
  sandbox: SandboxHandle;
  isNew: boolean;
  usedSnapshot: boolean;
  sandboxDetails: string;
  branchName: string;
  devPort: number;
  devCommand: string;
  /** Set to the sandbox id when the provider is Vercel; undefined for Daytona. */
  vercelSandboxId: string | undefined;
};

type ProgressStep = { type: string; label: string; status: string };

/** Emits progress steps to a streaming entity for UI updates. */
async function emitProgress(
  ctx: GenericActionCtx<DataModel>,
  entityId: string,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  const steps = [
    ...completedSteps,
    { type: "tool", label: activeLabel, status: "active" },
  ];
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId,
    currentActivity: JSON.stringify(steps),
  });
}

/** Clears the streaming activity for an entity when startup is done. */
async function clearProgress(
  ctx: GenericActionCtx<DataModel>,
  entityId: string,
): Promise<void> {
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId,
    currentActivity: JSON.stringify([]),
  });
}

/** Emits session sandbox startup progress steps to streaming for UI updates. */
function emitSessionProgress(
  ctx: GenericActionCtx<DataModel>,
  sessionId: Id<"sessions">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  return emitProgress(
    ctx,
    `session-startup-${sessionId}`,
    completedSteps,
    activeLabel,
  );
}

/** Marks the final step complete and clears streaming. */
function completeSessionProgress(
  ctx: GenericActionCtx<DataModel>,
  sessionId: Id<"sessions">,
): Promise<void> {
  return clearProgress(ctx, `session-startup-${sessionId}`);
}

/** Emits task sandbox startup progress steps to streaming for UI updates. */
function emitTaskProgress(
  ctx: GenericActionCtx<DataModel>,
  taskId: Id<"agentTasks">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  return emitProgress(
    ctx,
    `task-sandbox-startup-${taskId}`,
    completedSteps,
    activeLabel,
  );
}

/** Clears task sandbox startup streaming when done. */
function completeTaskProgress(
  ctx: GenericActionCtx<DataModel>,
  taskId: Id<"agentTasks">,
): Promise<void> {
  return clearProgress(ctx, `task-sandbox-startup-${taskId}`);
}

/** Emits project sandbox startup progress steps to streaming for UI updates. */
function emitProjectProgress(
  ctx: GenericActionCtx<DataModel>,
  projectId: Id<"projects">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  return emitProgress(
    ctx,
    `project-sandbox-startup-${projectId}`,
    completedSteps,
    activeLabel,
  );
}

/** Clears project sandbox startup streaming when done. */
function completeProjectProgress(
  ctx: GenericActionCtx<DataModel>,
  projectId: Id<"projects">,
): Promise<void> {
  return clearProgress(ctx, `project-sandbox-startup-${projectId}`);
}

/** Core logic for preparing a session sandbox: reuses existing or creates new, syncs refs, and starts services. */
async function prepareSessionSandboxInternal(
  ctx: GenericActionCtx<DataModel>,
  args: SessionSandboxPreparationArgs,
): Promise<PreparedSessionSandbox> {
  // Total wall-clock budget for this call, logged at every exit point below
  // so slow session starts can be attributed to reuse vs. fresh-create vs.
  // provider without re-deriving it from scattered per-step timings.
  const startedAt = Date.now();
  const actionDetails = `sessionId=${args.sessionId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
  const completedSteps: ProgressStep[] = [];

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Loading repository config...",
  );
  const repo = await runLoggedSessionStep(
    "loadSessionRepo",
    actionDetails,
    () =>
      ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      }),
  );
  const rootDir = repo?.rootDirectory ?? "";
  completedSteps.push({
    type: "tool",
    label: "Loading repository config...",
    status: "complete",
  });

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Resolving sandbox context...",
  );
  // Resume path: credentials-only client (no full env decrypt). Full context
  // (env map + snapshot) loads only if reuse fails and we create.
  const client = await runLoggedSessionStep(
    "resolveSessionSandboxClient",
    actionDetails,
    () => resolveSandboxClientOnly(ctx, args.repoId),
  );
  // Sandbox reuse and persistence volumes remain Daytona-only; resolve a raw
  // Daytona client lazily (never invoked on the Vercel path) for those paths
  // while the create path uses the neutral client.
  const getDaytonaClient = createLazyDaytonaClient(ctx, args.repoId);
  // Vercel sandboxes are only ever reused via `vercelSandboxId` — a stale
  // Daytona `sandboxId` on the entity must never be treated as reusable here.
  const reuseId = resolveExistingSandboxId({
    providerKind: client.kind,
    sandboxId: args.existingSandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  logSession(
    `prepareSessionSandbox client resolved (${actionDetails}, rootDir=${rootDir || "."})`,
  );
  completedSteps.push({
    type: "tool",
    label: "Resolving sandbox context...",
    status: "complete",
  });

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Checking existing sandbox...",
  );
  let reusedResult: PreparedSessionSandbox | null = null;
  if (client.kind === "vercel") {
    const reusedHandle = await runLoggedSessionStep(
      "tryReuseSessionSandbox",
      actionDetails,
      () =>
        tryReuseSandboxHandle(
          client,
          reuseId,
          async (handle) => {
            const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}`;
            await runLoggedSessionStep(
              "reuseSessionSandbox.prepare",
              sandboxDetails,
              () =>
                resumeReusedSandbox(ctx, handle, {
                  installationId: args.installationId,
                  branchName: args.branchName,
                  baseBranch: args.baseBranch,
                  onRestoring: () =>
                    emitSessionProgress(
                      ctx,
                      args.sessionId,
                      completedSteps,
                      // Vercel resume is snapshot wake, not Daytona cold storage.
                      "Resuming sandbox...",
                    ),
                  onEarlyReady: async () => {
                    await ctx.runMutation(internal.sessions.sandboxReady, {
                      sessionId: args.sessionId,
                      sandboxId: handle.id,
                      vercelSandboxId: handle.id,
                      branchName: args.branchName,
                      isNew: false,
                      usedSnapshot: false,
                    });
                  },
                  shouldAbort: () => sessionStopRequested(ctx, args.sessionId),
                }),
            );
            await runLoggedSessionStep(
              "reuseSessionSandbox.setupBranch",
              sandboxDetails,
              () => setupBranch(handle, args.branchName, args.baseBranch),
            );
            await runLoggedSessionStep(
              "reuseSessionSandbox.copyConfigFiles",
              sandboxDetails,
              () => copySandboxConfigFilesToWorkspace(handle),
            );
            const { port: devPort, devCommand } = await runLoggedSessionStep(
              "reuseSessionSandbox.startSessionServices",
              sandboxDetails,
              () => startSessionServices(handle, rootDir, devOverrides(repo)),
            );
            if (args.startDesktop) {
              await runLoggedSessionStep(
                "reuseSessionSandbox.startDesktop",
                sandboxDetails,
                () => startDesktopWithChrome(handle),
              );
            }
            await emitSessionProgress(
              ctx,
              args.sessionId,
              completedSteps,
              "Launching background commands...",
            );
            let reuseBgRan = false;
            await runLoggedSessionStep(
              "reuseSessionSandbox.runBackgroundCommands",
              sandboxDetails,
              async () => {
                const result = await ctx.runAction(
                  internal.daytona.runBackgroundCommands,
                  { sandboxId: handle.id, repoId: args.repoId },
                );
                reuseBgRan = result.ran;
                if (result.ran && result.commandCount > 0) {
                  logSession(
                    `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
                  );
                }
              },
            );
            if (reuseBgRan) {
              completedSteps.push({
                type: "tool",
                label: "Launching background commands...",
                status: "complete",
              });
            }
            await runLoggedSessionStep(
              "reuseSessionSandbox.runStartupCommands",
              sandboxDetails,
              async () => {
                const result = await ctx.runAction(
                  internal.daytona.runStartupCommands,
                  { sandboxId: handle.id, repoId: args.repoId },
                );
                if (result.ran && result.commandCount > 0) {
                  logSession(
                    `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
                  );
                }
              },
            );
            reusedResult = {
              sandbox: handle,
              isNew: false,
              usedSnapshot: false,
              sandboxDetails,
              branchName: args.branchName,
              devPort,
              devCommand,
              vercelSandboxId: handle.id,
            };
          },
          // Never silently create a replacement when the existing sandbox is
          // still reachable — that orphans the old VM and loses workspace state.
          { fallbackOnPrepareError: false },
        ),
    );
    if (reusedHandle && reusedResult) {
      await completeSessionProgress(ctx, args.sessionId);
      logSession(
        `prepareSessionSandboxInternal summary: elapsed=${formatDurationMsShort(Date.now() - startedAt)}, path=vercel-reuse, isNew=false, usedSnapshot=false (${actionDetails})`,
      );
      return reusedResult;
    }
  }
  const reused =
    client.kind === "vercel"
      ? null
      : await runLoggedSessionStep(
          "tryReuseSessionSandbox",
          actionDetails,
          async () =>
            tryReuseSandbox(
              await getDaytonaClient(),
              reuseId,
              async (sandbox) => {
                const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}`;
                const handle = wrapDaytonaSandbox(sandbox);
                await runLoggedSessionStep(
                  "reuseSessionSandbox.prepare",
                  sandboxDetails,
                  () =>
                    resumeReusedSandbox(ctx, handle, {
                      installationId: args.installationId,
                      branchName: args.branchName,
                      baseBranch: args.baseBranch,
                      onRestoring: () =>
                        emitSessionProgress(
                          ctx,
                          args.sessionId,
                          completedSteps,
                          "Restoring sandbox from cold storage (can take up to 10 minutes)...",
                        ),
                      onEarlyReady: async () => {
                        await ctx.runMutation(internal.sessions.sandboxReady, {
                          sessionId: args.sessionId,
                          sandboxId: sandbox.id,
                          branchName: args.branchName,
                          isNew: false,
                          usedSnapshot: false,
                        });
                      },
                      shouldAbort: () =>
                        sessionStopRequested(ctx, args.sessionId),
                    }),
                );
                await runLoggedSessionStep(
                  "reuseSessionSandbox.setupBranch",
                  sandboxDetails,
                  () =>
                    setupBranch(
                      wrapDaytonaSandbox(sandbox),
                      args.branchName,
                      args.baseBranch,
                    ),
                );
                // Restore baked config files from /home/eva/sandbox-config into the workspace.
                // The snapshot ships them; this re-copies in case `git clean -fd` wiped them.
                await runLoggedSessionStep(
                  "reuseSessionSandbox.copyConfigFiles",
                  sandboxDetails,
                  () =>
                    copySandboxConfigFilesToWorkspace(
                      wrapDaytonaSandbox(sandbox),
                    ),
                );
                const { port: devPort, devCommand } =
                  await runLoggedSessionStep(
                    "reuseSessionSandbox.startSessionServices",
                    sandboxDetails,
                    () =>
                      startSessionServices(
                        wrapDaytonaSandbox(sandbox),
                        rootDir,
                        devOverrides(repo),
                      ),
                  );
                await runLoggedSessionStep(
                  "reuseSessionSandbox.resetDevTerminal",
                  sandboxDetails,
                  () =>
                    resetDevTerminalForResume(
                      sandbox,
                      `session-${args.sessionId}`,
                    ),
                );
                if (args.startDesktop) {
                  await runLoggedSessionStep(
                    "reuseSessionSandbox.startDesktop",
                    sandboxDetails,
                    () => startDesktopWithChrome(wrapDaytonaSandbox(sandbox)),
                  );
                }
                await emitSessionProgress(
                  ctx,
                  args.sessionId,
                  completedSteps,
                  "Launching background commands...",
                );
                let reuseBgRan = false;
                await runLoggedSessionStep(
                  "reuseSessionSandbox.runBackgroundCommands",
                  sandboxDetails,
                  async () => {
                    const result = await ctx.runAction(
                      internal.daytona.runBackgroundCommands,
                      { sandboxId: sandbox.id, repoId: args.repoId },
                    );
                    reuseBgRan = result.ran;
                    if (result.ran && result.commandCount > 0) {
                      logSession(
                        `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
                      );
                    }
                  },
                );
                if (reuseBgRan) {
                  completedSteps.push({
                    type: "tool",
                    label: "Launching background commands...",
                    status: "complete",
                  });
                }
                // Note: runStartupCommands is intentionally not surfaced as a UI step
                // on the reuse path — the marker file (`/tmp/.startup-commands-done`)
                // makes it a no-op once the sandbox has been initialised, so showing
                // "Running startup commands..." would be misleading on resume.
                await runLoggedSessionStep(
                  "reuseSessionSandbox.runStartupCommands",
                  sandboxDetails,
                  async () => {
                    const result = await ctx.runAction(
                      internal.daytona.runStartupCommands,
                      { sandboxId: sandbox.id, repoId: args.repoId },
                    );
                    if (result.ran && result.commandCount > 0) {
                      logSession(
                        `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
                      );
                    }
                  },
                );
                reusedResult = {
                  sandbox: wrapDaytonaSandbox(sandbox),
                  isNew: false,
                  usedSnapshot: false,
                  sandboxDetails,
                  branchName: args.branchName,
                  devPort,
                  devCommand,
                  vercelSandboxId: undefined,
                };
              },
              { fallbackOnPrepareError: false },
            ),
        );
  if (reused && reusedResult) {
    await completeSessionProgress(ctx, args.sessionId);
    logSession(
      `prepareSessionSandboxInternal summary: elapsed=${formatDurationMsShort(Date.now() - startedAt)}, path=daytona-reuse, isNew=false, usedSnapshot=false (${actionDetails})`,
    );
    return reusedResult;
  }
  completedSteps.push({
    type: "tool",
    label: "Checking existing sandbox...",
    status: "complete",
  });

  // Create path needs full env map + snapshot — load only after reuse failed.
  const { sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveSessionSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    client.kind === "vercel"
      ? "Creating sandbox..."
      : "Setting up persistence volumes...",
  );
  const sessionVolumeMounts =
    client.kind === "vercel"
      ? []
      : await runLoggedSessionStep(
          "ensureSessionPersistenceVolumes",
          actionDetails,
          async () =>
            ensureSessionPersistenceVolumes(
              await getDaytonaClient(),
              args.repoId,
              "sessions",
              args.sessionId,
            ),
        );
  if (client.kind !== "vercel") {
    completedSteps.push({
      type: "tool",
      label: "Setting up persistence volumes...",
      status: "complete",
    });
  }

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Creating sandbox...",
  );
  // Mark the session active as soon as the sandbox exists so the UI can chat /
  // open tabs while branch checkout + services finish in the background.
  // Snapshot restore is sub-second; the remaining work is what used to make
  // "new session" feel like 10–60s.
  let earlyReadyEmitted = false;
  const prepared = await runLoggedSessionStep(
    "createSessionSandboxAndPrepareRepo",
    `${actionDetails}, snapshot=${snapshotName ?? "none"}`,
    () =>
      createSandboxAndPrepareRepo(
        ctx,
        client,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        SESSION_LIFECYCLE,
        snapshotName,
        sessionVolumeMounts,
        async (sandbox) => {
          if (earlyReadyEmitted) return;
          earlyReadyEmitted = true;
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: sandbox.id,
            vercelSandboxId: client.kind === "vercel" ? sandbox.id : undefined,
            branchName: args.branchName,
            isNew: true,
            usedSnapshot: Boolean(snapshotName),
          });
        },
        undefined,
        { mode: "none" },
      ),
  );
  const handle = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
  // Any setup step below (ref sync, branch checkout, config restore, seeded-
  // runtime restore, dev server) can throw. This is the new-session path — the
  // sandbox was just created here — so delete it on failure before rethrowing,
  // else it leaks server-side (Daytona keeps it running, nothing references it).
  try {
    completedSteps.push({
      type: "tool",
      label: "Creating sandbox...",
      status: "complete",
    });

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Syncing repository refs...",
    );
    await runLoggedSessionStep(
      "newSessionSandbox.syncSessionRefsForRestore",
      sandboxDetails,
      () =>
        syncSessionRefsForRestore(
          handle,
          args.repoOwner,
          args.repoName,
          args.branchName,
          args.baseBranch,
        ),
    );
    completedSteps.push({
      type: "tool",
      label: "Syncing repository refs...",
      status: "complete",
    });

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Checking out branch...",
    );
    await runLoggedSessionStep(
      "newSessionSandbox.checkoutSessionBranch",
      sandboxDetails,
      () =>
        checkoutSessionBranchWithRetry(
          handle,
          args.branchName,
          args.baseBranch,
        ),
    );
    completedSteps.push({
      type: "tool",
      label: "Checking out branch...",
      status: "complete",
    });

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Preparing branch...",
    );
    await runLoggedSessionStep(
      "newSessionSandbox.setupBranch",
      sandboxDetails,
      () => setupBranch(handle, args.branchName, args.baseBranch),
    );
    completedSteps.push({
      type: "tool",
      label: "Preparing branch...",
      status: "complete",
    });

    // Restore baked config files from /home/eva/sandbox-config into the workspace.
    // Skipped when usedSnapshot: createSandboxAndPrepareRepo already ran this
    // exact copy (force: true) on the snapshot-restore path, and the
    // checkout/setupBranch steps above don't touch untracked files, so
    // re-copying here would be a pure duplicate on the common Vercel path.
    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Restoring config files...",
    );
    if (!prepared.usedSnapshot) {
      await runLoggedSessionStep(
        "newSessionSandbox.copyConfigFiles",
        sandboxDetails,
        () =>
          copySandboxConfigFilesToWorkspace(handle, {
            force: true,
          }),
      );
    }
    completedSteps.push({
      type: "tool",
      label: "Restoring config files...",
      status: "complete",
    });

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Starting dev server...",
    );
    const { port: devPort, devCommand } = await runLoggedSessionStep(
      "newSessionSandbox.startSessionServices",
      sandboxDetails,
      () => startSessionServices(handle, rootDir, devOverrides(repo)),
    );
    completedSteps.push({
      type: "tool",
      label: "Starting dev server...",
      status: "complete",
    });

    if (args.startDesktop) {
      await emitSessionProgress(
        ctx,
        args.sessionId,
        completedSteps,
        "Starting desktop environment...",
      );
      await runLoggedSessionStep(
        "newSessionSandbox.startDesktop",
        sandboxDetails,
        () => startDesktopWithChrome(handle),
      );
      completedSteps.push({
        type: "tool",
        label: "Starting desktop environment...",
        status: "complete",
      });
    }

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Launching background commands...",
    );
    let bgRan = false;
    await runLoggedSessionStep(
      "newSessionSandbox.runBackgroundCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runBackgroundCommands,
          { sandboxId: handle.id, repoId: args.repoId },
        );
        bgRan = result.ran;
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    if (bgRan) {
      completedSteps.push({
        type: "tool",
        label: "Launching background commands...",
        status: "complete",
      });
    }

    await emitSessionProgress(
      ctx,
      args.sessionId,
      completedSteps,
      "Running startup commands...",
    );
    await runLoggedSessionStep(
      "newSessionSandbox.runStartupCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runStartupCommands,
          {
            sandboxId: handle.id,
            repoId: args.repoId,
            // Seeded snapshots ship `/tmp/.startup-commands-done` from the build;
            // force re-bootstrap on every fresh session sandbox so dockerd and
            // local services come back after Vercel snapshot restore.
            force: prepared.usedSnapshot ? true : undefined,
          },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    completedSteps.push({
      type: "tool",
      label: "Running startup commands...",
      status: "complete",
    });

    await runLoggedSessionStep(
      "newSessionSandbox.launchDevServer",
      sandboxDetails,
      () => launchDevServerInBackground(handle, devCommand, devPort),
    );

    await completeSessionProgress(ctx, args.sessionId);
    logSession(
      `prepareSessionSandboxInternal summary: elapsed=${formatDurationMsShort(Date.now() - startedAt)}, path=new, isNew=true, usedSnapshot=${prepared.usedSnapshot} (${sandboxDetails})`,
    );
    return {
      sandbox: handle,
      isNew: true,
      usedSnapshot: prepared.usedSnapshot,
      sandboxDetails,
      branchName: args.branchName,
      devPort,
      devCommand,
      vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
    };
  } catch (setupError) {
    console.warn(
      `[daytona][sessions] deleting failed new session sandbox ${handle.id}: ${errorMessage(setupError, "setup failed")}`,
    );
    try {
      await handle.delete();
    } catch {}
    await ctx.runMutation(internal.sandboxGitCredentials.deleteBySandboxId, {
      sandboxId: handle.id,
    });
    throw setupError;
  }
}

/** Starts a session sandbox end-to-end and notifies the session of readiness or error. */
export const startSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actionStartedAt = Date.now();
    const actionDetails = `sessionId=${args.sessionId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
    logSession(`startSessionSandbox invoked (${actionDetails})`);
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startSessionSandbox");
      }
      // User may have clicked Stop after this action was scheduled. Abort before
      // any resume:true / create — otherwise we wake a VM the UI already left.
      const sessionBefore = await ctx.runQuery(internal.sessions.getInternal, {
        id: args.sessionId,
      });
      if (
        sessionBefore &&
        (sessionBefore.status === "stopping" ||
          sessionBefore.status === "closed")
      ) {
        console.log(
          `[daytona][sessions] startSessionSandbox aborted sessionId=${args.sessionId} status=${sessionBefore.status}`,
        );
        return null;
      }
      const prepared = await prepareSessionSandboxInternal(ctx, {
        sessionId: args.sessionId,
        existingSandboxId: args.existingSandboxId,
        vercelSandboxId: args.vercelSandboxId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        repoId: args.repoId,
        startDesktop: false,
      });
      await runLoggedSessionStep(
        prepared.isNew
          ? "newSessionSandbox.sandboxReady"
          : "reuseSessionSandbox.sandboxReady",
        prepared.sandboxDetails,
        () =>
          ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: prepared.sandbox.id,
            vercelSandboxId: prepared.vercelSandboxId,
            branchName: prepared.branchName,
            isNew: prepared.isNew,
            usedSnapshot: prepared.isNew ? prepared.usedSnapshot : undefined,
            devPort: prepared.devPort,
            devCommand: prepared.devCommand,
          }),
      );
      logSession(
        `startSessionSandbox completed in ${formatDurationMsShort(Date.now() - actionStartedAt)} (${prepared.sandboxDetails})`,
      );
    } catch (e) {
      const stopId = args.vercelSandboxId ?? args.existingSandboxId;
      // A Stop that raced this Start. The resume may have briefly woken the VM,
      // so still stop it (idempotent with finalizeStopSandbox), but leave the
      // session status to the stop flow's markSandboxClosed — do NOT mark a
      // start error, or Eva shows a false "Sandbox Error" and the row can stick
      // in `stopping` while the two paths fight over status.
      if (e instanceof SandboxStartAbortedError) {
        console.log(
          `[daytona][sessions] startSessionSandbox aborted by stop sessionId=${args.sessionId}: ${e.message}`,
        );
        if (args.repoId && stopId) {
          try {
            await ctx.runAction(internal.daytona.stopSandbox, {
              sandboxId: stopId,
              repoId: args.repoId,
            });
          } catch (stopErr) {
            console.log(
              `[daytona][sessions] stop after aborted start failed for ${stopId}: ${errorMessage(stopErr, "stop failed")}`,
            );
          }
        }
        return null;
      }
      console.error(
        `[daytona][sessions] startSessionSandbox failed after ${formatDurationMsShort(Date.now() - actionStartedAt)} (${actionDetails}): ${errorMessage(e, "Unknown error")}`,
      );
      // Early-ready may have already marked the session active while the VM is
      // still running. Stop the provider sandbox so UI "closed" matches reality
      // and a later Start can resume cleanly instead of fighting a live orphan.
      if (args.repoId && stopId) {
        try {
          await ctx.runAction(internal.daytona.stopSandbox, {
            sandboxId: stopId,
            repoId: args.repoId,
          });
          console.log(
            `[daytona][sessions] stopped sandbox ${stopId} after start failure`,
          );
        } catch (stopErr) {
          console.log(
            `[daytona][sessions] stop after start failure failed for ${stopId}: ${errorMessage(stopErr, "stop failed")}`,
          );
        }
      }
      await ctx.runMutation(internal.sessions.sandboxError, {
        sessionId: args.sessionId,
        error: errorMessage(e, "Unknown error"),
      });
    }
    return null;
  },
});

/** Prepares a session sandbox and returns the sandbox ID without notifying the session. */
export const prepareSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.object({
    sandboxId: v.string(),
    vercelSandboxId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const prepared = await prepareSessionSandboxInternal(ctx, {
      sessionId: args.sessionId,
      existingSandboxId: args.existingSandboxId,
      vercelSandboxId: args.vercelSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
      startDesktop: args.startDesktop === true,
    });
    return {
      sandboxId: prepared.sandbox.id,
      vercelSandboxId: prepared.vercelSandboxId,
    };
  },
});

/** Starts a design session sandbox with branch setup, dev server, and desktop support. */
export const startDesignSandbox = internalAction({
  args: {
    designSessionId: v.id("designSessions"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Track a freshly-created sandbox so the catch can delete it on setup
    // failure (else it leaks server-side). Stays undefined on the reuse path.
    let newSandbox: SandboxHandle | undefined;
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startDesignSandbox");
      }
      const repoId = args.repoId;

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";
      const { client, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, repoId);
      const reuseId = resolveExistingSandboxId({
        providerKind: client.kind,
        sandboxId: args.existingSandboxId,
        vercelSandboxId: args.vercelSandboxId,
      });
      // Sandbox reuse and persistence volumes remain Daytona-only; resolve a
      // raw Daytona client lazily (never invoked on the Vercel path) for
      // those paths while create uses the neutral client.
      const getDaytonaClient = createLazyDaytonaClient(ctx, repoId);

      const designVolumeMounts =
        client.kind === "vercel"
          ? []
          : await ensureSessionPersistenceVolumes(
              await getDaytonaClient(),
              repoId,
              "designSessions",
              args.designSessionId,
            );

      const prepareReusedDesignSandbox = async (
        handle: SandboxHandle,
      ): Promise<void> => {
        // Resume the sandbox if it was stopped/archived, matching the session
        // reuse path (previously this only ran `echo 1`, so a non-running
        // sandbox fell through to a fresh rebuild). designSandboxStartupWorkflow
        // pre-thaws archived sandboxes across polling steps first, so this
        // fast-paths instead of blocking the action on a cold-storage restore.
        if (await designStopRequested(ctx, args.designSessionId)) {
          throw new SandboxStartAbortedError(
            `resume aborted: stop requested for sandbox ${handle.id}`,
          );
        }
        await ensureSandboxRunning(handle, {
          timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
        });
        if (await designStopRequested(ctx, args.designSessionId)) {
          throw new SandboxStartAbortedError(
            `resume aborted: stop requested for sandbox ${handle.id}`,
          );
        }
        // Self-heal: rotate the per-sandbox secret + reinstall the helper
        // before any git network op so resumed sandboxes pick up the new
        // credential flow without carrying a stale URL-embedded token.
        await ensureGitCredentialHelper(ctx, handle, args.installationId);
        await syncDesignRefsForSetup(
          handle,
          args.repoOwner,
          args.repoName,
          args.branchName,
          args.baseBranch,
        );
        await setupBranch(handle, args.branchName, args.baseBranch);
        const { port: devPort, devCommand } = await startSessionServices(
          handle,
          rootDir,
          devOverrides(repo),
        );
        await execHandle(
          handle,
          `${devCommand} > /tmp/devserver.log 2>&1 &`,
          10,
        );
        await ctx.runAction(internal.daytona.runBackgroundCommands, {
          sandboxId: handle.id,
          repoId,
        });
        await ctx.runMutation(internal.designSessions.sandboxReady, {
          designSessionId: args.designSessionId,
          sandboxId: handle.id,
          vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
          branchName: args.branchName,
          isNew: false,
          devPort,
        });
      };

      const reused =
        client.kind === "vercel"
          ? await tryReuseSandboxHandle(
              client,
              reuseId,
              prepareReusedDesignSandbox,
            )
          : await tryReuseSandbox(
              await getDaytonaClient(),
              reuseId,
              (sandbox) =>
                prepareReusedDesignSandbox(wrapDaytonaSandbox(sandbox)),
            );
      if (reused) return null;

      const prepared = await createSandboxAndPrepareRepo(
        ctx,
        client,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        SESSION_LIFECYCLE,
        snapshotName,
        designVolumeMounts,
        undefined,
        undefined,
        { mode: "none" },
      );
      const sandbox = prepared.sandbox;
      newSandbox = sandbox;
      await syncDesignRefsForSetup(
        sandbox,
        args.repoOwner,
        args.repoName,
        args.branchName,
        args.baseBranch,
      );
      await setupBranch(sandbox, args.branchName, args.baseBranch);
      if (prepared.usedSnapshot) {
        await installSnapshotDependenciesWithRetry(sandbox, rootDir);
      }
      const { port: devPort, devCommand } = await startSessionServices(
        sandbox,
        rootDir,
        devOverrides(repo),
      );
      await execHandle(
        sandbox,
        `${devCommand} > /tmp/devserver.log 2>&1 &`,
        10,
      );
      await ctx.runAction(internal.daytona.runBackgroundCommands, {
        sandboxId: sandbox.id,
        repoId,
      });

      await ctx.runMutation(internal.designSessions.sandboxReady, {
        designSessionId: args.designSessionId,
        sandboxId: sandbox.id,
        vercelSandboxId: client.kind === "vercel" ? sandbox.id : undefined,
        branchName: args.branchName,
        isNew: true,
        devPort,
      });
    } catch (e) {
      if (e instanceof SandboxStartAbortedError) {
        console.log(
          `[daytona][sessions] startDesignSandbox aborted by stop designSessionId=${args.designSessionId}: ${e.message}`,
        );
        const stopId = args.vercelSandboxId ?? args.existingSandboxId;
        if (args.repoId && stopId) {
          try {
            await ctx.runAction(internal.daytona.stopSandbox, {
              sandboxId: stopId,
              repoId: args.repoId,
            });
          } catch {}
        }
        return null;
      }
      if (newSandbox) {
        console.warn(
          `[daytona][sessions] deleting failed new design sandbox ${newSandbox.id}: ${errorMessage(e, "setup failed")}`,
        );
        try {
          await newSandbox.delete();
        } catch {}
        await ctx.runMutation(
          internal.sandboxGitCredentials.deleteBySandboxId,
          { sandboxId: newSandbox.id },
        );
      }
      await ctx.runMutation(internal.designSessions.sandboxError, {
        designSessionId: args.designSessionId,
        error: errorMessage(e, "Unknown error"),
      });
    }
    return null;
  },
});

type TaskPreviewSandboxPreparationArgs = {
  taskId: Id<"agentTasks">;
  existingSandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  repoId: Id<"githubRepos">;
  forceStartupCommands?: boolean;
};

/** Core logic for preparing a task preview sandbox: reuses existing or creates new, syncs refs, and starts services. */
async function prepareTaskPreviewSandboxInternal(
  ctx: GenericActionCtx<DataModel>,
  args: TaskPreviewSandboxPreparationArgs,
): Promise<PreparedSessionSandbox> {
  const actionDetails = `taskId=${args.taskId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
  const completedSteps: ProgressStep[] = [];

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    "Loading repository config...",
  );
  const repo = await runLoggedSessionStep("loadTaskRepo", actionDetails, () =>
    ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    }),
  );
  const rootDir = repo?.rootDirectory ?? "";
  completedSteps.push({
    type: "tool",
    label: "Loading repository config...",
    status: "complete",
  });

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    "Resolving sandbox context...",
  );
  const client = await runLoggedSessionStep(
    "resolveTaskSandboxClient",
    actionDetails,
    () => resolveSandboxClientOnly(ctx, args.repoId),
  );
  // Sandbox reuse and persistence volumes remain Daytona-only; resolve a raw
  // Daytona client lazily (never invoked on the Vercel path) for those paths
  // while the create path uses the neutral client.
  const getDaytonaClient = createLazyDaytonaClient(ctx, args.repoId);
  const reuseId = resolveExistingSandboxId({
    providerKind: client.kind,
    sandboxId: args.existingSandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  logSession(
    `prepareTaskPreviewSandbox client resolved (${actionDetails}, rootDir=${rootDir || "."})`,
  );
  completedSteps.push({
    type: "tool",
    label: "Resolving sandbox context...",
    status: "complete",
  });

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    "Checking existing sandbox...",
  );
  let reusedResult: PreparedSessionSandbox | null = null;
  const prepareReusedTaskSandbox = async (
    handle: SandboxHandle,
  ): Promise<void> => {
    const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}`;
    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Resuming existing sandbox...",
    );
    await runLoggedSessionStep("reuseTaskSandbox.prepare", sandboxDetails, () =>
      resumeReusedSandbox(ctx, handle, {
        installationId: args.installationId,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        onRestoring: () =>
          emitTaskProgress(
            ctx,
            args.taskId,
            completedSteps,
            client.kind === "vercel"
              ? "Resuming sandbox..."
              : "Restoring sandbox from cold storage (can take up to 10 minutes)...",
          ),
        onEarlyReady: async () => {
          await ctx.runMutation(internal.agentTasks.taskSandboxReady, {
            taskId: args.taskId,
            sandboxId: handle.id,
            vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
            isNew: false,
          });
        },
        shouldAbort: () => taskStopRequested(ctx, args.taskId),
      }),
    );
    completedSteps.push({
      type: "tool",
      label: "Resuming existing sandbox...",
      status: "complete",
    });
    // Restore baked config files from /home/eva/sandbox-config into the workspace.
    // The snapshot ships them; this re-copies in case `git clean -fd` wiped them.
    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Restoring config files...",
    );
    await runLoggedSessionStep(
      "reuseTaskSandbox.copyConfigFiles",
      sandboxDetails,
      () => copySandboxConfigFilesToWorkspace(handle),
    );
    completedSteps.push({
      type: "tool",
      label: "Restoring config files...",
      status: "complete",
    });
    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Starting dev server...",
    );
    const { port: devPort, devCommand } = await runLoggedSessionStep(
      "reuseTaskSandbox.startSessionServices",
      sandboxDetails,
      () => startSessionServices(handle, rootDir, devOverrides(repo)),
    );
    // Terminal PTY reset only applies to Daytona — Vercel's PTY capability
    // isn't wired yet (see SandboxHandle.pty).
    if (client.kind !== "vercel") {
      await runLoggedSessionStep(
        "reuseTaskSandbox.resetDevTerminal",
        sandboxDetails,
        () =>
          resetDevTerminalForResume(
            unwrapDaytonaSandbox(handle),
            `task-${args.taskId}`,
          ),
      );
    }
    completedSteps.push({
      type: "tool",
      label: "Starting dev server...",
      status: "complete",
    });
    // Note: runStartupCommands is intentionally not surfaced as a UI step
    // on the reuse path — the marker file (`/tmp/.startup-commands-done`)
    // makes it a no-op once the sandbox has been initialised, so showing
    // "Running startup commands..." would be misleading on resume.
    await runLoggedSessionStep(
      "reuseTaskSandbox.runStartupCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runStartupCommands,
          {
            sandboxId: handle.id,
            repoId: args.repoId,
            force: args.forceStartupCommands,
          },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Launching background commands...",
    );
    await runLoggedSessionStep(
      "reuseTaskSandbox.runBackgroundCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runBackgroundCommands,
          { sandboxId: handle.id, repoId: args.repoId },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    completedSteps.push({
      type: "tool",
      label: "Launching background commands...",
      status: "complete",
    });
    reusedResult = {
      sandbox: handle,
      isNew: false,
      usedSnapshot: false,
      sandboxDetails,
      branchName: args.branchName,
      devPort,
      devCommand,
      vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
    };
  };
  const reused =
    client.kind === "vercel"
      ? await runLoggedSessionStep("tryReuseTaskSandbox", actionDetails, () =>
          tryReuseSandboxHandle(client, reuseId, prepareReusedTaskSandbox, {
            fallbackOnPrepareError: false,
          }),
        )
      : await runLoggedSessionStep(
          "tryReuseTaskSandbox",
          actionDetails,
          async () =>
            tryReuseSandbox(
              await getDaytonaClient(),
              reuseId,
              (sandbox) =>
                prepareReusedTaskSandbox(wrapDaytonaSandbox(sandbox)),
              { fallbackOnPrepareError: false },
            ),
        );
  if (reused && reusedResult) {
    return reusedResult;
  }
  completedSteps.push({
    type: "tool",
    label: "Checking existing sandbox...",
    status: "complete",
  });

  const { sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveTaskSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    client.kind === "vercel"
      ? "Creating sandbox..."
      : "Setting up persistence volumes...",
  );
  const taskVolumeMounts =
    client.kind === "vercel"
      ? []
      : await runLoggedSessionStep(
          "ensureTaskPersistenceVolumes",
          actionDetails,
          async () =>
            ensureSessionPersistenceVolumes(
              await getDaytonaClient(),
              args.repoId,
              "agentTasks",
              args.taskId,
            ),
        );
  if (client.kind !== "vercel") {
    completedSteps.push({
      type: "tool",
      label: "Setting up persistence volumes...",
      status: "complete",
    });
  }

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    "Creating sandbox...",
  );
  const prepared = await runLoggedSessionStep(
    "createTaskSandboxAndPrepareRepo",
    `${actionDetails}, snapshot=${snapshotName ?? "none"}`,
    () =>
      createSandboxAndPrepareRepo(
        ctx,
        client,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        SESSION_LIFECYCLE,
        snapshotName,
        taskVolumeMounts,
        undefined,
        undefined,
        { mode: "none" },
      ),
  );
  const handle = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
  // Delete the just-created sandbox if any setup step below fails, so it does
  // not leak server-side (mirrors the session path).
  try {
    completedSteps.push({
      type: "tool",
      label: "Creating sandbox...",
      status: "complete",
    });

    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Syncing repository refs...",
    );
    await runLoggedSessionStep(
      "newTaskSandbox.syncRefsForRestore",
      sandboxDetails,
      () =>
        syncSessionRefsForRestore(
          handle,
          args.repoOwner,
          args.repoName,
          args.branchName,
          args.baseBranch,
        ),
    );
    completedSteps.push({
      type: "tool",
      label: "Syncing repository refs...",
      status: "complete",
    });

    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Checking out branch...",
    );
    await runLoggedSessionStep(
      "newTaskSandbox.checkoutBranch",
      sandboxDetails,
      () =>
        checkoutSessionBranchWithRetry(
          handle,
          args.branchName,
          args.baseBranch,
        ),
    );
    completedSteps.push({
      type: "tool",
      label: "Checking out branch...",
      status: "complete",
    });

    // Restore baked config files from /home/eva/sandbox-config into the workspace.
    // Skipped when usedSnapshot: createSandboxAndPrepareRepo already ran this
    // exact copy (force: true) on the snapshot-restore path — see the
    // matching comment in prepareSessionSandboxInternal.
    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Restoring config files...",
    );
    if (!prepared.usedSnapshot) {
      await runLoggedSessionStep(
        "newTaskSandbox.copyConfigFiles",
        sandboxDetails,
        () =>
          copySandboxConfigFilesToWorkspace(handle, {
            force: true,
          }),
      );
    }
    completedSteps.push({
      type: "tool",
      label: "Restoring config files...",
      status: "complete",
    });

    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Starting dev server...",
    );
    const { port: devPort, devCommand } = await runLoggedSessionStep(
      "newTaskSandbox.startSessionServices",
      sandboxDetails,
      () => startSessionServices(handle, rootDir, devOverrides(repo)),
    );
    completedSteps.push({
      type: "tool",
      label: "Starting dev server...",
      status: "complete",
    });

    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Running startup commands...",
    );
    await runLoggedSessionStep(
      "newTaskSandbox.runStartupCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runStartupCommands,
          {
            sandboxId: handle.id,
            repoId: args.repoId,
            force: args.forceStartupCommands,
          },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    completedSteps.push({
      type: "tool",
      label: "Running startup commands...",
      status: "complete",
    });

    await emitTaskProgress(
      ctx,
      args.taskId,
      completedSteps,
      "Launching background commands...",
    );
    await runLoggedSessionStep(
      "newTaskSandbox.runBackgroundCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runBackgroundCommands,
          { sandboxId: handle.id, repoId: args.repoId },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );

    return {
      sandbox: handle,
      isNew: true,
      usedSnapshot: prepared.usedSnapshot,
      sandboxDetails,
      branchName: args.branchName,
      devPort,
      devCommand,
      vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
    };
  } catch (setupError) {
    console.warn(
      `[daytona][sessions] deleting failed new task sandbox ${handle.id}: ${errorMessage(setupError, "setup failed")}`,
    );
    try {
      await handle.delete();
    } catch {}
    await ctx.runMutation(internal.sandboxGitCredentials.deleteBySandboxId, {
      sandboxId: handle.id,
    });
    throw setupError;
  }
}

type ProjectPreviewSandboxPreparationArgs = {
  projectId: Id<"projects">;
  existingSandboxId: string | undefined;
  vercelSandboxId: string | undefined;
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  repoId: Id<"githubRepos">;
  forceStartupCommands?: boolean;
  /** Skip repo startup/background commands (e.g. project interview only reads files). */
  skipStartupCommands?: boolean;
};

/** Core logic for preparing a project preview sandbox: reuses existing or creates new, syncs refs, and starts services. */
async function prepareProjectPreviewSandboxInternal(
  ctx: GenericActionCtx<DataModel>,
  args: ProjectPreviewSandboxPreparationArgs,
): Promise<PreparedSessionSandbox> {
  const actionDetails = `projectId=${args.projectId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
  const completedSteps: ProgressStep[] = [];

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Loading repository config...",
  );
  const repo = await runLoggedSessionStep(
    "loadProjectRepo",
    actionDetails,
    () =>
      ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      }),
  );
  const rootDir = repo?.rootDirectory ?? "";
  completedSteps.push({
    type: "tool",
    label: "Loading repository config...",
    status: "complete",
  });

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Resolving sandbox context...",
  );
  const client = await runLoggedSessionStep(
    "resolveProjectSandboxClient",
    actionDetails,
    () => resolveSandboxClientOnly(ctx, args.repoId),
  );
  // Sandbox reuse and persistence volumes remain Daytona-only; resolve a raw
  // Daytona client lazily (never invoked on the Vercel path) for those paths
  // while the create path uses the neutral client.
  const getDaytonaClient = createLazyDaytonaClient(ctx, args.repoId);
  const reuseId = resolveExistingSandboxId({
    providerKind: client.kind,
    sandboxId: args.existingSandboxId,
    vercelSandboxId: args.vercelSandboxId,
  });
  logSession(
    `prepareProjectPreviewSandbox client resolved (${actionDetails}, rootDir=${rootDir || "."})`,
  );
  completedSteps.push({
    type: "tool",
    label: "Resolving sandbox context...",
    status: "complete",
  });

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Checking existing sandbox...",
  );
  let reusedResult: PreparedSessionSandbox | null = null;
  const prepareReusedProjectSandbox = async (
    handle: SandboxHandle,
  ): Promise<void> => {
    const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}`;
    await emitProjectProgress(
      ctx,
      args.projectId,
      completedSteps,
      "Resuming existing sandbox...",
    );
    await runLoggedSessionStep(
      "reuseProjectSandbox.prepare",
      sandboxDetails,
      () =>
        resumeReusedSandbox(ctx, handle, {
          installationId: args.installationId,
          branchName: args.branchName,
          baseBranch: args.baseBranch,
          onRestoring: () =>
            emitProjectProgress(
              ctx,
              args.projectId,
              completedSteps,
              client.kind === "vercel"
                ? "Resuming sandbox..."
                : "Restoring sandbox from cold storage (can take up to 10 minutes)...",
            ),
          onEarlyReady: async () => {
            await ctx.runMutation(internal.projects.projectSandboxReady, {
              projectId: args.projectId,
              sandboxId: handle.id,
              vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
              isNew: false,
            });
          },
          shouldAbort: () => projectStopRequested(ctx, args.projectId),
        }),
    );
    completedSteps.push({
      type: "tool",
      label: "Resuming existing sandbox...",
      status: "complete",
    });
    // Restore baked config files from /home/eva/sandbox-config into the workspace.
    // The snapshot ships them; this re-copies in case `git clean -fd` wiped them.
    await emitProjectProgress(
      ctx,
      args.projectId,
      completedSteps,
      "Restoring config files...",
    );
    await runLoggedSessionStep(
      "reuseProjectSandbox.copyConfigFiles",
      sandboxDetails,
      () => copySandboxConfigFilesToWorkspace(handle),
    );
    completedSteps.push({
      type: "tool",
      label: "Restoring config files...",
      status: "complete",
    });
    await emitProjectProgress(
      ctx,
      args.projectId,
      completedSteps,
      "Starting dev server...",
    );
    const { port: devPort, devCommand } = await runLoggedSessionStep(
      "reuseProjectSandbox.startSessionServices",
      sandboxDetails,
      () => startSessionServices(handle, rootDir, devOverrides(repo)),
    );
    // Terminal PTY reset only applies to Daytona — Vercel's PTY capability
    // isn't wired yet (see SandboxHandle.pty).
    if (client.kind !== "vercel") {
      await runLoggedSessionStep(
        "reuseProjectSandbox.resetDevTerminal",
        sandboxDetails,
        () =>
          resetDevTerminalForResume(
            unwrapDaytonaSandbox(handle),
            `project-${args.projectId}`,
          ),
      );
    }
    completedSteps.push({
      type: "tool",
      label: "Starting dev server...",
      status: "complete",
    });
    if (!args.skipStartupCommands) {
      await runLoggedSessionStep(
        "reuseProjectSandbox.runStartupCommands",
        sandboxDetails,
        async () => {
          const result = await ctx.runAction(
            internal.daytona.runStartupCommands,
            {
              sandboxId: handle.id,
              repoId: args.repoId,
              force: args.forceStartupCommands,
            },
          );
          if (result.ran && result.commandCount > 0) {
            logSession(
              `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
            );
          }
        },
      );
      await emitProjectProgress(
        ctx,
        args.projectId,
        completedSteps,
        "Launching background commands...",
      );
      await runLoggedSessionStep(
        "reuseProjectSandbox.runBackgroundCommands",
        sandboxDetails,
        async () => {
          const result = await ctx.runAction(
            internal.daytona.runBackgroundCommands,
            { sandboxId: handle.id, repoId: args.repoId },
          );
          if (result.ran && result.commandCount > 0) {
            logSession(
              `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
            );
          }
        },
      );
      completedSteps.push({
        type: "tool",
        label: "Launching background commands...",
        status: "complete",
      });
    }
    reusedResult = {
      sandbox: handle,
      isNew: false,
      usedSnapshot: false,
      sandboxDetails,
      branchName: args.branchName,
      devPort,
      devCommand,
      vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
    };
  };
  const reused =
    client.kind === "vercel"
      ? await runLoggedSessionStep(
          "tryReuseProjectSandbox",
          actionDetails,
          () =>
            tryReuseSandboxHandle(
              client,
              reuseId,
              prepareReusedProjectSandbox,
              { fallbackOnPrepareError: false },
            ),
        )
      : await runLoggedSessionStep(
          "tryReuseProjectSandbox",
          actionDetails,
          async () =>
            tryReuseSandbox(
              await getDaytonaClient(),
              reuseId,
              (sandbox) =>
                prepareReusedProjectSandbox(wrapDaytonaSandbox(sandbox)),
              { fallbackOnPrepareError: false },
            ),
        );
  if (reused && reusedResult) {
    return reusedResult;
  }
  completedSteps.push({
    type: "tool",
    label: "Checking existing sandbox...",
    status: "complete",
  });

  const { sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveProjectSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    client.kind === "vercel"
      ? "Creating sandbox..."
      : "Setting up persistence volumes...",
  );
  const projectVolumeMounts =
    client.kind === "vercel"
      ? []
      : await runLoggedSessionStep(
          "ensureProjectPersistenceVolumes",
          actionDetails,
          async () =>
            ensureSessionPersistenceVolumes(
              await getDaytonaClient(),
              args.repoId,
              "projects",
              args.projectId,
            ),
        );
  if (client.kind !== "vercel") {
    completedSteps.push({
      type: "tool",
      label: "Setting up persistence volumes...",
      status: "complete",
    });
  }

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Creating sandbox...",
  );
  const prepared = await runLoggedSessionStep(
    "createProjectSandboxAndPrepareRepo",
    `${actionDetails}, snapshot=${snapshotName ?? "none"}`,
    () =>
      createSandboxAndPrepareRepo(
        ctx,
        client,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        SESSION_LIFECYCLE,
        snapshotName,
        projectVolumeMounts,
        undefined,
        undefined,
        { mode: "none" },
      ),
  );
  const handle = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${handle.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
  await ctx.runMutation(internal.projects.projectSandboxAllocated, {
    projectId: args.projectId,
    sandboxId: handle.id,
    vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
  });
  completedSteps.push({
    type: "tool",
    label: "Creating sandbox...",
    status: "complete",
  });

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Syncing repository refs...",
  );
  await runLoggedSessionStep(
    "newProjectSandbox.syncRefsForRestore",
    sandboxDetails,
    () =>
      syncSessionRefsForRestore(
        handle,
        args.repoOwner,
        args.repoName,
        args.branchName,
        args.baseBranch,
      ),
  );
  completedSteps.push({
    type: "tool",
    label: "Syncing repository refs...",
    status: "complete",
  });

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Checking out branch...",
  );
  await runLoggedSessionStep(
    "newProjectSandbox.checkoutBranch",
    sandboxDetails,
    () =>
      checkoutSessionBranchWithRetry(handle, args.branchName, args.baseBranch),
  );
  completedSteps.push({
    type: "tool",
    label: "Checking out branch...",
    status: "complete",
  });

  // Restore baked config files from /home/eva/sandbox-config into the workspace.
  // Skipped when usedSnapshot: createSandboxAndPrepareRepo already ran this
  // exact copy (force: true) on the snapshot-restore path — see the
  // matching comment in prepareSessionSandboxInternal.
  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Restoring config files...",
  );
  if (!prepared.usedSnapshot) {
    await runLoggedSessionStep(
      "newProjectSandbox.copyConfigFiles",
      sandboxDetails,
      () =>
        copySandboxConfigFilesToWorkspace(handle, {
          force: true,
        }),
    );
  }
  completedSteps.push({
    type: "tool",
    label: "Restoring config files...",
    status: "complete",
  });

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Starting dev server...",
  );
  const { port: devPort, devCommand } = await runLoggedSessionStep(
    "newProjectSandbox.startSessionServices",
    sandboxDetails,
    () => startSessionServices(handle, rootDir, devOverrides(repo)),
  );
  completedSteps.push({
    type: "tool",
    label: "Starting dev server...",
    status: "complete",
  });

  if (!args.skipStartupCommands) {
    await emitProjectProgress(
      ctx,
      args.projectId,
      completedSteps,
      "Running startup commands...",
    );
    await runLoggedSessionStep(
      "newProjectSandbox.runStartupCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runStartupCommands,
          {
            sandboxId: handle.id,
            repoId: args.repoId,
            force: args.forceStartupCommands,
          },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Ran ${result.commandCount} startup command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
    completedSteps.push({
      type: "tool",
      label: "Running startup commands...",
      status: "complete",
    });

    await emitProjectProgress(
      ctx,
      args.projectId,
      completedSteps,
      "Launching background commands...",
    );
    await runLoggedSessionStep(
      "newProjectSandbox.runBackgroundCommands",
      sandboxDetails,
      async () => {
        const result = await ctx.runAction(
          internal.daytona.runBackgroundCommands,
          { sandboxId: handle.id, repoId: args.repoId },
        );
        if (result.ran && result.commandCount > 0) {
          logSession(
            `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
          );
        }
      },
    );
  }

  return {
    sandbox: handle,
    isNew: true,
    usedSnapshot: prepared.usedSnapshot,
    sandboxDetails,
    branchName: args.branchName,
    devPort,
    devCommand,
    vercelSandboxId: client.kind === "vercel" ? handle.id : undefined,
  };
}

/**
 * Starts a project preview sandbox end-to-end and notifies the project of
 * readiness or error. Returns the sandbox id on success so callers (e.g. the
 * interview/spec workflows) can launch agents on it without re-querying the
 * project doc — `projectSandboxReady` has already persisted it as well, so the
 * project card/sidebar indicator lights up.
 */
export const startProjectPreviewSandbox = internalAction({
  args: {
    projectId: v.id("projects"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    forceStartupCommands: v.optional(v.boolean()),
    skipStartupCommands: v.optional(v.boolean()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const actionStartedAt = Date.now();
    const actionDetails = `projectId=${args.projectId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
    logSession(`startProjectPreviewSandbox invoked (${actionDetails})`);
    try {
      await ctx.runMutation(internal.projects.projectSandboxStarting, {
        projectId: args.projectId,
      });
      const prepared = await prepareProjectPreviewSandboxInternal(ctx, {
        projectId: args.projectId,
        existingSandboxId: args.existingSandboxId,
        vercelSandboxId: args.vercelSandboxId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        repoId: args.repoId,
        forceStartupCommands: args.forceStartupCommands,
        skipStartupCommands: args.skipStartupCommands,
      });
      await runLoggedSessionStep(
        prepared.isNew
          ? "newProjectSandbox.sandboxReady"
          : "reuseProjectSandbox.sandboxReady",
        prepared.sandboxDetails,
        () =>
          ctx.runMutation(internal.projects.projectSandboxReady, {
            projectId: args.projectId,
            sandboxId: prepared.sandbox.id,
            vercelSandboxId: prepared.vercelSandboxId,
            isNew: prepared.isNew,
            devPort: prepared.devPort,
            devCommand: prepared.devCommand,
          }),
      );
      await completeProjectProgress(ctx, args.projectId);
      logSession(
        `startProjectPreviewSandbox completed in ${formatDurationMsShort(Date.now() - actionStartedAt)} (${prepared.sandboxDetails})`,
      );
      return { sandboxId: prepared.sandbox.id };
    } catch (e) {
      if (e instanceof SandboxStartAbortedError) {
        console.log(
          `[daytona][sessions] startProjectPreviewSandbox aborted by stop projectId=${args.projectId}: ${e.message}`,
        );
        await completeProjectProgress(ctx, args.projectId);
        const stopId = args.vercelSandboxId ?? args.existingSandboxId;
        if (stopId) {
          try {
            await ctx.runAction(internal.daytona.stopSandbox, {
              sandboxId: stopId,
              repoId: args.repoId,
            });
          } catch {}
        }
        return { sandboxId: stopId ?? "" };
      }
      console.error(
        `[daytona][sessions] startProjectPreviewSandbox failed after ${formatDurationMsShort(Date.now() - actionStartedAt)} (${actionDetails}): ${errorMessage(e, "Unknown error")}`,
      );
      await completeProjectProgress(ctx, args.projectId);
      await ctx.runMutation(internal.projects.projectSandboxError, {
        projectId: args.projectId,
        error: errorMessage(e, "Unknown error"),
      });
      throw e;
    }
  },
});

/** Starts a task preview sandbox end-to-end and notifies the task of readiness or error. */
export const startTaskPreviewSandbox = internalAction({
  args: {
    taskId: v.id("agentTasks"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    forceStartupCommands: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actionStartedAt = Date.now();
    const actionDetails = `taskId=${args.taskId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
    logSession(`startTaskPreviewSandbox invoked (${actionDetails})`);
    try {
      const prepared = await prepareTaskPreviewSandboxInternal(ctx, {
        taskId: args.taskId,
        existingSandboxId: args.existingSandboxId,
        vercelSandboxId: args.vercelSandboxId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        repoId: args.repoId,
        forceStartupCommands: args.forceStartupCommands,
      });
      await runLoggedSessionStep(
        prepared.isNew
          ? "newTaskSandbox.sandboxReady"
          : "reuseTaskSandbox.sandboxReady",
        prepared.sandboxDetails,
        () =>
          ctx.runMutation(internal.agentTasks.taskSandboxReady, {
            taskId: args.taskId,
            sandboxId: prepared.sandbox.id,
            vercelSandboxId: prepared.vercelSandboxId,
            isNew: prepared.isNew,
            devPort: prepared.devPort,
            devCommand: prepared.devCommand,
          }),
      );
      await completeTaskProgress(ctx, args.taskId);
      logSession(
        `startTaskPreviewSandbox completed in ${formatDurationMsShort(Date.now() - actionStartedAt)} (${prepared.sandboxDetails})`,
      );
    } catch (e) {
      if (e instanceof SandboxStartAbortedError) {
        console.log(
          `[daytona][sessions] startTaskPreviewSandbox aborted by stop taskId=${args.taskId}: ${e.message}`,
        );
        await completeTaskProgress(ctx, args.taskId);
        const stopId = args.vercelSandboxId ?? args.existingSandboxId;
        if (stopId) {
          try {
            await ctx.runAction(internal.daytona.stopSandbox, {
              sandboxId: stopId,
              repoId: args.repoId,
            });
          } catch {}
        }
        return null;
      }
      console.error(
        `[daytona][sessions] startTaskPreviewSandbox failed after ${formatDurationMsShort(Date.now() - actionStartedAt)} (${actionDetails}): ${errorMessage(e, "Unknown error")}`,
      );
      await completeTaskProgress(ctx, args.taskId);
      await ctx.runMutation(internal.agentTasks.taskSandboxError, {
        taskId: args.taskId,
        error: errorMessage(e, "Unknown error"),
      });
    }
    return null;
  },
});
