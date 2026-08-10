import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const heartbeats = readSource("callback-src/runtime/heartbeats.ts");
const oneShot = readSource("callback-src/index.ts");
const daemon = readSource("callback-src/providers/claudeSdkDaemon.ts");
const turnStore = readSource("convex/_chat/turnStore.ts");
const sessionWorkflow = readSource("convex/_sessions/workflow.ts");
const taskSynthetic = readSource("convex/_chat/taskChatDaemon.ts");
const projectSynthetic = readSource("convex/_chat/projectChatDaemon.ts");
const taskWorkflow = readSource("convex/agentTaskChatWorkflow.ts");
const projectWorkflow = readSource("convex/projectChatWorkflow.ts");
const taskCompletion = readSource("convex/_taskWorkflow/publicMutations.ts");
const summary = readSource("convex/summarizeWorkflow.ts");
const schema = readSource("convex/schema.ts");

describe("completion callbacks are fenced by their turn", () => {
  test("the final heartbeat verdict is enforced before either completion path", () => {
    const finalHeartbeat = functionBody(
      heartbeats,
      "export async function setFinalizingState()",
    );
    expect(finalHeartbeat).toContain("return enforceTurnLease()");

    const oneShotFence = oneShot.indexOf("if (await setFinalizingState())");
    const oneShotCompletion = oneShot.indexOf(
      "await deliverCompletionWithMedia(completionArgs)",
    );
    expect(oneShotFence).toBeGreaterThan(-1);
    expect(oneShotFence).toBeLessThan(oneShotCompletion);

    const daemonFence = daemon.indexOf("if (await setFinalizingState())");
    const daemonCompletion = daemon.indexOf(
      "await deliverCompletionWithMedia(completionArgs)",
    );
    expect(daemonFence).toBeGreaterThan(-1);
    expect(daemonFence).toBeLessThan(daemonCompletion);
  });

  test("normal and synthetic callback payloads carry the current turn id", () => {
    expect(oneShot).toContain("completionArgs.turnId = turnId");
    expect(daemon).toContain("Object.assign(completionArgs, currentTurnArgs())");
    expect(daemon).toContain("...currentTurnArgs()");
  });

  test("the warm daemon releases the lease after the server accepts completion", () => {
    const body = functionBody(daemon, "async function finalizeTurn(");
    const completionAt = body.indexOf(
      "await deliverCompletionWithMedia(completionArgs)",
    );
    const releaseAt = body.indexOf("setCurrentTurnId(null)", completionAt);
    expect(completionAt).toBeGreaterThan(-1);
    expect(releaseAt).toBeGreaterThan(completionAt);
  });

  test("the server resolves an exact current row and rejects unfenced successors", () => {
    const resolver = functionBody(
      turnStore,
      "export async function resolveCompletionTurn(",
    );
    expect(resolver).toContain("ctx.db.normalizeId(\"turns\", params.turnId)");
    expect(resolver).toContain("current._id !== turn._id");
    expect(resolver).toContain("turn.placeholderMessageId !==");
    expect(resolver).toContain('return { status: "stale" }');
  });

  test("each normal completion validates ownership before sending its event", () => {
    for (const [source, name] of [
      [sessionWorkflow, "session"],
      [taskWorkflow, "task chat"],
      [projectWorkflow, "project chat"],
    ]) {
      const body = definitionBody(source, "handleCompletion");
      const resolveAt = body.indexOf("resolveCompletionTurn(");
      const finalizeAt = body.indexOf("advanceTurn(");
      const sendAt = body.indexOf("sendCompletionEvent(");
      expect(resolveAt, `${name} completion is not fenced`).toBeGreaterThan(-1);
      expect(finalizeAt, `${name} does not finalize its exact row`).toBeGreaterThan(
        resolveAt,
      );
      expect(sendAt, `${name} event moved before the fence`).toBeGreaterThan(
        finalizeAt,
      );
      expect(body).toContain("turnId: v.optional(v.string())");
    }
  });
});

describe("synthetic completion retries are side-effect free", () => {
  test("all three surfaces validate message and turn before clearing or closing", () => {
    for (const [source, name] of [
      [sessionWorkflow, "session"],
      [taskSynthetic, "task chat"],
      [projectSynthetic, "project chat"],
    ]) {
      const body = definitionBody(source, "completeSyntheticTurn");
      const messageAt = body.indexOf("ctx.db.get(args.messageId)");
      const resolveAt = body.indexOf("resolveCompletionTurn(");
      const clearAt = body.indexOf("clearStreamingActivity(");
      const closeAt = body.indexOf("closeTurn(");
      expect(messageAt, `${name} message guard moved`).toBeGreaterThan(-1);
      expect(resolveAt, `${name} turn guard moved`).toBeGreaterThan(messageAt);
      expect(clearAt, `${name} clears before validation`).toBeGreaterThan(resolveAt);
      expect(closeAt, `${name} closes before validation`).toBeGreaterThan(resolveAt);
      expect(body).toContain("syntheticTurnMessageId !== args.messageId");
      expect(body).toContain("turnId: v.optional(v.string())");
    }
  });
});

describe("finalization leases cover the work that follows completion", () => {
  test("task completion grants the finalizing lease atomically", () => {
    const body = definitionBody(taskCompletion, "handleCompletion");
    expect(body).toContain("finalizingAt,");
    expect(body).toContain("leaseExpiresAt: leaseExpiryFor({");
    expect(body).toContain('state: "finalizing"');
  });

  test("summaries own and renew a distinct turn surface", () => {
    expect(schema).toContain('v.literal("summary")');
    expect(summary).toContain('surface: "summary"');
    expect(summary).toContain("internal.turns.markLaunching");
    expect(summary).toContain("...(turnId !== null ? { turnId } : {})");
    expect(summary).toContain("resolveCompletionTurn(ctx");
  });
});

function readSource(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function functionBody(source: string, header: string): string {
  const startAt = source.indexOf(header);
  expect(startAt, `${header} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n}\n", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}
