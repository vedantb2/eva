import { afterEach, describe, expect, test, vi } from "vitest";
import { cursorParseLine } from "../providers/cursor.js";
import type { JsonObject } from "../types.js";

/**
 * `log` writes through console.error; the file write beside it is best-effort
 * and irrelevant here.
 */
function captureLogs(): { lines: string[] } {
  const captured: { lines: string[] } = { lines: [] };
  vi.spyOn(console, "error").mockImplementation((...args: string[]) => {
    captured.lines.push(args.join(" "));
  });
  return captured;
}

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Cursor's runner synthesizes its final answer from `run.wait()`, not from the
 * stream — so a parser that recognises none of the SDK's event shapes still
 * returns a correct reply, having reported no activity at all. That is what a
 * grok-4.6 turn looked like in prod on 2026-08-19: seven minutes of
 * "Working...", every activity write the literal "[]", and nothing anywhere
 * saying the events had been dropped.
 */
describe("cursorParseLine reports events it cannot turn into activity", () => {
  test("recognised events still produce canonical events", () => {
    // The dedupe wrapper sits in front of the whole parser body; a mistake there
    // silences every Cursor turn's activity feed at once.
    expect(cursorParseLine({ type: "system" })).toEqual([
      {
        kind: "update_thinking",
        label: "Starting Cursor agent...",
        detail: "Cursor agent initializing...",
      },
    ]);
    expect(
      cursorParseLine({
        type: "assistant",
        message: { content: [{ type: "text", text: "hello" }] },
      }),
    ).toEqual([{ kind: "stream_text_delta", text: "hello" }]);
    expect(cursorParseLine({ type: "thinking", text: "considering" })).toEqual([
      { kind: "update_reasoning", text: "considering" },
    ]);
    expect(cursorParseLine({ type: "result" })).toEqual([
      { kind: "mark_last_complete" },
    ]);
  });

  test("an event shape the parser does not know leaves evidence", () => {
    const logs = captureLogs();
    expect(cursorParseLine({ type: "renamed_by_the_sdk" })).toEqual([]);
    expect(logs.lines.join("\n")).toContain("renamed_by_the_sdk");
    expect(logs.lines).toHaveLength(1);
  });

  /**
   * The stream carries one event per token, so reporting per event would bury
   * the finding in its own noise. One line per type is the whole point.
   */
  test("each unknown type is reported once, not once per event", () => {
    const logs = captureLogs();
    for (let index = 0; index < 50; index += 1) {
      cursorParseLine({ type: "chatty_unknown_type", index });
    }
    expect(logs.lines).toHaveLength(1);
  });

  test("an event with no type at all is still reported", () => {
    const logs = captureLogs();
    expect(cursorParseLine({ message: "no type field" })).toEqual([]);
    expect(logs.lines).toHaveLength(1);
  });

  /**
   * These carry nothing the activity feed wants and always have. Reporting them
   * would fire on every healthy turn, which trains the reader to ignore the
   * line that matters.
   */
  test("event types that are meant to be silent stay silent", () => {
    const logs = captureLogs();
    const expectedSilent: JsonObject[] = [
      { type: "user" },
      { type: "status" },
      { type: "request" },
      { type: "task" },
      { type: "usage" },
    ];
    for (const event of expectedSilent) {
      expect(cursorParseLine(event)).toEqual([]);
    }
    expect(logs.lines).toEqual([]);
  });
});
