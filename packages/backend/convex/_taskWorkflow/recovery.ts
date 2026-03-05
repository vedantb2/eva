import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import type { WorkflowId } from "@convex-dev/workflow";
import type { Id } from "../_generated/dataModel";
import { clearStreamingActivity } from "./helpers";

const QUICK_TASK_AUTO_RETRY_BASE_DELAY_MS = 20_000;
const QUICK_TASK_AUTO_RETRY_JITTER_MS = 20_000;

export const STALE_THRESHOLD_MS = 90_000;
export const STALE_CHECK_DELAY_MS = 90_000;
export const STALE_RECHECK_MS = 30_000;
export const STALE_NO_SANDBOX_THRESHOLD_MS = 600_000;

export function isDaytonaNetworkIssue(errorMessage: string): boolean {
  const message = errorMessage.toLowerCase();
  const networkMarkers = [
    "network",
    "fetch failed",
    "econnreset",
    "econnrefused",
    "etimedout",
    "enotfound",
    "getaddrinfo",
    "socket hang up",
  ];
  const daytonaMarkers = ["daytona", "sandbox", "snapshot"];

  const hasNetworkMarker = networkMarkers.some((marker) =>
    message.includes(marker),
  );
  const hasDaytonaMarker = daytonaMarkers.some((marker) =>
    message.includes(marker),
  );

  if (
    message.includes("sandbox failed to become ready within the timeout period")
  ) {
    return true;
  }

  return hasNetworkMarker && hasDaytonaMarker;
}

export function buildQuickTaskRetryDelayMs(): number {
  return (
    QUICK_TASK_AUTO_RETRY_BASE_DELAY_MS +
    Math.floor(Math.random() * QUICK_TASK_AUTO_RETRY_JITTER_MS)
  );
}

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
    error: params.errorMessage,
    finishedAt: Date.now(),
    exitReason: params.exitReason,
  });

  await ctx.db.patch(params.taskId, {
    status: "todo",
    activeWorkflowId: undefined,
    updatedAt: Date.now(),
  });

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

  await clearStreamingActivity(ctx, String(params.taskId));
}
