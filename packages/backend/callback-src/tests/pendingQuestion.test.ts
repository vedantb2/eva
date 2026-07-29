import { afterEach, describe, expect, test, vi } from "vitest";

const originalClaim = process.env.CLAIM_MUTATION;

afterEach(() => {
  if (originalClaim === undefined) {
    delete process.env.CLAIM_MUTATION;
  } else {
    process.env.CLAIM_MUTATION = originalClaim;
  }
  vi.resetModules();
});

describe("buildCanUseTool Agent/Task background policy", () => {
  test("daemon (CLAIM_MUTATION set) allows run_in_background for Agent", async () => {
    process.env.CLAIM_MUTATION = "sessionWorkflow:claimPendingTurn";
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

  test("one-shot (no CLAIM_MUTATION) coerces Agent to foreground", async () => {
    delete process.env.CLAIM_MUTATION;
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
