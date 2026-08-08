import {
  RUN_TIMEOUT_MS,
  STALE_FINISHING_THRESHOLD_MS,
  STALE_NO_SANDBOX_THRESHOLD_MS,
  type StaleTurnPhase,
  thresholdForPhase,
} from "../_taskWorkflow/staleness";

/**
 * Pure turn-lease policy: the state machine and the lease arithmetic, with no
 * Convex imports so the unit tests can exercise it directly.
 *
 * The whole point of the lease is that liveness is *asserted by the owner*
 * rather than inferred from proxies. A turn is running only while its lease
 * holds; when the owner dies the lease simply lapses and the reconciler
 * converges the row. Nothing depends on a process exiting cleanly.
 */

export type TurnState =
  | "staged"
  | "launching"
  | "running"
  | "finalizing"
  | "done"
  | "error"
  | "cancelled";

export type TerminalTurnState = "done" | "error" | "cancelled";

export const TERMINAL_TURN_STATES = ["done", "error", "cancelled"] as const;

export function isTerminalTurnState(
  state: TurnState,
): state is TerminalTurnState {
  return state === "done" || state === "error" || state === "cancelled";
}

/**
 * Legal successors for each state. Progress is one-way: a turn never goes back
 * to an earlier phase, so a late message from a superseded actor cannot drag a
 * running turn back to `launching`. Self-transitions are legal because a
 * renewal re-asserts the current state.
 */
export const TURN_TRANSITIONS: Record<TurnState, readonly TurnState[]> = {
  staged: [
    "staged",
    "launching",
    "running",
    "finalizing",
    "done",
    "error",
    "cancelled",
  ],
  launching: [
    "launching",
    "running",
    "finalizing",
    "done",
    "error",
    "cancelled",
  ],
  running: ["running", "finalizing", "done", "error", "cancelled"],
  finalizing: ["finalizing", "done", "error", "cancelled"],
  done: [],
  error: [],
  cancelled: [],
};

export function canTransitionTurn(from: TurnState, to: TurnState): boolean {
  return TURN_TRANSITIONS[from].includes(to);
}

/** Grace granted while the sandbox is being resumed, prepared, and launched. */
export const LEASE_STARTUP_MS = STALE_NO_SANDBOX_THRESHOLD_MS;
/** Grace granted for post-completion work (push, PR create, save). */
export const LEASE_FINALIZING_MS = STALE_FINISHING_THRESHOLD_MS;

/**
 * How long a lease lasts for one state. `running` is phase-aware and reuses
 * the watchdog thresholds verbatim: a silent 20-minute `pnpm build` gets the
 * long tool allowance, an idle agent gets five minutes.
 */
export function leaseDurationMs(
  state: TurnState,
  phase: StaleTurnPhase = "idle",
): number {
  switch (state) {
    case "staged":
    case "launching":
      return LEASE_STARTUP_MS;
    case "running":
      return thresholdForPhase(phase);
    case "finalizing":
      return LEASE_FINALIZING_MS;
    case "done":
    case "error":
    case "cancelled":
      return 0;
  }
}

/**
 * Lease expiry for a state, hard-capped at `turnStartedAt + RUN_TIMEOUT_MS`
 * (I4). The cap is what replaces the old per-surface 2-hour `handleStaleX`
 * backstops: no sequence of renewals can carry a turn past the limit, so the
 * backstop needs no scheduler entry of its own.
 */
export function leaseExpiryFor(input: {
  state: TurnState;
  phase?: StaleTurnPhase;
  turnStartedAt: number;
  now: number;
}): number {
  const granted = input.now + leaseDurationMs(input.state, input.phase);
  return Math.min(granted, input.turnStartedAt + RUN_TIMEOUT_MS);
}

/** Why a renewal was refused. The callback hard-exits on any of these. */
export type LeaseRejection =
  | "unknown_turn" // turnId does not resolve to a row
  | "closed" // the turn already reached a terminal state
  | "superseded" // a newer turn owns the entity
  | "timeout" // past turnStartedAt + RUN_TIMEOUT_MS
  | "cancelled"; // the user pressed stop

export type LeaseVerdict =
  | { status: "renewed"; leaseExpiresAt: number; durationMs: number }
  | { status: "terminal"; reason: LeaseRejection };

/** True once the turn has outlived the absolute 2-hour ceiling (I4). */
export function isPastRunTimeout(turnStartedAt: number, now: number): boolean {
  return now >= turnStartedAt + RUN_TIMEOUT_MS;
}
