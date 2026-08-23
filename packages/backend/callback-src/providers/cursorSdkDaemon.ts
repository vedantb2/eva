import { readFileSync, unlinkSync, writeFileSync } from "fs";
import {
  CALLBACK_SCRIPT_FP,
  CLAIM_MUTATION,
  COMPLETION_MUTATION,
  CONVEX_TOKEN,
  CONVEX_URL,
  DAEMON_OPTS_SIG,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  MAX_TOTAL_RUNTIME_MS,
  MODEL,
  REPO_ID,
  RUN_ID,
} from "../config.js";
import { callConvexWithRetry, fetchWithTimeout } from "../http/convexClient.js";
import { serializeSteps } from "../parse/stepBudget.js";
import {
  appendDiagnosticTail,
  buildErrorMessage,
  deliverCompletionWithMedia,
  extractResultEvent,
} from "../runtime/completion.js";
import {
  flushStreaming,
  runPreflightHeartbeat,
  setFinalizingState,
  startStreamingLoops,
  stopStreamingLoops,
} from "../runtime/heartbeats.js";
import { callbackState as S } from "../runtime/state.js";
import { materializeTurnAttachments } from "../runtime/turnAttachments.js";
import { persistTurnWork } from "../runtime/turnPersist.js";
import {
  prepareCursorSessionState,
  syncCursorStateToPersist,
} from "../session/cursorSession.js";
import type { JsonValue, ProviderAttemptResult } from "../types.js";
import { log, readResponseJson } from "../utils.js";
import { readCancelRequested } from "./claimPendingTurnParse.js";
import { runCursorSdkAttempt } from "./cursorSdk.js";
import {
  resolveDaemonPaths,
  resolveLegacySessionDaemonPaths,
} from "./daemonPaths.js";

// Same knobs as the Claude/Codex daemons (see claudeSdkDaemon.ts for the
// reasoning behind each): keep the sandbox warm for a whole work session, poll
// the claim mutation fast while anything is in flight and back off when idle so
// an idle daemon does not burn ~20 mutations/s for turns that never come.
const IDLE_EXIT_MS = 45 * 60 * 1000;
const FENCE_POLL_INTERVAL_MS = 5000;
const PROMPT_POLL_INTERVAL_MS = 50;
const PROMPT_POLL_IDLE_INTERVAL_MS = 1000;
const PROMPT_POLL_FAST_WINDOW_MS = 30_000;
const WATCHDOG_TICK_MS = 5000;
// Outer bound on one claimed turn. `runCursorSdkAttempt` already enforces the
// runtime cap and the silence kill itself (cancelling the run so the attempt
// returns and reports a failure completion like the one-shot path). This is the
// backstop for the case that machinery cannot cover: a run whose `cancel()` never
// unsticks `wait()`, which would otherwise leave the workflow's awaitEvent
// hanging on an empty "Working…" bubble forever.
const TURN_HARD_TIMEOUT_MS = MAX_TOTAL_RUNTIME_MS + 5 * 60 * 1000;
// Safety net for a cancel whose run never settles (mirrors the Claude daemon's
// CANCEL_SETTLE_TIMEOUT_MS): exit for respawn rather than wedge.
const CANCEL_SETTLE_TIMEOUT_MS = 30_000;

type ClaimedTurn = { prompt: string; attachmentUrls: string[] };

const daemonPaths = resolveDaemonPaths();

let daemonExiting = false;
let callbackRefreshPending = false;
let callbackRefreshDeferralLogged = false;
let pendingClaimedTurn: ClaimedTurn | null = null;
let turnActive = false;
let turnStartedAtMs = 0;
let lastIdleActivityAtMs = Date.now();
/** Set when a claim response drained a cancel for the running turn. */
let cancelInFlight = false;
let cancelRequestedAtMs = 0;
/** Aborts the in-flight Cursor run; registered by the attempt each turn. */
let abortActiveTurn: (() => void) | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readDaemonPidFile(): number {
  try {
    return Number(readFileSync(daemonPaths.pid, "utf8").trim());
  } catch {
    return Number.NaN;
  }
}

