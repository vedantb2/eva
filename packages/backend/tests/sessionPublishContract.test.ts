import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

const sessionWorkflow = readSource("_sessions/workflow.ts");
const sandboxExecution = readSource("_sandbox_runtime/execution.ts");

const PUSH_ACTION = "internal.sandbox.pushSandboxBranch";

/**
 * Eva owns publishing: the agent commits inside the sandbox and is told not to
 * push. Gating the push on a dirty tree therefore skipped it on every
 * *successful* run — a proper commit leaves the tree clean — so the work stayed
 * in the sandbox and never reached GitHub (fix c7df1ff2, again in 0fdcf11d).
 */
describe("a successful turn always publishes", () => {
  test("no workflow gates a push on a dirty tree", () => {
    const gated = convexFiles().filter((path) => {
      const source = readSource(path);
      return (
        source.includes(PUSH_ACTION) && source.includes("status --porcelain")
      );
    });
    expect(gated, "a clean tree is the normal success case").toEqual([]);
  });

  test("the session push is conditioned only on mode, success and branch", () => {
    const condition = sessionWorkflow.slice(
      sessionWorkflow.lastIndexOf("if (", sessionWorkflow.indexOf(PUSH_ACTION)),
      sessionWorkflow.indexOf(PUSH_ACTION),
    );
    expect(condition).toContain("result.success");
    expect(condition).toContain("data.branchName");
    expect(condition).not.toContain("porcelain");
    expect(condition).not.toContain("isDirty");
  });
});

/**
 * The push action used to swallow its own errors, which made every caller's
 * catch block dead code and reported failed pushes as successes (fix c7df1ff2).
 */
describe("push failures reach their callers", () => {
  test("pushSandboxBranch rethrows", () => {
    const body = definitionBody(sandboxExecution, "pushSandboxBranch");
    const catchAt = body.indexOf("} catch (error) {");
    expect(catchAt, "the push error handler moved").toBeGreaterThan(-1);
    expect(body.indexOf("throw error;", catchAt)).toBeGreaterThan(catchAt);
  });

  /** A rethrow with an unguarded call site kills the whole workflow step. */
  test("every call site handles the throw", () => {
    const sites: string[] = [];
    const unguarded: string[] = [];
    for (const path of convexFiles()) {
      const source = readSource(path);
      let at = source.indexOf(PUSH_ACTION);
      while (at > -1) {
        sites.push(`${path}:${at}`);
        const tryAt = source.lastIndexOf("try {", at);
        const catchAt = source.indexOf("} catch", at);
        if (tryAt < 0 || catchAt < 0) unguarded.push(`${path}:${at}`);
        at = source.indexOf(PUSH_ACTION, at + 1);
      }
    }
    // A scan that found nothing would satisfy the assertion below for free.
    expect(
      sites.length,
      "the push action moved or was renamed",
    ).toBeGreaterThan(5);
    expect(
      unguarded,
      "wrap the push so a failure surfaces as an alert",
    ).toEqual([]);
  });
});

/**
 * A push can hang for minutes. Saving the reply first is what stops the chat
 * sitting on "Working…" after the daemon has already finished (fix 27bef8e0).
 */
describe("the reply is saved before the push", () => {
  test("saveResult runs first", () => {
    const saveAt = sessionWorkflow.indexOf(
      "internal.sessionWorkflow.saveResult",
    );
    expect(saveAt, "saveResult moved or was renamed").toBeGreaterThan(-1);
    expect(saveAt).toBeLessThan(sessionWorkflow.indexOf(PUSH_ACTION));
  });

  /**
   * The publish failure is then patched onto the saved reply, which only works
   * because saveResult recognises the prefix the workflow produces. A typo in
   * either literal silently replaces the agent's answer with "Error: …".
   */
  test("saveResult recognises the publish-failure message it is sent", () => {
    const marker = sessionWorkflow.match(
      /args\.error\.startsWith\(\s*"([^"]+)"/,
    );
    expect(marker, "the publish-failure guard moved").not.toBeNull();
    const prefix = marker?.[1] ?? "";
    expect(prefix.length).toBeGreaterThan(0);
    const thrown = sessionWorkflow.match(/const publishError = `([^${]+)/);
    expect(thrown, "the publish-failure message moved").not.toBeNull();
    expect(thrown?.[1] ?? "").toContain(prefix);
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(convexDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

function convexFiles(): string[] {
  return readdirSync(convexDir, { recursive: true })
    .map((entry) => String(entry).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts"))
    .filter((path) => !path.includes("_generated"));
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
