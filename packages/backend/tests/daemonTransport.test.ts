import { describe, expect, test } from "vitest";
import { usesChatDaemon } from "../convex/_chat/daemonTransport";

describe("usesChatDaemon", () => {
  test("keeps Claude on its warm daemon", () => {
    expect(usesChatDaemon("claude:sonnet", undefined)).toBe(true);
  });

  test("routes every Cursor entity through its ACP daemon", () => {
    expect(usesChatDaemon("cursor:composer-2.5", "acp-v1")).toBe(true);
    expect(usesChatDaemon("cursor:composer-2.5", undefined)).toBe(true);
    expect(usesChatDaemon("cursor:composer-2.5", "stream-json")).toBe(true);
  });

  test("keeps remaining providers one-shot", () => {
    expect(usesChatDaemon("codex:gpt-5.5", "acp-v1")).toBe(false);
    expect(usesChatDaemon("opencode:openai/gpt-5.4", "acp-v1")).toBe(false);
  });
});
