"use node";

import { v } from "convex/values";
import type { Daytona, Sandbox, VolumeMount } from "@daytonaio/sdk";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { quote } from "shell-quote";
import {
  exec,
  WORKSPACE_DIR,
  resolveSandboxContext,
  getSandbox,
  sleep,
  errorMessage,
  withTimeout,
  SETUP_WALL_CLOCK_TIMEOUT_MS,
  SETUP_MAX_ATTEMPTS,
  DAYTONA_GET_TIMEOUT_MS,
} from "./helpers";
import {
  fetchOrigin,
  setupBranch,
  acquireSandbox,
  prepareSandboxRepo,
  ensureWorkspaceDependencies,
} from "./git";
import { sessionClaudeUuid, ensureSessionClaudeVolume } from "./volumes";
import { launchScript } from "./launch";
import { startDesktopWithChrome } from "./desktop";
import { getTaskRunStreamingEntityId } from "../_taskWorkflow/helpers";

const ACQUIRE_EXECUTION_TIMEOUT_MS = 240_000;
const PREPARE_EXECUTION_TIMEOUT_MS = 480_000;
const LAUNCH_EXECUTION_TIMEOUT_MS = 120_000;

type NodeActionCtx = GenericActionCtx<DataModel>;

type StageTiming = {
  stage: string;
  durationMs: number;
};

type ResolveSessionContextResult = {
  daytona: Daytona;
  sandboxEnvVars: Record<string, string>;
  snapshotName: string | undefined;
  sessionVolumeMounts: VolumeMount[] | undefined;
  claudeSessionId: string | undefined;
};

type AcquireExecutionParams = {
  existingSandboxId: string | undefined;
  installationId: number;
  repoId: Id<"githubRepos">;
  ephemeral: boolean;
  attachRunId: Id<"agentRuns"> | undefined;
  sessionPersistenceId: Id<"sessions"> | undefined;
  entityIdField: string;
};

type AcquireContext = {
  sandbox: Sandbox;
  isNewSandbox: boolean;
  deleteSandboxOnFailure: boolean;
  snapshotName: string | undefined;
  callbackEnvVars: Record<string, string>;
  claudeSessionId: string | undefined;
};

type PrepareExecutionParams = {
  installationId: number;
  repoOwner: string;
  repoName: string;
  isNewSandbox: boolean;
  snapshotName: string | undefined;
  baseBranch: string | undefined;
  branchName: string | undefined;
  startDesktop: boolean;
};

type LaunchExecutionParams = {
  prompt: string;
  completionMutation: string;
  entityIdField: string;
  userId: Id<"users">;
  entityId: string;
  model: string | undefined;
  allowedTools: string | undefined;
  systemPrompt: string | undefined;
  callbackEnvVars: Record<string, string>;
  claudeSessionId: string | undefined;
};

function buildCallbackEnvVars(
  sandboxEnvVars: Record<string, string>,
  attachRunId: Id<"agentRuns"> | undefined,
  entityIdField: string,
): Record<string, string> {
  const callbackEnvVars = { ...sandboxEnvVars };
  if (attachRunId && entityIdField === "taskId") {
    callbackEnvVars.STREAMING_ENTITY_ID =
      getTaskRunStreamingEntityId(attachRunId);
    callbackEnvVars.RUN_ID = String(attachRunId);
  }
  return callbackEnvVars;
}

function buildTransientRetryDelayMs(attempt: number): number {
  return 2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
}

function isRetryableSetupError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const hasDaytonaMarker =
    lowerMessage.includes("daytona") ||
    lowerMessage.includes("daytonaerror") ||
    lowerMessage.includes("sandbox") ||
    lowerMessage.includes("snapshot");
  const hasTransientMarker =
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("econnreset") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("etimedout") ||
    lowerMessage.includes("enotfound") ||
    lowerMessage.includes("getaddrinfo") ||
    lowerMessage.includes("socket hang up") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("timed out") ||
    lowerMessage.includes("aborted");
  const hasTransientStatus =
    lowerMessage.includes("status code 408") ||
    lowerMessage.includes("status code 429") ||
    lowerMessage.includes("status code 500") ||
    lowerMessage.includes("status code 502") ||
    lowerMessage.includes("status code 503") ||
    lowerMessage.includes("status code 504");
  const isSnapshotReadyTimeout = lowerMessage.includes(
    "sandbox failed to become ready within the timeout period",
  );
  return (
    (hasDaytonaMarker && (hasTransientMarker || hasTransientStatus)) ||
    isSnapshotReadyTimeout
  );
}

function toStageError(
  stage: string,
  durationMs: number,
  message: string,
): Error {
  return new Error(
    `[daytona stage=${stage} elapsedMs=${durationMs}] ${message}`,
  );
}

