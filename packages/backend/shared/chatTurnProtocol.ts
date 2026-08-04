/** Identity-aware callback contract understood by current backend and runner. */
export const CHAT_TURN_PROTOCOL_VERSION = 2;

export type ChatTurnIdentity = {
  turnId: string;
  assistantMessageId: string;
  attempt: number;
};
