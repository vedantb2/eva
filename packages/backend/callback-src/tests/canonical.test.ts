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

test("Cursor assistant deltas concatenate without paragraph breaks", () => {
  resetStateForTests();
  for (const text of ["Wid", "ening", " the", " Sent to column."]) {
    applyCanonicalEvents(
      parseToCanonical(
        {
          type: "assistant",
          message: { content: [{ type: "text", text }] },
        },
        "cursor",
      ),
    );
  }
  expect(S.currentStreamedContent).toBe("Widening the Sent to column.");
  resetStateForTests();
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
        toolUseId: "toolu_abc",
        status: "active",
      },
    },
  ]);
  expect(S.inFlightToolUses).toBe(1);
  applyCanonicalEvents([{ kind: "complete_tool", trackingId: "toolu_abc" }]);
  expect(S.inFlightToolUses).toBe(0);
  resetStateForTests();
});

test("complete_tool merges result onto matching step", () => {
  resetStateForTests();
  applyCanonicalEvents([
    {
      kind: "push_step",
      trackingId: "toolu_out",
      step: {
        type: "bash",
        label: "Running command...",
        toolUseId: "toolu_out",
        command: "pwd",
        status: "active",
      },
    },
  ]);
  applyCanonicalEvents([
    {
      kind: "complete_tool",
      trackingId: "toolu_out",
      result: {
        output: { text: "/tmp/repo", exitCode: 0 },
        isError: false,
      },
    },
  ]);
  expect(S.accumulatedSteps[0]?.output?.text).toBe("/tmp/repo");
  expect(S.accumulatedSteps[0]?.output?.exitCode).toBe(0);
  expect(S.accumulatedSteps[0]?.status).toBe("complete");
  expect(typeof S.accumulatedSteps[0]?.durationMs).toBe("number");
  resetStateForTests();
});

test("codex item.started sets toolUseId for id-matched completion", () => {
  resetStateForTests();
  const events = parseToCanonical(
    {
      type: "item.started",
      item: {
        id: "item_xyz",
        type: "command_execution",
        command: "echo hi",
      },
    },
    "codex",
  );
  applyCanonicalEvents(events);
  expect(S.accumulatedSteps[0]?.toolUseId).toBe("item_xyz");
  applyCanonicalEvents(
    parseToCanonical(
      {
        type: "item.completed",
        item: {
          id: "item_xyz",
          type: "command_execution",
          aggregated_output: "hi\n",
          exit_code: 0,
        },
      },
      "codex",
    ),
  );
  expect(S.accumulatedSteps[0]?.status).toBe("complete");
  expect(S.accumulatedSteps[0]?.output?.text).toContain("hi");
  resetStateForTests();
});

test("append_text keeps distinct blocks separated and adds no activity steps", () => {
  resetStateForTests();
  // Each append_text is a whole (non-streamed) assistant text block, so distinct
  // blocks are separated by a paragraph break and never create activity steps.
  applyCanonicalEvents([{ kind: "append_text", text: "First reply." }]);
  applyCanonicalEvents([{ kind: "append_text", text: "Second reply." }]);
  expect(S.accumulatedSteps.length).toBe(0);
  expect(S.currentStreamedContent).toBe("First reply.\n\nSecond reply.");
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

test("parseToCanonical cursor thinking event routes to update_reasoning", () => {
  resetStateForTests();
  const events = parseToCanonical(
    { type: "thinking", text: "hmm let me see" },
    "cursor",
  );
  expect(events.length).toBe(1);
  expect(events[0]).toEqual({
    kind: "update_reasoning",
    text: "hmm let me see",
  });
});

// Regression tests for the interleaved-thinking paragraph-break fix. With
// interleaved thinking the model streams text → thinking → text inside one
// message; consecutive text blocks used to clump ("design.Design settled.").
// A paragraph break must land between distinct blocks/messages, but never
// between deltas of the same block nor as a leading break on an empty buffer.

test("interleaved thinking inserts a paragraph break between text blocks in one message", () => {
  resetStateForTests();
  applyCanonicalEvents([
    { kind: "mark_message_start" },
    { kind: "mark_text_block_start" },
    { kind: "stream_text_delta", text: "First para." },
    { kind: "update_reasoning", text: "pondering" },
    { kind: "mark_text_block_start" },
    { kind: "stream_text_delta", text: "Second para." },
  ]);
  expect(S.currentStreamedContent).toBe("First para.\n\nSecond para.");
  resetStateForTests();
});

test("deltas within one text block are not separated by a paragraph break", () => {
  resetStateForTests();
  applyCanonicalEvents([
    { kind: "mark_message_start" },
    { kind: "stream_text_delta", text: "Hello" },
    { kind: "stream_text_delta", text: " world" },
  ]);
  expect(S.currentStreamedContent).toBe("Hello world");
  resetStateForTests();
});

test("a new assistant message inserts a paragraph break before its first text", () => {
  resetStateForTests();
  applyCanonicalEvents([
    { kind: "mark_message_start" },
    { kind: "stream_text_delta", text: "Wrapping up the design." },
    { kind: "mark_message_start" },
    { kind: "stream_text_delta", text: "Design settled." },
  ]);
  expect(S.currentStreamedContent).toBe(
    "Wrapping up the design.\n\nDesign settled.",
  );
  resetStateForTests();
});

test("no leading paragraph break when the streamed buffer is empty", () => {
  resetStateForTests();
  applyCanonicalEvents([
    { kind: "mark_message_start" },
    { kind: "mark_text_block_start" },
    { kind: "stream_text_delta", text: "First line" },
  ]);
  expect(S.currentStreamedContent).toBe("First line");
  resetStateForTests();
});

test("an existing newline boundary is not doubled into a paragraph break", () => {
  resetStateForTests();
  // Trailing newline on the buffer: no extra break added.
  applyCanonicalEvents([{ kind: "append_text", text: "Line one\n" }]);
  applyCanonicalEvents([{ kind: "append_text", text: "Line two" }]);
  expect(S.currentStreamedContent).toBe("Line one\nLine two");
  // Leading newline on the next block: no extra break added.
  resetStateForTests();
  applyCanonicalEvents([{ kind: "append_text", text: "Line one" }]);
  applyCanonicalEvents([{ kind: "append_text", text: "\nLine two" }]);
  expect(S.currentStreamedContent).toBe("Line one\nLine two");
  resetStateForTests();
});
