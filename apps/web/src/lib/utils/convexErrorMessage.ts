import { ConvexError } from "convex/values";

/**
 * The message to show the user for a failed Convex call.
 *
 * Production Convex redacts plain `Error` messages to "Server Error", so
 * `error.message` alone leaves the user with a request id and no reason. Only
 * `ConvexError` data crosses the wire intact — read that first.
 */
export function convexErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return error instanceof Error ? error.message : fallback;
}
