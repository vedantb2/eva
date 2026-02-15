"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { randomUUID } from "node:crypto";
import { quote } from "shell-quote";
import { LlmJson } from "@solvers-hub/llm-json";
import { createSignedCallbackToken } from "./callbackTokens";
import {
  CALLBACK_TOKEN_TTL_MS,
  POLL_INTERVAL_MS,
  TASK_COMMAND_TIMEOUT_MS,
  retrier,
  workflow,
} from "./workflowManagers";
import {
  WORKSPACE_DIR,
  buildClaudeCommand,
  finalizeActivityLog,
  getGitHubToken,
  getOrCreateSandbox,
  getSandbox,
  mergeActivityLog,
  parseClaudeResultFromStream,
  setupBranch,
  syncRepo,
} from "./daytona";
import { workflowCommandStateValidator } from "./validators";

const llmJson = new LlmJson({ attemptCorrection: true });

const completionSourceValidator = v.union(
  v.literal("callback"),
  v.literal("poll"),
);

const prepareTaskExecutionResultValidator = v.object({
  trackerId: v.id("workflowCommands"),
  workflowEventKey: v.string(),
  runId: v.id("agentRuns"),
  taskId: v.id("agentTasks"),
  repoId: v.id("githubRepos"),
  projectId: v.optional(v.id("projects")),
  sandboxId: v.string(),
  sessionId: v.string(),
  commandId: v.string(),
  branchName: v.string(),
  beforeHead: v.string(),
  shouldCreatePr: v.boolean(),
  taskTitle: v.string(),
  taskDescription: v.optional(v.string()),
});

const finalizeWorkflowCommandResultValidator = v.object({
  completed: v.boolean(),
  success: v.optional(v.boolean()),
  state: v.optional(workflowCommandStateValidator),
  error: v.optional(v.string()),
  resultText: v.optional(v.string()),
  exitCode: v.optional(v.number()),
  completionSource: v.optional(completionSourceValidator),
});

class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown) {
  if (error instanceof RetryableError) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("429")
  );
}

async function withRetries<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 5,
) {
  let attempt = 0;
  let backoffMs = 500;

  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryableNetworkError(error)) {
        throw error;
      }
      const jitter = Math.floor(Math.random() * 200);
      console.warn(
        `${label} failed (attempt ${attempt}/${maxAttempts}), retrying...`,
      );
      await sleep(backoffMs + jitter);
      backoffMs *= 2;
    }
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function getCallbackUrl() {
  const explicit = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_HTTP_URL;
  if (explicit)
    return `${explicit.replace(/\/+$/, "")}/daytona/command-complete`;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL (or CONVEX_SITE_URL) must be configured",
    );
  }
  const url = new URL(convexUrl);
  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  }
  return `${url.origin}/daytona/command-complete`;
}