async function runStage<T>(
  timings: StageTiming[],
  stage: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    timings.push({ stage, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    throw toStageError(
      stage,
      Date.now() - startedAt,
      errorMessage(error, "Stage failed"),
    );
  }
}

function logStageTimings(scope: string, timings: StageTiming[]): void {
  if (timings.length === 0) {
    return;
  }
  const summary = timings
    .map((timing) => `${timing.stage}:${timing.durationMs}ms`)
    .join(", ");
  console.info(`[daytona] ${scope} timings ${summary}`);
}

async function resolveSessionContext(
  ctx: NodeActionCtx,
  repoId: Id<"githubRepos">,
  sessionPersistenceId: Id<"sessions"> | undefined,
): Promise<ResolveSessionContextResult> {
  const { daytona, sandboxEnvVars, snapshotName } = await resolveSandboxContext(
    ctx,
    repoId,
  );
  const sessionVolumeMounts = sessionPersistenceId
    ? await ensureSessionClaudeVolume(daytona, sessionPersistenceId)
    : undefined;
  const claudeSessionId = sessionPersistenceId
    ? sessionClaudeUuid(sessionPersistenceId)
    : undefined;
  return {
    daytona,
    sandboxEnvVars,
    snapshotName,
    sessionVolumeMounts,
    claudeSessionId,
  };
}

async function acquireExecutionSandboxInternal(
  ctx: NodeActionCtx,
  params: AcquireExecutionParams,
  timings: StageTiming[],
): Promise<AcquireContext> {
  const resolved = await runStage(timings, "resolve_context", async () => {
    return await resolveSessionContext(
      ctx,
      params.repoId,
      params.sessionPersistenceId,
    );
  });

  const callbackEnvVars = buildCallbackEnvVars(
    resolved.sandboxEnvVars,
    params.attachRunId,
    params.entityIdField,
  );

  let attempt = 1;
  while (true) {
    try {
      const acquired = await runStage(
        timings,
        `acquire_sandbox_attempt_${attempt}`,
        async () => {
          if (params.ephemeral) {
            return await acquireSandbox(
              resolved.daytona,
              undefined,
              params.installationId,
              resolved.sandboxEnvVars,
              resolved.snapshotName,
              resolved.sessionVolumeMounts,
            );
          }

          return await acquireSandbox(
            resolved.daytona,
            params.existingSandboxId,
            params.installationId,
            resolved.sandboxEnvVars,
            resolved.snapshotName,
            resolved.sessionVolumeMounts,
          );
        },
      );

      if (params.attachRunId && params.entityIdField === "taskId") {
        const runId = params.attachRunId;
        try {
          await runStage(timings, "attach_run_sandbox", async () => {
            await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
              runId,
              sandboxId: acquired.sandbox.id,
            });
          });
        } catch (error) {
          if (params.ephemeral || acquired.isNew) {
            try {
              await acquired.sandbox.delete();
            } catch {}
          }
          throw error;
        }
      }

      return {
        sandbox: acquired.sandbox,
        isNewSandbox: acquired.isNew,
        deleteSandboxOnFailure: params.ephemeral || acquired.isNew,
        snapshotName: resolved.snapshotName,
        callbackEnvVars,
        claudeSessionId: resolved.claudeSessionId,
      };
    } catch (error) {
      const message = errorMessage(error, "Sandbox setup failed");
      const shouldRetry = isRetryableSetupError(message);
      if (!shouldRetry || attempt >= SETUP_MAX_ATTEMPTS) {
        throw error;
      }

      const delayMs = buildTransientRetryDelayMs(attempt);
      console.warn(
        `[daytona] transient sandbox setup failure (attempt ${attempt}/${SETUP_MAX_ATTEMPTS}), retrying in ${delayMs}ms: ${message}`,
      );
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

async function prepareExecutionSandboxInternal(
  sandbox: Sandbox,
  params: PrepareExecutionParams,
  timings: StageTiming[],
): Promise<void> {
  await runStage(timings, "prepare_repo", async () => {
    await prepareSandboxRepo(
      sandbox,
      params.installationId,
      params.repoOwner,
      params.repoName,
      {
        isNew: params.isNewSandbox,
        snapshotName: params.snapshotName,
      },
    );
  });

  if (params.baseBranch) {
    const baseBranch = params.baseBranch;
    await runStage(timings, "sync_base_branch", async () => {
      await fetchOrigin(
        sandbox,
        params.installationId,
        params.repoOwner,
        params.repoName,
        baseBranch,
        { prune: false, timeoutSeconds: 30 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git checkout ${quote([baseBranch])} && git pull --ff-only origin ${quote([baseBranch])}`,
        30,
      );
    });

    await runStage(
      timings,
      "install_dependencies_after_base_sync",
      async () => {
        await ensureWorkspaceDependencies(sandbox);
      },
    );
  }

  if (params.branchName) {
    const branchName = params.branchName;
    await runStage(timings, "setup_branch", async () => {
      await setupBranch(sandbox, branchName);
    });
  }

  if (params.startDesktop) {
    await runStage(timings, "start_desktop", async () => {
      await startDesktopWithChrome(sandbox);
    });
  }
}

async function launchExecutionOnSandboxInternal(
  ctx: NodeActionCtx,
  sandbox: Sandbox,
  params: LaunchExecutionParams,
  timings: StageTiming[],
): Promise<void> {
  const sandboxToken = await runStage(
    timings,
    "sign_sandbox_token",
    async () => {
      return await ctx.runAction(internal.sandboxJwt.signSandboxToken, {
        userId: params.userId,
      });
    },
  );

  await runStage(timings, "launch_script", async () => {
    await launchScript(
      sandbox,
      params.prompt,
      params.completionMutation,
      params.entityIdField,
      sandboxToken,
      params.entityId,
      {
        model: params.model,
        allowedTools: params.allowedTools,
        systemPrompt: params.systemPrompt,
        extraEnvVars: params.callbackEnvVars,
        claudeSessionId: params.claudeSessionId,
      },
    );
  });
}

export const runSandboxCommand = internalAction({
  args: {
    sandboxId: v.string(),
    command: v.string(),
    timeoutSeconds: v.optional(v.number()),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    return (
      await exec(sandbox, args.command, args.timeoutSeconds ?? 30)
    ).trim();
  },
});

export const getPreviewUrl = action({
  args: {
    sandboxId: v.string(),
    port: v.number(),
    checkReady: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    url: v.string(),
    port: v.number(),
    ready: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    const signedPreview = await sandbox.getSignedPreviewUrl(args.port, 86400);
    let ready = true;
    if (args.checkReady) {
      try {
        const result = await exec(
          sandbox,
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${args.port}`,
          3,
        );
        const code = parseInt(result.trim() || "0", 10);
        ready = code >= 200 && code < 500;
      } catch {
        ready = false;
      }
    }

    const parsedUrl = new URL(signedPreview.url);
    parsedUrl.protocol = "https:";
    const url = parsedUrl.toString();
    return { url, port: args.port, ready };
  },
});

export const acquireExecutionSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoId: v.id("githubRepos"),
    ephemeral: v.optional(v.boolean()),
    attachRunId: v.optional(v.id("agentRuns")),
    sessionPersistenceId: v.optional(v.id("sessions")),
    entityIdField: v.string(),
  },
  returns: v.object({
    sandboxId: v.string(),
    isNewSandbox: v.boolean(),
    deleteSandboxOnFailure: v.boolean(),
    snapshotName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const timings: StageTiming[] = [];

    try {
      const acquired = await withTimeout(
        acquireExecutionSandboxInternal(
          ctx,
          {
            existingSandboxId: args.existingSandboxId,
            installationId: args.installationId,
            repoId: args.repoId,
            ephemeral: args.ephemeral ?? false,
            attachRunId: args.attachRunId,
            sessionPersistenceId: args.sessionPersistenceId,
            entityIdField: args.entityIdField,
          },
          timings,
        ),
        ACQUIRE_EXECUTION_TIMEOUT_MS,
        "acquireExecutionSandbox wall-clock",
      );

      return {
        sandboxId: acquired.sandbox.id,
        isNewSandbox: acquired.isNewSandbox,
        deleteSandboxOnFailure: acquired.deleteSandboxOnFailure,
        snapshotName: acquired.snapshotName,
      };
    } finally {
      logStageTimings("acquireExecutionSandbox", timings);
    }
  },
});

