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

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