function buildTaskPrompt(
  taskTitle: string,
  taskDescription: string | undefined,
  subtasks: string[],
  branchName: string,
) {
  const subtasksList =
    subtasks.length > 0
      ? `\n## Subtasks:\n${subtasks.map((title, i) => `${i}. ${title}`).join("\n")}`
      : "";

  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Task: ${taskTitle}
## Description: ${taskDescription || "No description provided"}
${subtasksList}

## Steps:
1. Read CLAUDE.md to understand the codebase
2. Implement the changes by editing source code files
3. Update CLAUDE.md if you made major changes
4. Run: git add -A && git commit -m "feat: ${taskTitle}"
5. Run: git push -u origin ${branchName}

## Rules:
- Do NOT create .md plan files
- Do NOT run build, lint, test, or dev commands
- Use the lockfile to determine the package manager
- GITHUB_TOKEN is already set for git push`;
}

async function emitCompletionEvent(
  ctx: Parameters<typeof workflow.sendEvent>[0],
  tracker: {
    workflowId: string;
    workflowEventKey: string;
    _id: unknown;
    runId: unknown;
    taskId: unknown;
    projectId?: unknown;
    state: "running" | "completed" | "failed" | "timed_out" | "cancelled";
    resultText?: string;
    isError?: boolean;
    exitCode?: number;
    error?: string;
    completionSource?: "callback" | "poll";
  },
  completionSource: "callback" | "poll",
) {
  await workflow.sendEvent(ctx, {
    workflowId: tracker.workflowId as any,
    name: tracker.workflowEventKey,
    value: {
      trackerId: tracker._id,
      runId: tracker.runId,
      taskId: tracker.taskId,
      projectId: tracker.projectId,
      success: tracker.state === "completed",
      state: tracker.state,
      resultText: tracker.resultText,
      isError: tracker.isError,
      exitCode: tracker.exitCode,
      error: tracker.error,
      completionSource: tracker.completionSource ?? completionSource,
    },
  });
}

export const prepareTaskExecution = internalAction({
  args: {
    runId: v.id("agentRuns"),
    workflowId: v.string(),
  },
  returns: prepareTaskExecutionResultValidator,
  handler: async (ctx, args): Promise<any> => {
    const run: any = await ctx.runQuery(
      internal.agentExecution.getRunInternal,
      {
        id: args.runId,
      },
    );
    if (!run) throw new Error("Run not found");

    const task: any = await ctx.runQuery(internal.agentTasks.getInternal, {
      id: run.taskId,
    });
    if (!task) throw new Error("Task not found");
    if (!task.repoId) throw new Error("Task has no associated repo");

    const repo: any = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: task.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const project: any = task.projectId
      ? await ctx.runQuery(internal.projects.getInternal, {
          id: task.projectId,
        })
      : null;

    const subtasks: any[] = await ctx.runQuery(
      internal.subtasks.listByTaskInternal,
      {
        parentTaskId: task._id,
      },
    );

    await ctx.runMutation(internal.agentRuns.setStatusInternal, {
      id: run._id,
      status: "running",
    });

    const githubToken: string = await withRetries(
      () => getGitHubToken(repo.installationId),
      "getGitHubToken",
    );

    const taskBranchName =
      project?.branchName || `eva/task-${task.taskNumber ?? Date.now()}`;

    const sandbox: any = await withRetries(
      () =>
        getOrCreateSandbox(
          project?.sandboxId,
          githubToken,
          repo.owner,
          repo.name,
          async (sandboxId) => {
            if (task.projectId) {
              await ctx.runMutation(
                internal.projects.updateProjectSandboxInternal,
                {
                  id: task.projectId,
                  sandboxId,
                },
              );
            }
          },
        ),
      "getOrCreateSandbox",
    );

    await withRetries(
      () => syncRepo(sandbox, githubToken, repo.owner, repo.name),
      "syncRepo",
    );
    await withRetries(
      () => setupBranch(sandbox, taskBranchName),
      "setupBranch",
    );

    if (task.projectId) {
      await ctx.runMutation(
        internal.projects.updateLastSandboxActivityInternal,
        {
          id: task.projectId,
        },
      );
    }

    const headResult: any = await withRetries(
      () =>
        sandbox.process.executeCommand(
          `cd ${WORKSPACE_DIR} && git rev-parse HEAD`,
          "/",
          undefined,
          10,
        ),
      "git rev-parse HEAD",
    );
    const beforeHead = (headResult.result || "").trim();

    const sessionId = `task-${String(run._id).replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;
    await withRetries(
      () => sandbox.process.createSession(sessionId),
      "createSession",
    );

    const callbackTokenId = randomUUID();
    const callbackExpiresAt = Date.now() + CALLBACK_TOKEN_TTL_MS;
    const workflowEventKey = `daytona.command.complete:${String(run._id)}`;

    const trackerId: any = await ctx.runMutation(
      internal.workflowCommands.createInternal,
      {
        runId: run._id,
        taskId: task._id,
        projectId: task.projectId,
        repoId: task.repoId,
        workflowId: args.workflowId,
        workflowEventKey,
        sandboxId: sandbox.id,
        sessionId,
        callbackTokenId,
        callbackExpiresAt,
      },
    );

    const callbackToken = await createSignedCallbackToken(
      {
        tokenId: callbackTokenId,
        trackerId: String(trackerId),
        workflowId: args.workflowId,
        exp: callbackExpiresAt,
      },
      requireEnv("DAYTONA_CALLBACK_SECRET"),
    );

    const prompt = buildTaskPrompt(
      task.title,
      task.description,
      subtasks.map((subtask: any) => subtask.title),
      taskBranchName,
    );

    const command = buildClaudeCommand({
      prompt,
      model: task.model ?? "sonnet",
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      workDir: WORKSPACE_DIR,
      callbackUrl: getCallbackUrl(),
      callbackToken,
    });

    const commandResponse: any = await withRetries(
      () =>
        sandbox.process.executeSessionCommand(sessionId, {
          command,
          runAsync: true,
        }),
      "executeSessionCommand",
    );

    if (!commandResponse.cmdId) {
      throw new Error("Daytona did not return a command id");
    }

    await ctx.runMutation(internal.workflowCommands.setCommandIdInternal, {
      id: trackerId,
      commandId: commandResponse.cmdId,
    });

    return {
      trackerId,
      workflowEventKey,
      runId: run._id,
      taskId: task._id,
      repoId: task.repoId,
      projectId: task.projectId,
      sandboxId: sandbox.id,
      sessionId,
      commandId: commandResponse.cmdId,
      branchName: taskBranchName,
      beforeHead,
      shouldCreatePr: Boolean(task.projectId && !project?.prUrl),
      taskTitle: task.title,
      taskDescription: task.description,
    };
  },
});

