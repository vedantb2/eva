"use node";

import { v } from "convex/values";
import { formatDurationMsShort } from "@conductor/shared/duration";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";
import {
  exec,
  resolveSandboxContext,
  ensureSandboxRunning,
  ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
  errorMessage,
  sleep,
  workspaceDirShell,
} from "./helpers";
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
import { ensureSessionPersistenceVolumes } from "./volumes";
import { detectPackageManager, startSessionServices } from "./devServer";
import type { Daytona, Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { Doc } from "../_generated/dataModel";
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
  sandbox: Sandbox,
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
  sandbox: Sandbox,
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

/** Syncs remote refs for session restore, falling back to base branch if session branch is missing. */
async function syncSessionRefsForRestore(
  sandbox: Sandbox,
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
  sandbox: Sandbox,
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
  sandbox: Sandbox,
  rootDir: string,
): Promise<void> {
  const maxAttempts = 3;
  const pm = await detectPackageManager(sandbox, rootDir);
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const installCommand =
    pm === "pnpm"
      ? `npm install -g pnpm && cd ${dir} && pnpm install`
      : pm === "yarn"
        ? `cd ${dir} && yarn install`
        : `cd ${dir} && npm install`;
  const timeoutSeconds = pm === "pnpm" ? 240 : 180;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await exec(sandbox, installCommand, timeoutSeconds);
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
 */
async function tryReuseSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  prepareFn: (sandbox: Sandbox) => Promise<void>,
  options?: TryReuseSandboxOptions,
): Promise<Sandbox | null> {
  if (!existingSandboxId) return null;
  let sandbox: Sandbox;
  try {
    sandbox = await daytona.get(existingSandboxId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isSandboxGoneMessage(message)) {
      logSession(
        `tryReuseSandbox found missing sandbox ${existingSandboxId}; creating replacement`,
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
      `tryReuseSandbox preparation failed for ${existingSandboxId}; creating replacement: ${message}`,
    );
    return null;
  }

  return sandbox;
}

type SessionSandboxPreparationArgs = {
  sessionId: Id<"sessions">;
  existingSandboxId: string | undefined;
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  repoId: Id<"githubRepos">;
  startDesktop: boolean;
};

type PreparedSessionSandbox = {
  sandbox: Sandbox;
  isNew: boolean;
  usedSnapshot: boolean;
  sandboxDetails: string;
  branchName: string;
  devPort: number;
  devCommand: string;
};

type ProgressStep = { type: string; label: string; status: string };

/** Emits progress steps to streaming for UI updates. */
async function emitSessionProgress(
  ctx: GenericActionCtx<DataModel>,
  sessionId: Id<"sessions">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  const steps = [
    ...completedSteps,
    { type: "tool", label: activeLabel, status: "active" },
  ];
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `session-startup-${sessionId}`,
    currentActivity: JSON.stringify(steps),
  });
}

/** Marks the final step complete and clears streaming. */
async function completeSessionProgress(
  ctx: GenericActionCtx<DataModel>,
  sessionId: Id<"sessions">,
): Promise<void> {
  // Clear the streaming activity when done
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `session-startup-${sessionId}`,
    currentActivity: JSON.stringify([]),
  });
}

/** Emits task sandbox startup progress steps to streaming for UI updates. */
async function emitTaskProgress(
  ctx: GenericActionCtx<DataModel>,
  taskId: Id<"agentTasks">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  const steps = [
    ...completedSteps,
    { type: "tool", label: activeLabel, status: "active" },
  ];
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `task-sandbox-startup-${taskId}`,
    currentActivity: JSON.stringify(steps),
  });
}

/** Clears task sandbox startup streaming when done. */
async function completeTaskProgress(
  ctx: GenericActionCtx<DataModel>,
  taskId: Id<"agentTasks">,
): Promise<void> {
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `task-sandbox-startup-${taskId}`,
    currentActivity: JSON.stringify([]),
  });
}

/** Emits project sandbox startup progress steps to streaming for UI updates. */
async function emitProjectProgress(
  ctx: GenericActionCtx<DataModel>,
  projectId: Id<"projects">,
  completedSteps: ProgressStep[],
  activeLabel: string,
): Promise<void> {
  const steps = [
    ...completedSteps,
    { type: "tool", label: activeLabel, status: "active" },
  ];
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `project-sandbox-startup-${projectId}`,
    currentActivity: JSON.stringify(steps),
  });
}

