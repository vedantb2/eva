import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation, hasTaskAccess } from "./functions";
import { createNotification } from "./notifications";
import { claudeModelValidator } from "./validators";
import type { Id } from "./_generated/dataModel";

// --- Events ---

const taskCompleteEvent = defineEvent({
  name: "taskComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

/**
 * Exported — used by buildWorkflow to await task completion during sequential project builds.
 */
export const buildTaskDoneEvent = defineEvent({
  name: "buildTaskDone",
  validator: v.object({
    taskId: v.id("agentTasks"),
    success: v.boolean(),
  }),
});

const auditCompleteEvent = defineEvent({
  name: "auditComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  }),
});

// --- Prompt builder ---

const WORKSPACE_DIR = "/workspace/repo";

function buildRootDirectoryInstruction(rootDirectory: string): string {
  if (!rootDirectory) return "";
  return `\nIMPORTANT: Unless the user mentions otherwise, all changes must be made inside the app at "${rootDirectory}".`;
}

function buildImplementationPrompt(
  task: { title: string; description?: string; taskNumber?: number },
  subtasks: Array<{ title: string }>,
  branchName: string,
  isQuickTask: boolean,
  rootDirectory: string,
): string {
  const subtasksList =
    subtasks.length > 0
      ? `\n## Subtasks:\n${subtasks.map((s, i) => `${i}. ${s.title}`).join("\n")}`
      : "";

  const commitScope = isQuickTask
    ? "feat"
    : `feat(task-${task.taskNumber || 1})`;

  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${subtasksList}

## Steps:
1. Read CLAUDE.md to understand the codebase
2. Implement the changes by editing source code files
3. Update CLAUDE.md if you made major changes
4. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "${commitScope}: ${task.title}"
5. Run: git push -u origin ${branchName}

## Proof of Completion (REQUIRED):
After committing and pushing, you MUST capture visual proof using the agent-browser skill:
1. Start the dev server in background, wait for it to be ready
2. Use agent-browser to take a screenshot (simple changes) or record a video (complex multi-step changes) — pick one, not both
3. Save to screenshots/ or recordings/ in the repo root
4. Kill the dev server
If the dev server fails to start or the page shows an error (e.g. env var issues, build errors), screenshot the error state anyway and save it — the user needs to see what went wrong.
If the task has no UI changes, skip this step.
Do NOT mention proof capture in your response or commit message.

## Rules:
- Do NOT create .md plan files
- Do NOT run build, lint, test, or dev commands EXCEPT starting a dev server for proof capture after committing
- Use the lockfile to determine the package manager
- GITHUB_TOKEN is already set for git push${buildRootDirectoryInstruction(rootDirectory)}`;
}

function buildAuditPrompt(diff: string): string {
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

// --- Workflow ---

export const taskExecutionWorkflow = workflow.define({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(claudeModelValidator),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Update run to "running"
    await step.runMutation(internal.taskWorkflow.updateRunToRunning, {
      runId: args.runId,
      taskId: args.taskId,
    });

    // Step 2: Fetch task data and build prompt
    const data = await step.runQuery(internal.taskWorkflow.getTaskData, {
      taskId: args.taskId,
      repoId: args.repoId,
      projectId: args.projectId,
      branchName: args.branchName,
    });

    // Step 3: Setup sandbox + launch Claude CLI
    const { sandboxId } = await step.runAction(
      internal.daytona.setupAndExecute,
      {
        entityId: String(args.taskId),
        existingSandboxId: data.projectSandboxId,
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "taskWorkflow:handleCompletion",
        entityIdField: "taskId",
        model: args.model ?? "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        branchName: data.branchName,
        baseBranch: args.baseBranch,
        ephemeral: !args.projectId,
        repoId: args.repoId,
      },
      // setupAndExecute creates a new sandbox for standalone tasks.
      // Retrying this step can create duplicate sandboxes for one run.
      { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
    );

    // Step 4: Update project sandbox if applicable
    if (args.projectId) {
      await step.runMutation(internal.taskWorkflow.updateProjectSandbox, {
        projectId: args.projectId,
        sandboxId,
      });
    }

    // Step 5: Wait for sandbox callback
    const result = await step.awaitEvent(taskCompleteEvent);

    // Step 6: Create PR if first task on branch
    let prUrl: string | null = null;
    if (args.isFirstTaskOnBranch && result.success) {
      prUrl = await step.runAction(
        internal.taskWorkflowActions.createPullRequest,
        {
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName,
          baseBranch: args.baseBranch,
          title: data.taskTitle,
          description: data.taskDescription,
          labels: [
            "eva",
            args.projectId ? "project" : "quick-task",
            ...(data.appLabel ? [data.appLabel] : []),
          ],
        },
      );
    }

    await step.runMutation(internal.taskWorkflow.finalizeRunStreamingPhase, {
      runId: args.runId,
      taskId: args.taskId,
      success: result.success,
      error: result.error,
      prUrl,
      activityLog: result.activityLog,
    });

    // Step 7: Run audit before completing task status (non-fatal)
    if (result.success && sandboxId) {
      try {
        const diffRaw = await step.runAction(
          internal.daytona.runSandboxCommand,
          {
            sandboxId,
            command: `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
            timeoutSeconds: 30,
            repoId: args.repoId,
          },
        );

        if (diffRaw.trim()) {
          const auditId = await step.runMutation(
            internal.taskWorkflow.createAudit,
            {
              taskId: args.taskId,
              runId: args.runId,
            },
          );

          await step.runAction(internal.daytona.launchAudit, {
            sandboxId,
            prompt: buildAuditPrompt(diffRaw),
            taskId: String(args.taskId),
            userId: args.userId,
            repoId: args.repoId,
          });

          const auditResult = await step.awaitEvent(auditCompleteEvent);

          await step.runMutation(internal.taskWorkflow.saveAuditResult, {
            auditId,
            result: auditResult.result,
            error: auditResult.success
              ? undefined
              : (auditResult.error ?? "Audit failed"),
          });

          if (prUrl) {
            await step.runAction(
              internal.taskWorkflowActions.appendAuditToPullRequest,
              {
                installationId: args.installationId,
                repoOwner: data.repoOwner,
                repoName: data.repoName,
                branchName: data.branchName,
                auditResult: auditResult.result,
                auditError: auditResult.success
                  ? null
                  : (auditResult.error ?? "Audit failed"),
              },
            );
          }
        }
      } catch (err) {
        console.error("Audit step failed:", err);
      }
    }

    // Step 8: Complete the run (after audit so task stays in_progress until audit finishes)
    await step.runMutation(internal.taskWorkflow.completeRun, {
      runId: args.runId,
      taskId: args.taskId,
      projectId: args.projectId,
      success: result.success,
      error: result.error,
      prUrl,
      hasSubtasks: data.hasSubtasks,
      activityLog: result.activityLog,
    });

    // Cleanup: Delete sandbox for ephemeral (standalone) tasks
    if (!args.projectId && sandboxId) {
      await step.runAction(internal.daytona.deleteSandbox, {
        sandboxId,
        repoId: args.repoId,
      });
    }

    // Final step: Always clear activeWorkflowId on the task
    await step.runMutation(internal.taskWorkflow.clearActiveWorkflow, {
      taskId: args.taskId,
    });
  },
});

