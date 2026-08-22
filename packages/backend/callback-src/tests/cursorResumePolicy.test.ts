import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  CURSOR_MAX_RESUME_CONTEXT_TOKENS,
  readCursorResumeStats,
  shouldRotateCursorSession,
} from "../session/cursorResumePolicy.js";

type UsageFixture = { inputTokens: number; cacheReadTokens: number };

function makeStore(): string {
  const storeDir = mkdtempSync(join(tmpdir(), "cursor-resume-"));
  mkdirSync(storeDir, { recursive: true });
  return storeDir;
}

/** One `run_events.ndjson` line, matching JsonlLocalAgentStore's real envelope. */
function usageEvent(
  agentId: string,
  runId: string,
  seq: number,
  usage: UsageFixture,
): string {
  return JSON.stringify({
    runId,
    seq,
    offset: String(seq),
    eventType: "run_stream_event",
    payload: {
      schemaVersion: 1,
      type: "sdk_message",
      agentId,
      runId,
      message: {
        type: "usage",
        agent_id: agentId,
        run_id: runId,
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: 900,
          cacheReadTokens: usage.cacheReadTokens,
          cacheWriteTokens: 400,
          totalTokens: usage.inputTokens + usage.cacheReadTokens + 900 + 400,
        },
      },
    },
    payloadRef: null,
    idempotencyKey: null,
    createdAt: new Date(1_700_000_000_000 + seq).toISOString(),
  });
}

/** A non-usage stream event (assistant text) for the same run. */
function textEvent(agentId: string, runId: string, seq: number): string {
  return JSON.stringify({
    runId,
    seq,
    offset: String(seq),
    eventType: "run_stream_event",
    payload: {
      schemaVersion: 1,
      type: "sdk_message",
      agentId,
      runId,
      message: {
        type: "assistant",
        agent_id: agentId,
        run_id: runId,
        message: { role: "assistant", content: [{ type: "text", text: "ok" }] },
      },
    },
    payloadRef: null,
    idempotencyKey: null,
    createdAt: new Date(1_700_000_000_000 + seq).toISOString(),
  });
}

function writeEvents(lines: string[]): string {
  const storeDir = makeStore();
  writeFileSync(
    join(storeDir, "run_events.ndjson"),
    lines.join("\n") + "\n",
    "utf8",
  );
  return storeDir;
}

test("measures the newest run's LAST request, ignoring other agents and runs", () => {
  const storeDir = writeEvents([
    usageEvent("agent-target", "run-old", 1, {
      inputTokens: 190_000,
      cacheReadTokens: 40_000,
    }),
    usageEvent("agent-other", "run-noise", 1, {
      inputTokens: 900_000,
      cacheReadTokens: 900_000,
    }),
    usageEvent("agent-target", "run-new", 1, {
      inputTokens: 4_000,
      cacheReadTokens: 1_000,
    }),
    usageEvent("agent-target", "run-new", 2, {
      inputTokens: 7_000,
      cacheReadTokens: 21_000,
    }),
    textEvent("agent-target", "run-new", 3),
  ]);

  expect(readCursorResumeStats(storeDir, "agent-target")).toEqual({
    runId: "run-new",
    contextTokens: 28_000,
  });
});

test("does not rotate when the run's SUMMED usage is huge but the live context is small", () => {
  // The regression this policy fixes: the SDK stores run usage as the sum of
  // every model request in the turn, so runs.ndjson reports millions of "input
  // tokens" while each individual request only ever sees ~30k of context.
  const storeDir = writeEvents([
    usageEvent("agent-target", "run-new", 1, {
      inputTokens: 12_000,
      cacheReadTokens: 8_000,
    }),
    usageEvent("agent-target", "run-new", 2, {
      inputTokens: 15_000,
      cacheReadTokens: 60_000,
    }),
    usageEvent("agent-target", "run-new", 3, {
      inputTokens: 9_000,
      cacheReadTokens: 21_000,
    }),
  ]);
  writeFileSync(
    join(storeDir, "runs.ndjson"),
    JSON.stringify({
      runId: "run-new",
      agentId: "agent-target",
      turnNumber: 40,
      status: "FINISHED",
      usage: {
        inputTokens: 3_600_000,
        outputTokens: 40_000,
        cacheReadTokens: 2_100_000,
        cacheWriteTokens: 90_000,
        totalTokens: 5_830_000,
      },
    }) + "\n",
    "utf8",
  );

  const stats = readCursorResumeStats(storeDir, "agent-target");
  expect(stats).toEqual({ runId: "run-new", contextTokens: 30_000 });
  expect(shouldRotateCursorSession(stats)).toBe(false);
});

