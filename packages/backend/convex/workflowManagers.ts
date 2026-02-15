import { ActionRetrier } from "@convex-dev/action-retrier";
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 500,
  base: 2,
  maxFailures: 5,
});

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    defaultRetryBehavior: {
      maxAttempts: 5,
      initialBackoffMs: 500,
      base: 2,
    },
    retryActionsByDefault: true,
  },
});

export const TASK_WORKFLOW_EVENT = "daytona.command.complete";
export const TASK_COMPLETED_EVENT = "task.execute.completed";
export const POLL_INTERVAL_MS = 2_000;
export const TASK_COMMAND_TIMEOUT_MS = 90 * 60 * 1000;
export const CALLBACK_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
