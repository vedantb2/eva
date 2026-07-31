import { expect, test } from "vitest";
import { CursorAcpEventAdapter } from "../providers/cursorAcpEvents.js";
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
