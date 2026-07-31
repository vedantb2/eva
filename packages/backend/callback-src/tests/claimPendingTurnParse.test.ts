import { describe, expect, test } from "vitest";
import {
  readCancelRequested,
  readStopTaskToolUseIds,
} from "../providers/claimPendingTurnParse.js";
import type { JsonValue } from "../types.js";
import { readClaimedTurn } from "../providers/daemonTurn.js";

describe("readClaimedTurn", () => {
  test("unwraps the atomic prompt and keeps only string attachment URLs", () => {
    expect(
      readClaimedTurn({
        value: {
          prompt: "current prompt",
          attachmentUrls: ["https://files.test/a", 4, null],
        },
      }),
    ).toEqual({
      prompt: "current prompt",
      attachmentUrls: ["https://files.test/a"],
      identity: null,
    });
  });

  test("preserves an exact v2 turn identity", () => {
    expect(
      readClaimedTurn({
        prompt: "current prompt",
        attachmentUrls: [],
        turnId: "2c2d6de9-9e86-4bd9-a365-8ab42de9f115",
        assistantMessageId: "message-id",
        attempt: 2,
      }),
    ).toEqual({
      prompt: "current prompt",
      attachmentUrls: [],
      identity: {
        turnId: "2c2d6de9-9e86-4bd9-a365-8ab42de9f115",
        assistantMessageId: "message-id",
        attempt: 2,
      },
    });
  });

  test("rejects claim responses without a prompt", () => {
    expect(readClaimedTurn({ value: { cancelRequested: true } })).toBeNull();
  });
});

/**
 * `readCancelRequested` gates interrupt-based cancel (fix 1fc211db): the daemon
 * only calls `query.interrupt()` when this reads `true`. A false negative
 * silently ignores the user's cancel (turn runs on); a false positive tears
 * down a live turn. Both failure modes are invisible without this test, so the
 * envelope unwrapping and the strict `=== true` check are pinned here.
 */
describe("readCancelRequested", () => {
  test("reads a top-level cancel flag", () => {
    expect(readCancelRequested({ cancelRequested: true })).toBe(true);
  });

  /** Convex mutation HTTP responses wrap the payload under `.value`. */
  test("reads a cancel flag nested under the value envelope", () => {
    expect(readCancelRequested({ value: { cancelRequested: true } })).toBe(
      true,
    );
  });

  /**
   * The whole point of the flag: absent means no cancel. Servers that predate
   * the field omit it, and that must never read as a spurious cancel.
   */
  test("a missing flag reads as no cancel", () => {
    expect(readCancelRequested({ stopTaskToolUseIds: [] })).toBe(false);
    expect(readCancelRequested({ value: {} })).toBe(false);
    expect(readCancelRequested({})).toBe(false);
  });

  test("an explicit false reads as no cancel", () => {
    expect(readCancelRequested({ cancelRequested: false })).toBe(false);
    expect(readCancelRequested({ value: { cancelRequested: false } })).toBe(
      false,
    );
  });

  /**
   * The server drains this to `true` exactly once, so only a strict boolean
   * `true` may fire the interrupt. Truthy stand-ins must not.
   */
  test("truthy non-boolean values do not count as a cancel", () => {
    const cases: JsonValue[] = [
      { cancelRequested: "true" },
      { cancelRequested: 1 },
      { value: { cancelRequested: "true" } },
    ];
    for (const input of cases) {
      expect(readCancelRequested(input)).toBe(false);
    }
  });

  test("non-object results read as no cancel", () => {
    const cases: JsonValue[] = [null, true, 5, "cancelRequested", []];
    for (const input of cases) {
      expect(readCancelRequested(input)).toBe(false);
    }
  });
});

/**
 * Sibling reader sharing the exact same value-envelope unwrapping. Kept here so
 * a change to that shared shape can only pass if both readers still agree.
 */
describe("readStopTaskToolUseIds", () => {
  test("reads ids from a top-level payload", () => {
    expect(readStopTaskToolUseIds({ stopTaskToolUseIds: ["a", "b"] })).toEqual([
      "a",
      "b",
    ]);
  });

  test("reads ids nested under the value envelope", () => {
    expect(
      readStopTaskToolUseIds({ value: { stopTaskToolUseIds: ["a"] } }),
    ).toEqual(["a"]);
  });

  test("drops non-string entries and defaults missing to empty", () => {
    expect(
      readStopTaskToolUseIds({ stopTaskToolUseIds: ["a", 1, null, "b"] }),
    ).toEqual(["a", "b"]);
    expect(readStopTaskToolUseIds({})).toEqual([]);
    expect(readStopTaskToolUseIds(null)).toEqual([]);
  });
});
