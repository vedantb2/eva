import { describe, expect, test } from "vitest";
import { usesCursorConversationHandoff } from "../convex/_sessions/cursorContext";

describe("Cursor conversation handoff selection", () => {
  test("uses the pinned provider on current sessions", () => {
    expect(
      usesCursorConversationHandoff({
        provider: "cursor",
        lastModel: "cursor:grok-4.6",
      }),
    ).toBe(true);
  });

  test("derives Cursor from the model on legacy sessions", () => {
    expect(
      usesCursorConversationHandoff({
        provider: undefined,
        lastModel: "cursor:grok-4.6",
      }),
    ).toBe(true);
  });

  test("a pinned non-Cursor provider wins over stale model data", () => {
    expect(
      usesCursorConversationHandoff({
        provider: "claude",
        lastModel: "cursor:grok-4.6",
      }),
    ).toBe(false);
  });

  test("non-Cursor and missing legacy models do not add duplicate history", () => {
    expect(
      usesCursorConversationHandoff({
        provider: undefined,
        lastModel: "claude:claude-fable-5",
      }),
    ).toBe(false);
    expect(
      usesCursorConversationHandoff({
        provider: undefined,
        lastModel: undefined,
      }),
    ).toBe(false);
  });
});
