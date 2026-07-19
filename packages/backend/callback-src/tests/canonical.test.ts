import { test, expect } from "vitest";
import { parseToCanonical, applyCanonicalEvents } from "../parse/canonical.js";
import {
  callbackState as S,
  getPendingQuestionForTest,
  parsePriorStepForTest,
  resetStateForTests,
} from "../runtime/state.js";

test("parseToCanonical maps Claude tool_use to push_step", () => {
  resetStateForTests();
  const events = parseToCanonical(
    {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Read",
            input: { file_path: "/tmp/repo/src/index.ts" },
          },
        ],
      },
    },
    "claude",
  );
  expect(events.length).toBe(1);
  expect(events[0].kind).toBe("push_step");
  if (events[0].kind === "push_step") {
    expect(events[0].step.type).toBe("read");
  }
});

test("applyCanonicalEvents sets pending question", () => {
  resetStateForTests();
  const changed = applyCanonicalEvents([
    { kind: "set_pending_question", data: '{"questions":[]}' },
  ]);
  expect(changed).toBe(true);
  expect(getPendingQuestionForTest()).toBe('{"questions":[]}');
});

test("parseToCanonical cursor assistant text appends", () => {
  const events = parseToCanonical(
    {
      type: "assistant",
      message: { content: [{ type: "text", text: "hello" }] },
    },
    "cursor",
  );
  expect(events.some((e) => e.kind === "append_text")).toBeTruthy();
});

test("tool_result clears in-flight tool by tool_use_id", () => {
  resetStateForTests();
  applyCanonicalEvents([
    {
      kind: "push_step",
      trackingId: "toolu_abc",
      step: {
        type: "bash",
        label: "Running command...",
        status: "active",
      },
    },
  ]);
  expect(S.inFlightToolUses).toBe(1);
  applyCanonicalEvents([{ kind: "complete_tool", trackingId: "toolu_abc" }]);
  expect(S.inFlightToolUses).toBe(0);
  resetStateForTests();
});

test("append_text updates streamed content without adding activity steps", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "Hello" }]);
  applyCanonicalEvents([{ kind: "append_text", text: " world" }]);
  expect(S.accumulatedSteps.length).toBe(0);
  expect(S.currentStreamedContent).toBe("Hello world");
  resetStateForTests();
});

test("append_text replaces streamed content on cumulative snapshots", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "Hello" }]);
  applyCanonicalEvents([{ kind: "append_text", text: "Hello world" }]);
  expect(S.accumulatedSteps.length).toBe(0);
  expect(S.currentStreamedContent).toBe("Hello world");
  resetStateForTests();
});

test("update_reasoning is transient and does not add activity steps", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "update_reasoning", text: "pondering" }]);
  expect(S.accumulatedSteps.length).toBe(0);
  expect(S.lastStepType).toBe("thinking");
  resetStateForTests();
});

test("thinking push_step is transient and does not add activity steps", () => {
  resetStateForTests();
  applyCanonicalEvents([
    {
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Finalizing response...",
        status: "active",
      },
    },
  ]);
  expect(S.accumulatedSteps.length).toBe(0);
  expect(S.lastStepType).toBe("thinking");
  resetStateForTests();
});

test("parsePriorStepForTest ignores transient activity rows", () => {
  expect(
    parsePriorStepForTest({
      type: "thinking",
      label: "Preparing Codex session...",
      status: "active",
    }),
  ).toBe(null);
  expect(
    parsePriorStepForTest({
      type: "reasoning",
      label: "Thinking...",
      status: "active",
    }),
  ).toBe(null);
  expect(
    parsePriorStepForTest({
      type: "response",
      label: "Streaming response...",
      status: "active",
    }),
  ).toBe(null);
});

test("parseToCanonical codex reasoning item routes to update_reasoning", () => {
  resetStateForTests();
  const started = parseToCanonical(
    {
      type: "item.started",
      item: { id: "item_0", type: "reasoning" },
    },
    "codex",
  );
  expect(started.length).toBe(0);
  const completed = parseToCanonical(
    {
      type: "item.completed",
      item: { id: "item_0", type: "reasoning", text: "**Exploring repo**" },
    },
    "codex",
  );
  expect(completed.length).toBe(1);
  expect(completed[0]).toEqual({
    kind: "update_reasoning",
    text: "**Exploring repo**",
  });
});

test("parseToCanonical opencode reasoning part routes to update_reasoning", () => {
  const events = parseToCanonical(
    { type: "reasoning", part: { text: "weighing options" } },
    "opencode",
  );
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    kind: "update_reasoning",
    text: "weighing options",
  });
});

test("parseToCanonical cursor thinking block routes to update_reasoning", () => {
  resetStateForTests();
  const events = parseToCanonical(
    {
      type: "assistant",
      message: { content: [{ type: "thinking", thinking: "hmm let me see" }] },
    },
    "cursor",
  );
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    kind: "update_reasoning",
    text: "hmm let me see",
  });
});
