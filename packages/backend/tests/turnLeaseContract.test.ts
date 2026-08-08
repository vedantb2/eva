import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const turns = readSource("convex/turns.ts");
const turnStore = readSource("convex/_chat/turnStore.ts");
const turnLease = readSource("convex/_chat/turnLease.ts");
const stallWatchdog = readSource("convex/_chat/stallWatchdog.ts");
const surfaceAdapters = readSource("convex/_chat/surfaceAdapters.ts");
const crons = readSource("convex/crons.ts");
const http = readSource("convex/http.ts");
const streaming = readSource("convex/streaming.ts");
const runLease = readSource("convex/_taskWorkflow/runLease.ts");
const runReconcile = readSource("convex/_taskWorkflow/runReconcile.ts");
const runLifecycle = readSource("convex/_taskWorkflow/runLifecycle.ts");

// The generic parameter list is wrapped across lines by the formatter, so pin
// the name only — the type parameters are not what these rules are about.
const FINALIZE_HEADER = "export async function finalizeStaleChatTurn<";

/**
 * Liveness used to be smeared across four places that could disagree: entity
 * fields, the workflow component, filesystem markers in the sandbox, and the
 * runner process itself. Cleanup was edge-triggered — a chain of scheduled
 * checks armed by the turn they watched — so any missed edge meant a chat that
 * sat on "Working…" until someone noticed.
 *
 * The replacement is one fact: a turn is running iff an open `turns` row holds
 * an unexpired lease. Everything below pins an invariant of that contract.
 * They are source-text rules because the failures are invisible at runtime —
 * a stalled turn is a UI that looks busy, and nothing throws.
 */
describe("I1: an open turn row is the only 'Working…' signal", () => {
  test("getOpen uses entity fields only for pre-lease rows with no history", () => {
    const body = definitionBody(turns, "getOpen");
    expect(body).toContain('withIndex("by_entity_open"');
    // A legacy active field is consulted only before any row has ever existed;
    // post-migration rows remain the sole liveness signal.
    const historyGuardAt = body.indexOf("if (hasTurnHistory) return null");
    const legacySignalAt = body.indexOf("activeWorkflowId", historyGuardAt);
    expect(historyGuardAt).toBeGreaterThan(-1);
    expect(legacySignalAt).toBeGreaterThan(historyGuardAt);
    expect(body).not.toContain("streamingActivity");
  });

  test("opening the turn and claiming the workflow happen in one mutation", () => {
    const body = functionBody(
      surfaceAdapters,
      "async function trackChatWorkflow<TId extends ChatSurfaceId, TEntity>(",
    );
    const openAt = body.indexOf("openChatTurn(");
    const claimAt = body.indexOf("adapter.setActiveWorkflowId(");
    expect(openAt, "the turn open moved").toBeGreaterThan(-1);
    expect(claimAt, "the workflow claim moved").toBeGreaterThan(-1);
    // Same mutation, so the two can never be observed out of step.
    expect(openAt).toBeLessThan(claimAt);
  });
});

describe("I2: only the actor holding the current turn may renew", () => {
  test("renewal binds the turn to the streaming entity that signed the heartbeat", () => {
    const body = functionBody(
      turnStore,
      "export async function renewTurnLease(",
    );
    expect(body).toContain("streamingEntityId");
    // A turn that has been cancelled or superseded is told to stop, and the
    // callback exits on that verdict rather than carrying on in the sandbox.
    expect(body).toContain('reason: "superseded"');
    expect(body).toContain('reason: "cancelled"');
  });

  test("touch is gone, so nothing else can assert liveness", () => {
    // `internalTouch` bumped `lastUpdatedAt`, and anything holding the mutation
    // could bump it — including the probe sent to decide whether a run had
    // died, which reset the staleness clock of its own kill.
    expect(streaming).not.toContain("export const touch =");
    expect(streaming).not.toContain("export const internalTouch =");
  });

  test("the heartbeat route is the single renewal wire for both leases", () => {
    expect(http).toContain("internal.turns.renew");
    expect(http).toContain("internal.taskWorkflow.renewRunLeaseForEntity");
    // A payload-free touch still renews: that is what carries a turn through a
    // long silent tool run.
    expect(http).not.toContain("internal.streaming.internalTouch");
  });

  test("a heartbeat racing with completion preserves the finalizing lease", () => {
    const body = functionBody(
      turnStore,
      "export async function renewTurnLease(",
    );
    expect(body).toContain('turn.state === "finalizing"');
    expect(body).toContain("leaseDurationMs(renewedState, phase)");
    expect(body).toContain("state: renewedState");
  });
});