// --- Internal functions ---

export const updateRunToRunning = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, { status: "running" });
    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.taskWorkflow.handleStaleRun,
      {
        taskId: args.taskId,
        runId: args.runId,
      },
    );

    return null;
  },
});

export const getTaskData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
  },
  returns: v.object({
    prompt: v.string(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
    projectSandboxId: v.optional(v.string()),
    hasSubtasks: v.boolean(),
    appLabel: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    let projectSandboxId: string | undefined;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        projectSandboxId = project.sandboxId;
      }
    }

    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();
    const sortedSubtasks = subtasks.sort((a, b) => a.order - b.order);

    const branchName =
      args.branchName || `eva/task-${task.taskNumber || Date.now()}`;

    const rootDirectory = repo.rootDirectory ?? "";

    const prompt = buildImplementationPrompt(
      task,
      sortedSubtasks,
      branchName,
      !args.projectId,
      rootDirectory,
    );

    const appLabel = repo.rootDirectory
      ? repo.rootDirectory.split("/").pop() || undefined
      : undefined;

    return {
      prompt,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      taskTitle: task.title,
      taskDescription: task.description,
      projectSandboxId,
      hasSubtasks: sortedSubtasks.length > 0,
      appLabel,
    };
  },
});

export const updateProjectSandbox = internalMutation({
  args: {
    projectId: v.id("projects"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      sandboxId: args.sandboxId,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

export const finalizeRunStreamingPhase = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    error: v.union(v.string(), v.null()),
    prUrl: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const run = await ctx.db.get(args.runId);
    if (run && (run.status === "queued" || run.status === "running")) {
      await ctx.db.patch(args.runId, {
        status: args.success ? "success" : "error",
        finishedAt: now,
        resultSummary: args.success
          ? args.prUrl
            ? "Created project PR"
            : "Pushed commit to project branch"
          : undefined,
        prUrl: args.prUrl ?? undefined,
        error: args.success ? undefined : (args.error ?? "Unknown error"),
        activityLog: args.activityLog ?? undefined,
      });
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.taskId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    return null;
  },
});

export const completeRun = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    projectId: v.optional(v.id("projects")),
    success: v.boolean(),
    error: v.union(v.string(), v.null()),
    prUrl: v.union(v.string(), v.null()),
    hasSubtasks: v.boolean(),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const run = await ctx.db.get(args.runId);
    if (run && (run.status === "queued" || run.status === "running")) {
      await ctx.db.patch(args.runId, {
        status: args.success ? "success" : "error",
        finishedAt: now,
        resultSummary: args.success
          ? args.prUrl
            ? "Created project PR"
            : "Pushed commit to project branch"
          : undefined,
        prUrl: args.prUrl ?? undefined,
        error: args.success ? undefined : (args.error ?? "Unknown error"),
        activityLog: args.activityLog ?? undefined,
      });
    }

    // Update task status
    const task = await ctx.db.get(args.taskId);
    if (task) {
      await ctx.db.patch(args.taskId, {
        status: args.success ? "business_review" : "todo",
        updatedAt: now,
      });
    }

    // Mark subtasks completed on success
    if (args.success && args.hasSubtasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
        .collect();
      for (const subtask of subtasks) {
        await ctx.db.patch(subtask._id, { completed: true });
      }
    }

    // Update project PR URL + sandbox activity
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        const projectPatch: { lastSandboxActivity: number; prUrl?: string } = {
          lastSandboxActivity: now,
        };
        if (args.prUrl) {
          projectPatch.prUrl = args.prUrl;
        }
        await ctx.db.patch(args.projectId, projectPatch);
      }
    }

    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.taskId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    // Create notifications
    if (task) {
      const statusText = args.success ? "succeeded" : "failed";
      const notifyUsers = new Set(
        [task.createdBy, task.assignedTo].filter(
          (id): id is Id<"users"> => id !== undefined,
        ),
      );
      for (const userId of notifyUsers) {
        await createNotification(ctx, {
          userId,
          type: "run_completed",
          title: `Run ${statusText} for "${task.title}"`,
          repoId: task.repoId,
          projectId: task.projectId,
        });
      }
    }

    // Notify build workflow if task is part of an active build
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project?.activeBuildWorkflowId) {
        await workflow.sendEvent(ctx, {
          ...buildTaskDoneEvent,
          workflowId: project.activeBuildWorkflowId as WorkflowId,
          value: {
            taskId: args.taskId,
            success: args.success,
          },
        });
      }
    }

    return null;
  },
});

