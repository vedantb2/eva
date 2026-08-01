import { expect, test } from "vitest";
import { z } from "zod";
import { CursorAcpEventAdapter } from "../providers/cursorAcpEvents.js";
import { cursorAcpResultEvent } from "../providers/cursorAcpResult.js";
import {
  autoApproveCursorPermission,
  cursorGeneratedImageToCanonical,
  cursorTaskToCanonical,
  cursorTodosToCanonical,
} from "../providers/cursorAcpInteractions.js";

test("Cursor ACP ignores load replay and foreign-session updates", () => {
  const adapter = new CursorAcpEventAdapter();
  adapter.setSession("session-current");
  adapter.beginReplay();
  adapter.beginTurn();
  expect(
    adapter.handle({
      sessionId: "session-current",
      update: {
        sessionUpdate: "agent_message_chunk",
        messageId: "old-message",
        content: { type: "text", text: "old reply" },
      },
    }),
  ).toEqual([]);
  expect(adapter.getReplayNotificationCount()).toBe(1);
  expect(
    adapter.record([{ kind: "update_reasoning", text: "replayed extension" }]),
  ).toEqual([]);
  adapter.endReplay();
  expect(
    adapter.handle({
      sessionId: "session-other",
      update: {
        sessionUpdate: "agent_message_chunk",
        messageId: "wrong-session",
        content: { type: "text", text: "wrong reply" },
      },
    }),
  ).toEqual([]);
  expect(adapter.getFinalText()).toBe("");
});

test("Cursor ACP retains usage updates without emitting chat events", () => {
  const adapter = new CursorAcpEventAdapter();
  adapter.setSession("session-current");
  adapter.beginReplay();
  expect(
    adapter.handle({
      sessionId: "session-current",
      update: {
        sessionUpdate: "usage_update",
        used: 800,
        size: 200_000,
        cost: { amount: 0.25, currency: "USD" },
      },
    }),
  ).toEqual([]);
  adapter.endReplay();
  expect(adapter.getContextUsage()).toEqual({
    sessionUpdate: "usage_update",
    used: 800,
    size: 200_000,
    cost: { amount: 0.25, currency: "USD" },
  });
});

test("Cursor ACP accepts initial usage before session creation resolves", () => {
  const adapter = new CursorAcpEventAdapter();
  expect(
    adapter.handle({
      sessionId: "session-new",
      update: {
        sessionUpdate: "usage_update",
        used: 100,
        size: 200_000,
      },
    }),
  ).toEqual([]);
  adapter.setSession("session-new");
  expect(adapter.getContextUsage()).toEqual({
    sessionUpdate: "usage_update",
    used: 100,
    size: 200_000,
  });
});

test("Cursor ACP result events preserve token and context accounting", () => {
  const resultEvent = cursorAcpResultEvent({
    transport: "acp-v1",
    sessionId: "session-current",
    stopReason: "end_turn",
    result: "done",
    events: [],
    durationMs: 500,
    usage: {
      totalTokens: 1550,
      inputTokens: 1000,
      outputTokens: 200,
      thoughtTokens: 50,
      cachedReadTokens: 250,
      cachedWriteTokens: 50,
    },
    contextUsage: {
      sessionUpdate: "usage_update",
      used: 800,
      size: 200_000,
      cost: { amount: 0.25, currency: "USD" },
    },
    promptSubmitted: true,
    cancellationAcknowledged: false,
    childExitCode: 0,
    childSignal: null,
    stderrTail: "",
  });
  const raw = z
    .object({
      provider: z.string(),
      usage: z.object({
        input_tokens: z.number(),
        output_tokens: z.number(),
        cache_read_input_tokens: z.number(),
        cache_creation_input_tokens: z.number(),
      }),
      context_used_tokens: z.number(),
      context_window_size: z.number(),
      total_cost_usd: z.number(),
    })
    .parse(JSON.parse(resultEvent.rawResultEvent));

  expect(raw.provider).toBe("cursor");
  expect(raw.usage).toEqual({
    input_tokens: 1000,
    output_tokens: 250,
    cache_read_input_tokens: 250,
    cache_creation_input_tokens: 50,
  });
  expect(raw.context_used_tokens).toBe(800);
  expect(raw.context_window_size).toBe(200_000);
  expect(raw.total_cost_usd).toBe(0.25);
});

