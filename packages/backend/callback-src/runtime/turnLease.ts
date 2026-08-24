import { TURN_ID, TURN_LEASE_GENERATION } from "../config.js";
import type { JsonObject, JsonValue } from "../types.js";
import { log } from "../utils.js";

export type TurnLeaseIdentity = {
  turnId: string;
  leaseGeneration: number;
};

export type LeaseTerminalReason =
  | "unknown_turn"
  | "closed"
  | "superseded"
  | "timeout"
  | "cancelled";

let currentTurnLease: TurnLeaseIdentity | null =
  TURN_ID !== null && TURN_LEASE_GENERATION !== null
    ? { turnId: TURN_ID, leaseGeneration: TURN_LEASE_GENERATION }
    : null;
let terminalReason: LeaseTerminalReason | null = null;

export function getCurrentTurnLease(): TurnLeaseIdentity | null {
  return currentTurnLease;
}

/** Daemons must not heartbeat until claimPendingTurn grants turn ownership. */
export function canSendTurnHeartbeat({
  claimMutation,
  turnLease,
}: {
  claimMutation: string | undefined;
  turnLease: TurnLeaseIdentity | null;
}): boolean {
  return claimMutation === undefined || turnLease !== null;
}

/** Adds the current fence to any callback mutation payload when one is owned. */
export function appendCurrentTurnLease(args: JsonObject): void {
  const identity = getCurrentTurnLease();
  if (identity === null) return;
  args.turnId = identity.turnId;
  args.leaseGeneration = identity.leaseGeneration;
}

export function setCurrentTurnLease(identity: TurnLeaseIdentity | null): void {
  if (
    currentTurnLease?.turnId === identity?.turnId &&
    currentTurnLease?.leaseGeneration === identity?.leaseGeneration
  ) {
    return;
  }
  currentTurnLease = identity;
  terminalReason = null;
}

export function getLeaseTerminalReason(): LeaseTerminalReason | null {
  return terminalReason;
}

function parseTerminalReason(value: JsonValue): LeaseTerminalReason | null {
  if (
    value === "unknown_turn" ||
    value === "closed" ||
    value === "superseded" ||
    value === "timeout" ||
    value === "cancelled"
  ) {
    return value;
  }
  return null;
}

export function noteHeartbeatResponse(response: string | JsonValue): boolean {
  if (terminalReason !== null) return true;
  let parsed: JsonValue;
  if (typeof response === "string") {
    try {
      parsed = JSON.parse(response);
    } catch {
      return false;
    }
  } else {
    parsed = response;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return false;
  }
  const responseValue = parsed.value;
  const payload =
    typeof responseValue === "object" &&
    responseValue !== null &&
    !Array.isArray(responseValue)
      ? responseValue
      : parsed;
  const lease = payload.lease;
  if (typeof lease !== "object" || lease === null || Array.isArray(lease)) {
    return false;
  }
  if (lease.status !== "terminal") return false;
  terminalReason = parseTerminalReason(lease.reason) ?? "closed";
  log(
    "turn lease terminal (" +
      terminalReason +
      ") turnId=" +
      String(currentTurnLease?.turnId),
  );
  return true;
}