function entityMutationArgs(
  fields: Record<string, JsonValue>,
): Record<string, JsonValue> {
  return { [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "", ...fields };
}

/**
 * True when a newer callback bundle was uploaded while this daemon is running.
 * The daemon then stops claiming, lets active work settle, and exits so the
 * next prewarm spawns with fresh code — a refresh must never lose a turn.
 */
function callbackScriptWentStaleOnDisk(): boolean {
  if (!CALLBACK_SCRIPT_FP) return false;
  try {
    return (
      readFileSync("/tmp/eva-callback-fp", "utf8").trim() !== CALLBACK_SCRIPT_FP
    );
  } catch {
    return false;
  }
}

/** Clears the per-turn accumulators so the next turn starts clean. */
function resetTurnState(): void {
  S.accumulatedSteps.length = 0;
  S.currentStreamedContent = "";
  S.streamedAssistantTextThisMessage = false;
  S.pendingParagraphBreak = false;
  S.resultEventSeen = false;
  S.rawOutput = "";
  // The flush cursor and the buffer are one value: a cleared buffer with a live
  // cursor makes flushStreaming's `rawOutput.length <= lastProcessed` guard
  // permanently true, so no later line is ever parsed into accumulatedSteps and
  // every turn from the second onward reports an empty activity log.
  S.lastProcessed = 0;
  S.realtimeOutputBuffer = "";
  S.inFlightToolUses = 0;
  S.pendingQuestionData = "";
  S.todoState.length = 0;
  S.lastStepType = "thinking";
}

/** Unwraps `{ status, value }` from the claim mutation's HTTP envelope. */
function readClaimedTurn(result: JsonValue): ClaimedTurn | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  if (typeof payload.prompt !== "string") return null;
  const urls = payload.attachmentUrls;
  return {
    prompt: payload.prompt,
    attachmentUrls: Array.isArray(urls)
      ? urls.filter((url): url is string => typeof url === "string")
      : [],
  };
}

/** Sessions may push git commits; refresh the installation token like the one-shot path. */
async function ensureGithubToken(): Promise<void> {
  if (!REPO_ID || !CONVEX_URL || !CONVEX_TOKEN) return;
  try {
    const response = await fetchWithTimeout(CONVEX_URL + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + CONVEX_TOKEN,
      },
      body: JSON.stringify({
        path: "github:getInstallationTokenAction",
        args: { repoId: REPO_ID },
        format: "json",
      }),
    });
    if (!response.ok) return;
    const data = await readResponseJson(response);
    if (typeof data !== "object" || data === null || Array.isArray(data))
      return;
    const value = data.value;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return;
    }
    if (typeof value.token === "string") {
      process.env.GITHUB_TOKEN = value.token;
      process.env.GH_TOKEN = value.token;
    }
  } catch {
    /* non-fatal */
  }
}

/**
 * Turn outcome → completion payload, using the same rules as the one-shot path
 * (index.ts): a result event decides success, a timeout demotes it, and a
 * failure without a result event reports the shared diagnostic error message.
 */
export function buildTurnCompletion(attempt: ProviderAttemptResult): {
  success: boolean;
  error: string | null;
} {
  const resultEvent = extractResultEvent(attempt.output);
  const attemptEndedDueToTimeout =
    attempt.timedOutForMaxRuntime ||
    attempt.timedOutForNoOutput ||
    Boolean(attempt.toolStallErrorMessage);
  // Same interruption guard as index.ts: Cursor can flush partial text while a
  // SIGTERM/SIGKILL tears the process down, and shells translate a direct
  // signal (code=null, terminatedBySignal) into exit 137/143 — none of those
  // may masquerade as genuine completion.
  const finalTerminatedBySignal = attempt.terminatedBySignal;
  const finalCode = attempt.code;
  const agentWasInterrupted =
    finalTerminatedBySignal || finalCode === 137 || finalCode === 143;
  const runSucceededWithResult =
    resultEvent !== null && !resultEvent.isError && !agentWasInterrupted;
  if (resultEvent?.isError) {
    return { success: false, error: resultEvent.result };
  }
  if (
    (!runSucceededWithResult && attempt.code !== 0) ||
    (attemptEndedDueToTimeout && !runSucceededWithResult)
  ) {
    return {
      success: false,
      error: appendDiagnosticTail(
        buildErrorMessage(
          attempt.code,
          S.fatalHeartbeatErrorMessage,
          attempt.toolStallErrorMessage,
          attempt.timedOutForMaxRuntime,
          attempt.timedOutForNoOutput,
          attempt.timedOutForFirstEvent,
          attempt.timedOutForFirstAssistant,
          attempt.timedOutAfterFirstText,
          attempt.timedOutForZombie,
        ),
      ),
    };
  }
  return { success: runSucceededWithResult, error: null };
}

