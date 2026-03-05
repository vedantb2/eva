"use node";

import { v } from "convex/values";
import type { Sandbox } from "@daytonaio/sdk";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { quote } from "shell-quote";
import {
  exec,
  WORKSPACE_DIR,
  resolveSandboxContext,
  getSandbox,
  errorMessage,
  ensureSandboxRunning,
} from "./daytona/helpers";
import {
  createSandbox,
  fetchOrigin,
  syncRepo,
  setupBranch,
  checkoutSessionBranch,
  createSandboxAndPrepareRepo,
  getOrCreateSandbox,
} from "./daytona/git";
import {
  sessionClaudeUuid,
  ensureSessionClaudeVolume,
} from "./daytona/volumes";
import { launchScript } from "./daytona/launch";
import {
  setDisplayResolution,
  startDesktopWithChrome,
  launchChrome,
} from "./daytona/desktop";
import { startSessionServices } from "./daytona/devServer";

export const warmSnapshotCache = internalAction({
  args: { repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);
      if (!snapshotName) return null;
      const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
        repoId: args.repoId,
      });
      if (!repo) return null;
      const sandbox = await createSandbox(
        daytona,
        repo.installationId,
        sandboxEnvVars,
        snapshotName,
      );
      await sandbox.delete();
      console.log(
        `[daytona] Warmed snapshot cache for ${repo.owner}/${repo.name}`,
      );
    } catch (err) {
      console.error(
        "[daytona] warmSnapshotCache failed (best-effort):",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  },
});

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

    let sandbox: Sandbox;
    let deleteSandboxOnFailure = false;

    if (args.ephemeral) {
      const prepared = await createSandboxAndPrepareRepo(
        daytona,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        snapshotName,
        sessionVolumeMounts,
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

    try {
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

      const sandboxToken = await ctx.runAction(
        internal.sandboxJwt.signSandboxToken,
        { userId: args.userId },
      );

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
          extraEnvVars: sandboxEnvVars,
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

export const launchAudit = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    userId: v.id("users"),
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
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      sandboxToken,
      args.taskId,
      {
        model: "haiku",
        extraEnvVars: { STREAMING_ENTITY_ID: `audit-${args.taskId}` },
      },
    );

    return null;
  },
});

function buildSessionAuditPrompt(diff: string): string {
  return `You are a code auditor. Analyze this git diff and produce a JSON audit with 3 sections.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
1. **accessibility**: WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.
2. **testing**: Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.
3. **codeReview**: Implementation quality — correctness, bugs, security, error handling, naming, code style.

Return ONLY valid JSON in this exact format:
{
  "accessibility": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "testing": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "codeReview": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "summary": "1-2 sentence overall assessment"
}

## Git Diff:
${diff.slice(0, 30000)}`;
}

export const runSessionAudit = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    auditId: v.id("sessionAudits"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const session = await ctx.runQuery(internal.sessions.getInternal, {
        id: args.sessionId,
      });
      if (!session) {
        throw new Error("Session not found");
      }

      const sandboxToken = await ctx.runAction(
        internal.sandboxJwt.signSandboxToken,
        { userId: args.userId },
      );
      const sandbox = await getSandbox(ctx, session.repoId, args.sandboxId);

      const diffRaw = await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        30,
      );

      if (!diffRaw.trim()) {
        await ctx.runMutation(internal.sessionAudits.fail, {
          id: args.auditId,
          error: "No changes detected",
        });
        return null;
      }

      await launchScript(
        sandbox,
        buildSessionAuditPrompt(diffRaw),
        "sessionAudits:handleCompletion",
        "sessionId",
        sandboxToken,
        String(args.sessionId),
        {
          model: "haiku",
          claudeSessionId: sessionClaudeUuid(args.sessionId),
        },
      );
    } catch (err) {
      await ctx.runMutation(internal.sessionAudits.fail, {
        id: args.auditId,
        error: errorMessage(err, "Audit failed"),
      });
    }
    return null;
  },
});

export const killSandboxProcess = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await exec(
        sandbox,
        "pkill -f 'claude-code' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
        10,
      );
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.delete();
    } catch {
      // Sandbox may already be deleted or expired
    }
    return null;
  },
});

export const stopSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) return null;
    if (session.status !== "closed" || session.sandboxId !== args.sandboxId) {
      return null;
    }

    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.stop();
    } catch {}
    return null;
  },
});

export const toggleCodeServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    if (args.action === "start") {
      await exec(
        sandbox,
        `pgrep -f 'code-server.*8080' > /dev/null 2>&1 || code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${WORKSPACE_DIR} > /tmp/code-server.log 2>&1 &`,
        10,
      );
    } else {
      await exec(sandbox, "pkill -f code-server || true", 10);
    }

    return null;
  },
});

export const toggleDesktopServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    if (args.action === "start") {
      await sandbox.computerUse.start();
      await setDisplayResolution(sandbox);
    } else {
      await sandbox.computerUse.stop();
    }

    return null;
  },
});

export const launchChromeInDesktop = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await launchChrome(sandbox);

    return null;
  },
});

export const startSessionSandbox = internalAction({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
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

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await ensureSandboxRunning(sandbox);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await checkoutSessionBranch(sandbox, args.branchName);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await ctx.runMutation(internal.sessions.sandboxReady, {
            sessionId: args.sessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
            devPort,
            devCommand,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

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
        args.branchName,
        { prune: false, timeoutSeconds: 30 },
      );
      await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && (git checkout ${quote([args.branchName])} 2>/dev/null || git checkout -b ${quote([args.branchName])} ${quote([`origin/${args.branchName}`])} 2>/dev/null || git checkout -b ${quote([args.branchName])}) && (git pull --ff-only origin ${quote([args.branchName])} 2>/dev/null || true)`,
        30,
      );
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

      if (args.existingSandboxId) {
        try {
          const sandbox = await daytona.get(args.existingSandboxId);
          await exec(sandbox, "echo 1", 5);
          await syncRepo(
            sandbox,
            args.installationId,
            args.repoOwner,
            args.repoName,
          );
          await setupBranch(sandbox, args.branchName);
          const { port: devPort, devCommand } = await startSessionServices(
            sandbox,
            rootDir,
          );
          await exec(sandbox, `${devCommand} > /tmp/devserver.log 2>&1 &`, 10);
          await ctx.runMutation(internal.designSessions.sandboxReady, {
            designSessionId: args.designSessionId,
            sandboxId: args.existingSandboxId,
            branchName: args.branchName,
            isNew: false,
            devPort,
          });
          return null;
        } catch {
          // Sandbox dead or unresponsive, create new
        }
      }

      const prepared = await createSandboxAndPrepareRepo(
        daytona,
        args.installationId,
        args.repoOwner,
        args.repoName,
        sandboxEnvVars,
        snapshotName,
      );
      const sandbox = prepared.sandbox;
      await setupBranch(sandbox, args.branchName);
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
