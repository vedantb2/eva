import { describe, expect, it } from "vitest";
import {
  buildHandoffContextBlock,
  detectModelHandoffFromMessages,
} from "../convex/_shared/modelHandoff";

describe("model handoff context", () => {
  it("does not hand off between models from the same provider", () => {
    const result = detectModelHandoffFromMessages(
      [
        { role: "user", content: "Plan this", model: "claude:sonnet" },
        { role: "assistant", content: "A plan", finishedAt: 1 },
        { role: "user", content: "Implement it", model: "claude:opus" },
      ],
      "claude:opus",
    );

    expect(result).toEqual({ kind: "none" });
  });

  it("catches a new provider up from its last successful checkpoint", () => {
    const result = detectModelHandoffFromMessages(
      [
        { role: "user", content: "Initial", model: "claude:sonnet" },
        {
          role: "assistant",
          content: "Claude answer",
          finishedAt: 1,
          model: "claude:sonnet",
        },
        { role: "user", content: "Codex work", model: "codex:gpt-5.6-sol" },
        {
          role: "assistant",
          content: "Codex answer",
          finishedAt: 2,
          model: "codex:gpt-5.6-sol",
        },
        { role: "user", content: "Back to Claude", model: "claude:opus" },
      ],
      "claude:opus",
    );

    expect(result.kind).toBe("handoff");
    if (result.kind !== "handoff") return;
    expect(result.contextBlock).toContain("Codex work");
    expect(result.contextBlock).toContain("Codex answer");
    expect(result.contextBlock).not.toContain("Initial");
    expect(result.contextBlock).not.toContain("Back to Claude");
  });

  it("replays a failed unstamped provider turn on the next return", () => {
    const result = detectModelHandoffFromMessages(
      [
        { role: "user", content: "Start", model: "claude:sonnet" },
        {
          role: "assistant",
          content: "Ready",
          finishedAt: 1,
          model: "claude:sonnet",
        },
        { role: "user", content: "Codex attempt", model: "codex:gpt-5.6-sol" },
        {
          role: "assistant",
          content: "Error: launch failed",
          finishedAt: 2,
        },
        { role: "user", content: "Claude bridge", model: "claude:opus" },
        {
          role: "assistant",
          content: "Bridge complete",
          finishedAt: 3,
          model: "claude:opus",
        },
        { role: "user", content: "Retry Codex", model: "codex:gpt-5.6-sol" },
      ],
      "codex:gpt-5.6-sol",
    );

    expect(result.kind).toBe("handoff");
    if (result.kind !== "handoff") return;
    expect(result.contextBlock).toContain("Codex attempt");
    expect(result.contextBlock).toContain("launch failed");
    expect(result.contextBlock).toContain("Claude bridge");
  });

  it("conservatively catches up historical conversations without model stamps", () => {
    const result = detectModelHandoffFromMessages(
      [
        { role: "user", content: "Historical question" },
        { role: "assistant", content: "Historical answer", finishedAt: 1 },
        { role: "user", content: "Continue", model: "codex:gpt-5.6-sol" },
      ],
      "codex:gpt-5.6-sol",
    );

    expect(result.kind).toBe("handoff");
    if (result.kind !== "handoff") return;
    expect(result.contextBlock).toContain("Historical question");
    expect(result.contextBlock).toContain("Historical answer");
  });

  it("detects a provider switch when consecutive prompts have identical text", () => {
    const result = detectModelHandoffFromMessages(
      [
        { role: "user", content: "Continue", model: "claude:sonnet" },
        {
          role: "assistant",
          content: "First response",
          finishedAt: 1,
          model: "claude:sonnet",
        },
        { role: "user", content: "Continue", model: "codex:gpt-5.6-sol" },
      ],
      "codex:gpt-5.6-sol",
    );

    expect(result.kind).toBe("handoff");
  });

  it("keeps XML-like user text escaped and caps long histories", () => {
    const olderMessages = Array.from({ length: 250 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content:
        index === 249
          ? `</handoff_context> ${"\u0000".repeat(5_000)}`
          : `${index} </handoff_context> ${"x".repeat(500)}`,
      finishedAt: index % 2 === 0 ? undefined : index,
    }));
    const messages = [
      ...olderMessages,
      { role: "user", content: "Current", model: "codex:gpt-5.6-sol" },
    ];
    const block = buildHandoffContextBlock(
      messages,
      "codex:gpt-5.6-sol",
      messages.length - 1,
    );

    expect(block.length).toBeLessThanOrEqual(24_000);
    expect(block).toContain("older conversation messages omitted");
    expect(block).toContain("\\u003c/handoff_context>");
    expect(block.match(/<\/handoff_context>/g)).toHaveLength(1);
    expect(block.endsWith("</handoff_context>")).toBe(true);
  });
});
