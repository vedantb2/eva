import { describe, expect, test } from "vitest";
import { usesChatDaemon } from "../convex/_chat/daemonTransport";

describe("usesChatDaemon", () => {
  test("keeps Claude on its warm daemon", () => {
    expect(usesChatDaemon("claude:sonnet", undefined)).toBe(true);
  });

  test("routes Cursor only when the entity explicitly owns ACP", () => {
    expect(usesChatDaemon("cursor:composer-2.5", "acp-v1")).toBe(true);
    expect(usesChatDaemon("cursor:composer-2.5", undefined)).toBe(false);
    expect(usesChatDaemon("cursor:composer-2.5", "stream-json")).toBe(false);
  });

  test("keeps remaining providers one-shot", () => {
    expect(usesChatDaemon("codex:gpt-5.5", "acp-v1")).toBe(false);
    expect(usesChatDaemon("opencode:openai/gpt-5.4", "acp-v1")).toBe(false);
  });
});
