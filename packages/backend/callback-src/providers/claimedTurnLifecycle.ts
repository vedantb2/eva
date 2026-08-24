import type { JsonObject, JsonValue } from "../types.js";
import {
  setCurrentTurnLease,
  type TurnLeaseIdentity,
} from "../runtime/turnLease.js";
import { readTurnLeaseIdentity } from "./claimPendingTurnParse.js";

type ClaimedTurnBase = {
  prompt: string;
  attachmentUrls: string[];
};

export type ClaimedTurn =
  | (ClaimedTurnBase & {
      lifecycle: "legacy";
      turnLease: null;
    })
  | (ClaimedTurnBase & {
      lifecycle: "durable";
      turnLease: TurnLeaseIdentity;
    });

type ActiveClaimState =
  | { status: "idle" }
  | { status: "active"; lifecycle: "legacy" }
  | {
      status: "active";
      lifecycle: "durable";
      turnLease: TurnLeaseIdentity;
    };

let activeClaimState: ActiveClaimState = { status: "idle" };

function claimPayload(result: JsonValue): JsonObject | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  return typeof inner === "object" && inner !== null && !Array.isArray(inner)
    ? inner
    : result;
}

/** Parses the one shared claim contract used by every persistent provider. */
export function readClaimedTurn(result: JsonValue): ClaimedTurn | null {
  const payload = claimPayload(result);
  if (!payload || typeof payload.prompt !== "string") return null;
  const lifecycle = payload.turnLifecycle;
  if (
    lifecycle !== undefined &&
    lifecycle !== "legacy" &&
    lifecycle !== "durable"
  ) {
    throw new Error("Claimed turn returned an invalid lifecycle discriminator");
  }
  const attachmentUrls = Array.isArray(payload.attachmentUrls)
    ? payload.attachmentUrls.filter(
        (url): url is string => typeof url === "string",
      )
    : [];
  const turnLease = readTurnLeaseIdentity(result);
  if (lifecycle === "durable" && turnLease === null) {
    throw new Error("Durable claimed turn did not include a lease identity");
  }
  if (lifecycle === "legacy" && turnLease !== null) {
    throw new Error("Legacy claimed turn unexpectedly included a lease identity");
  }
  if (turnLease !== null) {
    return {
      lifecycle: "durable",
      prompt: payload.prompt,
      attachmentUrls,
      turnLease,
    };
  }
  return {
    lifecycle: "legacy",
    prompt: payload.prompt,
    attachmentUrls,
    turnLease: null,
  };
}

/** Installs ownership before provider execution or heartbeat emission begins. */
export function startClaimedTurn(turn: ClaimedTurn): void {
  if (activeClaimState.status === "active") {
    throw new Error("Cannot start a claimed turn while another claim is active");
  }
  activeClaimState =
    turn.lifecycle === "durable"
      ? { status: "active", lifecycle: "durable", turnLease: turn.turnLease }
      : { status: "active", lifecycle: "legacy" };
  setCurrentTurnLease(turn.turnLease);
}

/** Fences every real-turn completion through the ownership installed at start. */
export function appendClaimedTurnCompletion(args: JsonObject): void {
  if (activeClaimState.status !== "active") {
    throw new Error("Cannot complete a claimed turn before it starts");
  }
  if (activeClaimState.lifecycle === "durable") {
    args.turnId = activeClaimState.turnLease.turnId;
    args.leaseGeneration = activeClaimState.turnLease.leaseGeneration;
  }
}

/** Clears ownership between turns in a warm provider process. */
export function finishClaimedTurn(): void {
  activeClaimState = { status: "idle" };
  setCurrentTurnLease(null);
}

/** Test-only lifecycle view; carries no provider or prompt data. */
export function claimedTurnLifecycleStatus(): ActiveClaimState["status"] {
  return activeClaimState.status;
}
