import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const sandboxExecution = readSource("convex/_sandbox_runtime/execution.ts");
const previewRecovery = readSource(
  "convex/_sandbox_runtime/previewRecovery.ts",
);
const previewProxy = readSource("convex/_sandbox_runtime/previewProxy.ts");

/**
 * Nothing watches the dev server or the navigation proxy after launch. An OOM
 * kill (observed in prod: the kernel killed next-server twice in one boot) or
 * a lazily-resumed VM leaves the app port dead while the sandbox runs; the
 * proxy is only ensured on a PASSING probe, so both stay down and the user
 * has to ask the agent to restart them. The readiness poll is the only thing
 * that notices — these rules pin the recovery path it now triggers.
 */
describe("a dead dev server recovers through the Console launcher", () => {
  test("the poll schedules recovery only on a claimed heal with a failed probe", () => {
    const body = definitionBody(sandboxExecution, "getPreviewUrl");
    const probeAt = body.indexOf("probePreviewReady(");
    const recoveryAt = body.indexOf("ensureSessionPreviewServices");
    expect(probeAt, "the readiness probe moved").toBeGreaterThan(-1);
    expect(recoveryAt, "the recovery schedule moved").toBeGreaterThan(-1);
    expect(probeAt).toBeLessThan(recoveryAt);

    const gate = body.slice(probeAt, recoveryAt);
    expect(gate).toContain("!ready");
    expect(gate).toContain("healClaimed");
  });

  test("the poll itself never launches the app", () => {
    // Lifecycle owns Console as the single launcher; recovery goes through a
    // scheduled action, never inline from the poll.
    const body = definitionBody(sandboxExecution, "getPreviewUrl");
    expect(body).not.toContain("launchPreviewDevServer");
    expect(body).not.toContain("launchDevServerInVercelConsole");
  });

  test("recovery relaunches via the Console launcher, guarded", () => {
    const body = definitionBody(
      previewRecovery,
      "ensureSessionPreviewServices",
    );
    const stateGuardAt = body.indexOf('handle.state !== "running"');
    const portGuardAt = body.indexOf("session.devPort !== args.expectedPort");
    const launchAt = body.indexOf("launchPreviewDevServer(");
    expect(stateGuardAt, "the non-running guard moved").toBeGreaterThan(-1);
    expect(portGuardAt, "the port guard moved").toBeGreaterThan(-1);
    expect(launchAt, "the launcher call moved").toBeGreaterThan(-1);
    // Never exec on a stopped sandbox, and never fight a secondary app tab's
    // own dev server.
    expect(stateGuardAt).toBeLessThan(launchAt);
    expect(portGuardAt).toBeLessThan(launchAt);
    // Console visibility: the relaunch uses the session PTY owner key.
    expect(body).toContain("`session-${session._id}`");
  });
});

/**
 * The proxy runs detached with no supervisor, so one uncaught throw killed it
 * and took the preview down until someone asked for a restart.
 */
describe("the preview proxy survives uncaught errors", () => {
  test("the generated script installs process-level handlers", () => {
    expect(previewProxy).toContain('process.on("uncaughtException"');
    expect(previewProxy).toContain('process.on("unhandledRejection"');
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
