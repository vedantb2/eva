"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  exec,
  WORKSPACE_DIR,
  resolveSandboxContext,
  ensureSandboxRunning,
  errorMessage,
  sleep,
} from "./helpers";
import {
  syncRepo,
  setupBranch,
  checkoutSessionBranch,
  createSandboxAndPrepareRepo,
  createBranchSyncStrategy,
  fetchBranchRefs,
  remoteBranchExists,
  SESSION_LIFECYCLE,
} from "./git";
import { ensureSessionClaudeVolume } from "./volumes";
import { startSessionServices } from "./devServer";
import type { Daytona, Sandbox } from "@daytonaio/sdk";

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

function isRetryableSessionFetchError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("sandbox exec") && lower.includes("timed out");
}

async function checkSessionBranchExistsWithRetry(
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
        10,
      );
      if (attempt > 1) {
        logSession(
          `checkSessionBranchExistsWithRetry recovered on retry ${attempt}/${maxAttempts} (repo=${repoOwner}/${repoName}, branch=${branchName})`,
        );
      }
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canRetry =
        attempt < maxAttempts && isRetryableSessionFetchError(message);
      if (!canRetry) {
        throw error;
      }
      const delayMs = 1000 * attempt;
      logSession(
        `checkSessionBranchExistsWithRetry retrying after ${delayMs}ms (attempt ${attempt}/${maxAttempts}, repo=${repoOwner}/${repoName}, branch=${branchName}): ${message}`,
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
        attempt < maxAttempts && isRetryableSessionFetchError(message);
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

async function syncSessionRefsForRestore(
  sandbox: Sandbox,
  installationId: number,
  repoOwner: string,
  repoName: string,
  branchName: string,
  baseBranch: string,
): Promise<void> {
  const sessionBranchExists = await checkSessionBranchExistsWithRetry(
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
      const repoId = args.repoId;

      const repo = await runLoggedSessionStep(
        "loadSessionRepo",
        actionDetails,
        () =>
          ctx.runQuery(internal.githubRepos.getInternal, {
            id: repoId,
          }),
      );
      const rootDir = repo?.rootDirectory ?? "";
      const syncStrategy = getSessionSyncStrategy(
        args.branchName,
        args.baseBranch,
      );

      const { daytona, sandboxEnvVars, snapshotName } =
        await runLoggedSessionStep(
          "resolveSessionSandboxContext",
          actionDetails,
          () => resolveSandboxContext(ctx, repoId),
        );
      logSession(
        `startSessionSandbox context resolved (${actionDetails}, snapshot=${snapshotName ?? "none"}, rootDir=${rootDir || "."}, syncStrategy=${syncStrategy.mode === "branches" ? syncStrategy.branchNames.join(",") : syncStrategy.mode})`,
      );

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
                await checkoutSessionBranch(
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
            await runLoggedSessionStep(
              "reuseSessionSandbox.sandboxReady",
              sandboxDetails,
              () =>
                ctx.runMutation(internal.sessions.sandboxReady, {
                  sessionId: args.sessionId,
                  sandboxId: sandbox.id,
                  branchName: args.branchName,
                  isNew: false,
                  devPort,
                  devCommand,
                }),
            );
          }),
      );
      if (reused) {
        logSession(
          `startSessionSandbox reused existing sandbox in ${formatDurationMs(Date.now() - actionStartedAt)} (${actionDetails}, sandboxId=${reused.id})`,
        );
        return null;
      }

      const sessionVolumeMounts = await runLoggedSessionStep(
        "ensureSessionClaudeVolume",
        actionDetails,
        () => ensureSessionClaudeVolume(daytona, args.sessionId),
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
        () => checkoutSessionBranch(sandbox, args.branchName, args.baseBranch),
      );
      const { port: devPort, devCommand } = await runLoggedSessionStep(
        "newSessionSandbox.startSessionServices",
        sandboxDetails,
        () => startSessionServices(sandbox, rootDir),
      );

      await runLoggedSessionStep(
        "newSessionSandbox.sandboxReady",
        sandboxDetails,
        () =>
          ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: sandbox.id,
            branchName: args.branchName,
            isNew: true,
            usedSnapshot: prepared.usedSnapshot,
            devPort,
            devCommand,
          }),
      );
      logSession(
        `startSessionSandbox completed in ${formatDurationMs(Date.now() - actionStartedAt)} (${sandboxDetails})`,
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
      const syncStrategy = getSessionSyncStrategy(
        args.branchName,
        args.baseBranch,
      );

      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      const designVolumeMounts = await ensureSessionClaudeVolume(
        daytona,
        args.designSessionId,
      );

      const reused = await tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          await exec(sandbox, "echo 1", 5);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
            syncStrategy,
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
        syncStrategy,
      );
      const sandbox = prepared.sandbox;
      await setupBranch(sandbox, args.branchName, args.baseBranch);
      if (prepared.usedSnapshot) {
        await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 240);
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
