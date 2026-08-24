import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { buildTurnCompletion } from "../providers/cursorSdkDaemon.js";
import type { ProviderAttemptResult } from "../types.js";

const CLEAN_ATTEMPT: ProviderAttemptResult = {
  code: 0,
  terminatedBySignal: false,
  output: "",
  timedOutForNoOutput: false,
  timedOutForMaxRuntime: false,
  timedOutForFirstEvent: false,
  timedOutForFirstAssistant: false,
  timedOutAfterFirstText: false,
  timedOutForZombie: false,
  toolStallErrorMessage: "",
};

/** The synthetic result line `runCursorSdkAttempt` emits at the end of a turn. */
function resultLine(result: string, isError = false): string {
  return JSON.stringify({ type: "result", is_error: isError, result }) + "\n";
}

/**
 * The daemon runs one claimed turn per loop and then has to decide, from the
 * attempt's outcome alone, what the chat message says. Getting this wrong is
 * invisible in the happy path and disastrous in the tail: a timed-out turn
 * reported as a success posts the agent's half-finished text as its final
 * answer, and a failed turn with no error resolves the workflow with nothing
 * to show. Same rules as the one-shot path in index.ts.
 */
describe("the daemon turn loop reports each turn's outcome", () => {
  test("a clean result is a successful turn with no error", () => {
    expect(
      buildTurnCompletion({
        ...CLEAN_ATTEMPT,
        output: resultLine("Renamed the button."),
      }),
    ).toEqual({ success: true, error: null });
  });

  test("an error result surfaces the agent's own message", () => {
    expect(
      buildTurnCompletion({
        ...CLEAN_ATTEMPT,
        code: 1,
        output: resultLine("rate limit or usage quota exhausted", true),
      }),
    ).toEqual({
      success: false,
      error: "rate limit or usage quota exhausted",
    });
  });

  /**
   * A timeout cancels the run, so `run.wait()` reports a non-finished status and
   * the synthetic result line carries `is_error` — that flag, not the timeout,
   * is what fails the turn. A *clean* result event alongside a timeout flag
   * still counts as a success, exactly as the one-shot path decides it
   * (index.ts: `attemptEndedDueToTimeout && !runSucceededWithResult`), so the
   * two paths cannot disagree about the same attempt.
   */
  test("an interrupted run fails on its result event, not its timeout flag", () => {
    expect(
      buildTurnCompletion({
        ...CLEAN_ATTEMPT,
        code: 1,
        timedOutForMaxRuntime: true,
        output: resultLine("I was still working on", true),
      }),
    ).toEqual({ success: false, error: "I was still working on" });

    expect(
      buildTurnCompletion({
        ...CLEAN_ATTEMPT,
        timedOutForMaxRuntime: true,
        output: resultLine("Renamed the button."),
      }).success,
    ).toBe(true);
  });

  test("a silent turn that never produced a result reports a diagnostic error", () => {
    const outcome = buildTurnCompletion({
      ...CLEAN_ATTEMPT,
      code: 1,
      timedOutForNoOutput: true,
    });
    expect(outcome.success).toBe(false);
    expect(outcome.error).toContain("no stdout");
  });

  test("a turn that dies without a result reports the runtime cap", () => {
    const outcome = buildTurnCompletion({
      ...CLEAN_ATTEMPT,
      code: 1,
      timedOutForMaxRuntime: true,
    });
    expect(outcome.success).toBe(false);
    expect(outcome.error).toContain("terminated after max runtime");
  });
});

/**
 * Ordering invariants inside the turn loop. Each of these is a silent failure
 * mode rather than a crash, so they are asserted on the source directly (same
 * approach as daemonFlushCursor.test.ts).
 */
