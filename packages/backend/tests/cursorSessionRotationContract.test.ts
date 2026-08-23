import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const cursorSurfaces: [string, string][] = [
  ["callback source", read("callback-src/session/cursorSession.ts")],
  ["deployed bundle", read("convex/_sandbox_runtime/callbackScript.generated.ts")],
];
const workflow = read("convex/_sessions/workflow.ts");

describe("oversized Cursor history cannot be resumed", () => {
  test.each(cursorSurfaces)(
    "rotation wins before the resume branch (%s)",
    (_label, source) => {
      const policyAt = source.indexOf("shouldRotateCursorSession(resumeStats)");
      const freshAt = source.indexOf(
        'return { mode: "none", sessionId: null }',
        policyAt,
      );
      const resumeAt = source.indexOf(
        'return { mode: "resume", sessionId: persistedState.resumeSessionId }',
        policyAt,
      );

      expect(
        policyAt,
        "the rotation policy is no longer consulted",
      ).toBeGreaterThan(-1);
      expect(freshAt, "rotation no longer starts a fresh agent").toBeGreaterThan(
        policyAt,
      );
      expect(resumeAt, "the normal resume branch moved").toBeGreaterThan(freshAt);
    },
  );
});

describe("a rotated Cursor session receives the prior conversation", () => {
  test("the workflow derives Cursor handoff from current and legacy providers", () => {
    const handoffAt = workflow.indexOf("usesCursorConversationHandoff({");
    const handoff = workflow.slice(handoffAt, workflow.indexOf("});", handoffAt));

    expect(handoffAt, "the Cursor handoff decision moved").toBeGreaterThan(-1);
    expect(handoff).toContain("provider: session.provider");
    expect(handoff).toContain("lastModel: session.lastModel");
  });

  test("the selected history is passed into prompt construction", () => {
    const historyAt = workflow.indexOf("const priorCursorHistory =");
    const promptAt = workflow.indexOf("buildEditPrompt(", historyAt);
    const prompt = workflow.slice(promptAt, workflow.indexOf("\n    );", promptAt));

    expect(
      historyAt,
      "the prior conversation is no longer selected",
    ).toBeGreaterThan(-1);
    expect(
      promptAt,
      "prompt construction moved before history selection",
    ).toBeGreaterThan(historyAt);
    expect(prompt).toContain("priorCursorHistory");
  });
});

function read(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
