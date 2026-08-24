import type { Doc } from "../_generated/dataModel";

/**
 * Deployment bridge for workflows that started before durable Turns existed.
 * Once a session opens any durable Turn, the marker permanently removes these
 * fallbacks so stale legacy fields can never become authoritative again.
 */
export function isLegacySessionExecuting(
  session: Pick<
    Doc<"sessions">,
    "activeWorkflowId" | "syntheticTurnMessageId" | "turnLifecycleVersion"
  >,
): boolean {
  return (
    session.turnLifecycleVersion === undefined &&
    (session.activeWorkflowId !== undefined ||
      session.syntheticTurnMessageId !== undefined)
  );
}
