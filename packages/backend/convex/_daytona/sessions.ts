"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";
import {
  exec,
  resolveSandboxContext,
  ensureSandboxRunning,
  errorMessage,
  sleep,
  workspaceDirShell,
} from "./helpers";
import {
  setupBranch,
  checkoutSessionBranch,
  createSandboxAndPrepareRepo,
  createBranchSyncStrategy,
  fetchBranchRefs,
  remoteBranchExists,
  SESSION_LIFECYCLE,
} from "./git";
import { ensureSessionClaudeVolume } from "./volumes";
import { detectPackageManager, startSessionServices } from "./devServer";
import type { Daytona, Sandbox } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import { startDesktopWithChrome } from "./desktop";

function formatDurationMs(durationMs: number): string {
  return `${durationMs}ms`;
}

function logSession(message: string): void {
  console.log(`[daytona][sessions] ${message}`);
}

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
      `${label} completed in ${formatDurationMs(Date.now() - startedAt)}${details ? ` (${details})` : ""}`,
    );
    return result;
  } catch (error) {
    console.error(
      `[daytona][sessions] ${label} failed after ${formatDurationMs(Date.now() - startedAt)}${details ? ` (${details})` : ""}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

function getSessionSyncStrategy(branchName: string, baseBranch: string) {
  return createBranchSyncStrategy([branchName, baseBranch]);
}

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
    lower.includes("gnutls recv error") ||
    lower.includes("tls connection was non-properly terminated") ||
    lower.includes("remote end hung up unexpectedly") ||
    lower.includes("http/2 stream") ||
    lower.includes("early eof") ||
    lower.includes("connection reset by peer") ||
    lower.includes("rpc failed")
  );
}

async function checkRemoteBranchExistsWithRetry(
  sandbox: Sandbox,
  installationId: number,
  repoOwner: string,
  repoName: string,
  branchName: string,
): Promise<boolean> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const exists = await remoteBranchExists(
        sandbox,
        installationId,
        repoOwner,
        repoName,
        branchName,
        20,
      );
      if (attempt > 1) {
        logSession(
          `checkRemoteBranchExistsWithRetry recovered on retry ${attempt}/${maxAttempts} (repo=${repoOwner}/${repoName}, branch=${branchName})`,
        );
      }
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canRetry =
        attempt < maxAttempts && isRetryableSessionGitError(message);
      if (!canRetry) {
        throw error;
      }
      const delayMs = 1000 * attempt;
      logSession(
        `checkRemoteBranchExistsWithRetry retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts}, repo=${repoOwner}/${repoName}, branch=${branchName}): ${message}`,
      );
      await sleep(delayMs);
    }
  }
  return false;
}

async function fetchSessionBaseFallbackBranch(
  sandbox: Sandbox,
  installationId: number,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fetchBranchRefs(
        sandbox,
        installationId,
        repoOwner,
        repoName,
        [baseBranch],
        {
          prune: false,
          timeoutSeconds: 15,
          shallow: true,
        },
      );
      if (attempt > 1) {
        logSession(
          `fetchSessionBaseFallbackBranch recovered on retry ${attempt}/${maxAttempts} (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
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
        `fetchSessionBaseFallbackBranch retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts}, repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch}): ${message}`,
      );
      await sleep(delayMs);
    }
  }
}

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