export const createAudit = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.id("taskAudits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("taskAudits", {
      taskId: args.taskId,
      runId: args.runId,
      status: "running",
      accessibility: [],
      testing: [],
      codeReview: [],
      createdAt: Date.now(),
    });
  },
});

/**
 * Extracts the first JSON object from raw LLM text output.
 * Handles code blocks (```json ... ```) and bare JSON objects.
 */
function extractJsonBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

export const saveAuditResult = internalMutation({
  args: {
    auditId: v.id("taskAudits"),
    result: v.union(v.string(), v.null()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.error || !args.result) {
      await ctx.db.patch(args.auditId, {
        status: "error",
        error: args.error ?? "Audit failed",
      });
      return null;
    }

    try {
      const jsonStr = extractJsonBlock(args.result);
      const parsed: {
        accessibility: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        testing: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        codeReview: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        summary: string;
      } = JSON.parse(jsonStr);

      await ctx.db.patch(args.auditId, {
        status: "completed",
        accessibility: parsed.accessibility || [],
        testing: parsed.testing || [],
        codeReview: parsed.codeReview || [],
        summary: parsed.summary || "Audit completed",
      });
    } catch {
      await ctx.db.patch(args.auditId, {
        status: "error",
        error: "Failed to parse audit JSON",
      });
    }

    return null;
  },
});

// --- Public mutations ---

/**
 * Sandbox callback — routes completion event to the waiting workflow.
 */
export const handleCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...taskCompleteEvent,
      workflowId: task.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    return null;
  },
});

/**
 * Sandbox audit callback — routes audit completion event to the waiting workflow.
 * Called by the nohup audit script in Daytona when Claude CLI haiku finishes.
 */
export const handleAuditCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task?.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...auditCompleteEvent,
      workflowId: task.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
      },
    });

    return null;
  },
});

