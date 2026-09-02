import { expect, test } from "vitest";
import {
  buildEditPrompt,
  buildSessionHandoff,
} from "../convex/_sessions/prompts";

function prompt(history: Array<{ role: string; content: string }>): string {
  return buildEditPrompt(
    { owner: "vvedantb", name: "eva", baseBranch: "main" },
    "eva/session-1",
    "",
    "continue",
    "",
    "",
    undefined,
    undefined,
    history,
  );
}

function history(
  count: number,
  contentFor: (index: number) => string,
): Array<{ role: string; content: string }> {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: contentFor(index),
  }));
}

test("the handoff carries every user instruction, not just the last turns", () => {
  const result = prompt(history(20, (index) => `message-${index}`));

  expect(result).toContain("Prior instructions from this session (handoff");
  // Every user message survives, including the very first one.
  for (let index = 0; index < 20; index += 2) {
    expect(result).toContain(`User: message-${index}`);
  }
});

test("only the last three assistant messages are kept", () => {
  const block = buildSessionHandoff(history(20, (index) => `message-${index}`));
  const assistants = block
    .split("\n\n")
    .filter((line) => line.startsWith("Assistant: "));

  expect(assistants).toEqual([
    "Assistant: message-15",
    "Assistant: message-17",
    "Assistant: message-19",
  ]);
});

test("entries stay in chronological order", () => {
  const block = buildSessionHandoff([
    { role: "user", content: "first" },
    { role: "assistant", content: "second" },
    { role: "user", content: "third" },
  ]);

  expect(block).toBe("User: first\n\nAssistant: second\n\nUser: third");
});

test("each entry is capped at 1,500 characters", () => {
  const block = buildSessionHandoff([
    { role: "assistant", content: "x".repeat(3_000) },
  ]);

  expect(block).toContain("x".repeat(1_500));
  expect(block).not.toContain("x".repeat(1_501));
});

test("an empty history renders no handoff block", () => {
  expect(buildSessionHandoff([])).toBe("");
  expect(
    buildSessionHandoff([
      { role: "user", content: "   " },
      { role: "assistant", content: "" },
    ]),
  ).toBe("");
  expect(prompt([])).not.toContain("Prior instructions from this session");
});

test("over budget, assistant entries are dropped before any user message", () => {
  // 30 user + 30 assistant entries of ~1,000 chars is far over the 24,000 budget.
  const block = buildSessionHandoff(
    history(60, (index) => `m${index}-${"y".repeat(1_000)}`),
  );

  expect(block).not.toContain("Assistant: ");
  expect(block).toContain("User: m0-");
});

test("over budget, the middle user messages are elided and both ends kept", () => {
  const block = buildSessionHandoff(
    Array.from({ length: 40 }, (_, index) => ({
      role: "user",
      content: `m${index}-${"z".repeat(1_000)}`,
    })),
  );

  expect(block.length).toBeLessThanOrEqual(24_000);
  expect(block).toContain("User: m0-");
  expect(block).toContain("User: m39-");
  expect(block).toMatch(/\[\.\.\. \d+ earlier messages elided \.\.\.\]/);
  // Elision happens in the middle, so the marker sits between the ends.
  const markerIndex = block.search(/\[\.\.\. \d+ earlier/);
  expect(markerIndex).toBeGreaterThan(block.indexOf("User: m0-"));
  expect(markerIndex).toBeLessThan(block.indexOf("User: m39-"));
  expect(block).not.toContain("User: m20-");
});
