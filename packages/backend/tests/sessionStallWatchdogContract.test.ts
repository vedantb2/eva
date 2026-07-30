import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const workflowWatchdog = readSource("convex/workflowWatchdog.ts");

/**
 * A session turn whose agent process dies silently (OOM) stops heartbeating
 * streamingActivity within seconds, but the chat used to sit on "Working…"
 * until the 2-hour handleStaleSession backstop. The heartbeat chain below
 * turns that into a clear failure within minutes. These rules pin its safety
 * properties, not its thresholds (see staleTurnDecision.test.ts for those).
 */
describe("session turns are watched for dead heartbeats", () => {
  test("every tracked session workflow arms the heartbeat chain", () => {
    const body = functionBody(
      workflowWatchdog,
      "export async function trackSessionWorkflow(",
    );
    expect(body).toContain("checkStaleSessionHeartbeat");
  });

  test("the check only ever acts on the workflow it was armed for", () => {
    const body = definitionBody(workflowWatchdog, "checkStaleSessionHeartbeat");
    const guardAt = body.indexOf(
      "session.activeWorkflowId !== args.workflowId",
    );
    const finalizeAt = body.indexOf("finalizeStaleSessionTurn(");
    expect(guardAt, "the workflow guard moved").toBeGreaterThan(-1);
    expect(finalizeAt, "the finalize call moved").toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(finalizeAt);
  });

  test("a stale turn is probed for liveness before it is killed", () => {
    const body = definitionBody(workflowWatchdog, "checkStaleSessionHeartbeat");
    const probeAt = body.indexOf("probeStaleSessionLiveness");
    const finalizeAt = body.indexOf("finalizeStaleSessionTurn(");
    expect(probeAt, "the liveness probe moved").toBeGreaterThan(-1);
    expect(probeAt).toBeLessThan(finalizeAt);

    const probe = definitionBody(workflowWatchdog, "probeStaleSessionLiveness");
    expect(probe).toContain("verifySandboxLiveness");
    // An alive probe must reset the clock, not kill.
    expect(probe).toContain("internalTouch");
  });

  test("the salvage reads the streaming row before the clear wipes it", () => {
    const body = functionBody(
      workflowWatchdog,
      "async function finalizeStaleSessionTurn(",
    );
    const readAt = body.indexOf('query("streamingActivity")');
    const clearAt = body.indexOf("cancelStaleWorkflow(");
    expect(readAt, "the streaming read moved").toBeGreaterThan(-1);
    expect(clearAt, "the workflow cancel moved").toBeGreaterThan(-1);
    expect(readAt).toBeLessThan(clearAt);
  });

  test("the kill frees the session, alerts the user and drains the queue", () => {
    const body = functionBody(
      workflowWatchdog,
      "async function finalizeStaleSessionTurn(",
    );
    expect(body).toContain("isSystemAlert: true");
    expect(body).toContain("activeWorkflowId: undefined");
    expect(body).toContain("startNextQueuedSessionMessage(");
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
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
