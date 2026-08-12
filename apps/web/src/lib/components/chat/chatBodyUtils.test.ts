import { describe, expect, it } from "vitest";
import { findHandoffBoundaryIds } from "./chatBodyUtils";

describe("findHandoffBoundaryIds", () => {
  it("marks provider changes but not model changes within a provider", () => {
    const boundaries = findHandoffBoundaryIds([
      {
        _id: "one",
        role: "user",
        content: "First",
        model: "claude:sonnet",
      },
      {
        _id: "reply-one",
        role: "assistant",
        content: "Reply",
        model: "claude:sonnet",
      },
      {
        _id: "two",
        role: "user",
        content: "Same provider",
        model: "claude:opus",
      },
      {
        _id: "three",
        role: "user",
        content: "New provider",
        model: "codex:gpt-5.6-sol",
      },
      {
        _id: "alert",
        role: "assistant",
        content: "Handed off",
        isSystemAlert: true,
      },
    ]);

    expect([...boundaries]).toEqual(["three"]);
  });

  it("marks the first stamped turn after historical unstamped context", () => {
    const boundaries = findHandoffBoundaryIds([
      { _id: "legacy", role: "user", content: "Old conversation" },
      {
        _id: "first-stamped",
        role: "user",
        content: "Continue",
        model: "cursor:grok-4.5",
      },
    ]);

    expect([...boundaries]).toEqual(["first-stamped"]);
  });
});
