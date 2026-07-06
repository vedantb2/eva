import assert from "node:assert/strict";
import { test } from "node:test";
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
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, "push_step");
  if (events[0].kind === "push_step") {
    assert.equal(events[0].step.type, "read");
  }
});

test("applyCanonicalEvents sets pending question", () => {
  resetStateForTests();
  const changed = applyCanonicalEvents([
    { kind: "set_pending_question", data: '{"questions":[]}' },
  ]);
  assert.equal(changed, true);
  assert.equal(getPendingQuestionForTest(), '{"questions":[]}');
});

test("parseToCanonical cursor assistant text appends", () => {
  const events = parseToCanonical(
    {
      type: "assistant",
      message: { content: [{ type: "text", text: "hello" }] },
    },
    "cursor",
  );
  assert.ok(events.some((e) => e.kind === "append_text"));
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
  assert.equal(S.inFlightToolUses, 1);
  applyCanonicalEvents([{ kind: "complete_tool", trackingId: "toolu_abc" }]);
  assert.equal(S.inFlightToolUses, 0);
  resetStateForTests();
});

test("append_text updates streamed content without adding activity steps", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "Hello" }]);
  applyCanonicalEvents([{ kind: "append_text", text: " world" }]);
  assert.equal(S.accumulatedSteps.length, 0);
  assert.equal(S.currentStreamedContent, "Hello world");
  resetStateForTests();
});

test("append_text replaces streamed content on cumulative snapshots", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "Hello" }]);
  applyCanonicalEvents([{ kind: "append_text", text: "Hello world" }]);
  assert.equal(S.accumulatedSteps.length, 0);
  assert.equal(S.currentStreamedContent, "Hello world");
  resetStateForTests();
});

test("update_reasoning records a durable reasoning step and merges deltas", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "update_reasoning", text: "pondering" }]);
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].type, "reasoning");
  assert.equal(S.accumulatedSteps[0].detail, "pondering");
  // A cumulative snapshot merges into the same step rather than adding a new one.
  applyCanonicalEvents([{ kind: "update_reasoning", text: "pondering more" }]);
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].detail, "pondering more");
  assert.equal(S.lastStepType, "thinking");
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
  assert.equal(S.accumulatedSteps.length, 0);
  assert.equal(S.lastStepType, "thinking");
  resetStateForTests();
});

test("parsePriorStepForTest ignores transient activity rows", () => {
  assert.equal(
    parsePriorStepForTest({
      type: "thinking",
      label: "Preparing Codex session...",
      status: "active",
    }),
    null,
  );
  assert.equal(
    parsePriorStepForTest({
      type: "response",
      label: "Streaming response...",
      status: "active",
    }),
    null,
  );
});

test("parsePriorStepForTest preserves reasoning rows", () => {
  const restored = parsePriorStepForTest({
    type: "reasoning",
    label: "Thought process",
    detail: "prior thinking",
    status: "active",
  });
  assert.notEqual(restored, null);
  assert.equal(restored?.type, "reasoning");
  assert.equal(restored?.detail, "prior thinking");
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
  assert.equal(started.length, 0);
  const completed = parseToCanonical(
    {
      type: "item.completed",
      item: { id: "item_0", type: "reasoning", text: "**Exploring repo**" },
    },
    "codex",
  );
  assert.equal(completed.length, 1);
  assert.deepEqual(completed[0], {
    kind: "update_reasoning",
    text: "**Exploring repo**",
  });
});

test("parseToCanonical opencode reasoning part routes to update_reasoning", () => {
  const events = parseToCanonical(
    { type: "reasoning", part: { text: "weighing options" } },
    "opencode",
  );
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
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
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    kind: "update_reasoning",
    text: "hmm let me see",
  });
});
