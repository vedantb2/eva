"use node";

import { v } from "convex/values";
import type { Sandbox } from "@daytonaio/sdk";
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
  signAndLaunchScript,
} from "./helpers";
import {
  fetchOrigin,
  setupBranch,
  createSandboxAndPrepareRepo,
  getOrCreateSandbox,
} from "./git";
import { sessionClaudeUuid, ensureSessionClaudeVolume } from "./volumes";
import { startDesktopWithChrome } from "./desktop";
import { getTaskRunStreamingEntityId } from "../_taskWorkflow/helpers";

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

    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts = args.sessionPersistenceId
      ? await ensureSessionClaudeVolume(daytona, args.sessionPersistenceId)
      : undefined;
    const claudeSessionId = args.sessionPersistenceId
      ? sessionClaudeUuid(args.sessionPersistenceId)
      : undefined;
    const callbackEnvVars = { ...sandboxEnvVars };
    if (args.attachRunId && args.entityIdField === "taskId") {
      callbackEnvVars.STREAMING_ENTITY_ID = getTaskRunStreamingEntityId(
        args.attachRunId,
      );
      callbackEnvVars.RUN_ID = String(args.attachRunId);
    }

    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 5;
    const attachRunSandbox = async (
      sandboxToAttach: Sandbox,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            daytona,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            snapshotName,
            sessionVolumeMounts,
            attachRunSandbox,
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = true;
        } else {
          const prepared = await getOrCreateSandbox(
            daytona,
            args.existingSandboxId,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            snapshotName,
            sessionVolumeMounts,
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = prepared.isNew;
        }

        if (args.baseBranch) {
          await fetchOrigin(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
            args.baseBranch,
            { prune: false, timeoutSeconds: 30 },
          );
          await exec(
            sandbox,
            `cd ${WORKSPACE_DIR} && git checkout ${quote([args.baseBranch])} && git pull --ff-only origin ${quote([args.baseBranch])}`,
            30,
          );
        }

        if (args.branchName) {
          await setupBranch(sandbox, args.branchName);
        }

        if (args.startDesktop) {
          await startDesktopWithChrome(sandbox);
        }

        break;
      } catch (error) {
        if (deleteSandboxOnFailure && sandbox) {
          try {
            await sandbox.delete();
          } catch {}
        }

        const message = errorMessage(error, "Sandbox setup failed");
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
        const shouldRetry =
          (hasDaytonaMarker && (hasTransientMarker || hasTransientStatus)) ||
          isSnapshotReadyTimeout;

        if (!shouldRetry || attempt >= maxSetupAttempts) {
          throw error;
        }

        const delayMs =
          2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
        console.warn(
          `[daytona] setupAndExecute transient failure (attempt ${attempt}/${maxSetupAttempts}), retrying in ${delayMs}ms: ${message}`,
        );
        await sleep(delayMs);
        attempt += 1;
        sandbox = undefined;
        deleteSandboxOnFailure = false;
      }
    }

    if (!sandbox) {
      throw new Error("Sandbox setup failed");
    }

    try {
      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        args.prompt,
        args.completionMutation,
        args.entityIdField,
        args.entityId,
        {
          model: args.model,
          allowedTools: args.allowedTools,
          systemPrompt: args.systemPrompt,
          extraEnvVars: callbackEnvVars,
          claudeSessionId,
        },
      );

      return { sandboxId: sandbox.id };
    } catch (error) {
      if (deleteSandboxOnFailure) {
        try {
          await sandbox.delete();
        } catch {}
      }
      throw error;
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
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
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
