import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  CURSOR_MAX_RESUME_INPUT_TOKENS,
  CURSOR_MAX_RESUME_TURNS,
  readCursorResumeStats,
  shouldRotateCursorSession,
} from "../session/cursorResumePolicy.js";

function writeRuns(lines: string[]): string {
  const storeDir = mkdtempSync(join(tmpdir(), "cursor-resume-"));
  mkdirSync(storeDir, { recursive: true });
  writeFileSync(join(storeDir, "runs.ndjson"), lines.join("\n"), "utf8");
  return storeDir;
}

test("reads the newest run for only the persisted Cursor agent", () => {
  const storeDir = writeRuns([
    '{"agentId":"agent-target","turnNumber":4,"usage":{"inputTokens":1200}}',
    '{"agentId":"agent-other","turnNumber":99,"usage":{"inputTokens":999999}}',
    '{"agentId":"agent-target","turnNumber":7,"usage":{"inputTokens":42000}}',
  ]);

  expect(readCursorResumeStats(storeDir, "agent-target")).toEqual({
    turnNumber: 7,
    inputTokens: 42_000,
  });
});

test("rotates a long-lived agent before another context replay", () => {
  expect(
    shouldRotateCursorSession({
      turnNumber: CURSOR_MAX_RESUME_TURNS,
      inputTokens: 1,
    }),
  ).toBe(true);
  expect(
    shouldRotateCursorSession({
      turnNumber: 1,
      inputTokens: CURSOR_MAX_RESUME_INPUT_TOKENS,
    }),
  ).toBe(true);
});

test("keeps a bounded agent and tolerates a missing store", () => {
  expect(
    shouldRotateCursorSession({
      turnNumber: CURSOR_MAX_RESUME_TURNS - 1,
      inputTokens: CURSOR_MAX_RESUME_INPUT_TOKENS - 1,
    }),
  ).toBe(false);
  expect(readCursorResumeStats("/path/that/does/not/exist", "agent-x")).toBe(
    null,
  );
  expect(shouldRotateCursorSession(null)).toBe(false);
});