export const prepareExecutionSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    isNewSandbox: v.boolean(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    snapshotName: v.optional(v.string()),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const timings: StageTiming[] = [];

    try {
      await withTimeout(
        (async () => {
          const { daytona } = await runStage(
            timings,
            "resolve_context",
            async () => {
              return await resolveSandboxContext(ctx, args.repoId);
            },
          );

          const sandbox = await runStage(timings, "get_sandbox", async () => {
            return await withTimeout(
              daytona.get(args.sandboxId),
              DAYTONA_GET_TIMEOUT_MS,
              `daytona.get(${args.sandboxId})`,
            );
          });

          await prepareExecutionSandboxInternal(
            sandbox,
            {
              installationId: args.installationId,
              repoOwner: args.repoOwner,
              repoName: args.repoName,
              isNewSandbox: args.isNewSandbox,
              snapshotName: args.snapshotName,
              baseBranch: args.baseBranch,
              branchName: args.branchName,
              startDesktop: args.startDesktop ?? false,
            },
            timings,
          );
        })(),
        PREPARE_EXECUTION_TIMEOUT_MS,
        "prepareExecutionSandbox wall-clock",
      );

      return null;
    } finally {
      logStageTimings("prepareExecutionSandbox", timings);
    }
  },
});

export const launchExecutionOnSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    completionMutation: v.string(),
    entityIdField: v.string(),
    userId: v.id("users"),
    entityId: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    attachRunId: v.optional(v.id("agentRuns")),
    sessionPersistenceId: v.optional(v.id("sessions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const timings: StageTiming[] = [];

    try {
      await withTimeout(
        (async () => {
          const resolved = await runStage(
            timings,
            "resolve_context",
            async () => {
              return await resolveSessionContext(
                ctx,
                args.repoId,
                args.sessionPersistenceId,
              );
            },
          );

          const sandbox = await runStage(timings, "get_sandbox", async () => {
            return await withTimeout(
              resolved.daytona.get(args.sandboxId),
              DAYTONA_GET_TIMEOUT_MS,
              `daytona.get(${args.sandboxId})`,
            );
          });

          await launchExecutionOnSandboxInternal(
            ctx,
            sandbox,
            {
              prompt: args.prompt,
              completionMutation: args.completionMutation,
              entityIdField: args.entityIdField,
              userId: args.userId,
              entityId: args.entityId,
              model: args.model,
              allowedTools: args.allowedTools,
              systemPrompt: args.systemPrompt,
              callbackEnvVars: buildCallbackEnvVars(
                resolved.sandboxEnvVars,
                args.attachRunId,
                args.entityIdField,
              ),
              claudeSessionId: resolved.claudeSessionId,
            },
            timings,
          );
        })(),
        LAUNCH_EXECUTION_TIMEOUT_MS,
        "launchExecutionOnSandbox wall-clock",
      );

      return null;
    } finally {
      logStageTimings("launchExecutionOnSandbox", timings);
    }
  },
});

