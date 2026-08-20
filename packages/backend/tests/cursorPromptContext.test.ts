import { describe, expect, test } from "vitest";
import { buildEditPrompt } from "../convex/_sessions/prompts";
import { sessionNeedsConversationHandoff } from "../convex/_sessions/workflow";

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

test("a prompt built without history carries no handoff block", () => {
  expect(prompt([])).not.toContain("Recent Eva conversation");
});

/**
 * Which sessions the handoff above is gathered for. Getting this wrong is
 * invisible: the prompt is still well-formed without the block, so a Cursor
 * session simply forgets the conversation and reads as a bad agent rather than
 * a missing branch. `provider` was only stamped from the provider lock onward,
 * so gating on it alone excluded every session that predates it — which is
 * every long-running one, the case the handoff exists for.
 */
describe("sessionNeedsConversationHandoff", () => {
  test("a Cursor session with no stamped provider is recognised by its model", () => {
    expect(
      sessionNeedsConversationHandoff({ lastModel: "cursor:composer-2" }),
    ).toBe(true);
    expect(
      sessionNeedsConversationHandoff({ lastModel: "cursor:grok-4.6" }),
    ).toBe(true);
  });

  test("the stamped provider is used when present", () => {
    expect(sessionNeedsConversationHandoff({ provider: "cursor" })).toBe(true);
    expect(sessionNeedsConversationHandoff({ provider: "claude" })).toBe(false);
  });

  /** Providers that keep their own history must not pay for the extra read. */
  test("non-Cursor sessions are excluded either way", () => {
    expect(sessionNeedsConversationHandoff({ lastModel: "claude:opus" })).toBe(
      false,
    );
    expect(
      sessionNeedsConversationHandoff({ lastModel: "codex:gpt-5.5" }),
    ).toBe(false);
    expect(
      sessionNeedsConversationHandoff({
        provider: "codex",
        lastModel: "codex:gpt-5.5",
      }),
    ).toBe(false);
  });

  /** A session with neither field recorded must not throw on the fallback. */
  test("a session with nothing recorded gets no handoff", () => {
    expect(sessionNeedsConversationHandoff({})).toBe(false);
  });
});