export const finalizeWorkflowCommand = internalAction({
  args: {
    trackerId: v.id("workflowCommands"),
    completionSource: completionSourceValidator,
  },
  returns: finalizeWorkflowCommandResultValidator,
  handler: async (ctx, args): Promise<any> => {
    const tracker: any = await ctx.runQuery(
      internal.workflowCommands.getInternal,
      {
        id: args.trackerId,
      },
    );
    if (!tracker) {
      return {
        completed: true,
        success: false,
        state: "failed",
        error: "Tracker not found",
      };
    }

    if (tracker.state !== "running") {
      await emitCompletionEvent(ctx, tracker, args.completionSource);
      return {
        completed: true,
        success: tracker.state === "completed",
        state: tracker.state,
        error: tracker.error,
        resultText: tracker.resultText,
        exitCode: tracker.exitCode,
        completionSource: tracker.completionSource ?? args.completionSource,
      };
    }

    if (!tracker.commandId) {
      return { completed: false };
    }

    const sandbox: any = await withRetries(
      () => getSandbox(tracker.sandboxId),
      "getSandbox",
    );

    const [command, logs]: [any, any] = await withRetries(
      async () => [
        await sandbox.process.getSessionCommand(
          tracker.sessionId,
          tracker.commandId!,
        ),
        await sandbox.process.getSessionCommandLogs(
          tracker.sessionId,
          tracker.commandId!,
        ),
      ],
      "getSessionCommand/getSessionCommandLogs",
    );

    const output = logs.output ?? logs.stdout ?? "";
    let activityLog = tracker.activityLog;
    let lastOutputLength = tracker.lastOutputLength;

    if (output.length > tracker.lastOutputLength) {
      const incremental = output.slice(tracker.lastOutputLength);
      activityLog = mergeActivityLog(tracker.activityLog, incremental);
      lastOutputLength = output.length;

      await ctx.runMutation(internal.workflowCommands.updateStreamingInternal, {
        id: tracker._id,
        lastOutputLength,
        activityLog,
      });
      await ctx.runMutation(api.streaming.set, {
        entityId: String(tracker.taskId),
        currentActivity: activityLog,
      });
    }

    if (command.exitCode === undefined) {
      if (Date.now() - tracker.startedAt < TASK_COMMAND_TIMEOUT_MS) {
        return { completed: false };
      }

      const timeoutMessage = "Task command timed out";
      const finalizedActivity = finalizeActivityLog(activityLog);
      await ctx.runMutation(internal.workflowCommands.completeInternal, {
        id: tracker._id,
        state: "timed_out",
        error: timeoutMessage,
        completionSource: args.completionSource,
        activityLog: finalizedActivity,
        lastOutputLength,
      });
      await ctx.runMutation(api.streaming.clear, {
        entityId: String(tracker.taskId),
      });

      const completedTracker = await ctx.runQuery(
        internal.workflowCommands.getInternal,
        { id: tracker._id },
      );
      if (completedTracker) {
        await emitCompletionEvent(ctx, completedTracker, args.completionSource);
      }

      return {
        completed: true,
        success: false,
        state: "timed_out",
        error: timeoutMessage,
        completionSource: args.completionSource,
      };
    }

    const parsedResult = parseClaudeResultFromStream(output);
    const success = command.exitCode === 0 && !parsedResult.isError;
    const state = success ? "completed" : "failed";
    const finalizedActivity = finalizeActivityLog(activityLog);
    const error = success
      ? undefined
      : parsedResult.result.slice(0, 5_000) ||
        `Command exited with ${command.exitCode}`;

    await ctx.runMutation(internal.workflowCommands.completeInternal, {
      id: tracker._id,
      state,
      resultText: parsedResult.result,
      isError: parsedResult.isError,
      exitCode: command.exitCode,
      error,
      completionSource: args.completionSource,
      activityLog: finalizedActivity,
      lastOutputLength,
    });
    await ctx.runMutation(api.streaming.clear, {
      entityId: String(tracker.taskId),
    });

    const completedTracker = await ctx.runQuery(
      internal.workflowCommands.getInternal,
      {
        id: tracker._id,
      },
    );
    if (completedTracker) {
      await emitCompletionEvent(ctx, completedTracker, args.completionSource);
    }

    return {
      completed: true,
      success,
      state,
      error,
      resultText: parsedResult.result,
      exitCode: command.exitCode,
      completionSource: args.completionSource,
    };
  },
});

