import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  isEmptyActivityPayload,
  parseActivitySteps,
} from "@eva/shared/parseActivitySteps";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "StreamingActivityDisplay.tsx"),
  "utf8",
);

/**
 * A cursor:grok-4.6 turn sat on a shimmering "Working... (7m 39s)" while the
 * daemon rewrote its activity payload as the literal "[]" every ~10s (prod,
 * 2026-08-19). `parseActivitySteps` returns null for both "[]" and "nothing
 * published yet", so the reader cannot tell startup lag from a stream that has
 * gone silent. Telling them apart is what this pair of functions is for, and it
 * only works while they disagree on "[]".
 */
describe("an empty activity payload is distinguishable from no payload", () => {
  test("an empty array is a payload, not the absence of one", () => {
    expect(isEmptyActivityPayload("[]")).toBe(true);
    expect(
      parseActivitySteps("[]"),
      "the two must disagree on '[]' or the notice can never fire",
    ).toBeNull();
  });

  test("having published nothing yet is not silence", () => {
    expect(isEmptyActivityPayload(undefined)).toBe(false);
    expect(isEmptyActivityPayload("")).toBe(false);
  });

  test("a payload with steps is not silence", () => {
    const populated = JSON.stringify([{ type: "read", label: "index.ts" }]);
    expect(isEmptyActivityPayload(populated)).toBe(false);
    expect(parseActivitySteps(populated)).toHaveLength(1);
  });

  /**
   * The legacy plain-text format and any malformed write must read as "no
   * payload", never as silence — misreading them turns every legacy turn into
   * a false alarm.
   */
  test("unparseable and non-array payloads are not silence", () => {
    expect(isEmptyActivityPayload("Working on it")).toBe(false);
    expect(isEmptyActivityPayload("{}")).toBe(false);
    expect(isEmptyActivityPayload("[")).toBe(false);
    expect(isEmptyActivityPayload("null")).toBe(false);
  });
});

describe("the streaming placeholder admits when it is receiving nothing", () => {
  test("the notice is gated on an empty payload AND elapsed time", () => {
    expect(source).toContain("isEmptyActivityPayload");
    expect(
      source.match(
        /isEmptyActivityPayload\(activity\)\s*&&\s*elapsed\s*>=\s*SILENT_STREAM_NOTICE_AFTER_SECONDS/,
      ),
      "an ungated notice fires on the empty writes that open every healthy turn",
    ).not.toBeNull();
  });

  /**
   * The one number that decides whether this helps or cries wolf. Too short and
   * every turn's opening empty writes are reported as a dead stream; too long
   * and the reader is back to staring at "Working..." with no explanation.
   */
  test("the grace period is long enough to be quiet and short enough to be useful", () => {
    const grace = source.match(
      /SILENT_STREAM_NOTICE_AFTER_SECONDS\s*=\s*(\d+)/,
    );
    expect(grace, "the grace period must stay a named constant").not.toBeNull();
    const seconds = Number(grace?.[1]);
    expect(seconds).toBeGreaterThanOrEqual(30);
    expect(seconds).toBeLessThanOrEqual(300);
  });

  test("a silent stream gets a different label from an ordinary one", () => {
    expect(source).toContain("no activity reported");
    expect(
      source.match(/streamIsSilent\s*\?[\s\S]{0,80}:\s*thinkingLabel/),
      "the notice must replace the placeholder label, not sit beside it",
    ).not.toBeNull();
  });

  /**
   * The elapsed hook must be read before the simple-view early return, or the
   * hook order changes with the setting and React throws mid-turn.
   */
  test("elapsed is read unconditionally", () => {
    const elapsedAt = source.indexOf("const elapsed = useElapsedSeconds(");
    const earlyReturnAt = source.indexOf("if (simpleView) {");
    expect(elapsedAt).toBeGreaterThan(-1);
    expect(earlyReturnAt).toBeGreaterThan(-1);
    expect(elapsedAt).toBeLessThan(earlyReturnAt);
  });
});
