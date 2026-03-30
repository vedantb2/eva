import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { createNotification } from "../notifications";
import { runModeValidator } from "../validators";
import type { Id } from "../_generated/dataModel";
import { RUN_TIMEOUT_MS } from "../workflowWatchdog";
import { buildWorkflowRunNotificationMessage } from "./prompts";
import { buildTaskDoneEvent } from "./events";
import { STALE_CHECK_DELAY_MS } from "./recovery";
import {
  clearStreamingActivity,
  getTaskRunStreamingEntityId,
  upsertStreamingActivity,
  upsertActivityLog,
  finalizeRunStatus,
} from "./helpers";

export const updateRunToRunning = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const startedAt = Date.now();

    await ctx.db.patch(args.runId, {
      status: "running",
      repoId: args.repoId,
      startedAt,
      finalizingAt: undefined,
    });
    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      updatedAt: startedAt,
    });
    await upsertStreamingActivity(
      ctx,
      getTaskRunStreamingEntityId(args.runId),
      JSON.stringify([
        {
          type: "thinking",
          label: "Starting sandbox...",
          status: "active",
        },
      ]),
    );

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.taskWorkflow.handleStaleRun,
      {
        taskId: args.taskId,
        runId: args.runId,
      },
    );

    await ctx.scheduler.runAfter(
      STALE_CHECK_DELAY_MS,
      internal.taskWorkflow.checkStaleRuns,
      {
        runId: args.runId,
        taskId: args.taskId,
      },
    );

    return null;
  },
});

export const saveSandboxId = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run) {
      await ctx.db.patch(args.runId, { sandboxId: args.sandboxId });
    }
    return null;
  },
});

export const scheduleDeploymentTracking = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    deploymentProjectName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, { deploymentStatus: "queued" });
    await ctx.scheduler.runAfter(
      30_000,
      internal.taskWorkflowActions.pollDeploymentStatus,
      {
        runId: args.runId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        branchName: args.branchName,
        deploymentProjectName: args.deploymentProjectName,
        attempt: 0,
      },
    );
    return null;
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
    projectId: v.optional(v.id("projects")),
    success: v.boolean(),
    error: v.union(v.string(), v.null()),
    prUrl: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    exitReason: v.optional(v.string()),
    claudeResult: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await finalizeRunStatus(ctx, {
      runId: args.runId,
      projectId: args.projectId,
      success: args.success,
      error: args.error,
      prUrl: args.prUrl,
      exitReason: args.exitReason,
      claudeResult: args.claudeResult,
    });
    if (args.activityLog) {
      await upsertActivityLog(ctx, args.runId, args.activityLog);
    }
    await clearStreamingActivity(ctx, getTaskRunStreamingEntityId(args.runId));
    await clearStreamingActivity(ctx, String(args.taskId));
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
    exitReason: v.optional(v.string()),
    mode: v.optional(runModeValidator),
    claudeResult: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    await finalizeRunStatus(ctx, {
      runId: args.runId,
      projectId: args.projectId,
      success: args.success,
      error: args.error,
      prUrl: args.prUrl,
      exitReason: args.exitReason,
      claudeResult: args.claudeResult,
    });

    if (args.activityLog) {
      await upsertActivityLog(ctx, args.runId, args.activityLog);
    }

    const task = await ctx.db.get(args.taskId);
    if (task) {
      await ctx.db.patch(args.taskId, {
        status: args.success ? "code_review" : "todo",
        updatedAt: now,
      });
    }

    if (args.success && args.hasSubtasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
        .collect();
      for (const subtask of subtasks) {
        await ctx.db.patch(subtask._id, { completed: true });
      }
    }

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

    await clearStreamingActivity(ctx, getTaskRunStreamingEntityId(args.runId));
    await clearStreamingActivity(ctx, String(args.taskId));

    if (task) {
      const scopeLabel = task.projectId ? "Task" : "Quick task";
      const statusText = args.success ? "completed" : "failed";
      const notifyUsers = new Set(
        [task.createdBy, task.assignedTo].filter(
          (id): id is Id<"users"> => id !== undefined,
        ),
      );
      for (const userId of notifyUsers) {
        await createNotification(ctx, {
          userId,
          type: "run_completed",
          title: `${scopeLabel} ${statusText}: ${task.title}`,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.taskId,
          message: buildWorkflowRunNotificationMessage({
            success: args.success,
            projectId: task.projectId,
            error: args.error,
            prUrl: args.prUrl,
          }),
        });
      }
    }

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
