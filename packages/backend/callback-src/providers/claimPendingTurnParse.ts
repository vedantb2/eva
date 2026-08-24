import type { JsonValue } from "../types.js";

/** Reads stop-task toolUseIds from a claimPendingTurn mutation HTTP response. */
export function readStopTaskToolUseIds(result: JsonValue): string[] {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return [];
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  const field = payload.stopTaskToolUseIds;
  if (!Array.isArray(field)) {
    return [];
  }
  return field.filter((id): id is string => typeof id === "string");
}

/**
 * Reads the `cancelRequested` flag from a claimPendingTurn mutation HTTP
 * response. The server drains this field server-side, so it arrives `true`
 * exactly once per user cancel. Missing (including on servers that predate
 * this field) reads as `false` — same envelope unwrapping as the other
 * claim-payload readers (the value may live under `.value`).
 */
export function readCancelRequested(result: JsonValue): boolean {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return false;
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  return payload.cancelRequested === true;
}
