import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));
const source = (path: string): string =>
  readFileSync(join(testsDir, path), "utf8");

test("the schema supports one indexed open turn and lease reconciliation", () => {
  const schema = source("../convex/schema.ts");
  expect(schema).toContain('turns: defineTable(turnFields)');
  expect(schema).toContain('.index("by_entity_open"');
  expect(schema).toContain('.index("by_open_lease"');
});

test("a turn is persisted before its workflow is launched", () => {
  const execution = source("../convex/_sessions/execution.ts");
  const openAt = execution.indexOf("await openSessionTurn(");
  const startAt = execution.indexOf(
    "internal.sessionWorkflow.sessionExecuteWorkflow",
  );
  expect(openAt).toBeGreaterThan(-1);
  expect(startAt).toBeGreaterThan(-1);
  expect(openAt).toBeLessThan(startAt);
});

test("claiming increments the fenced lease generation", () => {
  const store = source("../convex/_chat/turnStore.ts");
  expect(store).toContain(
    "const leaseGeneration = turn.leaseGeneration + 1;",
  );
  expect(store).toContain(
    "turn.leaseGeneration !== params.leaseGeneration",
  );
});

test("the heartbeat fences stale writers before changing streaming state", () => {
  const http = source("../convex/http.ts");
  const turns = source("../convex/turns.ts");
  expect(http).toContain("internal.turns.heartbeat");
  const heartbeatAt = turns.indexOf("export const heartbeat");
  const renewAt = turns.indexOf("await renewTurnLease", heartbeatAt);
  const terminalAt = turns.indexOf('lease.status === "terminal"', heartbeatAt);
  const streamAt = turns.indexOf("await upsertStreamingActivity", heartbeatAt);
  expect(renewAt).toBeGreaterThan(-1);
  expect(terminalAt).toBeGreaterThan(renewAt);
  expect(streamAt).toBeGreaterThan(terminalAt);
});

test("completion resolves the lease fence before publishing its event", () => {
  const workflow = source("../convex/_sessions/workflow.ts");
  const handlerAt = workflow.indexOf("export const handleCompletion");
  const resolutionAt = workflow.indexOf("resolveCompletionTurn", handlerAt);
  const eventAt = workflow.indexOf("sendCompletionEvent", handlerAt);
  expect(resolutionAt).toBeGreaterThan(handlerAt);
  expect(eventAt).toBeGreaterThan(resolutionAt);
});

test("expired leases are reconciled by a level-triggered cron", () => {
  const turns = source("../convex/turns.ts");
  const crons = source("../convex/crons.ts");
  expect(turns).toContain("turn.leaseExpiresAt >= Date.now()");
  expect(turns).toContain("internal.turns.finalizeExpired");
  expect(crons).toContain('"session turn lease reconcile"');
  expect(crons).toContain("internal.turns.reconcile");
});

test("both warm daemons propagate claimed lease identity", () => {
  for (const path of [
    "../callback-src/providers/claudeSdkDaemon.ts",
    "../callback-src/providers/codexAppServerDaemon.ts",
  ]) {
    const daemon = source(path);
    expect(daemon).toContain("readTurnLeaseIdentity(result)");
    expect(daemon).toContain("setCurrentTurnLease(turn.turnLease)");
  }
});