/** Reports one finished turn to the chat workflow (mirrors the one-shot completion). */
async function finalizeTurn(attempt: ProviderAttemptResult): Promise<void> {
  // Only flushStreaming parses buffered lines into accumulatedSteps, so the
  // drain has to happen before the activity log is read and before the
  // completion mutation persists it.
  await flushStreaming();
  const resultEvent = extractResultEvent(attempt.output);
  for (const step of S.accumulatedSteps) step.status = "complete";
  const { success, error } = buildTurnCompletion(attempt);
  const completionArgs: Record<string, string | boolean | null> = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success,
    result: resultEvent?.result ?? S.rawOutput,
    error,
    activityLog: serializeSteps(S.accumulatedSteps),
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (resultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = resultEvent.rawResultEvent;
  }
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }
  // Final streaming reconcile BEFORE completion: the completion mutation
  // finalizes the assistant message and the server may dequeue the next turn
  // straight after, so writing streaming state past that point resurrects this
  // turn's text into the next turn's placeholder.
  await setFinalizingState();
  // Durability BEFORE completion: a VM death after this point must not erase
  // the turn's work.
  persistTurnWork();
  await deliverCompletionWithMedia(completionArgs);
  syncCursorStateToPersist();
  log("cursor daemon: turn finalized success=" + success);
}

/**
 * Posts a failure completion for the running turn (resolving the workflow's
 * awaitEvent so the UI stops spinning) and exits, abandoning a possibly wedged
 * run — the next turn's prewarm boots a fresh daemon.
 */
async function failTurnAndExit(error: string): Promise<never> {
  log("cursor daemon: failing turn — " + error);
  try {
    await callConvexWithRetry(
      "mutation",
      COMPLETION_MUTATION ?? "",
      entityMutationArgs({
        success: false,
        result: null,
        error,
        activityLog: serializeSteps(S.accumulatedSteps),
        ...(RUN_ID ? { runId: RUN_ID } : {}),
      }),
    );
  } catch {
    /* best-effort: exit regardless so the daemon does not wedge */
  }
  cleanOwnedMarkers();
  await stopStreamingLoops();
  process.exit(1);
}

