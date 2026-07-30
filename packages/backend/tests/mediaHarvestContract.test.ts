import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const sessionPrompts = readSource("convex/_sessions/prompts.ts");
const completion = readSource("callback-src/runtime/completion.ts");
const bundledScript = readSource(
  "convex/_sandbox_runtime/callbackScript.generated.ts",
);
const taskChatPrompt = readSource("convex/_agentTasks/chatPrompt.ts");
const projectChatPrompt = readSource("convex/_projects/chatPrompt.ts");

/**
 * The end-of-turn harvest posts EVERY file left in the deliverable folders to
 * the chat. A recordings request came back as 4 videos plus 33 working
 * screenshots because the prompt named the folder without stating that
 * contract, and the agent parked its per-step verification captures there.
 */
describe("media folders are a documented deliverable contract", () => {
  test("the session prompt states everything left there is posted", () => {
    expect(sessionPrompts).toContain("DELIVERABLE-ONLY");
    // Working captures need a named home outside the harvested folders, or
    // agents will keep using the deliverable ones.
    expect(sessionPrompts).toContain("/tmp/checks/");
    expect(sessionPrompts).toContain(
      "exactly what the user asked for and nothing else",
    );
  });

  test("task chat and project chat inherit the same deliverable contract", () => {
    // Both surfaces build their turn prompt through the session's
    // buildEditPrompt, so the DELIVERABLE-ONLY clause and the managed
    // dev-server section apply automatically — no separate copy to drift.
    expect(taskChatPrompt).toContain("buildEditPrompt(");
    expect(projectChatPrompt).toContain("buildEditPrompt(");
  });

  test("task chat and project chat forward their own dev port", () => {
    // buildEditPrompt renders "its configured dev port" when devPort is
    // undefined — a quiet regression if either surface stopped threading it.
    const taskBody = functionBody(
      taskChatPrompt,
      "export function buildAgentTaskChatPrompt(",
    );
    expect(taskBody).toContain("args.devPort,");
    const projectBody = functionBody(
      projectChatPrompt,
      "export function buildProjectChatPrompt(",
    );
    expect(projectBody).toContain("args.devPort,");
  });
});

/**
 * Agents also re-capture the same frame (retry loops, double screenshots), so
 * the harvest skips byte-identical files within a turn.
 */
describe("the harvest deduplicates identical captures", () => {
  test.each([
    ["callback source", completion],
    ["deployed bundle", bundledScript],
  ])("byte-identical files upload once (%s)", (_label, source) => {
    const at = source.indexOf("async function uploadAndAttachSandboxMedia(");
    expect(at, "the harvest moved").toBeGreaterThan(-1);
    const body = source.slice(at, source.indexOf("\n}", at));
    expect(body).toContain("sha256");
    // The digest gate must run before the upload.
    const gateAt = body.indexOf("isDuplicate");
    const uploadAt = body.indexOf("uploadMediaFile(");
    expect(gateAt, "the dedupe gate moved").toBeGreaterThan(-1);
    expect(uploadAt, "the upload moved").toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(uploadAt);
  });
});

function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

/** One top-level function, ending on the `\n}` that closes it at column 0. */
function functionBody(source: string, header: string): string {
  const startAt = source.indexOf(header);
  expect(startAt, `${header} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n}", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
