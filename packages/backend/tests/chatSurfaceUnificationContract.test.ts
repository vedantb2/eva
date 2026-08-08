import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const workflowWatchdog = readSource("convex/workflowWatchdog.ts");
const stallWatchdog = readSource("convex/_chat/stallWatchdog.ts");
const surfaceAdapters = readSource("convex/_chat/surfaceAdapters.ts");
const turns = readSource("convex/turns.ts");

/**
 * The per-surface check/probe wrappers each armed their own scheduler chain.
 * A chain only converges if
 * every link is scheduled and every link runs, and prod kept losing links: a
 * turn whose entry never got created sat on "Working…" forever. The reconciler
 * cron replaced those recurring chains, so they must stay gone rather than creep back
 * alongside it and give liveness two disagreeing owners again.
 */
const DELETED_CHAT_WRAPPERS = [
  "checkStaleSessionHeartbeat",
  "probeStaleSessionLiveness",
  "checkStaleProjectChatHeartbeat",
  "probeStaleProjectChatLiveness",
  "checkStaleAgentTaskChatHeartbeat",
  "probeStaleAgentTaskChatLiveness",
];

describe("the per-turn chat watchdog chains stay deleted", () => {
  test.each(DELETED_CHAT_WRAPPERS)("%s is gone", (name) => {
    expect(
      workflowWatchdog,
      `${name} is back — the lease reconciler is the only chat liveness owner`,
    ).not.toContain(`export const ${name} =`);
  });

  test.each([
    "handleStaleSession",
    "handleStaleProjectChat",
    "handleStaleAgentTaskChat",
  ])("%s remains only as a no-row deployment backstop", (name) => {
    const body = definitionBody(workflowWatchdog, name);
    expect(body).toContain("findOpenTurn(");
    expect(body).toContain("finalizeStaleChatTurn(");
    expect(body).not.toContain("scheduleCheck");
    expect(body).not.toContain("internalTouch");
  });

  /**
   * The shared implementation still exists and still owns every write; the
   * reconciler is a thin caller of it, exactly as the wrappers were. Logic
   * drifting back up into the caller is how the three surfaces diverged before.
   */
  test("the reconciler delegates rather than writing the teardown itself", () => {
    const body = definitionBody(turns, "finalizeExpired");
    expect(body).toContain("finalizeExpiredTurn(");
    expect(body, "the reconciler patches the entity directly").not.toContain(
      "ctx.db.patch(",
    );
    expect(body, "the reconciler inserts a message directly").not.toContain(
      'insert("messages"',
    );
  });

  /**
   * The probe survives only to word the alert. Letting it renew is the exact
   * bug that kept session 53 alive: the check sent to kill a zombie reset the
   * clock it was being judged against.
   */
  test("the reconciler's liveness probe cannot renew a lease", () => {
    const body = definitionBody(turns, "reconcile");
    expect(body).toContain("verifySandboxLiveness");
    expect(body, "the probe renews the lease it is judging").not.toContain(
      "renew",
    );
  });
});

/**
 * The standalone system-alert message is the one write every stale-turn kill
 * must produce. Three copies of this insert (one per surface) is exactly the
 * drift the refactor removes — it must exist exactly once in the shared
 * implementation.
 */
test("finalizeStaleChatTurn inserts the isSystemAlert message exactly once", () => {
  const matches = stallWatchdog.match(/isSystemAlert: true/g) ?? [];
  expect(matches).toHaveLength(1);
});

/**
 * chatSurfaceAdapters is the single registration point for every chat
 * surface the shared watchdog knows about. A fourth surface — or one of the
 * existing three quietly dropped — must show up here.
 */
test("all three chat surface adapters are registered together in chatSurfaceAdapters", () => {
  const startAt = surfaceAdapters.indexOf(
    "export const chatSurfaceAdapters = [",
  );
  expect(startAt, "chatSurfaceAdapters moved or was renamed").toBeGreaterThan(
    -1,
  );
  const endAt = surfaceAdapters.indexOf("] as const;", startAt);
  expect(endAt, "the chatSurfaceAdapters array close moved").toBeGreaterThan(
    -1,
  );
  const body = surfaceAdapters.slice(startAt, endAt);
  expect(body).toContain("sessionChatAdapter");
  expect(body).toContain("taskChatAdapter");
  expect(body).toContain("projectChatAdapter");
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