test("rotates once the live context reaches the window guard", () => {
  const storeDir = writeEvents([
    usageEvent("agent-target", "run-new", 1, {
      inputTokens: 20_000,
      cacheReadTokens: 10_000,
    }),
    usageEvent("agent-target", "run-new", 2, {
      inputTokens: 30_000,
      cacheReadTokens: CURSOR_MAX_RESUME_CONTEXT_TOKENS - 30_000,
    }),
  ]);

  const stats = readCursorResumeStats(storeDir, "agent-target");
  expect(stats?.contextTokens).toBe(CURSOR_MAX_RESUME_CONTEXT_TOKENS);
  expect(shouldRotateCursorSession(stats)).toBe(true);
  expect(
    shouldRotateCursorSession({
      runId: "run-new",
      contextTokens: CURSOR_MAX_RESUME_CONTEXT_TOKENS - 1,
    }),
  ).toBe(false);
});

test("treats unreadable events as unknown and keeps the saved agent", () => {
  const storeDir = writeEvents([
    "{not json at all",
    '{"runId":"run-new","payload":{"agentId":"agent-target"}}',
  ]);

  expect(readCursorResumeStats(storeDir, "agent-target")).toBe(null);
  expect(shouldRotateCursorSession(null)).toBe(false);
});

test("treats a newest run without usage as unknown, not as a reason to rotate", () => {
  const storeDir = writeEvents([
    usageEvent("agent-target", "run-old", 1, {
      inputTokens: 200_000,
      cacheReadTokens: 50_000,
    }),
    textEvent("agent-target", "run-new", 1),
  ]);

  expect(readCursorResumeStats(storeDir, "agent-target")).toBe(null);
});

// The ids are read from the envelope, the payload and the message in both
// casings on purpose: if an SDK rename made every lookup miss, the policy would
// report "unknown" for a real 200k context and quietly resume it forever.
test("finds the run when the SDK only reports snake_case ids on the message", () => {
  const storeDir = writeEvents([
    JSON.stringify({
      seq: 1,
      eventType: "run_stream_event",
      payload: {
        schemaVersion: 1,
        type: "sdk_message",
        message: {
          type: "usage",
          agent_id: "agent-target",
          run_id: "run-new",
          usage: { inputTokens: 40_000, cacheReadTokens: 130_000 },
        },
      },
    }),
  ]);

  const stats = readCursorResumeStats(storeDir, "agent-target");
  expect(stats).toEqual({ runId: "run-new", contextTokens: 170_000 });
  expect(shouldRotateCursorSession(stats)).toBe(true);
});

// `cacheReadTokens` is the bulk of a resumed context. Dropping it would read a
// nearly full window as a few thousand tokens and never rotate.
test("counts cached context and tolerates an absent cache field", () => {
  const withoutCache = writeEvents([
    JSON.stringify({
      runId: "run-new",
      seq: 1,
      payload: {
        agentId: "agent-target",
        message: { type: "usage", usage: { inputTokens: 5_000 } },
      },
    }),
  ]);
  expect(readCursorResumeStats(withoutCache, "agent-target")).toEqual({
    runId: "run-new",
    contextTokens: 5_000,
  });

  const withoutInput = writeEvents([
    JSON.stringify({
      runId: "run-new",
      seq: 1,
      payload: {
        agentId: "agent-target",
        message: { type: "usage", usage: { cacheReadTokens: 200_000 } },
      },
    }),
  ]);
  // No `inputTokens` means the request never reported its context: unknown, and
  // unknown resumes rather than throwing the agent's memory away.
  expect(readCursorResumeStats(withoutInput, "agent-target")).toBe(null);
});

test("tolerates a missing store", () => {
  expect(readCursorResumeStats("/path/that/does/not/exist", "agent-x")).toBe(
    null,
  );
  expect(readCursorResumeStats(makeStore(), "agent-x")).toBe(null);
});