test("Cursor ACP assembles current agent messages without thought leakage", () => {
  const adapter = new CursorAcpEventAdapter();
  adapter.setSession("session-current");
  adapter.beginTurn();
  const first = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "agent_message_chunk",
      messageId: "message-1",
      content: { type: "text", text: "Current" },
    },
  });
  const thought = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "agent_thought_chunk",
      messageId: "thought-1",
      content: { type: "text", text: "private reasoning" },
    },
  });
  const second = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "agent_message_chunk",
      messageId: "message-2",
      content: { type: "text", text: "answer" },
    },
  });
  expect(first[0]).toEqual({ kind: "mark_message_start" });
  expect(thought).toEqual([
    { kind: "update_reasoning", text: "private reasoning" },
  ]);
  expect(second[0]).toEqual({ kind: "mark_message_start" });
  expect(adapter.getFinalText()).toBe("Current\n\nanswer");
});

test("Cursor ACP tool completion is correlated and idempotent", () => {
  const adapter = new CursorAcpEventAdapter();
  adapter.setSession("session-current");
  adapter.beginTurn();
  const started = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "tool_call",
      toolCallId: "tool-1",
      title: "Read config",
      kind: "read",
      status: "in_progress",
      locations: [{ path: "/tmp/repo/config.ts" }],
    },
  });
  const completed = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "tool_call_update",
      toolCallId: "tool-1",
      status: "completed",
      content: [
        {
          type: "content",
          content: { type: "text", text: "done" },
        },
      ],
    },
  });
  const duplicate = adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "tool_call_update",
      toolCallId: "tool-1",
      status: "completed",
    },
  });
  expect(started[0]?.kind).toBe("push_step");
  expect(completed).toEqual([
    {
      kind: "complete_tool",
      trackingId: "tool-1",
      result: { output: { text: "done" } },
    },
  ]);
  expect(duplicate).toEqual([]);
});

test("Cursor task extension completes an existing ACP tool without duplicating it", () => {
  const adapter = new CursorAcpEventAdapter();
  adapter.setSession("session-current");
  adapter.beginTurn();
  adapter.handle({
    sessionId: "session-current",
    update: {
      sessionUpdate: "tool_call",
      toolCallId: "task-1",
      title: "Explore auth",
      kind: "other",
      status: "in_progress",
    },
  });
  const events = adapter.recordToolCompletion(
    cursorTaskToCanonical({
      toolCallId: "task-1",
      description: "Explore auth",
      prompt: "Find auth",
      subagentType: "explore",
    }),
    "task-1",
  );
  expect(events).toEqual([
    {
      kind: "complete_tool",
      trackingId: "task-1",
      result: undefined,
    },
  ]);
});

test("Cursor ACP auto-approval chooses semantic allow options", () => {
  const response = autoApproveCursorPermission({
    sessionId: "session-current",
    toolCall: { toolCallId: "tool-1" },
    options: [
      { optionId: "deny", name: "Deny", kind: "reject_once" },
      { optionId: "once", name: "Allow", kind: "allow_once" },
      { optionId: "always", name: "Always", kind: "allow_always" },
    ],
  });
  expect(response).toEqual({
    outcome: { outcome: "selected", optionId: "always" },
  });
});

test("Cursor extensions map todos, subagents, and generated images", () => {
  expect(
    cursorTodosToCanonical([
      { id: "1", content: "Inspect", status: "completed" },
      { id: "2", content: "Implement", status: "in_progress" },
    ]),
  ).toEqual([
    {
      kind: "set_todos",
      todos: [
        { content: "Inspect", status: "completed" },
        { content: "Implement", status: "in_progress" },
      ],
    },
  ]);
  expect(
    cursorTaskToCanonical({
      toolCallId: "task-1",
      description: "Explore auth",
      prompt: "Find auth",
      subagentType: "explore",
      model: "cursor-model",
      durationMs: 50,
    })[0],
  ).toMatchObject({
    kind: "push_step",
    trackingId: "task-1",
    step: { type: "subtask", toolUseId: "task-1" },
  });
  expect(
    cursorGeneratedImageToCanonical({
      toolCallId: "image-1",
      description: "Create icon",
      filePath: "/tmp/repo/icon.png",
    })[1],
  ).toEqual({
    kind: "complete_tool",
    trackingId: "image-1",
    result: { files: ["/tmp/repo/icon.png"] },
  });
});