export const setupAndExecute = internalAction({
  args: {
    entityId: v.string(),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.optional(v.id("githubRepos")),
    attachRunId: v.optional(v.id("agentRuns")),
    sessionPersistenceId: v.optional(v.id("sessions")),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    if (!args.repoId) {
      throw new Error("repoId is required for setupAndExecute");
    }
    const repoId = args.repoId;

    const timings: StageTiming[] = [];
    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;

    try {
      const result = await withTimeout(
        (async () => {
          const acquired = await acquireExecutionSandboxInternal(
            ctx,
            {
              existingSandboxId: args.existingSandboxId,
              installationId: args.installationId,
              repoId,
              ephemeral: args.ephemeral ?? false,
              attachRunId: args.attachRunId,
              sessionPersistenceId: args.sessionPersistenceId,
              entityIdField: args.entityIdField,
            },
            timings,
          );

          sandbox = acquired.sandbox;
          deleteSandboxOnFailure = acquired.deleteSandboxOnFailure;

          await prepareExecutionSandboxInternal(
            acquired.sandbox,
            {
              installationId: args.installationId,
              repoOwner: args.repoOwner,
              repoName: args.repoName,
              isNewSandbox: acquired.isNewSandbox,
              snapshotName: acquired.snapshotName,
              baseBranch: args.baseBranch,
              branchName: args.branchName,
              startDesktop: args.startDesktop ?? false,
            },
            timings,
          );

          await launchExecutionOnSandboxInternal(
            ctx,
            acquired.sandbox,
            {
              prompt: args.prompt,
              completionMutation: args.completionMutation,
              entityIdField: args.entityIdField,
              userId: args.userId,
              entityId: args.entityId,
              model: args.model,
              allowedTools: args.allowedTools,
              systemPrompt: args.systemPrompt,
              callbackEnvVars: acquired.callbackEnvVars,
              claudeSessionId: acquired.claudeSessionId,
            },
            timings,
          );

          return { sandboxId: acquired.sandbox.id };
        })(),
        SETUP_WALL_CLOCK_TIMEOUT_MS,
        "setupAndExecute wall-clock",
      );

      return result;
    } catch (error) {
      if (deleteSandboxOnFailure && sandbox) {
        try {
          await sandbox.delete();
        } catch {}
      }
      throw error;
    } finally {
      logStageTimings("setupAndExecute", timings);
    }
  },
});

export const launchOnExistingSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandboxToken = await ctx.runAction(
      internal.sandboxJwt.signSandboxToken,
      { userId: args.userId },
    );
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    await launchScript(
      sandbox,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      sandboxToken,
      args.entityId,
      {
        model: args.model,
        allowedTools: args.allowedTools,
        systemPrompt: args.systemPrompt,
      },
    );

    return null;
  },
});
