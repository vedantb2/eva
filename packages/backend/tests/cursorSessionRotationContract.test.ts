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

describe("a saved Cursor agent is always resumed", () => {
  test.each(cursorSurfaces)(
    "context size never forces a fresh agent (%s)",
    (_label, source) => {
      expect(source).not.toContain("shouldRotateCursorSession");
      expect(source).not.toContain("rotating saved Cursor agent");
      expect(source).toContain(
        'return { mode: "resume", sessionId: persistedState.resumeSessionId }',
      );
    },
  );
});

describe("session prompts do not dump a Cursor conversation handoff", () => {
  test("the workflow no longer selects prior Cursor history", () => {
    expect(workflow).not.toContain("usesCursorConversationHandoff");
    expect(workflow).not.toContain("priorCursorHistory");
    expect(workflow).not.toContain("./cursorContext");
  });
});

function read(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
