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
