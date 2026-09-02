import {
  type ConvexErrorPayload,
  convexErrorPayloadSchema,
} from "@eva/shared/convexErrorPayload";
import { ConvexError } from "convex/values";

/**
 * The structured payload on a `ConvexError`, when it carries one.
 *
 * The zod parse is the boundary: anything that does not match the contract —
 * legacy string data, a half-built object, a number — is simply not a payload.
 */
function convexErrorPayload(error: unknown): ConvexErrorPayload | undefined {
  if (!(error instanceof ConvexError)) return undefined;
  const parsed = convexErrorPayloadSchema.safeParse(error.data);
  return parsed.success ? parsed.data : undefined;
}

/**
 * The message to show the user for a failed Convex call.
 *
 * Production Convex redacts plain `Error` messages to "Server Error", so
 * `error.message` alone leaves the user with a request id and no reason. Only
 * `ConvexError` data crosses the wire intact — read that first. Data is either
 * a structured `{ tag, message }` payload from a tagged backend error or, for
 * now, a plain string.
 */
export function convexErrorMessage(error: unknown, fallback: string): string {
  const payload = convexErrorPayload(error);
  if (payload) return payload.message;
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * The `_tag` of the backend error behind a failed Convex call, when it sent a
 * structured payload, so callers can branch on the kind of failure instead of
 * matching message text. `undefined` for anything else.
 */
export function convexErrorTag(error: unknown): string | undefined {
  return convexErrorPayload(error)?.tag;
}