/** Removes marker files only while this process still owns the pidfile. */
function cleanOwnedMarkers(): void {
  if (readDaemonPidFile() !== process.pid) return;
  const legacy =
    ENTITY_ID_FIELD === "sessionId" ? resolveLegacySessionDaemonPaths() : null;
  const targets = [
    daemonPaths.pid,
    daemonPaths.entity,
    daemonPaths.opts,
    ...(legacy ? [legacy.pid, legacy.entity, legacy.opts] : []),
  ];
  for (const path of targets) {
    try {
      unlinkSync(path);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Backstops the per-attempt watchdog inside `runCursorSdkAttempt`: a turn that
 * outlives the hard cap (or a cancel that never settles) means that machinery
 * failed, so resolve the turn server-side and exit for a clean respawn.
 */
function startTurnWatchdog(): void {
  const timer = setInterval(() => {
    const now = Date.now();
    if (cancelInFlight) {
      if (now - cancelRequestedAtMs > CANCEL_SETTLE_TIMEOUT_MS) {
        // The server already finalized this turn when it drained the cancel, so
        // posting a completion here could resolve the NEXT turn's event.
        log("cursor daemon: cancelled turn did not settle in time — exiting");
        cleanOwnedMarkers();
        process.exit(1);
      }
      return;
    }
    if (!turnActive) return;
    if (now - turnStartedAtMs > TURN_HARD_TIMEOUT_MS) {
      turnActive = false;
      void failTurnAndExit("The assistant exceeded the maximum turn runtime.");
    }
  }, WATCHDOG_TICK_MS);
  timer.unref?.();
}

/**
 * Polls the claim mutation: hands staged turns to the run loop, drains cancels
 * for the running turn, and stops claiming once a newer callback bundle lands.
 */
function startClaimWatcher(): void {
  void (async () => {
    while (!daemonExiting) {
      if (callbackScriptWentStaleOnDisk()) callbackRefreshPending = true;
      if (callbackRefreshPending) {
        if (turnActive || pendingClaimedTurn !== null || cancelInFlight) {
          if (!callbackRefreshDeferralLogged) {
            callbackRefreshDeferralLogged = true;
            log(
              "cursor daemon: callback script updated on disk — deferring respawn until active work settles",
            );
          }
          await sleep(PROMPT_POLL_INTERVAL_MS);
          continue;
        }
        log(
          "cursor daemon: callback script updated on disk — exiting for respawn",
        );
        daemonExiting = true;
        return;
      }
      try {
        const claimed = await callConvexWithRetry(
          "mutation",
          CLAIM_MUTATION ?? "",
          entityMutationArgs({ model: MODEL }),
        );
        if (readCancelRequested(claimed)) handleCancelRequested();
        const turn = readClaimedTurn(claimed);
        if (turn !== null) {
          await materializeTurnAttachments(turn);
          lastIdleActivityAtMs = Date.now();
          // claimPendingTurn already cleared the staged turn atomically, so any
          // branch that neither parks nor starts it loses that prompt. A cancel
          // can dequeue the next prompt in the same mutation, so park it and let
          // the run loop pick it up once the cancelled run settles.
          if (!turnActive || cancelInFlight) {
            pendingClaimedTurn = turn;
          } else {
            log(
              "cursor daemon: claim discarded while real turn active (prompt lost; pendingTurn was already cleared)",
            );
          }
        }
      } catch {
        /* retry on the next poll */
      }
      const busy = turnActive || pendingClaimedTurn !== null || cancelInFlight;
      const recentlyActive =
        Date.now() - lastIdleActivityAtMs < PROMPT_POLL_FAST_WINDOW_MS;
      await sleep(
        busy || recentlyActive
          ? PROMPT_POLL_INTERVAL_MS
          : PROMPT_POLL_IDLE_INTERVAL_MS,
      );
    }
  })();
}

/**
 * Handles a drained `cancelRequested` flag: cancels the in-flight Cursor run so
 * the attempt returns, and marks the turn as server-finalized so no completion
 * is posted for it. Idempotent; a stale flag with no running turn is ignored.
 */
function handleCancelRequested(): void {
  if (!turnActive) {
    log("cursor daemon: cancelRequested with no active turn — ignored");
    return;
  }
  if (cancelInFlight) return;
  cancelInFlight = true;
  cancelRequestedAtMs = Date.now();
  log("cursor daemon: cancel requested — cancelling the in-flight run");
  abortActiveTurn?.();
}

/**
 * Runs one claimed turn on the warm process. The session state (and with it the
 * rotation policy) is re-evaluated every turn, exactly as the one-shot path does
 * before its single attempt.
 */
async function runClaimedTurn(turn: ClaimedTurn): Promise<void> {
  resetTurnState();
  turnActive = true;
  turnStartedAtMs = Date.now();
  abortActiveTurn = null;
  log("cursor daemon: turn started");
  try {
    if (!process.env.CURSOR_API_KEY?.trim()) {
      throw new Error(
        "CURSOR_API_KEY is missing in the sandbox environment — the Cursor SDK cannot authenticate",
      );
    }
    const sessionMode = prepareCursorSessionState();
    const attempt = await runCursorSdkAttempt(sessionMode, {
      promptText: turn.prompt,
      onAbortHandle: (abort) => {
        abortActiveTurn = abort;
        // A cancel that arrived while the agent was still being created has no
        // run to stop yet; apply it as soon as the handle exists.
        if (cancelInFlight) abort();
      },
    });
    turnActive = false;
    if (cancelInFlight) {
      log("cursor daemon: cancelled turn settled — no completion posted");
      return;
    }
    await finalizeTurn(attempt);
  } catch (error) {
    turnActive = false;
    const message = error instanceof Error ? error.message : String(error);
    log("cursor daemon: turn failed — " + message);
    if (cancelInFlight) return;
    try {
      await flushStreaming();
      for (const step of S.accumulatedSteps) step.status = "complete";
      await setFinalizingState();
      await deliverCompletionWithMedia({
        [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
        success: false,
        result: null,
        error: appendDiagnosticTail(message),
        activityLog: serializeSteps(S.accumulatedSteps),
        ...(RUN_ID ? { runId: RUN_ID } : {}),
      });
    } catch {
      /* best-effort — the watchdog and stall recovery own the rest */
    }
  } finally {
    turnActive = false;
    abortActiveTurn = null;
    cancelInFlight = false;
    lastIdleActivityAtMs = Date.now();
  }
}

/**
 * Persistent warm-session daemon for Cursor. The process, the pinned
 * `@cursor/sdk` module and the streaming loops are created once and reused, so
 * only the first turn pays process + SDK startup; later turns cost model time
 * plus a local resume. Jobs (no CLAIM_MUTATION) never reach this and stay on
 * the one-shot path in index.ts.
 */
export async function runCursorDaemon(): Promise<void> {
  if (!CLAIM_MUTATION) {
    log("cursor daemon: CLAIM_MUTATION env is required in daemon mode");
    process.exit(1);
  }

  // Single-daemon fence, part 1 (boot claim): a live rival owning the pidfile
  // wins, and this process exits without touching its markers.
  const rivalPid = readDaemonPidFile();
  if (
    !Number.isNaN(rivalPid) &&
    rivalPid !== process.pid &&
    pidAlive(rivalPid)
  ) {
    log(
      `cursor daemon: rival daemon pid=${rivalPid} already owns ${daemonPaths.pid} — exiting`,
    );
    process.exit(0);
  }
  writeFileSync(daemonPaths.pid, String(process.pid));
  writeFileSync(daemonPaths.entity, ENTITY_ID ?? "");
  writeFileSync(daemonPaths.opts, DAEMON_OPTS_SIG);

  // Single-daemon fence, part 2: a launch racing past the boot claim (or an
  // opts-mismatch respawn) overwrites the pidfile; the deposed daemon must exit
  // or it double-claims turns and flip-flops the shared streaming row. Deferred
  // while a turn is running so work is never killed mid-flight.
  let deposedLogged = false;
  const fence = setInterval(() => {
    const owner = readDaemonPidFile();
    if (owner === process.pid) {
      deposedLogged = false;
      return;
    }
    const ownerLabel = Number.isNaN(owner) ? "none" : String(owner);
    if (turnActive) {
      if (!deposedLogged) {
        deposedLogged = true;
        log(
          `cursor daemon: deposed (pidfile owner=${ownerLabel}) — exiting after active turn`,
        );
      }
      return;
    }
    log(`cursor daemon: deposed (pidfile owner=${ownerLabel}) — exiting`);
    process.exit(0);
  }, FENCE_POLL_INTERVAL_MS);
  fence.unref?.();

  const preflightOk = await runPreflightHeartbeat();
  if (!preflightOk) {
    log("cursor daemon: preflight failed");
    process.exit(1);
  }
  startStreamingLoops();
  await ensureGithubToken();

  log(
    "runCursorDaemon started (entityId=" +
      (ENTITY_ID ?? "none") +
      ", model=" +
      MODEL +
      ")",
  );
  startTurnWatchdog();
  startClaimWatcher();

  try {
    while (!daemonExiting) {
      if (pendingClaimedTurn !== null) {
        const turn = pendingClaimedTurn;
        pendingClaimedTurn = null;
        await runClaimedTurn(turn);
        continue;
      }
      if (Date.now() - lastIdleActivityAtMs > IDLE_EXIT_MS) {
        log("cursor daemon: idle timeout — exiting");
        break;
      }
      await sleep(PROMPT_POLL_INTERVAL_MS);
    }
  } finally {
    daemonExiting = true;
    cleanOwnedMarkers();
    await stopStreamingLoops();
  }
  process.exit(0);
}