async function syncSessionRefsForRestore(
  sandbox: Sandbox,
  installationId: number,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const sessionBranchExists = await checkRemoteBranchExistsWithRetry(
    sandbox,
    installationId,
    repoOwner,
    repoName,
    branchName,
  );
  if (sessionBranchExists) {
    await fetchBranchRefs(
      sandbox,
      installationId,
      repoOwner,
      repoName,
      [branchName],
      {
        prune: false,
        timeoutSeconds: 240,
        shallow: true,
      },
    );
    logSession(
      `syncSessionRefsForRestore fetched existing remote session branch (repo=${repoOwner}/${repoName}, branch=${branchName})`,
    );
    return;
  }
  logSession(
    `syncSessionRefsForRestore remote session branch missing, falling back to base branch fetch (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
  await fetchSessionBaseFallbackBranch(
    sandbox,
    installationId,
    repoOwner,
    repoName,
    branchName,
    baseBranch,
  );
}

async function syncDesignRefsForSetup(
  sandbox: Sandbox,
  installationId: number,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const designBranchExists = await checkRemoteBranchExistsWithRetry(
    sandbox,
    installationId,
    repoOwner,
    repoName,
    branchName,
  );
  const branchNames = designBranchExists
    ? [baseBranch, branchName]
    : [baseBranch];
  await fetchBranchRefs(
    sandbox,
    installationId,
    repoOwner,
    repoName,
    branchNames,
    {
      prune: false,
      timeoutSeconds: 240,
    },
  );
  logSession(
    designBranchExists
      ? `syncDesignRefsForSetup fetched base and existing design branch (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`
      : `syncDesignRefsForSetup fetched base branch only (repo=${repoOwner}/${repoName}, branch=${branchName}, base=${baseBranch})`,
  );
}

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

async function tryReuseSandbox(
  daytona: Daytona,
  existingSandboxId: string | undefined,
  prepareFn: (sandbox: Sandbox) => Promise<void>,
): Promise<Sandbox | null> {
  if (!existingSandboxId) return null;
  try {
    const sandbox = await daytona.get(existingSandboxId);
    await prepareFn(sandbox);
    return sandbox;
  } catch {
    return null;
  }
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

async function prepareSessionSandboxInternal(
  ctx: GenericActionCtx<DataModel>,
  args: SessionSandboxPreparationArgs,
): Promise<PreparedSessionSandbox> {
  const actionDetails = `sessionId=${args.sessionId}, repo=${args.repoOwner}/${args.repoName}, branch=${args.branchName}, base=${args.baseBranch}, existingSandboxId=${args.existingSandboxId ?? "none"}`;
  const repo = await runLoggedSessionStep(
    "loadSessionRepo",
    actionDetails,
    () =>
      ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      }),
  );
  const rootDir = repo?.rootDirectory ?? "";
  const syncStrategy = getSessionSyncStrategy(args.branchName, args.baseBranch);

  const { daytona, sandboxEnvVars, snapshotName } = await runLoggedSessionStep(
    "resolveSessionSandboxContext",
    actionDetails,
    () => resolveSandboxContext(ctx, args.repoId),
  );
  logSession(
    `prepareSessionSandbox context resolved (${actionDetails}, snapshot=${snapshotName ?? "none"}, rootDir=${rootDir || "."}, syncStrategy=${syncStrategy.mode === "branches" ? syncStrategy.branchNames.join(",") : syncStrategy.mode})`,
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
            await ensureSandboxRunning(sandbox);
            await syncSessionRefsForRestore(
              sandbox,
              args.installationId,
              args.repoOwner,
              args.repoName,
              args.branchName,
              args.baseBranch,
            );
            await checkoutSessionBranchWithRetry(
              sandbox,
              args.branchName,
              args.baseBranch,
            );
          },
        );
        const { port: devPort, devCommand } = await runLoggedSessionStep(
          "reuseSessionSandbox.startSessionServices",
          sandboxDetails,
          () => startSessionServices(sandbox, rootDir),
        );
        if (args.startDesktop) {
          await runLoggedSessionStep(
            "reuseSessionSandbox.startDesktop",
            sandboxDetails,
            () => startDesktopWithChrome(sandbox),
          );
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
    return reusedResult;
  }

  const sessionVolumeMounts = await runLoggedSessionStep(
    "ensureSessionClaudeVolume",
    actionDetails,
    () =>
      ensureSessionClaudeVolume(
        daytona,
        args.repoId,
        "sessions",
        args.sessionId,
      ),
  );
  const prepared = await runLoggedSessionStep(
    "createSessionSandboxAndPrepareRepo",
    `${actionDetails}, snapshot=${snapshotName ?? "none"}`,
    () =>
      createSandboxAndPrepareRepo(
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
  await runLoggedSessionStep(
    "newSessionSandbox.syncSessionRefsForRestore",
    sandboxDetails,
    () =>
      syncSessionRefsForRestore(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        args.branchName,
        args.baseBranch,
      ),
  );
  await runLoggedSessionStep(
    "newSessionSandbox.checkoutSessionBranch",
    sandboxDetails,
    () =>
      checkoutSessionBranchWithRetry(sandbox, args.branchName, args.baseBranch),
  );
  const { port: devPort, devCommand } = await runLoggedSessionStep(
    "newSessionSandbox.startSessionServices",
    sandboxDetails,
    () => startSessionServices(sandbox, rootDir),
  );
  if (args.startDesktop) {
    await runLoggedSessionStep(
      "newSessionSandbox.startDesktop",
      sandboxDetails,
      () => startDesktopWithChrome(sandbox),
    );
  }
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
        `startSessionSandbox completed in ${formatDurationMs(Date.now() - actionStartedAt)} (${prepared.sandboxDetails})`,
      );
    } catch (e) {
      console.error(
        `[daytona][sessions] startSessionSandbox failed after ${formatDurationMs(Date.now() - actionStartedAt)} (${actionDetails}): ${errorMessage(e, "Unknown error")}`,
      );
      await ctx.runMutation(internal.sessions.sandboxError, {
        sessionId: args.sessionId,
        error: errorMessage(e, "Unknown error"),
      });
    }
    return null;
  },
});

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

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";
      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      const designVolumeMounts = await ensureSessionClaudeVolume(
        daytona,
        args.repoId,
        "designSessions",
        args.designSessionId,
      );

      const reused = await tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          await exec(sandbox, "echo 1", 5);
          await syncDesignRefsForSetup(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
            args.branchName,
            args.baseBranch,
          );
          await setupBranch(sandbox, args.branchName, args.baseBranch);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
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
        args.installationId,
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
      );
      await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);

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
