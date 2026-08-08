import { TURN_ID } from "../config.js";
import type { JsonValue } from "../types.js";
import { log } from "../utils.js";

/**
 * The runner's half of the turn lease. Every heartbeat carries the turn id this
 * process believes it owns, and the server answers with a verdict. `terminal`
 * means another turn owns the entity now (or this one is over), so the only
 * correct response is to stop touching the sandbox.
 *
 * One-shot launches get the id from `TURN_ID`. The warm Claude daemon outlives
 * any single turn, so it sets the id from each `claimPendingTurn` instead and
 * clears it when the turn finishes.
 */

export type LeaseTerminalReason =
  | "unknown_turn"
  | "closed"
  | "superseded"
  | "timeout"
  | "cancelled";

const TERMINAL_REASONS: readonly LeaseTerminalReason[] = [
  "unknown_turn",
  "closed",
  "superseded",
  "timeout",
  "cancelled",
];

let currentTurnId: string | null = TURN_ID;
let terminalReason: LeaseTerminalReason | null = null;

export function getCurrentTurnId(): string | null {
  return currentTurnId;
}

/** Points the lease at a new turn, clearing any verdict from the previous one. */
export function setCurrentTurnId(turnId: string | null): void {
  if (currentTurnId === turnId) return;
  currentTurnId = turnId;
  terminalReason = null;
}

/** The reason the lease ended, once a heartbeat has been told `terminal`. */
export function getLeaseTerminalReason(): LeaseTerminalReason | null {
  return terminalReason;
}

function isTerminalReason(value: string): value is LeaseTerminalReason {
  return TERMINAL_REASONS.some((reason) => reason === value);
}

/**
 * Reads the lease verdict out of a heartbeat response body. Anything that is
 * not a well-formed `terminal` verdict — including responses from a deployment
 * that predates leases — reads as "keep going": the reconciler is the backstop,
 * so a parse miss must never kill a healthy turn.
 */
export function parseLeaseTerminalReason(
  body: JsonValue,
): LeaseTerminalReason | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const lease = body.lease;
  if (typeof lease !== "object" || lease === null || Array.isArray(lease)) {
    return null;
  }
  if (lease.status !== "terminal") return null;
  const reason = lease.reason;
  if (typeof reason !== "string" || !isTerminalReason(reason)) {
    return "closed";
  }
  return reason;
}

/** Records a heartbeat response; returns true once the lease has gone terminal. */
export function noteHeartbeatResponse(body: string | JsonValue): boolean {
  if (terminalReason !== null) return true;
  let parsed: JsonValue;
  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      return false;
    }
  } else {
    parsed = body;
  }
  const reason = parseLeaseTerminalReason(parsed);
  if (reason === null) return false;
  terminalReason = reason;
  log(
    "turn lease terminal (" +
      reason +
      ") for turnId=" +
      String(currentTurnId) +
      " — this runner no longer owns the turn",
  );
  return true;
}
