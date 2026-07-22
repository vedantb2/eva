import { afterEach, describe, expect, test, vi } from "vitest";

const originalMode = process.env.CLAUDE_ATTEMPT_MODE;

afterEach(() => {
  if (originalMode === undefined) {
    delete process.env.CLAUDE_ATTEMPT_MODE;
  } else {
    process.env.CLAUDE_ATTEMPT_MODE = originalMode;
  }
  vi.resetModules();
});

describe("buildCanUseTool Agent/Task background policy", () => {
  test("sdk-daemon allows run_in_background for Agent", async () => {
    process.env.CLAUDE_ATTEMPT_MODE = "sdk-daemon";
    vi.resetModules();
    const { buildCanUseTool } = await import("../runtime/pendingQuestion.js");
    const canUseTool = buildCanUseTool();
    const result = await canUseTool(
      "Agent",
      { run_in_background: true },
      { toolUseID: "toolu_test", signal: new AbortController().signal },
    );
    expect(result.behavior).toBe("allow");
    if (result.behavior === "allow") {
      expect(result.updatedInput.run_in_background).toBe(true);
    }
  });

  test("sdk mode coerces Agent to foreground", async () => {
    process.env.CLAUDE_ATTEMPT_MODE = "sdk";
    vi.resetModules();
    const { buildCanUseTool } = await import("../runtime/pendingQuestion.js");
    const canUseTool = buildCanUseTool();
    const result = await canUseTool(
      "Task",
      { run_in_background: true },
      { toolUseID: "toolu_test", signal: new AbortController().signal },
    );
    expect(result.behavior).toBe("allow");
    if (result.behavior === "allow") {
      expect(result.updatedInput.run_in_background).toBe(false);
    }
  });
});
