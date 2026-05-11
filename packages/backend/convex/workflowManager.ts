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
    maxParallelism: 10,
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
