import { describe, expect, test } from "vitest";
import { findStreamingTargetMessage } from "./chatBodyUtils";

type TestMessage = {
  role: "user" | "assistant";
  content: string;
  isSystemAlert?: boolean;
  finishedAt?: number;
  label: string;
};

const user = (label: string, content = "hello"): TestMessage => ({
  role: "user",
  content,
  label,
});
const placeholder = (label: string): TestMessage => ({
  role: "assistant",
  content: "",
  label,
});
const finished = (label: string, content = "done"): TestMessage => ({
  role: "assistant",
  content,
  finishedAt: 1,
  label,
});
const alert = (label: string): TestMessage => ({
  role: "assistant",
  content: "Sandbox stopped",
  isSystemAlert: true,
  label,
});

describe("findStreamingTargetMessage", () => {
  test("no unfinished placeholder → undefined", () => {
    expect(
      findStreamingTargetMessage([user("u1"), finished("a1")]),
    ).toBeUndefined();
  });

  test("single placeholder is the target", () => {
    const messages = [user("u1"), placeholder("a1")];
    expect(findStreamingTargetMessage(messages)?.label).toBe("a1");
  });

  test("a queued turn's newer placeholder does not steal a still-streaming older turn", () => {
    // The session-62 incident: a synthetic loop-continuation bubble was still
    // streaming when a queued user message inserted its own placeholder.
    const messages = [
      user("u1"),
      finished("loop-turn"),
      placeholder("synthetic-continuation"),
      user("u2"),
      placeholder("queued-turn"),
    ];
    expect(findStreamingTargetMessage(messages)?.label).toBe(
      "synthetic-continuation",
    );
  });

  test("the newer placeholder takes over once the older turn finalises", () => {
    const messages = [
      user("u1"),
      finished("loop-turn"),
      finished("synthetic-continuation"),
      user("u2"),
      placeholder("queued-turn"),
    ];
    expect(findStreamingTargetMessage(messages)?.label).toBe("queued-turn");
  });

  test("system alerts never match, even between placeholders", () => {
    const messages = [
      user("u1"),
      alert("stopped"),
      alert("reconnected"),
      placeholder("a1"),
    ];
    expect(findStreamingTargetMessage(messages)?.label).toBe("a1");
  });

  test("an unfinished bubble with streamed-in content is not a placeholder", () => {
    const messages = [
      user("u1"),
      { role: "assistant" as const, content: "partial", label: "partial" },
      placeholder("a1"),
    ];
    expect(findStreamingTargetMessage(messages)?.label).toBe("a1");
  });
});
