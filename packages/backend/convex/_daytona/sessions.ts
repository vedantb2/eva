"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { quote } from "shell-quote";
import {
  exec,
  WORKSPACE_DIR,
  resolveSandboxContext,
  ensureSandboxRunning,
  errorMessage,
} from "./helpers";
import {
  fetchOrigin,
  syncRepo,
  setupBranch,
  checkoutSessionBranch,
  createSandboxAndPrepareRepo,
} from "./git";
import { ensureSessionClaudeVolume } from "./volumes";
import { startSessionServices } from "./devServer";
import type { Daytona, Sandbox } from "@daytonaio/sdk";

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
    try {
      if (!args.repoId) {
        throw new Error("repoId is required for startSessionSandbox");
      }

      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      const rootDir = repo?.rootDirectory ?? "";

      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

      const reused = await tryReuseSandbox(
        daytona,
        args.existingSandboxId,
        async (sandbox) => {
          await ensureSandboxRunning(sandbox);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await checkoutSessionBranch(
            sandbox,
            args.branchName,
            args.baseBranch,
          );
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: sandbox.id,
            branchName: args.branchName,
            isNew: false,
            devPort,
            devCommand,
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
        snapshotName,
        await ensureSessionClaudeVolume(daytona, args.sessionId),
      );
      const sandbox = prepared.sandbox;
      await fetchOrigin(
        sandbox,
        args.installationId,
        args.repoOwner,
        args.repoName,
        undefined,
        { prune: false, timeoutSeconds: 60 },
      );
      await checkoutSessionBranch(sandbox, args.branchName, args.baseBranch);
      const { port: devPort, devCommand } = await startSessionServices(
        sandbox,
        rootDir,
      );

      await ctx.runMutation(internal.sessions.sandboxReady, {
        sessionId: args.sessionId,
        sandboxId: sandbox.id,
        branchName: args.branchName,
        isNew: true,
        usedSnapshot: prepared.usedSnapshot,
        devPort,
        devCommand,
      });
    } catch (e) {
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

      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);

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
        snapshotName,
      );
      const sandbox = prepared.sandbox;
      await setupBranch(sandbox, args.branchName, args.baseBranch);
      if (prepared.usedSnapshot) {
        await exec(sandbox, `cd ${WORKSPACE_DIR} && pnpm install`, 120);
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