describe("the cursor daemon's per-turn ordering", () => {
  const daemon = readSource("providers/cursorSdkDaemon.ts");

  test("clearing the turn buffer also rewinds the flush cursor", () => {
    const reset = functionBody(daemon, "function resetTurnState(): void {");
    expect(reset).toContain('S.rawOutput = ""');
    expect(
      reset,
      "a cleared buffer with a live cursor kills flushing",
    ).toContain("S.lastProcessed = 0");
  });

  /**
   * `prepareCursorSessionState` pushes a persistent activity notice when it
   * rotates the saved agent, so the per-turn state reset has to run BEFORE it —
   * resetting afterwards wipes the notice out of the turn's activity log.
   */
  test("the state reset runs before session prep, which runs every turn", () => {
    const runTurn = functionBody(
      daemon,
      "async function runClaimedTurn(turn: ClaimedTurn): Promise<void> {",
    );
    const resetAt = runTurn.indexOf("resetTurnState()");
    const prepareAt = runTurn.indexOf("prepareCursorSessionState()");
    const attemptAt = runTurn.indexOf("runCursorSdkAttempt(");
    expect(resetAt, "the per-turn reset moved").toBeGreaterThan(-1);
    expect(
      prepareAt,
      "session prep moved out of the turn loop",
    ).toBeGreaterThan(-1);
    expect(attemptAt, "the attempt call moved").toBeGreaterThan(-1);
    expect(resetAt).toBeLessThan(prepareAt);
    expect(prepareAt).toBeLessThan(attemptAt);
  });

  /**
   * Only `flushStreaming` parses buffered lines into `accumulatedSteps`, so the
   * completion payload has to be built after a drain — and the drain has to
   * precede the mutation that persists it.
   */
  test("the turn is drained before its activity log is read and posted", () => {
    const finalize = functionBody(
      daemon,
      "async function finalizeTurn(attempt: ProviderAttemptResult): Promise<void> {",
    );
    const flushAt = finalize.indexOf("await flushStreaming()");
    const serializeAt = finalize.indexOf("serializeSteps(S.accumulatedSteps)");
    const deliverAt = finalize.indexOf("deliverCompletionWithMedia(");
    expect(flushAt, "the pre-completion drain is gone").toBeGreaterThan(-1);
    expect(serializeAt, "the activity log build moved").toBeGreaterThan(-1);
    expect(deliverAt, "the completion call moved").toBeGreaterThan(-1);
    expect(flushAt).toBeLessThan(serializeAt);
    expect(flushAt).toBeLessThan(deliverAt);
  });

  /**
   * The server finalizes the user-facing message itself when it drains a
   * cancel, so a completion posted afterwards could resolve the NEXT turn's
   * workflow event instead of this already-settled one.
   */
  test("a cancelled turn posts no completion", () => {
    const runTurn = functionBody(
      daemon,
      "async function runClaimedTurn(turn: ClaimedTurn): Promise<void> {",
    );
    const cancelAt = runTurn.indexOf("if (cancelInFlight) {");
    const finalizeAt = runTurn.indexOf("await finalizeTurn(attempt)");
    expect(cancelAt, "the cancel guard moved").toBeGreaterThan(-1);
    expect(finalizeAt, "the finalize call moved").toBeGreaterThan(-1);
    expect(cancelAt).toBeLessThan(finalizeAt);
  });

  /**
   * Only interactive chats stage turns for a daemon to claim. Jobs (tasks,
   * automations, arena) launch without CLAIM_MUTATION and must keep pushing
   * their prompt through the one-shot attempt path.
   */
  test("interactive cursor chats route to the daemon and jobs stay one-shot", () => {
    const entry = readSource("index.ts");
    const daemonBlock = functionBody(entry, "if (CLAIM_MUTATION) {");
    expect(daemonBlock).toContain('if (PROVIDER === "cursor")');
    expect(daemonBlock).toContain("await runCursorDaemon()");
    expect(entry).toContain(
      "const firstAttempt = await runProviderAttempt(initialSessionMode)",
    );
  });

  /** An idle daemon polling at 50ms burns ~20 Convex mutations/s for nothing. */
  test("the claim poll backs off once nothing is in flight", () => {
    const watcher = daemon.slice(daemon.indexOf("function startClaimWatcher("));
    expect(watcher).toContain("PROMPT_POLL_IDLE_INTERVAL_MS");
    expect(watcher).toContain("PROMPT_POLL_INTERVAL_MS");
    expect(watcher).toContain("PROMPT_POLL_FAST_WINDOW_MS");
  });
});

function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", relativePath),
      "utf8",
    ).replaceAll("\r\n", "\n"),
  );
}

/** Slices from a declaration to the next top-level one. */
function functionBody(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  expect(startAt, `${declaration} moved or was renamed`).toBeGreaterThan(-1);
  const rest = source.slice(startAt + declaration.length);
  const nextAt = rest.search(/\n(?:export |async function |function |const )/);
  return declaration + (nextAt < 0 ? rest : rest.slice(0, nextAt));
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
