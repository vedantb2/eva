import { expect, test } from "vitest";
import { buildEditPrompt } from "../convex/_sessions/prompts";

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

test("a rotated Cursor agent receives a bounded recent conversation handoff", () => {
  const history = Array.from({ length: 8 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message-${index}`,
  }));
  const result = prompt(history);

  expect(result).toContain("Recent Eva conversation (compact handoff");
  expect(result).not.toContain("message-0");
  expect(result).not.toContain("message-1");
  expect(result).toContain("User: message-6");
  expect(result).toContain("Assistant: message-7");
});

test("each handoff entry is capped", () => {
  const result = prompt([{ role: "assistant", content: "x".repeat(3_000) }]);
  expect(result).toContain("x".repeat(2_000));
  expect(result).not.toContain("x".repeat(2_001));
});
