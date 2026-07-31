import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import {
  CALLBACK_SCRIPT_FP,
  CHAT_TURN_PROTOCOL_VERSION,
  CLAIM_MUTATION,
  DAEMON_OPTS_SIG,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  MAX_TOTAL_RUNTIME_MS,
  MODEL,
  NO_OUTPUT_TIMEOUT_MS,
  RUN_ID,
} from "../config.js";
import { callConvexWithRetry } from "../http/convexClient.js";
import { serializeSteps } from "../parse/stepBudget.js";
import {
  deliverCompletionWithMedia,
  writeDoneFile,
} from "../runtime/completion.js";
import {
  runPreflightHeartbeat,
  setFinalizingState,
  startStreamingLoops,
  stopStreamingLoops,
} from "../runtime/heartbeats.js";
import { callbackState as S } from "../runtime/state.js";
import {
  prepareCursorSessionState,
  syncCursorStateToPersist,
} from "../session/cursorSession.js";
import type { CursorAcpAttemptResult, JsonValue } from "../types.js";
import { log } from "../utils.js";
import { readCancelRequested } from "./claimPendingTurnParse.js";
import {
  readCursorAcpMcpServers,
  withCursorAcpSession,
  type CursorAcpSession,
} from "./cursorAcpRuntime.js";
import { cursorAcpFailure, cursorAcpResultEvent } from "./cursorAcpResult.js";
import { resolveDaemonPaths } from "./daemonPaths.js";
import { ensureDaemonGithubToken } from "./daemonAuth.js";
import {
  activeTurnIdentityArgs,
  setActiveTurnIdentity,
} from "../runtime/turnIdentity.js";
import {
  materializeTurnAttachments,
  readClaimedTurn,
  type ClaimedTurn,
} from "./daemonTurn.js";

const IDLE_EXIT_MS = 45 * 60 * 1000;
const PROMPT_POLL_INTERVAL_MS = 50;
const PROMPT_SETTLE_POLL_MS = 250;
const CANCEL_SETTLE_TIMEOUT_MS = 30_000;
const NO_EVENT_TIMEOUT_MS = NO_OUTPUT_TIMEOUT_MS * 5;

type CancellationKind = "none" | "server" | "watchdog";
type SettledPrompt = { kind: "settled"; attempt: CursorAcpAttemptResult };
type PromptPoll = { kind: "poll" };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetTurnState(): void {
  S.accumulatedSteps.length = 0;
  S.currentStreamedContent = "";
  S.streamedAssistantTextThisMessage = false;
  S.pendingParagraphBreak = false;
  S.resultEventSeen = false;
  S.rawOutput = "";
  S.lastProcessed = 0;
  S.inFlightToolUses = 0;
  S.pendingQuestionData = "";
  S.todoState.length = 0;
  S.awaitingQuestionAnswer = false;
  S.lastStepType = "thinking";
}

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

function settledPrompt(attempt: CursorAcpAttemptResult): SettledPrompt {
  return { kind: "settled", attempt };
}

async function promptPoll(): Promise<PromptPoll> {
  await sleep(PROMPT_SETTLE_POLL_MS);
  return { kind: "poll" };
}

async function finalizeTurn(attempt: CursorAcpAttemptResult): Promise<void> {
  const failure = cursorAcpFailure(attempt);
  const resultEvent = cursorAcpResultEvent(attempt);
  for (const step of S.accumulatedSteps) step.status = "complete";
  const completionArgs: Record<string, JsonValue> = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success: failure === null,
    result: resultEvent.result,
    error: failure,
    activityLog: serializeSteps(S.accumulatedSteps),
    rawResultEvent: resultEvent.rawResultEvent,
    ...activeTurnIdentityArgs(),
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }

  // Completion clears streaming and may immediately dequeue the next turn.
  // Reconcile first so an old reply can never reappear in that next placeholder.
  await setFinalizingState();
  await deliverCompletionWithMedia(completionArgs);
  syncCursorStateToPersist();
  log(
    `cursor_acp daemon turn finalized success=${failure === null} steps=${S.accumulatedSteps.length}`,
  );
}

