/**
 * Snapshot lifecycle states that end a build/capture poll loop: "active" is
 * success; "error" / "build_failed" are failures.
 *
 * This module is intentionally dependency-free. The snapshot SDK service
 * (snapshots.ts) is node-only and cannot be imported by the build workflow,
 * which runs in the Convex isolate — so the shared terminal-state definition
 * lives here where both sides can import it.
 */
export const TERMINAL_SNAPSHOT_STATES: readonly string[] = [
  "active",
  "error",
  "build_failed",
];

export function isTerminalSnapshotState(state: string): boolean {
  return TERMINAL_SNAPSHOT_STATES.includes(state);
}
