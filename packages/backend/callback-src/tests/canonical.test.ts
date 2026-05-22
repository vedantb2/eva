import assert from "node:assert/strict";
import { test } from "node:test";
import { parseToCanonical, applyCanonicalEvents } from "../parse/canonical.js";
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