export const executeScheduledTask = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.union(v.id("agentRuns"), v.null()),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status !== "todo" || !task.repoId || !task.createdBy) {
      if (task) {
        await ctx.db.patch(args.taskId, {
          scheduledAt: undefined,
          scheduledFunctionId: undefined,
        });
      }
      return null;
    }

    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    if (
      existingRuns.some((r) => r.status === "queued" || r.status === "running")
    ) {
      await ctx.db.patch(args.taskId, {
        scheduledAt: undefined,
        scheduledFunctionId: undefined,
      });
      return null;
    }

    const repo = await ctx.db.get(task.repoId);
    if (!repo) {
      await ctx.db.patch(args.taskId, {
        scheduledAt: undefined,
        scheduledFunctionId: undefined,
      });
      return null;
    }

    let isFirstTaskOnBranch = true;
    let project = null;
    if (task.projectId) {
      project = await ctx.db.get(task.projectId);
      if (project) {
        const projectTasks = await ctx.db
          .query("agentTasks")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect();
        for (const pt of projectTasks) {
          const runs = await ctx.db
            .query("agentRuns")
            .withIndex("by_task", (q) => q.eq("taskId", pt._id))
            .collect();
          if (runs.some((r) => r.status === "success")) {
            isFirstTaskOnBranch = false;
            break;
          }
        }
      }
    }

    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.taskId,
      status: "queued",
      logs: [],
      startedAt: Date.now(),
    });

    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      scheduledAt: undefined,
      scheduledFunctionId: undefined,
      updatedAt: Date.now(),
    });

    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId,
        taskId: args.taskId,
        repoId: task.repoId,
        installationId: repo.installationId,
        projectId: task.projectId,
        branchName: project?.branchName,
        baseBranch: task.baseBranch,
        isFirstTaskOnBranch,
        model: task.model,
        userId: task.createdBy,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return runId;
  },
});

export const clearActiveWorkflow = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (task) {
      await ctx.db.patch(args.taskId, { activeWorkflowId: undefined });
    }
    return null;
  },
});

import { RUN_TIMEOUT_MS } from "./workflowWatchdog";

export const handleStaleRun = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.status !== "in_progress" || !task.activeWorkflowId) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const latestRun = runs.sort(
      (a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0),
    )[0];
    if (latestRun && latestRun._id !== args.runId) return null;

    try {
      await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
    } catch {}

    const run = await ctx.db.get(args.runId);
    const runStillActive =
      run && (run.status === "queued" || run.status === "running");

    if (runStillActive) {
      await ctx.db.patch(args.runId, {
        status: "error",
        error: "Run timed out after 2 hours",
        finishedAt: Date.now(),
      });
      await ctx.db.patch(args.taskId, {
        status: "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    } else {
      const taskStatus =
        run && run.status === "success" ? "business_review" : "todo";
      await ctx.db.patch(args.taskId, {
        status: taskStatus,
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    }

    const audits = await ctx.db
      .query("taskAudits")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const audit of audits) {
      if (audit.status === "running") {
        await ctx.db.patch(audit._id, {
          status: "error",
          error: "Run timed out",
        });
      }
    }

    for (const entityId of [
      String(args.taskId),
      `audit-${String(args.taskId)}`,
    ]) {
      const streaming = await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", entityId))
        .first();
      if (streaming) await ctx.db.delete(streaming._id);
    }

    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project?.activeBuildWorkflowId) {
        try {
          await workflow.sendEvent(ctx, {
            ...buildTaskDoneEvent,
            workflowId: project.activeBuildWorkflowId as WorkflowId,
            value: { taskId: args.taskId, success: false },
          });
        } catch {}
      }
    }

    return null;
  },
});

export const cancelExecution = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Not authorized");

    if (task.activeWorkflowId) {
      try {
        await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
      } catch {
        // Workflow may have already completed
      }
    }

    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "running"),
        ),
      )
      .first();

    if (run) {
      await ctx.db.patch(run._id, {
        status: "error",
        error: "Cancelled by user",
        finishedAt: Date.now(),
      });
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.taskId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    await ctx.db.patch(args.taskId, {
      status: "todo",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Frontend trigger — starts the task execution workflow.
 * Called after agentTasks.startExecution which creates the run and returns metadata.
 */
export const triggerExecution = authMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(claudeModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId: args.runId,
        taskId: args.taskId,
        repoId: args.repoId,
        installationId: args.installationId,
        projectId: args.projectId,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        isFirstTaskOnBranch: args.isFirstTaskOnBranch,
        model: args.model,
        userId: ctx.userId,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
