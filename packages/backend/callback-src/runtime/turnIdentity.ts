import {
  ASSISTANT_MESSAGE_ID,
  supportsExactTurnIdentity,
  TURN_ATTEMPT,
  TURN_ID,
} from "../config.js";
import type { ChatTurnIdentity } from "../../shared/chatTurnProtocol.js";

let activeTurnIdentity: ChatTurnIdentity | null = supportsExactTurnIdentity
  ? {
      turnId: TURN_ID,
      assistantMessageId: ASSISTANT_MESSAGE_ID,
      attempt: TURN_ATTEMPT,
    }
  : null;

/** Rebinds a warm daemon's callback traffic to its atomically claimed turn. */
export function setActiveTurnIdentity(identity: ChatTurnIdentity | null): void {
  activeTurnIdentity = identity;
}

/** Optional callback fields understood by protocol-v2 chat mutations. */
export function activeTurnIdentityArgs(): {
  turnId?: string;
  assistantMessageId?: string;
  attempt?: number;
} {
  if (activeTurnIdentity === null) return {};
  return {
    turnId: activeTurnIdentity.turnId,
    assistantMessageId: activeTurnIdentity.assistantMessageId,
    attempt: activeTurnIdentity.attempt,
  };
}
