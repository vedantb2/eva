import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

const sandboxSource = readSource("_sessions/sandbox.ts");
const stopRecoverySource = readSource("_sandbox/stopRecovery.ts");
const startupSource = readSource("_sandbox_runtime/sessions.ts");

/**
 * Convex does not auto-retry actions. A "Transient error while executing action"
 * on `finalizeStopSandbox` therefore left the session on `"stopping"` forever,
 * with no button that could recover it (fix 37cdeb0b). The fix pairs every stop
 * with a delayed re-issue, so the invariant is about *pairing*, not about either
 * schedule on its own.
 */
describe("every session stop schedules its own recovery", () => {
  const scheduler = functionBody(
    sandboxSource,
    "export async function scheduleFinalizeStop(",
  );

  test("issues the finalize immediately", () => {
    expect(scheduler).toContain(
      "internal._sessions.sandbox.finalizeStopSandbox",
    );
    expect(scheduler).toContain("await ctx.scheduler.runAfter(\n    0,");
  });

  test("issues a delayed recovery alongside it", () => {
    expect(scheduler).toContain(
      "internal._sessions.sandbox.recoverStuckStopping",
    );
    expect(scheduler).toContain("STUCK_STOPPING_RECOVER_MS");
  });

  /**
   * A zero delay would race the finalize it is meant to backstop. Sessions,
   * tasks and projects share one constant, so it is declared in `_sandbox`
   * rather than in any one of their modules.
   */
  test("waits before re-issuing", () => {
    const declaration = stopRecoverySource.match(
      /const STUCK_STOPPING_RECOVER_MS = ([\d_]+);/,
    );
    expect(
      declaration,
      "the recovery delay moved or was renamed",
    ).not.toBeNull();
    expect(Number(declaration?.[1].replaceAll("_", ""))).toBeGreaterThan(0);
  });

  /**
   * The gap this test was written for: idle auto-stop set `"stopping"` and
   * scheduled the finalize itself, so a transient wedged it with no recovery.
   */
  test("nothing schedules the finalize outside its own module", () => {
    const callers = convexFiles()
      .filter((path) => path !== "_sessions/sandbox.ts")
      .filter((path) =>
        readSource(path).includes(
          "internal._sessions.sandbox.finalizeStopSandbox",
        ),
      );
    expect(callers, "schedule stops via scheduleFinalizeStop instead").toEqual(
      [],
    );
  });

  /** Recovery has to be a no-op once the stop it backstops has landed. */
  test("recovery only fires while the session is still stopping", () => {
    const body = definitionBody(sandboxSource, "recoverStuckStopping");
    const guardAt = body.indexOf('session.status !== "stopping"');
    expect(guardAt, "the stopping guard moved or was renamed").toBeGreaterThan(
      -1,
    );
    expect(body.indexOf("return null;", guardAt)).toBeLessThan(
      body.indexOf("ctx.scheduler.runAfter("),
    );
  });
});

/**
 * Early-ready hands the user a live sandbox before startup has finished. A late
 * step failing after that point used to run the ordinary start-failure path,
 * which stops the VM and closes the session — deleting sandboxes out from under
 * users who were already mid-conversation (fix 2a0e08e5).
 */
describe("a startup failure after early-ready keeps the sandbox", () => {
  const warning = definitionBody(sandboxSource, "sandboxStartupWarning");

  test("records the failure as a message", () => {
    expect(warning).toContain('ctx.db.insert("messages"');
  });

  test.each([
    ["patch the session", "ctx.db.patch("],
    ["close the session", 'status: "closed"'],
    ["stop the sandbox", "stopSandbox"],
    ["mark processes exited", "markAllRunningExited"],
  ])("does not %s", (_label, call) => {
    expect(warning).not.toContain(call);
  });

  /** Its destructive sibling still exists — the two must not converge. */
  test("sandboxError still closes the session", () => {
    const body = definitionBody(sandboxSource, "sandboxError");
    expect(body).toContain('status: "closed"');
  });

  test("post-ready setup failures warn instead of tearing down", () => {
    const block = blockBody(startupSource, "if (earlyReadyEmitted) {");
    expect(block).toContain("internal.sessions.sandboxStartupWarning");
    expect(block).not.toContain("internal.sessions.sandboxError");
    expect(block).not.toContain("internal.sandbox.stopSandbox");
  });

  /**
   * The outer safety net: even a wholesale start failure must leave an already
   * active session alone, and must return before reaching the teardown below it.
   */
  test("an active session with a sandbox is left running", () => {
    const guardAt = startupSource.indexOf(
      'sessionAfter.status === "active" &&',
    );
    expect(guardAt, "the early-ready safety net moved").toBeGreaterThan(-1);
    const teardownAt = startupSource.indexOf(
      "internal.sandbox.stopSandbox",
      guardAt,
    );
    expect(teardownAt, "the no-early-ready teardown moved").toBeGreaterThan(
      guardAt,
    );
    const branch = startupSource.slice(guardAt, teardownAt);
    expect(branch).toContain("internal.sessions.sandboxStartupWarning");
    expect(branch).toContain("return null;");
  });
});

/**
 * Comments name the very calls these rules rule out, so they have to go first.
 * Newlines are normalised so multi-line assertions do not depend on checkout
 * line endings.
 */
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

/** Slices from a declaration to the next top-level one. */
function functionBody(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  expect(startAt, `${declaration} moved or was renamed`).toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nexport ", startAt + 1);
  return source.slice(startAt, nextAt < 0 ? undefined : nextAt);
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/**
 * One braced block, matched by counting braces from its opening line. Needed
 * because this block sits mid-function, so no `export`/`});` boundary applies.
 */
function blockBody(source: string, opener: string): string {
  const startAt = source.indexOf(opener);
  expect(startAt, `${opener} moved or was renamed`).toBeGreaterThan(-1);
  let depth = 0;
  for (let at = startAt + opener.length - 1; at < source.length; at += 1) {
    if (source[at] === "{") depth += 1;
    if (source[at] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(startAt, at + 1);
    }
  }
  throw new Error(`unterminated block at ${opener}`);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
