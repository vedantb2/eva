import { describe, expect, test } from "vitest";
import { resolveClaudeBinFallback } from "../providers/claudeSdk.js";

/**
 * When `command -v claude` finds nothing on PATH, the SDK daemon must still
 * locate the CLI. launch.ts installs a fallback under a non-PATH /tmp prefix
 * and passes it via CLAUDE_BIN_PATH; regressing this leaves the daemon pointing
 * at a bare "claude" that is not on PATH, so every attempt fails to start
 * (fix 329e242). These lock the exact selection rule.
 */
describe("resolveClaudeBinFallback", () => {
  const exists = (path: string): boolean => path === "/tmp/eva/bin/claude";

  test("uses CLAUDE_BIN_PATH when it points at a real file", () => {
    expect(resolveClaudeBinFallback("/tmp/eva/bin/claude", exists)).toBe(
      "/tmp/eva/bin/claude",
    );
  });

  test("falls back to bare claude when the env path does not exist", () => {
    expect(resolveClaudeBinFallback("/tmp/eva/bin/missing", exists)).toBe(
      "claude",
    );
  });

  test("falls back to bare claude when CLAUDE_BIN_PATH is unset", () => {
    expect(resolveClaudeBinFallback(undefined, exists)).toBe("claude");
  });

  test('treats an empty CLAUDE_BIN_PATH as unset (never stats "")', () => {
    let statted = false;
    const spyExists = (path: string): boolean => {
      statted = true;
      return exists(path);
    };
    expect(resolveClaudeBinFallback("", spyExists)).toBe("claude");
    expect(statted).toBe(false);
  });
});
