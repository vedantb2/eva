import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import type { WorkflowId } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import {
  clearStreamingActivity,
  getTaskRunStreamingEntityId,
  snapshotStreamingActivityToLog,
} from "./helpers";

const QUICK_TASK_AUTO_RETRY_BASE_DELAY_MS = 20_000;
const QUICK_TASK_AUTO_RETRY_JITTER_MS = 20_000;

export const STALE_THRESHOLD_MS = 300_000;
export const STALE_CHECK_DELAY_MS = 90_000;
export const STALE_RECHECK_MS = 30_000;
export const STALE_FINISHING_THRESHOLD_MS = 600_000;
export const STALE_NO_SANDBOX_THRESHOLD_MS = 900_000;

/** Checks whether an error message indicates a Daytona infrastructure/network issue. */
export function isDaytonaNetworkIssue(errorMsg: string): boolean {
  const message = errorMsg.toLowerCase();
  if (
    message.includes("failed to fetch latest base branch") ||
    message.includes("daytona:fetchbasebranch")
  ) {
    return false;
  }
  const networkMarkers = [
    "network",
    "fetch failed",
    "econnreset",
    "econnrefused",
    "etimedout",
    "enotfound",
    "getaddrinfo",
    "socket hang up",
    "timeout",
    "timed out",
    "aborted",
  ];
  const daytonaMarkers = ["daytona", "daytonaerror", "sandbox", "snapshot"];
  const daytonaStatusMarkers = [
    "status code 408",
    "status code 429",
    "status code 500",
    "status code 502",
    "status code 503",
    "status code 504",
  ];

  const hasDaytonaMarker = daytonaMarkers.some((marker) =>
    message.includes(marker),
  );
  if (!hasDaytonaMarker) {
    return false;
  }

  if (
    message.includes("sandbox exec") ||
    message.includes("sandbox command failed")
  ) {
    return false;
  }

  const hasNetworkMarker = networkMarkers.some((marker) =>
    message.includes(marker),
  );
  const hasDaytonaStatusMarker = daytonaStatusMarkers.some((marker) =>
    message.includes(marker),
  );

  if (
    message.includes("sandbox failed to become ready within the timeout period")
  ) {
    return true;
  }

  return hasNetworkMarker || hasDaytonaStatusMarker;
}

/** Calculates a randomized retry delay for quick task auto-retries. */
export function buildQuickTaskRetryDelayMs(): number {
  return (
    QUICK_TASK_AUTO_RETRY_BASE_DELAY_MS +
    Math.floor(Math.random() * QUICK_TASK_AUTO_RETRY_JITTER_MS)
  );
}

/** Cleans up a stale or failed run: cancels workflow, kills sandbox, marks run as error, and schedules retry. */
export async function cleanUpStaleRun(
  ctx: MutationCtx,
  params: {
    taskId: Id<"agentTasks">;
    runId: Id<"agentRuns">;
    sandboxId?: string;
    repoId?: Id<"githubRepos">;
    isProjectTask: boolean;
    errorMessage: string;
    exitReason: string;
    activeWorkflowId?: string;
    taskStatus: string;
  },
): Promise<void> {
  if (params.activeWorkflowId) {
    try {
      await workflow.cancel(ctx, params.activeWorkflowId as WorkflowId);
    } catch {}
  }

  if (params.sandboxId && params.repoId) {
    await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
      sandboxId: params.sandboxId,
      repoId: params.repoId,
    });
    if (!params.isProjectTask) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: params.sandboxId,
        repoId: params.repoId,
      });
    }
  }

  await ctx.db.patch(params.runId, {
    status: "error",
    finalizingAt: undefined,
    error: params.errorMessage,
    finishedAt: Date.now(),
    exitReason: params.exitReason,
  });

  const taskPatch = {
    activeWorkflowId: undefined as undefined,
    updatedAt: Date.now(),
    ...(params.taskStatus === "in_progress" ? { status: "todo" as const } : {}),
  };
  await ctx.db.patch(params.taskId, taskPatch);

  if (!params.isProjectTask) {
    await ctx.scheduler.runAfter(
      0,
      internal.taskWorkflow.maybeScheduleQuickTaskRetry,
      {
        taskId: params.taskId,
        runId: params.runId,
        error: params.errorMessage,
        delayMs: buildQuickTaskRetryDelayMs(),
      },
    );
  }

  await snapshotStreamingActivityToLog(
    ctx,
    getTaskRunStreamingEntityId(params.runId),
    params.runId,
  );
  await clearStreamingActivity(ctx, getTaskRunStreamingEntityId(params.runId));
  await clearStreamingActivity(ctx, String(params.taskId));
}