export const pollWorkflowCommand = internalAction({
  args: { trackerId: v.id("workflowCommands") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const tracker = await ctx.runQuery(internal.workflowCommands.getInternal, {
      id: args.trackerId,
    });
    if (!tracker) {
      return null;
    }

    try {
      const result = await ctx.runAction(
        internal.taskWorkflowActions.finalizeWorkflowCommand,
        {
          trackerId: args.trackerId,
          completionSource: "poll",
        },
      );

      if (!result.completed) {
        await retrier.runAfter(
          ctx,
          POLL_INTERVAL_MS,
          internal.taskWorkflowActions.pollWorkflowCommand,
          { trackerId: args.trackerId },
        );
      }
      return null;
    } catch (error) {
      console.error("pollWorkflowCommand error", error);
      await retrier.runAfter(
        ctx,
        POLL_INTERVAL_MS,
        internal.taskWorkflowActions.pollWorkflowCommand,
        { trackerId: args.trackerId },
      );
      return null;
    }
  },
});

export const createProjectPullRequest = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    branchName: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const repo: any = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const githubToken = await withRetries(
      () => getGitHubToken(repo.installationId),
      "getGitHubToken/createPR",
    );

    return await withRetries(async () => {
      const res = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: args.taskTitle,
            body: `## Task\n${args.taskDescription || "No description"}\n\n---\n*Implemented by Eva AI Agent*`,
            head: args.branchName,
            base: "main",
          }),
        },
      );

      if (res.ok) {
        const pr = (await res.json()) as { html_url?: string };
        if (!pr.html_url) throw new Error("PR created but missing html_url");
        return pr.html_url;
      }

      if (res.status === 422) {
        const head = encodeURIComponent(`${repo.owner}:${args.branchName}`);
        const existingRes = await fetch(
          `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls?head=${head}&state=open`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
            },
          },
        );
        if (existingRes.ok) {
          const existing = (await existingRes.json()) as Array<{
            html_url?: string;
          }>;
          if (existing[0]?.html_url) {
            return existing[0].html_url;
          }
        }
      }

      const body = await res.text();
      if (res.status === 429 || res.status >= 500) {
        throw new RetryableError(
          `GitHub create PR failed (${res.status}): ${body.slice(0, 300)}`,
        );
      }
      throw new Error(
        `Failed to create PR (${res.status}): ${body.slice(0, 300)}`,
      );
    }, "createProjectPullRequest");
  },
});

export const runTaskAudit = internalAction({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    sandboxId: v.string(),
    beforeHead: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      const sandbox: any = await getSandbox(args.sandboxId);
      const diffResult = await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git diff ${args.beforeHead}..HEAD`,
        "/",
        undefined,
        30,
      );
      const diff = (diffResult.result || "").trim();
      if (!diff) {
        return null;
      }

      const auditId = await ctx.runMutation(
        internal.taskAudits.createInternal,
        {
          taskId: args.taskId,
          runId: args.runId,
        },
      );

      const prompt = `You are a code auditor. Analyze this git diff and produce a JSON audit with 3 sections.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
1. accessibility: WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.
2. testing: Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.
3. codeReview: Implementation quality - correctness, bugs, security, error handling, naming, code style.

Return ONLY valid JSON in this exact format:
{
  "accessibility": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "testing": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "codeReview": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "summary": "1-2 sentence overall assessment"
}

## Git Diff:
${diff.slice(0, 30_000)}`;

      const escapedPrompt = quote([prompt]);
      const command = `cd ${WORKSPACE_DIR} && echo ${escapedPrompt} | npx @anthropic-ai/claude-code -p --verbose --dangerously-skip-permissions --model haiku --output-format text`;
      const auditResult = await sandbox.process.executeCommand(
        command,
        "/",
        undefined,
        180,
      );

      const extracted = llmJson.extract(auditResult.result || "");
      if (!extracted.json.length) {
        await ctx.runMutation(internal.taskAudits.failInternal, {
          id: auditId,
          error: "Failed to parse audit response",
        });
        return null;
      }

      const parsed = extracted.json[0] as {
        accessibility?: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        testing?: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        codeReview?: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        summary?: string;
      };

      await ctx.runMutation(internal.taskAudits.completeInternal, {
        id: auditId,
        accessibility: parsed.accessibility ?? [],
        testing: parsed.testing ?? [],
        codeReview: parsed.codeReview ?? [],
        summary: parsed.summary ?? "Audit completed",
      });
      return null;
    } catch (error) {
      console.error("runTaskAudit failed (non-fatal)", error);
      return null;
    }
  },
});