async function failTurn(message: string): Promise<void> {
  for (const step of S.accumulatedSteps) step.status = "complete";
  const completionArgs: Record<string, JsonValue> = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success: false,
    result: S.currentStreamedContent || null,
    error: message,
    activityLog: serializeSteps(S.accumulatedSteps),
    ...activeTurnIdentityArgs(),
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  await setFinalizingState();
  await deliverCompletionWithMedia(completionArgs);
}

function cleanupDaemonMarkers(): void {
  const paths = resolveDaemonPaths();
  for (const path of [paths.pid, paths.entity, paths.opts]) {
    try {
      unlinkSync(path);
    } catch {
      // The marker may already have been removed by sandbox cleanup.
    }
  }
}

/** Runs serialized prompts through one warm Cursor ACP process and session. */
export async function runCursorAcpDaemon(): Promise<void> {
  if (!CLAIM_MUTATION) {
    log("cursor_acp daemon requires CLAIM_MUTATION");
    process.exit(1);
  }
  const claimMutation = CLAIM_MUTATION;

  const paths = resolveDaemonPaths();
  writeFileSync(paths.pid, String(process.pid));
  writeFileSync(paths.entity, ENTITY_ID ?? "");
  writeFileSync(paths.opts, DAEMON_OPTS_SIG);

  const preflightOk = await runPreflightHeartbeat();
  if (!preflightOk) {
    cleanupDaemonMarkers();
    process.exit(1);
  }
  startStreamingLoops();
  await ensureDaemonGithubToken();

  let daemonExiting = false;
  let acceptingClaims = true;
  let activeTurn = false;
  let pendingTurn: ClaimedTurn | null = null;
  let cancellationKind: CancellationKind = "none";
  let cancelRequestedAt = 0;
  let turnStartedAt = 0;
  let lastEventAt = Date.now();
  let lastIdleActivityAt = Date.now();
  let currentSession: CursorAcpSession | null = null;
  let completionAttempted = false;
  const currentCancellationKind = (): CancellationKind => cancellationKind;

  const requestCancellation = async (
    kind: Exclude<CancellationKind, "none">,
  ): Promise<void> => {
    if (!activeTurn || cancellationKind !== "none") return;
    cancellationKind = kind;
    cancelRequestedAt = Date.now();
    const session = currentSession;
    if (session === null) return;
    try {
      await session.cancel();
      log(`cursor_acp daemon cancellation sent kind=${kind}`);
    } catch (error) {
      log(
        `cursor_acp daemon cancellation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const claimWatcher = async (): Promise<void> => {
    while (!daemonExiting && acceptingClaims) {
      if (callbackScriptWentStaleOnDisk()) {
        acceptingClaims = false;
        log("cursor_acp daemon callback script changed; draining current turn");
        break;
      }
      try {
        const claimed = await callConvexWithRetry("mutation", claimMutation, {
          [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
          model: MODEL,
          callbackProtocolVersion: CHAT_TURN_PROTOCOL_VERSION,
        });
        if (readCancelRequested(claimed)) {
          await requestCancellation("server");
        }
        const claimedTurn = readClaimedTurn(claimed);
        if (claimedTurn !== null) {
          await materializeTurnAttachments(claimedTurn);
          lastIdleActivityAt = Date.now();
          if (pendingTurn === null) {
            pendingTurn = claimedTurn;
          } else {
            log(
              "cursor_acp daemon received an extra claimed turn; preserving the first",
            );
          }
        }
      } catch {
        // The next short poll retries transient Convex failures.
      }
      await sleep(PROMPT_POLL_INTERVAL_MS);
    }
  };

  const waitForPrompt = async (
    session: CursorAcpSession,
    turn: ClaimedTurn,
  ): Promise<CursorAcpAttemptResult> => {
    const promptPromise = session.prompt(turn.prompt).then(settledPrompt);
    while (true) {
      const outcome = await Promise.race([promptPromise, promptPoll()]);
      if (outcome.kind === "settled") return outcome.attempt;

      const now = Date.now();
      if (
        cancellationKind !== "none" &&
        now - cancelRequestedAt > CANCEL_SETTLE_TIMEOUT_MS
      ) {
        throw new Error("Cursor ACP did not settle after cancellation");
      }
      if (cancellationKind !== "none") continue;

      const exceededRuntime = now - turnStartedAt > MAX_TOTAL_RUNTIME_MS;
      const stoppedProducingEvents =
        !S.awaitingQuestionAnswer && now - lastEventAt > NO_EVENT_TIMEOUT_MS;
      if (S.fatalHeartbeatErrorMessage) {
        await requestCancellation("watchdog");
      } else if (exceededRuntime || stoppedProducingEvents) {
        await requestCancellation("watchdog");
      }
    }
  };

  try {
    const sessionMode = prepareCursorSessionState();
    await withCursorAcpSession(
      {
        sessionMode,
        mcpServers: readCursorAcpMcpServers(),
        onEvents: () => {
          lastEventAt = Date.now();
        },
      },
      async (session) => {
        currentSession = session;
        log(
          `cursor_acp daemon warm entityId=${ENTITY_ID ?? "none"} sessionId=${session.sessionId}`,
        );
        const watcher = claimWatcher();
        while (!daemonExiting) {
          if (!activeTurn && pendingTurn !== null) {
            const turn = pendingTurn;
            pendingTurn = null;
            resetTurnState();
            setActiveTurnIdentity(turn.identity);
            activeTurn = true;
            cancellationKind = "none";
            completionAttempted = false;
            cancelRequestedAt = 0;
            turnStartedAt = Date.now();
            lastEventAt = turnStartedAt;
            try {
              const attempt = await waitForPrompt(session, turn);
              if (currentCancellationKind() === "server") {
                log(
                  "cursor_acp daemon cancelled turn settled without completion",
                );
              } else if (currentCancellationKind() === "watchdog") {
                completionAttempted = true;
                await failTurn(
                  S.fatalHeartbeatErrorMessage ||
                    "Cursor stopped responding before the turn completed.",
                );
              } else {
                completionAttempted = true;
                await finalizeTurn(attempt);
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              if (currentCancellationKind() === "server") {
                log(`cursor_acp daemon cancel settle failed: ${message}`);
              } else if (completionAttempted) {
                log(`cursor_acp daemon completion failed: ${message}`);
              } else {
                completionAttempted = true;
                await failTurn(`Cursor ACP daemon failed: ${message}`);
              }
              acceptingClaims = false;
              daemonExiting = true;
            } finally {
              setActiveTurnIdentity(null);
              activeTurn = false;
              cancellationKind = "none";
              resetTurnState();
              lastIdleActivityAt = Date.now();
            }
            continue;
          }

          if (!acceptingClaims && !activeTurn) {
            daemonExiting = true;
            break;
          }
          if (
            !activeTurn &&
            pendingTurn === null &&
            Date.now() - lastIdleActivityAt > IDLE_EXIT_MS
          ) {
            acceptingClaims = false;
            daemonExiting = true;
            log("cursor_acp daemon idle timeout");
            break;
          }
          await sleep(PROMPT_POLL_INTERVAL_MS);
        }
        await watcher;
      },
    );
    writeDoneFile("daemon-exit");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`cursor_acp daemon failed: ${message}`);
    if (
      activeTurn &&
      !completionAttempted &&
      currentCancellationKind() !== "server"
    ) {
      completionAttempted = true;
      try {
        await failTurn(`Cursor ACP daemon failed: ${message}`);
      } catch {
        // The workflow's stale-run recovery remains the final safety net.
      }
    }
  } finally {
    daemonExiting = true;
    setActiveTurnIdentity(null);
    currentSession = null;
    cleanupDaemonMarkers();
    await stopStreamingLoops();
  }
  process.exit(0);
}
