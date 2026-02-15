import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  workflow,
  POLL_INTERVAL_MS,
  TASK_COMPLETED_EVENT,
} from "./workflowManagers";
import { workflowCommandStateValidator } from "./validators";

const completionSourceValidator = v.union(
  v.literal("callback"),
  v.literal("poll"),
);

const commandCompletionEventValidator = v.object({
  trackerId: v.id("workflowCommands"),
  runId: v.id("agentRuns"),
  taskId: v.id("agentTasks"),
  projectId: v.optional(v.id("projects")),
  success: v.boolean(),
  state: workflowCommandStateValidator,
  resultText: v.optional(v.string()),
  isError: v.optional(v.boolean()),
  exitCode: v.optional(v.number()),
  error: v.optional(v.string()),
  completionSource: v.optional(completionSourceValidator),
});

const taskCompletedEventValidator = v.object({
  runId: v.id("agentRuns"),
  taskId: v.id("agentTasks"),
  projectId: v.optional(v.id("projects")),
  success: v.boolean(),
  error: v.optional(v.string()),
});

async function sendTaskCompletedEvent(
  ctx: Parameters<typeof workflow.sendEvent>[0],
  notifyWorkflowId: string | undefined,
  payload: {
    runId: any;
    taskId: any;
    projectId?: any;
    success: boolean;
    error?: string;
  },
) {
  if (!notifyWorkflowId) return;
  await workflow.sendEvent(ctx, {
    workflowId: notifyWorkflowId as any,
    name: `${TASK_COMPLETED_EVENT}:${payload.runId}`,
    value: payload,
  });
}

export const executeTaskWorkflow = workflow.define({
  args: {
    runId: v.id("agentRuns"),
    notifyWorkflowId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    projectId: v.optional(v.id("projects")),
    prUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<any> => {
    let prepared: any = null;

    try {
      prepared = await ctx.runAction(
        internal.taskWorkflowActions.prepareTaskExecution,
        {
          runId: args.runId,
          workflowId: ctx.workflowId,
        },
        { retry: false, name: "prepare-task-execution" },
      );

      await ctx.runAction(
        internal.taskWorkflowActions.pollWorkflowCommand,
        { trackerId: prepared.trackerId as any },
        {
          runAfter: POLL_INTERVAL_MS,
          retry: false,
          name: "schedule-poll-fallback",
        },
      );

      const completion = await ctx.awaitEvent({
        name: prepared.workflowEventKey,
        validator: commandCompletionEventValidator,
      });

      if (!completion.success) {
        const errorMessage =
          completion.error ??
          completion.resultText?.slice(0, 5000) ??
          "Task execution failed";

        await ctx.runMutation(internal.agentRuns.completeInternal, {
          id: args.runId,
          success: false,
          error: errorMessage,
        });
        await ctx.runMutation(api.streaming.clear, {
          entityId: String(prepared.taskId),
        });

        await sendTaskCompletedEvent(ctx, args.notifyWorkflowId, {
          runId: args.runId,
          taskId: prepared.taskId,
          projectId: prepared.projectId,
          success: false,
          error: errorMessage,
        });

        return {
          success: false,
          runId: args.runId,
          taskId: prepared.taskId,
          projectId: prepared.projectId,
          error: errorMessage,
        };
      }

      let prUrl: string | undefined;
      if (prepared.shouldCreatePr && prepared.projectId) {
        prUrl = await ctx.runAction(
          internal.taskWorkflowActions.createProjectPullRequest,
          {
            repoId: prepared.repoId as any,
            branchName: prepared.branchName,
            taskTitle: prepared.taskTitle,
            taskDescription: prepared.taskDescription,
          },
          { retry: false, name: "create-project-pr" },
        );
        await ctx.runMutation(internal.projects.updatePrUrlInternal, {
          id: prepared.projectId as any,
          prUrl,
        });
      }

      const subtasks = await ctx.runQuery(
        internal.subtasks.listByTaskInternal,
        {
          parentTaskId: prepared.taskId as any,
        },
      );
      if (subtasks.length > 0) {
        await ctx.runMutation(internal.subtasks.markCompletedInternal, {
          parentTaskId: prepared.taskId as any,
          completedIndices: subtasks.map((_: unknown, index: number) => index),
        });
      }

      await ctx.runMutation(internal.agentRuns.completeInternal, {
        id: args.runId,
        success: true,
        resultSummary: prUrl
          ? "Created project PR"
          : "Pushed commit to project branch",
        prUrl,
      });

      await ctx.runAction(
        internal.taskWorkflowActions.runTaskAudit,
        {
          runId: args.runId,
          taskId: prepared.taskId as any,
          sandboxId: prepared.sandboxId,
          beforeHead: prepared.beforeHead,
        },
        { retry: false, name: "run-task-audit" },
      );

      await sendTaskCompletedEvent(ctx, args.notifyWorkflowId, {
        runId: args.runId,
        taskId: prepared.taskId,
        projectId: prepared.projectId,
        success: true,
      });

      return {
        success: true,
        runId: args.runId,
        taskId: prepared.taskId,
        projectId: prepared.projectId,
        prUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Task workflow failed";
      const run = await ctx.runQuery(internal.agentExecution.getRunInternal, {
        id: args.runId,
      });

      if (run) {
        await ctx.runMutation(internal.agentRuns.completeInternal, {
          id: args.runId,
          success: false,
          error: errorMessage,
        });
        await ctx.runMutation(api.streaming.clear, {
          entityId: String(run.taskId),
        });
      }

      const fallbackTaskId = prepared?.taskId ?? run?.taskId;
      if (!fallbackTaskId) {
        throw error instanceof Error ? error : new Error(errorMessage);
      }

      await sendTaskCompletedEvent(ctx, args.notifyWorkflowId, {
        runId: args.runId,
        taskId: fallbackTaskId,
        projectId: prepared?.projectId,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        runId: args.runId,
        taskId: fallbackTaskId,
        projectId: prepared?.projectId,
        error: errorMessage,
      };
    }
  },
});

export const buildProjectWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    results: v.array(
      v.object({
        runId: v.id("agentRuns"),
        taskId: v.id("agentTasks"),
        success: v.boolean(),
        error: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<any> => {
    const tasks = await ctx.runQuery(
      internal.agentTasks.listTodoByProjectInternal,
      {
        projectId: args.projectId,
      },
    );

    const results: Array<{
      runId: any;
      taskId: any;
      success: boolean;
      error?: string;
    }> = [];

    for (const task of tasks) {
      const start = await ctx.runMutation(
        internal.agentTasks.startExecutionInternal,
        {
          id: task._id,
          notifyWorkflowId: ctx.workflowId,
        },
      );

      const completed = await ctx.awaitEvent({
        name: `${TASK_COMPLETED_EVENT}:${String(start.runId)}`,
        validator: taskCompletedEventValidator,
      });

      results.push({
        runId: start.runId,
        taskId: task._id,
        success: completed.success,
        error: completed.error,
      });

      if (!completed.success) {
        break;
      }
    }

    return { results };
  },
});
