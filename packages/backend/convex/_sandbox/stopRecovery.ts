/**
 * How long to wait before re-issuing a sandbox stop when the finalize action
 * died with a Convex transient error. Actions are not auto-retried — without a
 * re-issue, a "Transient error while executing action" (0ms) leaves the entity
 * stuck on "stopping" forever. Shared by the session, task, and project stop
 * paths (each has its own recoverStuckStopping mutation).
 */
export const STUCK_STOPPING_RECOVER_MS = 20_000;
