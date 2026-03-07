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
import { isDaytonaNetworkIssue } from "../_taskWorkflow/recovery";
import {
  fetchOrigin,
  setupBranch,
  createSandboxAndPrepareRepo,
  getOrCreateSandbox,
} from "./git";
import { sessionClaudeUuid, ensureSessionClaudeVolume } from "./volumes";
import { startDesktopWithChrome } from "./desktop";

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

const MAX_SETUP_ELAPSED_MS = 7 * 60 * 1000;

export const prepareSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
    attachRunId: v.optional(v.id("agentRuns")),
    sessionPersistenceId: v.optional(v.id("sessions")),
    startDesktop: v.optional(v.boolean()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const setupStartedAt = Date.now();
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts = args.sessionPersistenceId
      ? await ensureSessionClaudeVolume(daytona, args.sessionPersistenceId)
      : undefined;

    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 2;
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
        const elapsed = Date.now() - setupStartedAt;
        const shouldRetry =
          isDaytonaNetworkIssue(message) && elapsed < MAX_SETUP_ELAPSED_MS;

        if (!shouldRetry || attempt >= maxSetupAttempts) {
          throw error;
        }

        const delayMs =
          2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
        console.warn(
          `[daytona] prepareSandbox transient failure (attempt ${attempt}/${maxSetupAttempts}), retrying in ${delayMs}ms: ${message}`,
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

    return { sandboxId: sandbox.id };
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
    streamingEntityId: v.optional(v.string()),
    runId: v.optional(v.string()),
    sessionPersistenceId: v.optional(v.id("sessions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    const extraEnvVars: Record<string, string> = {};
    if (args.streamingEntityId) {
      extraEnvVars.STREAMING_ENTITY_ID = args.streamingEntityId;
    }
    if (args.runId) {
      extraEnvVars.RUN_ID = args.runId;
    }

    const claudeSessionId = args.sessionPersistenceId
      ? sessionClaudeUuid(args.sessionPersistenceId)
      : undefined;

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
        extraEnvVars:
          Object.keys(extraEnvVars).length > 0 ? extraEnvVars : undefined,
        claudeSessionId,
      },
    );

    return null;
  },
});
