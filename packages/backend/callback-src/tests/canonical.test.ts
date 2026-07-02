import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseToCanonical,
  applyCanonicalEvents,
  updateResponseStep,
  updateReasoningStep,
} from "../parse/canonical.js";
import {
  callbackState as S,
  getPendingQuestionForTest,
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

test("updateResponseStep appends deltas to the active response step", () => {
  resetStateForTests();
  updateResponseStep("Hello");
  updateResponseStep(" world");
  assert.equal(S.accumulatedSteps.length, 1);
  const step = S.accumulatedSteps[0];
  assert.equal(step.type, "response");
  assert.equal(step.status, "active");
  assert.equal(step.detail, "Hello world");
  resetStateForTests();
});

test("updateResponseStep replaces detail on cumulative snapshots", () => {
  resetStateForTests();
  updateResponseStep("Hello");
  updateResponseStep("Hello world");
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].detail, "Hello world");
  resetStateForTests();
});

test("updateResponseStep starts a new step after the prior one completed", () => {
  resetStateForTests();
  updateResponseStep("First turn");
  applyCanonicalEvents([{ kind: "mark_last_complete" }]);
  updateResponseStep("Second turn");
  assert.equal(S.accumulatedSteps.length, 2);
  assert.equal(S.accumulatedSteps[0].status, "complete");
  assert.equal(S.accumulatedSteps[1].status, "active");
  assert.equal(S.accumulatedSteps[1].detail, "Second turn");
  resetStateForTests();
});

test("updateReasoningStep merges into an active reasoning step", () => {
  resetStateForTests();
  updateReasoningStep("Thinking about ");
  updateReasoningStep("Thinking about the plan");
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].type, "reasoning");
  assert.equal(S.accumulatedSteps[0].detail, "Thinking about the plan");
  assert.equal(S.lastStepType, "thinking");
  resetStateForTests();
});

test("applyCanonicalEvents update_reasoning routes to a reasoning step", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "update_reasoning", text: "pondering" }]);
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].type, "reasoning");
  assert.equal(S.accumulatedSteps[0].detail, "pondering");
  resetStateForTests();
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

test("applyCanonicalEvents append_text routes to a response step", () => {
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "hi there" }]);
  assert.equal(S.accumulatedSteps.length, 1);
  assert.equal(S.accumulatedSteps[0].type, "response");
  assert.equal(S.accumulatedSteps[0].detail, "hi there");
  assert.equal(S.currentStreamedContent, "hi there");
  resetStateForTests();
});