/** Clears project sandbox startup streaming when done. */
async function completeProjectProgress(
  ctx: GenericActionCtx<DataModel>,
  projectId: Id<"projects">,
): Promise<void> {
  await ctx.runMutation(internal.streaming.internalSet, {
    entityId: `project-sandbox-startup-${projectId}`,
    currentActivity: JSON.stringify([]),
  });
}

/** Core logic for preparing a session sandbox: reuses existing or creates new, syncs refs, and starts services. */
async function prepareSessionSandboxInternal(
  ctx: GenericActionCtx<DataModel>,
  args: SessionSandboxPreparationArgs,
): Promise<PreparedSessionSandbox> {
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
  const { daytona, sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveSessionSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );
  logSession(
    `prepareSessionSandbox context resolved (${actionDetails}, snapshot=${snapshotName ?? "none"}, rootDir=${rootDir || "."})`,
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
  const reused = await runLoggedSessionStep(
    "tryReuseSessionSandbox",
    actionDetails,
    () =>
      tryReuseSandbox(daytona, args.existingSandboxId, async (sandbox) => {
        const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}`;
        await runLoggedSessionStep(
          "reuseSessionSandbox.prepare",
          sandboxDetails,
          async () => {
            await ensureSandboxRunning(sandbox, {
              timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
              onRestoring: () =>
                emitSessionProgress(
                  ctx,
                  args.sessionId,
                  completedSteps,
                  "Restoring sandbox from cold storage (can take up to 10 minutes)...",
                ),
            });
            // Self-heal: rotate the per-sandbox secret + reinstall the helper
            // every resume so in-sandbox `git pull` and any subsequent fetch
            // authenticate without relying on a stale URL-embedded token.
            await ensureGitCredentialHelper(ctx, sandbox, args.installationId);
            await checkoutSessionBranchWithRetry(
              sandbox,
              args.branchName,
              args.baseBranch,
            );
          },
        );
        await runLoggedSessionStep(
          "reuseSessionSandbox.setupBranch",
          sandboxDetails,
          () => setupBranch(sandbox, args.branchName, args.baseBranch),
        );
        // Restore baked config files from /home/eva/sandbox-config into the workspace.
        // The snapshot ships them; this re-copies in case `git clean -fd` wiped them.
        await runLoggedSessionStep(
          "reuseSessionSandbox.copyConfigFiles",
          sandboxDetails,
          () => copySandboxConfigFilesToWorkspace(sandbox),
        );
        const { port: devPort, devCommand } = await runLoggedSessionStep(
          "reuseSessionSandbox.startSessionServices",
          sandboxDetails,
          () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
        );
        if (args.startDesktop) {
          await runLoggedSessionStep(
            "reuseSessionSandbox.startDesktop",
            sandboxDetails,
            () => startDesktopWithChrome(sandbox),
          );
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
        reusedResult = {
          sandbox,
          isNew: false,
          usedSnapshot: false,
          sandboxDetails,
          branchName: args.branchName,
          devPort,
          devCommand,
        };
      }),
  );
  if (reused && reusedResult) {
    await completeSessionProgress(ctx, args.sessionId);
    return reusedResult;
  }
  completedSteps.push({
    type: "tool",
    label: "Checking existing sandbox...",
    status: "complete",
  });

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Setting up persistence volumes...",
  );
  const sessionVolumeMounts = await runLoggedSessionStep(
    "ensureSessionPersistenceVolumes",
    actionDetails,
    () =>
      ensureSessionPersistenceVolumes(
        daytona,
        args.repoId,
        "sessions",
        args.sessionId,
      ),
  );
  completedSteps.push({
    type: "tool",
    label: "Setting up persistence volumes...",
    status: "complete",
  });

  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Creating sandbox...",
  );
  const prepared = await runLoggedSessionStep(
    "createSessionSandboxAndPrepareRepo",
    `${actionDetails}, snapshot=${snapshotName ?? "none"}`,
    () =>
      createSandboxAndPrepareRepo(
        ctx,
        daytona,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        SESSION_LIFECYCLE,
        snapshotName,
        sessionVolumeMounts,
        undefined,
        undefined,
        { mode: "none" },
      ),
  );
  const sandbox = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
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
        sandbox,
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
      checkoutSessionBranchWithRetry(sandbox, args.branchName, args.baseBranch),
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
    () => setupBranch(sandbox, args.branchName, args.baseBranch),
  );
  completedSteps.push({
    type: "tool",
    label: "Preparing branch...",
    status: "complete",
  });

  // Restore baked config files from /home/eva/sandbox-config into the workspace.
  // The snapshot ships them; this re-copies in case `git clean -fd` wiped them.
  await emitSessionProgress(
    ctx,
    args.sessionId,
    completedSteps,
    "Restoring config files...",
  );
  await runLoggedSessionStep(
    "newSessionSandbox.copyConfigFiles",
    sandboxDetails,
    () => copySandboxConfigFilesToWorkspace(sandbox),
  );
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
    () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
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
      () => startDesktopWithChrome(sandbox),
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
    "Running startup commands...",
  );
  await runLoggedSessionStep(
    "newSessionSandbox.runStartupCommands",
    sandboxDetails,
    async () => {
      const result = await ctx.runAction(internal.daytona.runStartupCommands, {
        sandboxId: sandbox.id,
        repoId: args.repoId,
      });
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
        { sandboxId: sandbox.id, repoId: args.repoId },
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

  await completeSessionProgress(ctx, args.sessionId);
  return {
    sandbox,
    isNew: true,
    usedSnapshot: prepared.usedSnapshot,
    sandboxDetails,
    branchName: args.branchName,
    devPort,
    devCommand,
  };
}

/** Starts a session sandbox end-to-end and notifies the session of readiness or error. */
export const startSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
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
      const prepared = await prepareSessionSandboxInternal(ctx, {
        sessionId: args.sessionId,
        existingSandboxId: args.existingSandboxId,
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
      console.error(
        `[daytona][sessions] startSessionSandbox failed after ${formatDurationMsShort(Date.now() - actionStartedAt)} (${actionDetails}): ${errorMessage(e, "Unknown error")}`,
      );
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
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const prepared = await prepareSessionSandboxInternal(ctx, {
      sessionId: args.sessionId,
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
      startDesktop: args.startDesktop === true,
    });
    return { sandboxId: prepared.sandbox.id };
  },
});

/** Starts a design session sandbox with branch setup, dev server, and desktop support. */
export const startDesignSandbox = internalAction({
  args: {
    designSessionId: v.id("designSessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startDesignSandbox");
      }
      const repoId = args.repoId;

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";
      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, repoId);

      const designVolumeMounts = await ensureSessionPersistenceVolumes(
        daytona,
        repoId,
        "designSessions",
        args.designSessionId,
      );

      const reused = await tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          await exec(sandbox, "echo 1", 5);
          // Self-heal: rotate the per-sandbox secret + reinstall the helper
          // before any git network op so resumed sandboxes pick up the new
          // credential flow without carrying a stale URL-embedded token.
          await ensureGitCredentialHelper(ctx, sandbox, args.installationId);
          await syncDesignRefsForSetup(
            sandbox,
            args.repoOwner,
            args.repoName,
            args.branchName,
            args.baseBranch,
          );
          await setupBranch(sandbox, args.branchName, args.baseBranch);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
            devOverrides(repo),
          );
          await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
          await ctx.runAction(internal.daytona.runBackgroundCommands, {
            sandboxId: sandbox.id,
            repoId,
          });
          await ctx.runMutation(internal.designSessions.sandboxReady, {
            designSessionId: args.designSessionId,
            sandboxId: sandbox.id,
            branchName: args.branchName,
            isNew: false,
            devPort,
          });
        },
      );
      if (reused) return null;

      const prepared = await createSandboxAndPrepareRepo(
        ctx,
        daytona,
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
      await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
      await ctx.runAction(internal.daytona.runBackgroundCommands, {
        sandboxId: sandbox.id,
        repoId,
      });

      await ctx.runMutation(internal.designSessions.sandboxReady, {
        designSessionId: args.designSessionId,
        sandboxId: sandbox.id,
        branchName: args.branchName,
        isNew: true,
        devPort,
      });
    } catch (e) {
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
  const { daytona, sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveTaskSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );
  logSession(
    `prepareTaskPreviewSandbox context resolved (${actionDetails}, snapshot=${snapshotName ?? "none"}, rootDir=${rootDir || "."})`,
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
  const reused = await runLoggedSessionStep(
    "tryReuseTaskSandbox",
    actionDetails,
    () =>
      tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}`;
          await emitTaskProgress(
            ctx,
            args.taskId,
            completedSteps,
            "Resuming existing sandbox...",
          );
          await runLoggedSessionStep(
            "reuseTaskSandbox.prepare",
            sandboxDetails,
            async () => {
              await ensureSandboxRunning(sandbox, {
                timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
                onRestoring: () =>
                  emitTaskProgress(
                    ctx,
                    args.taskId,
                    completedSteps,
                    "Restoring sandbox from cold storage (can take up to 10 minutes)...",
                  ),
              });
              // Self-heal: rotate the per-sandbox secret + reinstall the
              // helper every resume so in-sandbox `git pull` and any
              // subsequent fetch authenticate without a stale URL token.
              await ensureGitCredentialHelper(
                ctx,
                sandbox,
                args.installationId,
              );
              await checkoutSessionBranchWithRetry(
                sandbox,
                args.branchName,
                args.baseBranch,
              );
            },
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
            () => copySandboxConfigFilesToWorkspace(sandbox),
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
            () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
          );
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
                  sandboxId: sandbox.id,
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
                { sandboxId: sandbox.id, repoId: args.repoId },
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
            sandbox,
            isNew: false,
            usedSnapshot: false,
            sandboxDetails,
            branchName: args.branchName,
            devPort,
            devCommand,
          };
        },
        {
          fallbackOnPrepareError: false,
        },
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

  await emitTaskProgress(
    ctx,
    args.taskId,
    completedSteps,
    "Setting up persistence volumes...",
  );
  const taskVolumeMounts = await runLoggedSessionStep(
    "ensureTaskPersistenceVolumes",
    actionDetails,
    () =>
      ensureSessionPersistenceVolumes(
        daytona,
        args.repoId,
        "agentTasks",
        args.taskId,
      ),
  );
  completedSteps.push({
    type: "tool",
    label: "Setting up persistence volumes...",
    status: "complete",
  });

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
        daytona,
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
  const sandbox = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
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
        sandbox,
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
      checkoutSessionBranchWithRetry(sandbox, args.branchName, args.baseBranch),
  );
  completedSteps.push({
    type: "tool",
    label: "Checking out branch...",
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
    "newTaskSandbox.copyConfigFiles",
    sandboxDetails,
    () => copySandboxConfigFilesToWorkspace(sandbox),
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
    "newTaskSandbox.startSessionServices",
    sandboxDetails,
    () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
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
      const result = await ctx.runAction(internal.daytona.runStartupCommands, {
        sandboxId: sandbox.id,
        repoId: args.repoId,
        force: args.forceStartupCommands,
      });
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
        { sandboxId: sandbox.id, repoId: args.repoId },
      );
      if (result.ran && result.commandCount > 0) {
        logSession(
          `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
        );
      }
    },
  );

  return {
    sandbox,
    isNew: true,
    usedSnapshot: prepared.usedSnapshot,
    sandboxDetails,
    branchName: args.branchName,
    devPort,
    devCommand,
  };
}

type ProjectPreviewSandboxPreparationArgs = {
  projectId: Id<"projects">;
  existingSandboxId: string | undefined;
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  repoId: Id<"githubRepos">;
  forceStartupCommands?: boolean;
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
  const { daytona, sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveProjectSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );
  logSession(
    `prepareProjectPreviewSandbox context resolved (${actionDetails}, snapshot=${snapshotName ?? "none"}, rootDir=${rootDir || "."})`,
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
  const reused = await runLoggedSessionStep(
    "tryReuseProjectSandbox",
    actionDetails,
    () =>
      tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}`;
          await emitProjectProgress(
            ctx,
            args.projectId,
            completedSteps,
            "Resuming existing sandbox...",
          );
          await runLoggedSessionStep(
            "reuseProjectSandbox.prepare",
            sandboxDetails,
            async () => {
              await ensureSandboxRunning(sandbox, {
                timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
                onRestoring: () =>
                  emitProjectProgress(
                    ctx,
                    args.projectId,
                    completedSteps,
                    "Restoring sandbox from cold storage (can take up to 10 minutes)...",
                  ),
              });
              // Self-heal: rotate the per-sandbox secret + reinstall the
              // helper every resume so in-sandbox `git pull` and any
              // subsequent fetch authenticate without a stale URL token.
              await ensureGitCredentialHelper(
                ctx,
                sandbox,
                args.installationId,
              );
              await checkoutSessionBranchWithRetry(
                sandbox,
                args.branchName,
                args.baseBranch,
              );
            },
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
            () => copySandboxConfigFilesToWorkspace(sandbox),
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
            () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
          );
          completedSteps.push({
            type: "tool",
            label: "Starting dev server...",
            status: "complete",
          });
          await runLoggedSessionStep(
            "reuseProjectSandbox.runStartupCommands",
            sandboxDetails,
            async () => {
              const result = await ctx.runAction(
                internal.daytona.runStartupCommands,
                {
                  sandboxId: sandbox.id,
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
                { sandboxId: sandbox.id, repoId: args.repoId },
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
            sandbox,
            isNew: false,
            usedSnapshot: false,
            sandboxDetails,
            branchName: args.branchName,
            devPort,
            devCommand,
          };
        },
        {
          fallbackOnPrepareError: false,
        },
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

  await emitProjectProgress(
    ctx,
    args.projectId,
    completedSteps,
    "Setting up persistence volumes...",
  );
  const projectVolumeMounts = await runLoggedSessionStep(
    "ensureProjectPersistenceVolumes",
    actionDetails,
    () =>
      ensureSessionPersistenceVolumes(
        daytona,
        args.repoId,
        "projects",
        args.projectId,
      ),
  );
  completedSteps.push({
    type: "tool",
    label: "Setting up persistence volumes...",
    status: "complete",
  });

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
        daytona,
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
  const sandbox = prepared.sandbox;
  const sandboxDetails = `${actionDetails}, sandboxId=${sandbox.id}, usedSnapshot=${prepared.usedSnapshot ? "true" : "false"}`;
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
        sandbox,
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
      checkoutSessionBranchWithRetry(sandbox, args.branchName, args.baseBranch),
  );
  completedSteps.push({
    type: "tool",
    label: "Checking out branch...",
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
    "newProjectSandbox.copyConfigFiles",
    sandboxDetails,
    () => copySandboxConfigFilesToWorkspace(sandbox),
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
    "newProjectSandbox.startSessionServices",
    sandboxDetails,
    () => startSessionServices(sandbox, rootDir, devOverrides(repo)),
  );
  completedSteps.push({
    type: "tool",
    label: "Starting dev server...",
    status: "complete",
  });

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
      const result = await ctx.runAction(internal.daytona.runStartupCommands, {
        sandboxId: sandbox.id,
        repoId: args.repoId,
        force: args.forceStartupCommands,
      });
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
        { sandboxId: sandbox.id, repoId: args.repoId },
      );
      if (result.ran && result.commandCount > 0) {
        logSession(
          `Launched ${result.commandCount} background command(s)${result.errors.length > 0 ? ` with errors: ${result.errors.join("; ")}` : ""}`,
        );
      }
    },
  );

  return {
    sandbox,
    isNew: true,
    usedSnapshot: prepared.usedSnapshot,
    sandboxDetails,
    branchName: args.branchName,
    devPort,
    devCommand,
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
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
    forceStartupCommands: v.optional(v.boolean()),
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
          ? "newProjectSandbox.sandboxReady"
          : "reuseProjectSandbox.sandboxReady",
        prepared.sandboxDetails,
        () =>
          ctx.runMutation(internal.projects.projectSandboxReady, {
            projectId: args.projectId,
            sandboxId: prepared.sandbox.id,
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
