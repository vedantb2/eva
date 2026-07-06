import { WorkflowManager, type WorkflowId } from "@convex-dev/workflow";
import { components } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

/** Shared workflow manager instance with retry and parallelism configuration. */
export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 1000,
      base: 2,
    },
    retryActionsByDefault: true,
    // Shared across every workflow type (sessions, tasks, design, projects…).
    // At 10, a burst of concurrent turns queued steps behind each other and a
    // warm session turn's handoff could wait 10s+ in the pool — the "slow hi".
    // Raised to cut that head-of-line wait; Convex scales the functions, this
    // cap is backpressure, not a hard resource limit.
    maxParallelism: 30,
  },
});

/** Cancels a tracked workflow, swallowing errors when it has already completed or been cancelled. */
export async function cancelTrackedWorkflow(
  ctx: MutationCtx,
  workflowId: string | undefined,
): Promise<void> {
  if (!workflowId) return;
  try {
    await workflow.cancel(ctx, workflowId as WorkflowId);
  } catch {
    // Workflow may have already completed or been cancelled
  }
}