describe("I3: every open turn reaches a terminal state on its own", () => {
  test("one cron converges turns and one converges runs", () => {
    expect(crons).toContain("internal.turns.reconcile");
    expect(crons).toContain("internal.taskWorkflow.reconcileRuns");
    // Fixed interval, not armed by the turn it watches — that is the whole
    // difference between level- and edge-triggered convergence.
    expect(crons).toContain('"turn lease reconcile"');
    expect(crons).toContain('"run lease reconcile"');
  });

  test("the finalize mutation re-reads the lease so the live owner wins the race", () => {
    const body = definitionBody(turns, "finalizeExpired");
    expect(body).toContain("ctx.db.get(args.turnId)");
    expect(body).toContain("turn.leaseExpiresAt >= Date.now()");

    const runBody = definitionBody(runReconcile, "finalizeExpiredRun");
    expect(runBody).toContain("ctx.db.get(args.runId)");
    expect(runBody).toContain("run.leaseExpiresAt >= now");
  });

  test("the reconciler queries take now as an argument", () => {
    // Convex caches a query on its data dependencies, never on a timer, so a
    // sweep that read the clock itself would keep answering with the time of
    // its first run and stop finding expired leases.
    expect(definitionBody(turns, "listExpired")).toContain("now: v.number()");
    expect(definitionBody(runReconcile, "listExpiredRuns")).toContain(
      "now: v.number()",
    );
  });

  test("the run sweep excludes rows that predate leases", () => {
    // A missing optional field sorts before every number, so without the lower
    // bound every pre-lease run would look expired and die on first deploy.
    expect(definitionBody(runReconcile, "listExpiredRuns")).toContain(
      '.gt("leaseExpiresAt", 0)',
    );
  });
});

describe("I4: no lease outlives the absolute run timeout", () => {
  test("the expiry helper caps every grant at turnStartedAt + RUN_TIMEOUT_MS", () => {
    const body = functionBody(turnLease, "export function leaseExpiryFor(");
    expect(body).toContain("Math.min(granted, input.turnStartedAt");
    expect(body).toContain("RUN_TIMEOUT_MS");
  });

  test("a run past the ceiling is refused rather than renewed", () => {
    const body = functionBody(runLease, "export async function renewRunLease(");
    const timeoutAt = body.indexOf('reason: "timeout"');
    const patchAt = body.indexOf("ctx.db.patch(");
    expect(timeoutAt, "the timeout refusal moved").toBeGreaterThan(-1);
    expect(patchAt, "the lease write moved").toBeGreaterThan(-1);
    // The refusal must come first, or the ceiling is extended by the very call
    // that was supposed to enforce it.
    expect(timeoutAt).toBeLessThan(patchAt);
  });

  test("a starting run gets its lease instead of a scheduled watchdog", () => {
    const body = definitionBody(runLifecycle, "updateRunToRunning");
    expect(body).toContain("leaseExpiryFor(");
    expect(body).not.toContain("checkStaleRuns");
    expect(body).not.toContain("handleStaleRun");
  });
});

describe("the sandbox deadline is extended by the owner, never by the watcher", () => {
  test("renewal is what pushes the VM deadline out", () => {
    for (const [name, body] of [
      [
        "turn renewal",
        functionBody(turnStore, "export async function renewTurnLease("),
      ],
      [
        "run renewal",
        functionBody(runLease, "export async function renewRunLease("),
      ],
    ] as const) {
      expect(body, `${name} no longer extends the sandbox deadline`).toContain(
        "extendSandboxDeadline",
      );
    }
  });

  test("the reconcilers only probe to choose wording", () => {
    for (const [name, body] of [
      ["turn reconciler", definitionBody(turns, "reconcile")],
      ["run reconciler", definitionBody(runReconcile, "reconcileRuns")],
    ] as const) {
      expect(body).toContain("verifySandboxLiveness");
      expect(
        body,
        `${name} extends the deadline of the thing it is judging`,
      ).not.toContain("extendSandboxDeadline");
    }
  });
});

/**
 * The teardown itself is unchanged and still shared by all three chat
 * surfaces — only its trigger moved from nine scheduler chains to one cron.
 * These rules pin the properties that made the old kill safe.
 */
