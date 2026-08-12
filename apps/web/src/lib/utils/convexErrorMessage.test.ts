import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { convexErrorMessage } from "./convexErrorMessage";

/**
 * Production Convex redacts the message of a plain `Error` to "Server Error",
 * so a failed Create PR reached the user as a request id and nothing else —
 * on the very button offered as the recovery path for a run whose own PR step
 * failed. Only `ConvexError` data crosses the wire intact (fix aea40f89).
 */
describe("convexErrorMessage", () => {
  test("prefers the ConvexError data that survived the wire", () => {
    expect(
      convexErrorMessage(
        new ConvexError("eva/task-12 is not ahead of staging"),
        "Failed to create PR",
      ),
    ).toBe("eva/task-12 is not ahead of staging");
  });

  test("keeps a plain Error's own message", () => {
    expect(
      convexErrorMessage(new Error("Not authenticated"), "Failed to create PR"),
    ).toBe("Not authenticated");
  });

  test("falls back only when the failure carries no message at all", () => {
    expect(convexErrorMessage("boom", "Failed to create PR")).toBe(
      "Failed to create PR",
    );
    expect(convexErrorMessage(undefined, "Failed to create PR")).toBe(
      "Failed to create PR",
    );
  });
});
