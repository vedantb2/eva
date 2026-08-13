import { expect, test } from "vitest";
import { codexParseLine } from "../providers/codex.js";
import { normalizeAppServerNotification } from "../providers/codexAppServerDaemon.js";

test("normalizes App Server item notifications into the existing Codex stream", () => {
  expect(
    normalizeAppServerNotification({
      method: "item/started",
      params: {
        item: { id: "item-1", type: "commandExecution", command: "git status" },
      },
    }),
  ).toEqual({
    type: "item.started",
    item: { id: "item-1", type: "commandExecution", command: "git status" },
  });
  expect(
    normalizeAppServerNotification({
      method: "item/agentMessage/delta",
      params: { delta: "Hello" },
    }),
  ).toEqual({ type: "item.agent_message.delta", delta: "Hello" });
});

test("parses App Server camel-case agent messages and streaming deltas", () => {
  expect(
    codexParseLine({
      type: "item.started",
      item: { id: "item-2", type: "agentMessage", text: "" },
    }),
  ).toEqual([{ kind: "mark_message_start" }]);
  expect(
    codexParseLine({ type: "item.agent_message.delta", delta: "Hello" }),
  ).toEqual([{ kind: "stream_text_delta", text: "Hello" }]);
  expect(
    codexParseLine({
      type: "item.completed",
      item: { id: "item-2", type: "agentMessage", text: "Done" },
    }),
  ).toEqual([{ kind: "append_text", text: "Done" }]);
});

test("maps App Server command and collaboration items to progress steps", () => {
  expect(
    codexParseLine({
      type: "item.started",
      item: { id: "cmd-1", type: "commandExecution", command: "pnpm test" },
    }),
  ).toMatchObject([
    {
      kind: "push_step",
      trackingId: "cmd-1",
      step: { type: "bash", command: "pnpm test" },
    },
  ]);
  expect(
    codexParseLine({
      type: "item.started",
      item: { id: "agent-1", type: "collabToolCall", name: "reviewer" },
    }),
  ).toMatchObject([
    {
      kind: "push_step",
      trackingId: "agent-1",
      step: { type: "subtask" },
    },
  ]);
});