describe("shared stale-turn teardown (_chat/stallWatchdog.ts)", () => {
  test("the salvage reads the streaming row before the clear wipes it", () => {
    const body = functionBody(stallWatchdog, FINALIZE_HEADER);
    const readAt = body.indexOf('query("streamingActivity")');
    const cancelAt = body.indexOf("cancelStaleWorkflow(");
    expect(readAt, "the streaming read moved").toBeGreaterThan(-1);
    expect(cancelAt, "the workflow cancel moved").toBeGreaterThan(-1);
    expect(readAt).toBeLessThan(cancelAt);
  });

  test("a stopped sandbox skips the interrupt", () => {
    // "sandbox_not_started" means the VM is gone; exec would lazily resume it,
    // which is a sandbox the user never asked to wake.
    const body = functionBody(stallWatchdog, FINALIZE_HEADER);
    const stoppedGuardAt = body.indexOf("opts.sandboxStopped !== true");
    const interruptAt = body.indexOf("adapter.interrupt(ctx, entity)");
    expect(stoppedGuardAt, "the stopped-sandbox guard moved").toBeGreaterThan(
      -1,
    );
    expect(interruptAt, "the interrupt call moved").toBeGreaterThan(-1);
    expect(stoppedGuardAt).toBeLessThan(interruptAt);
  });

  test("the kill alerts the user, releases the entity and drains the queue", () => {
    const body = functionBody(stallWatchdog, FINALIZE_HEADER);
    expect(body).toContain("isSystemAlert: true");
    expect(body).toContain("adapter.release(ctx, id,");
    expect(body).toContain("adapter.drainQueue(ctx, id)");
  });
});

/**
 * Each adapter's own specifics: which sandbox-status field a stopped sandbox
 * closes, how a live process is interrupted, and which queue is drained. A
 * guard present in one adapter must not stand in for one missing from another.
 */
describe("per-surface adapters (_chat/surfaceAdapters.ts)", () => {
  test("a stopped sandbox closes the session and kills the process directly", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "sessionChatAdapter",
      "const taskChatAdapter:",
    );
    // The UI must reflect the stop — users cannot see the provider dashboard.
    expect(adapter).toContain('patch.status = "closed"');
    expect(adapter).toContain("The session is now closed");
    // Sessions have no daemon-owning workflow field, so they always kill the
    // sandbox process rather than a named entity daemon.
    expect(adapter).toContain("killSandboxProcess");
    expect(adapter).not.toContain("killEntityDaemon");
  });

  test("release drains the session's own queue and clears its own extra summary row", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "sessionChatAdapter",
      "const taskChatAdapter:",
    );
    expect(adapter).toContain("startNextQueuedSessionMessage(ctx, id)");
    // Only sessions carry a separate summary streaming row alongside the turn's.
    expect(adapter).toContain("`summary:${String(id)}`");
  });

  test("a stopped sandbox closes the task sandbox status, and a live daemon is killed by name", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "taskChatAdapter",
      "const projectChatAdapter:",
    );
    expect(adapter).toContain('patch.reviewTaskSandboxStatus = "closed"');
    expect(adapter).toContain("The sandbox is now closed");
    expect(adapter).toContain("task.activeWorkflowId");
    expect(adapter).toContain("killEntityDaemon");
    expect(adapter).toContain("killSandboxProcess");
  });

  test("release drains the task's own queue and clears no extra streaming rows", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "taskChatAdapter",
      "const projectChatAdapter:",
    );
    expect(adapter).toContain("startNextQueuedTaskChatMessage(ctx, id)");
    expect(adapter).toContain("extraStreamingClears: () => []");
  });

  test("a stopped sandbox closes the project sandbox status, and a live daemon (chat or build) is killed by name", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "projectChatAdapter",
      "export const chatSurfaceAdapters",
    );
    expect(adapter).toContain('patch.reviewProjectSandboxStatus = "closed"');
    expect(adapter).toContain("The sandbox is now closed");
    // A project chat turn can share the sandbox with a build workflow — both
    // are checked, since either owns the same named daemon.
    expect(adapter).toContain(
      "project.activeWorkflowId || project.activeBuildWorkflowId",
    );
    expect(adapter).toContain("killEntityDaemon");
    expect(adapter).toContain("killSandboxProcess");
  });

  test("release drains the project's own queue and clears no extra streaming rows", () => {
    const adapter = adapterBody(
      surfaceAdapters,
      "projectChatAdapter",
      "export const chatSurfaceAdapters",
    );
    expect(adapter).toContain("startNextQueuedProjectChatMessage(ctx, id)");
    expect(adapter).toContain("extraStreamingClears: () => []");
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

/**
 * One top-level function, ending on the `\n}\n` that closes it at column 0.
 * The trailing newline matters: an inline parameter object type closes with
 * `}): number {` at column 0 too, and stopping there would cut the signature
 * off from the body it introduces.
 */
function functionBody(source: string, header: string): string {
  const startAt = source.indexOf(header);
  expect(startAt, `${header} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n}\n", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/**
 * One `const name: ChatSurfaceAdapter<...> = {...}` object literal, bounded
 * by the next adapter/export marker rather than a brace count — the object's
 * closing `};` sits at a 2-space indent (from the `=\n  {` split), so it
 * cannot be found by the column-0 convention the other helpers rely on.
 */
function adapterBody(source: string, name: string, nextMarker: string): string {
  const startAt = source.indexOf(`const ${name}:`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf(nextMarker, startAt);
  expect(end, `${nextMarker} moved or was renamed`).toBeGreaterThan(-1);
  return source.slice(startAt, end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
