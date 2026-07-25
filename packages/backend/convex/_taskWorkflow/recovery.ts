import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { cancelTrackedWorkflow } from "../workflowManager";
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
// Extended threshold for when the agent is demonstrably running a long tool
// (e.g. `pnpm build`, `pnpm install`) with output redirected away from the
// terminal. During that window stream-json emits nothing new, so the only
// thing bumping `streamingActivity.lastUpdatedAt` is the 10s heartbeat — if
// transport has a transient issue we don't want to kill a run that's mid-build.
// Paired with the pre-kill liveness probe, we only apply this when we've
// confirmed the callback PID is still alive.
export const STALE_TOOL_ACTIVE_THRESHOLD_MS = 1_500_000;

/** Checks whether an error message indicates a sandbox infrastructure/network issue. */
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

/** Checks whether an error message indicates a Claude API usage limit. */
export function isUsageLimitError(errorMsg: string): boolean {
  const message = errorMsg.toLowerCase();
  return (
    message.includes("out of extra usage") ||
    message.includes("rate limit") ||
    message.includes("usage limit") ||
    message.includes("token limit exceeded")
  );
}

/**
 * Parses a usage-limit error message for the reset time.
 * Handles messages like "You're out of extra usage · resets 4pm (UTC)"
 * Returns the reset timestamp (ms since epoch) or null if unparseable.
 */
export function parseUsageLimitResetTime(errorMsg: string): number | null {
  // Match patterns like "resets 4pm (UTC)", "resets 4:30pm (UTC)", "resets 16:00 (UTC)"
  const resetMatch = errorMsg.match(
    /resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*\(?\s*UTC\s*\)?/i,
  );
  if (!resetMatch) return null;

  const hourRaw = parseInt(resetMatch[1], 10);
  const minutes = resetMatch[2] ? parseInt(resetMatch[2], 10) : 0;
  const ampm = resetMatch[3]?.toLowerCase();

  let hour24: number;
  if (ampm) {
    // 12-hour format
    if (ampm === "pm" && hourRaw !== 12) {
      hour24 = hourRaw + 12;
    } else if (ampm === "am" && hourRaw === 12) {
      hour24 = 0;
    } else {
      hour24 = hourRaw;
    }
  } else {
    // 24-hour format
    hour24 = hourRaw;
  }

  const now = new Date();
  const resetDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hour24,
      minutes,
      0,
      0,
    ),
  );

  // If the reset time has already passed today, schedule for tomorrow
  if (resetDate.getTime() <= now.getTime()) {
    resetDate.setUTCDate(resetDate.getUTCDate() + 1);
  }

  // Add 2-minute buffer so the limit is definitely cleared
  return resetDate.getTime() + 2 * 60 * 1000;
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
  await cancelTrackedWorkflow(ctx, params.activeWorkflowId);

  if (params.sandboxId && params.repoId) {
    await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
      sandboxId: params.sandboxId,
      repoId: params.repoId,
    });
    if (!params.isProjectTask) {
      // Quick-task sandboxes are persistent: stop (don't delete) so any
      // uncommitted work or unpushed commits stay recoverable and the next
      // run resumes the same filesystem. Diagnostics (dmesg OOM lines, done
      // file, callback log tail) are captured onto the run first, while the
      // sandbox is still running.
      await ctx.scheduler.runAfter(
        0,
        internal.sandbox.captureDiagnosticsAndStopSandbox,
        {
          sandboxId: params.sandboxId,
          repoId: params.repoId,
          runId: params.runId,
        },
      );
    }
  }

  await ctx.db.patch(params.runId, {
    status: "error",
    finalizingAt: undefined,
    error: params.errorMessage,
    finishedAt: Date.now(),
    exitReason: params.exitReason,
  });

  const taskPatch: {
    activeWorkflowId: undefined;
    updatedAt: number;
    status?: "todo";
    sandboxId?: string;
    reviewTaskSandboxStatus?: "closed";
  } = {
    activeWorkflowId: undefined,
    updatedAt: Date.now(),
    ...(params.taskStatus === "in_progress" ? { status: "todo" as const } : {}),
  };
  if (!params.isProjectTask && params.sandboxId) {
    // Keep the sandbox reference on the task (the run may have died before
    // saveTaskSandboxId ran, which would otherwise orphan the stopped
    // sandbox) and mark it closed so the reviewer UI shows a resumable,
    // stopped sandbox.
    taskPatch.sandboxId = params.sandboxId;
    taskPatch.reviewTaskSandboxStatus = "closed";
  }
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

  const runStreamingEntityId = getTaskRunStreamingEntityId(params.runId);
  await snapshotStreamingActivityToLog(ctx, runStreamingEntityId, params.runId);
  await clearStreamingActivity(ctx, runStreamingEntityId);
  await clearStreamingActivity(ctx, String(params.taskId));
}
