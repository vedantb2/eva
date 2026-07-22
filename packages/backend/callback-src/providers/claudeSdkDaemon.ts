import { unlinkSync, writeFileSync, readFileSync } from "fs";
import {
  COMPLETION_MUTATION,
  CONVEX_TOKEN,
  CONVEX_URL,
  CALLBACK_SCRIPT_FP,
  DAEMON_OPTS_SIG,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  MAX_TOTAL_RUNTIME_MS,
  MODEL,
  NO_OUTPUT_TIMEOUT_MS,
  REPO_ID,
  RUN_ID,
} from "../config.js";
import { callConvexWithRetry, fetchWithTimeout } from "../http/convexClient.js";
import {
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
import { processRealtimeStdoutChunk } from "../parse/streamRouter.js";
import { serializeSteps } from "../parse/stepBudget.js";
import {
  appendToRawLogFile,
  appendToRawOutput,
  trimBufferHead,
} from "../runtime/buffers.js";
import {
  syncClaudeStateToPersist,
  prepareClaudeSessionState,
} from "../session/claudeSession.js";
import {
  buildSdkOptions,
  buildConversationalSdkOptions,
  loadSdk,
  type SdkUserMessage,
} from "./claudeSdk.js";
import {
  isEscalationReply,
  shouldHoldConversationalStream,
} from "./conversationalEscalation.js";
import { callbackState as S } from "../runtime/state.js";
import { log, readResponseJson } from "../utils.js";
import type { JsonObject, JsonValue } from "../types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The daemon writes its pid + entity so the backend's prewarm alive-check can
// confirm a live, matching daemon (and skip respawning one). Prompts are no
// longer delivered by file: the daemon PULLS each turn from Convex via
// claimPendingTurn (daemon-pull), so there is no prompt/ready file to poll.
export const DAEMON_PID_FILE = "/tmp/eva-daemon.pid";
export const DAEMON_ENTITY_FILE = "/tmp/eva-daemon.entity";
// Model+tools signature this daemon booted with. The prewarm alive-check reads
// it to detect a model/tools change and respawn rather than reuse the daemon.
export const DAEMON_OPTS_FILE = "/tmp/eva-daemon.opts";

// Public Convex mutation the daemon polls to atomically claim the next staged
// turn's prompt for THIS session (ENTITY_ID). Mirrors how COMPLETION_MUTATION is
// invoked over /api/mutation with the sandbox CONVEX_TOKEN identity.
const CLAIM_PENDING_TURN_MUTATION = "sessionWorkflow:claimPendingTurn";
const OPEN_SYNTHETIC_TURN_MUTATION = "sessionWorkflow:openSyntheticTurn";
const COMPLETE_SYNTHETIC_TURN_MUTATION =
  "sessionWorkflow:completeSyntheticTurn";

// Exit if no new turn arrives for this long, so the sandbox can be reclaimed.
// Kept generous so a normal work session never pays a mid-session respawn (the
// respawn — re-upload + boot — is the ~20s "slow hi" users feel). Matches the
// keep-warm window of comparable agents (t3code reaps at 30min).
const IDLE_EXIT_MS = 45 * 60 * 1000;
// Poll interval for the claim mutation. Low enough to keep handoff→turn-start
// latency to ~one poll; the turn itself dominates so this only trims the tail.
const PROMPT_POLL_INTERVAL_MS = 50;

// Per-turn watchdog. Without this a turn whose SDK query stalls or ends without
// emitting a result would never send a completion event, so the workflow's
// awaitEvent hangs until the 2h stale-session timeout (empty "Working…" bubble).
// Mirrors the one-shot path (claudeSdk.ts): fail the turn if it produces no SDK
// message for a while, or exceeds the hard runtime cap. On a fire we send a
// failure completion (resolving awaitEvent) and exit so the next turn respawns a
// clean daemon rather than reusing a wedged query.
const NO_MESSAGE_TIMEOUT_MS = NO_OUTPUT_TIMEOUT_MS * 5;
const WATCHDOG_TICK_MS = 5000;

let turnActive = false;
let turnStartedAtMs = 0;
let lastMessageAtMs = 0;

type TurnKind = "conversational" | "agent";

type ClaimedTurn = {
  prompt: string;
  turnKind: TurnKind;
  attachmentUrls: string[];
};

type DaemonMessage = Record<string, JsonValue>;

type DaemonTurn = { kind: "real" } | { kind: "synthetic"; messageId: string };

type BackgroundAgentEntry = {
  toolUseId: string;
  taskId?: string;
  description?: string;
};

let daemonTurn: DaemonTurn | null = null;
let pendingClaimedTurn: ClaimedTurn | null = null;
let daemonExiting = false;
let openingSyntheticTurn = false;
let lastIdleActivityAtMs = Date.now();
let agentTurnOutput = "";
let agentTurnStartedAt = 0;
let sawFirstMessageThisTurn = { value: false };
let sawAssistantThisTurn = { value: false };

const recognisedSubagentToolUseIds = new Set<string>();
const settledSubagentToolUseIds = new Set<string>();
const unsettledBackgroundAgents = new Map<string, BackgroundAgentEntry>();

function beginWatchedTurn(): void {
  turnActive = true;
  turnStartedAtMs = Date.now();
  lastMessageAtMs = turnStartedAtMs;
}

function noteWatchedMessage(): void {
  lastMessageAtMs = Date.now();
}

// Called as soon as a turn's result is in hand (before finalize) and between
// turns, so the watchdog only guards a turn that is genuinely in flight.
function endWatchedTurn(): void {
  turnActive = false;
}

/**
 * Sends a failure completion for the current turn (resolving the workflow's
 * awaitEvent so the UI stops spinning) and exits the process. Exiting abandons a
 * potentially wedged SDK query; the next turn's prewarm boots a fresh daemon.
 */
async function failTurnAndExit(error: string): Promise<never> {
  log("daemon: failing turn — " + error);
  try {
    await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", {
      [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
      success: false,
      result: null,
      error,
      activityLog: serializeSteps(S.accumulatedSteps),
      ...(RUN_ID ? { runId: RUN_ID } : {}),
    });
  } catch {
    /* best-effort: exit regardless so the daemon does not wedge */
  }
  try {
    unlinkSync(DAEMON_PID_FILE);
  } catch {
    /* ignore */
  }
  await stopStreamingLoops();
  process.exit(1);
}

/** Arms the per-turn watchdog interval for the daemon's lifetime. */
function startTurnWatchdog(): void {
  const timer = setInterval(() => {
    if (!turnActive) return;
    const now = Date.now();
    // A turn paused on a blocking question emits no SDK messages by design —
    // keep both timers fresh so the wait is never mistaken for a stalled turn.
    if (S.awaitingQuestionAnswer) {
      turnStartedAtMs = now;
      lastMessageAtMs = now;
      return;
    }
    if (now - turnStartedAtMs > MAX_TOTAL_RUNTIME_MS) {
      turnActive = false;
      if (daemonTurn?.kind === "synthetic") {
        void failSyntheticTurn(
          "The assistant exceeded the maximum turn runtime.",
        );
      } else {
        void failTurnAndExit(
          "The assistant exceeded the maximum turn runtime.",
        );
      }
    } else if (now - lastMessageAtMs > NO_MESSAGE_TIMEOUT_MS) {
      turnActive = false;
      if (daemonTurn?.kind === "synthetic") {
        void failSyntheticTurn(
          "The assistant stopped responding. Please try again.",
        );
      } else {
        void failTurnAndExit(
          "The assistant stopped responding. Please try again.",
        );
      }
    }
  }, WATCHDOG_TICK_MS);
  timer.unref?.();
}

/**
 * A queue-backed async iterable of user messages that BLOCKS when empty and
 * never returns. Feeding this as `query({ prompt })` keeps the underlying
 * `claude` subprocess + MCP + API connection warm across turns — each pushed
 * message starts a new turn (ended by a `result` message).
 */
function createPromptStream(): {
  push: (text: string) => void;
  iterable: AsyncIterable<SdkUserMessage>;
} {
  const queue: SdkUserMessage[] = [];
  let notify: (() => void) | null = null;
  const push = (text: string): void => {
    queue.push({
      type: "user",
      message: { role: "user", content: text },
      parent_tool_use_id: null,
      session_id: S.activeClaudeSessionId || "",
    });
    const resume = notify;
    notify = null;
    if (resume) resume();
  };
  const iterable: AsyncIterable<SdkUserMessage> = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (queue.length === 0) {
            await new Promise<void>((resolve) => {
              notify = resolve;
            });
          }
          const value = queue.shift();
          if (value === undefined) {
            return { value: undefined, done: true as const };
          }
          return { value, done: false as const };
        },
      };
    },
  };
  return { push, iterable };
}

/** Sessions may push git commits; refresh the installation token like the one-shot path. */
async function ensureGithubToken(): Promise<void> {
  if (!REPO_ID || !CONVEX_URL || !CONVEX_TOKEN) return;
  try {
    const res = await fetchWithTimeout(CONVEX_URL + "/api/action", {
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
    if (!res.ok) return;
    const data = await readResponseJson(res);
    const token = readGithubToken(data);
    if (token) {
      process.env.GITHUB_TOKEN = token;
      process.env.GH_TOKEN = token;
    }
  } catch {
    /* non-fatal */
  }
}

function readGithubToken(data: JsonValue | null): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const value = data.value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const payload: JsonObject = value;
  return typeof payload.token === "string" ? payload.token : null;
}

/** Clears the per-turn accumulators so the next turn starts clean on the same query. */
function resetTurnState(): void {
  S.accumulatedSteps.length = 0;
  S.currentStreamedContent = "";
  S.streamedAssistantTextThisMessage = false;
  S.resultEventSeen = false;
  S.rawOutput = "";
  // rawOutput is truncated to "" above, so the flush cursor must return to the
  // head — otherwise flushStreaming's `rawOutput.length <= lastProcessed` guard
  // stays true for the whole next turn and its lines are never parsed into
  // accumulatedSteps (activity would be empty from turn 2 onward).
  S.lastProcessed = 0;
  S.inFlightToolUses = 0;
  S.pendingQuestionData = "";
  S.todoState.length = 0;
  S.awaitingQuestionAnswer = false;
  S.lastStepType = "thinking";
}

type FinalizeTurnOptions = {
  /** Conversational one-shots skip transcript persistence — not on the agent resume path. */
  skipBookkeeping?: boolean;
};

/** Reports one finished turn to the session workflow (mirrors the one-shot completion). */
async function finalizeTurn(
  output: string,
  opts: FinalizeTurnOptions = {},
): Promise<void> {
  // Drain the buffered turn output into S.accumulatedSteps before building the
  // completion payload — exactly like the one-shot path (index.ts) flushes after
  // its attempt loop. processRealtimeStdoutChunk only runs the streaming
  // side-effects (onStreamLine); it does NOT parse tool_use blocks into
  // accumulatedSteps. Only flushStreaming -> parseStreamEvent -> claudeParseLine
  // does that, and it runs on a 150ms interval, so without this synchronous
  // drain the activityLog is read (and then resetTurnState-cleared) before the
  // loop has parsed this turn's tool steps — yielding an empty "[]" activityLog.
  await flushStreaming();
  const resultEvent = extractResultEvent(output);
  for (const step of S.accumulatedSteps) step.status = "complete";
  const activityLog = serializeSteps(S.accumulatedSteps);
  const success = resultEvent ? !resultEvent.isError : false;
  const completionArgs: Record<string, string | boolean | null> = {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    success,
    result: resultEvent?.result ?? S.rawOutput,
    error: resultEvent?.isError ? resultEvent.result : null,
    activityLog,
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (resultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = resultEvent.rawResultEvent;
  }
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }
  // Proof: media before completion so the workflow's hasMediaForRun check does
  // not spuriously retry. Chat/coding: completion first so attachMedia can patch
  // the assistant message that was just written.
  const completionSentAt = Date.now();
  await deliverCompletionWithMedia(completionArgs);
  log(
    "daemon: turn finalized success=" +
      success +
      " steps=" +
      activityLog.length +
      " (completion mutation " +
      (Date.now() - completionSentAt) +
      "ms)",
  );
  // Persist the Claude transcript to the volume for restart recovery, and send a
  // final streaming reconcile. Both run AFTER completion so the ~5s synchronous
  // transcript copy never delays the reply the user is waiting on. The sandbox
  // stays warm between turns, so this only guards against a sandbox restart.
  // accumulatedSteps is still populated (resetTurnState runs after this returns).
  // setFinalizingState pushes the now-complete steps to the streaming heartbeat;
  // the buffer was already drained at the top of finalizeTurn, so a plain
  // flushStreaming() here would early-return without reflecting the completed
  // status.
  if (!opts.skipBookkeeping) {
    const bookkeepingAt = Date.now();
    syncClaudeStateToPersist("daemon-turn");
    await setFinalizingState();
    log(
      "daemon: post-turn bookkeeping took " +
        (Date.now() - bookkeepingAt) +
        "ms",
    );
  }
}

/**
 * Reads the `prompt` string out of a claimPendingTurn result. The Convex
 * `/api/mutation` HTTP endpoint wraps the return value in `{ status, value }`
 * (same envelope readToken() unwraps for `/api/action`), so the actual
 * `{ prompt }` lives under `.value`. Falls back to the top level in case an
 * unwrapped value is ever passed.
 */
function readClaimedPrompt(result: JsonValue): string | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  const prompt = payload.prompt;
  return typeof prompt === "string" ? prompt : null;
}

function readClaimedAttachmentUrls(payload: {
  [key: string]: JsonValue;
}): string[] {
  const field = payload.attachmentUrls;
  if (!Array.isArray(field)) {
    return [];
  }
  return field.filter((url): url is string => typeof url === "string");
}

function readClaimedTurn(result: JsonValue): ClaimedTurn | null {
  const prompt = readClaimedPrompt(result);
  if (prompt === null) {
    return null;
  }
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return { prompt, turnKind: "agent", attachmentUrls: [] };
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  const turnKindField = payload.turnKind;
  const turnKind: TurnKind =
    turnKindField === "conversational" ? "conversational" : "agent";
  return {
    prompt,
    turnKind,
    attachmentUrls: readClaimedAttachmentUrls(payload),
  };
}

function readSyntheticTurnMessageId(result: JsonValue): string | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  const messageId = payload.messageId;
  return typeof messageId === "string" ? messageId : null;
}

function readParentToolUseId(message: DaemonMessage): string | null {
  const parentField = message.parent_tool_use_id;
  if (typeof parentField === "string" && parentField.trim()) {
    return parentField.trim();
  }
  return null;
}

function readStringField(
  message: DaemonMessage,
  field: string,
): string | undefined {
  const value = message[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function recogniseSubagentToolUses(message: DaemonMessage): void {
  if (message.type !== "assistant") {
    return;
  }
  const nested = message.message;
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
    return;
  }
  const content = nested.content;
  if (!Array.isArray(content)) {
    return;
  }
  for (const block of content) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) {
      continue;
    }
    if (block.type !== "tool_use") {
      continue;
    }
    const name = block.name;
    if (name !== "Agent" && name !== "Task") {
      continue;
    }
    const id = block.id;
    if (typeof id === "string" && id.trim()) {
      recognisedSubagentToolUseIds.add(id.trim());
    }
  }
}

function shouldDropSubagentMessage(message: DaemonMessage): boolean {
  const parentId = readParentToolUseId(message);
  if (parentId === null) {
    return false;
  }
  return settledSubagentToolUseIds.has(parentId);
}

function completeSubtaskStep(toolUseId: string): void {
  for (const step of S.accumulatedSteps) {
    if (step.type === "subtask" && step.toolUseId === toolUseId) {
      step.status = "complete";
    }
  }
}

function settleSubagent(toolUseId: string): void {
  settledSubagentToolUseIds.add(toolUseId);
  unsettledBackgroundAgents.delete(toolUseId);
  completeSubtaskStep(toolUseId);
}

function handleSystemTaskMessage(message: DaemonMessage): void {
  if (message.type !== "system") {
    return;
  }
  const subtype = message.subtype;
  if (typeof subtype !== "string") {
    return;
  }
  const toolUseId = readStringField(message, "tool_use_id");
  if (subtype === "task_started" && toolUseId) {
    unsettledBackgroundAgents.set(toolUseId, {
      toolUseId,
      taskId: readStringField(message, "task_id"),
      description: readStringField(message, "description"),
    });
    return;
  }
  if (
    (subtype === "task_updated" || subtype === "task_notification") &&
    toolUseId
  ) {
    const status = readStringField(message, "status");
    const terminal =
      status === "completed" ||
      status === "failed" ||
      status === "killed" ||
      subtype === "task_notification";
    if (terminal) {
      settleSubagent(toolUseId);
    }
  }
}

async function failSyntheticTurn(error: string): Promise<void> {
  if (daemonTurn?.kind !== "synthetic") {
    return;
  }
  log("daemon: failing synthetic turn — " + error);
  const messageId = daemonTurn.messageId;
  try {
    await flushStreaming();
    for (const step of S.accumulatedSteps) {
      step.status = "complete";
    }
    await callConvexWithRetry("mutation", COMPLETE_SYNTHETIC_TURN_MUTATION, {
      sessionId: ENTITY_ID ?? "",
      messageId,
      success: false,
      result: null,
      error,
      activityLog: serializeSteps(S.accumulatedSteps),
    });
  } catch {
    /* best-effort */
  }
  endWatchedTurn();
  resetTurnState();
  daemonTurn = null;
  agentTurnOutput = "";
}

async function ensureSyntheticTurn(): Promise<void> {
  if (daemonTurn !== null || openingSyntheticTurn) {
    return;
  }
  openingSyntheticTurn = true;
  try {
    const result = await callConvexWithRetry(
      "mutation",
      OPEN_SYNTHETIC_TURN_MUTATION,
      { sessionId: ENTITY_ID ?? "" },
    );
    const messageId = readSyntheticTurnMessageId(result);
    if (messageId === null) {
      log("daemon: openSyntheticTurn returned no messageId");
      return;
    }
    resetTurnState();
    daemonTurn = { kind: "synthetic", messageId };
    agentTurnStartedAt = Date.now();
    sawFirstMessageThisTurn = { value: false };
    sawAssistantThisTurn = { value: false };
    S.activeAttemptStartedAt = agentTurnStartedAt;
    beginWatchedTurn();
    log("daemon: synthetic turn opened messageId=" + messageId);
  } finally {
    openingSyntheticTurn = false;
  }
}

async function finalizeSyntheticTurn(output: string): Promise<void> {
  if (daemonTurn?.kind !== "synthetic") {
    return;
  }
  const messageId = daemonTurn.messageId;
  await flushStreaming();
  const resultEvent = extractResultEvent(output);
  for (const step of S.accumulatedSteps) {
    step.status = "complete";
  }
  const activityLog = serializeSteps(S.accumulatedSteps);
  const success = resultEvent ? !resultEvent.isError : false;
  const completionArgs: Record<string, string | boolean | null> = {
    sessionId: ENTITY_ID ?? "",
    messageId,
    success,
    result: resultEvent?.result ?? S.rawOutput,
    error: resultEvent?.isError ? resultEvent.result : null,
    activityLog,
  };
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }
  await callConvexWithRetry(
    "mutation",
    COMPLETE_SYNTHETIC_TURN_MUTATION,
    completionArgs,
  );
  syncClaudeStateToPersist("daemon-synthetic-turn");
  endWatchedTurn();
  resetTurnState();
  daemonTurn = null;
  agentTurnOutput = "";
  log("daemon: synthetic turn finalized success=" + success);
}

function startRealAgentTurn(turn: ClaimedTurn, agentRunner: WarmRunner): void {
  // Do not drain the agent pump here: buffered post-result / background-agent
  // messages must stay queued so the main loop can open a synthetic turn (or
  // attribute them into this real turn once it is live).
  resetTurnState();
  daemonTurn = { kind: "real" };
  agentTurnStartedAt = Date.now();
  sawFirstMessageThisTurn = { value: false };
  sawAssistantThisTurn = { value: false };
  beginWatchedTurn();
  agentRunner.push(turn.prompt);
  S.activeAttemptStartedAt = agentTurnStartedAt;
  agentTurnOutput = "";
  log("daemon: real turn started");
}

function startClaimWatcher(_convRunner: WarmConversationalRunner): void {
  void (async () => {
    while (!daemonExiting) {
      if (callbackScriptWentStaleOnDisk()) {
        log("daemon: callback script updated on disk — exiting for respawn");
        daemonExiting = true;
        return;
      }
      try {
        const claimed = await callConvexWithRetry(
          "mutation",
          CLAIM_PENDING_TURN_MUTATION,
          { sessionId: ENTITY_ID ?? "", model: MODEL },
        );
        const turn = readClaimedTurn(claimed);
        if (turn !== null) {
          await materializeTurnAttachments(turn);
          lastIdleActivityAtMs = Date.now();
          if (turn.turnKind === "conversational") {
            if (daemonTurn === null && pendingClaimedTurn === null) {
              pendingClaimedTurn = turn;
            } else if (
              daemonTurn?.kind === "synthetic" &&
              pendingClaimedTurn === null
            ) {
              pendingClaimedTurn = turn;
            } else {
              log(
                "daemon: conversational claim deferred — turn already active",
              );
            }
          } else if (daemonTurn === null) {
            pendingClaimedTurn = turn;
          } else if (daemonTurn.kind === "synthetic") {
            pendingClaimedTurn = turn;
          } else {
            log("daemon: claim while real turn active — unexpected");
          }
        }
      } catch {
        /* retry on next poll */
      }
      await sleep(PROMPT_POLL_INTERVAL_MS);
    }
  })();
}

async function handleClaimedTurn(
  turn: ClaimedTurn,
  agentRunner: WarmRunner,
  convRunner: WarmConversationalRunner,
): Promise<void> {
  if (turn.turnKind === "conversational") {
    const outcome = await runConversationalWarmTurn(convRunner, turn.prompt);
    if (outcome === "escalated") {
      startRealAgentTurn({ ...turn, turnKind: "agent" }, agentRunner);
    }
    return;
  }
  startRealAgentTurn(turn, agentRunner);
}

async function runDaemonMessagePump(
  agentRunner: WarmRunner,
  convRunner: WarmConversationalRunner,
): Promise<void> {
  while (!daemonExiting) {
    if (daemonTurn === null && pendingClaimedTurn !== null) {
      const turn = pendingClaimedTurn;
      pendingClaimedTurn = null;
      await handleClaimedTurn(turn, agentRunner, convRunner);
      continue;
    }

    if (
      daemonTurn === null &&
      pendingClaimedTurn === null &&
      unsettledBackgroundAgents.size === 0 &&
      Date.now() - lastIdleActivityAtMs > IDLE_EXIT_MS
    ) {
      log("daemon: idle timeout — exiting");
      return;
    }

    if (daemonTurn === null && !agentRunner.hasPending()) {
      await sleep(PROMPT_POLL_INTERVAL_MS);
      continue;
    }

    const message = await agentRunner.waitMessage();
    if (message === null) {
      if (turnActive) {
        if (daemonTurn?.kind === "synthetic") {
          await failSyntheticTurn(
            "The assistant ended without a reply. Please try again.",
          );
        } else {
          await failTurnAndExit(
            "The assistant ended without a reply. Please try again.",
          );
        }
      }
      return;
    }

    lastIdleActivityAtMs = Date.now();

    if (shouldDropSubagentMessage(message)) {
      const messageType = typeof message.type === "string" ? message.type : "?";
      log("daemon: dropped settled subagent message type=" + messageType);
      continue;
    }

    recogniseSubagentToolUses(message);
    handleSystemTaskMessage(message);

    if (message.type === "result" && daemonTurn === null) {
      log("daemon: result with no live turn — ignored");
      continue;
    }

    if (daemonTurn === null) {
      await ensureSyntheticTurn();
      if (daemonTurn === null) {
        continue;
      }
      agentTurnOutput = "";
    }

    noteWatchedMessage();
    const processed = handleDaemonMessage(
      message,
      agentTurnOutput,
      agentTurnStartedAt,
      sawFirstMessageThisTurn,
      sawAssistantThisTurn,
    );
    agentTurnOutput = processed.output;
    if (!processed.isResult) {
      continue;
    }

    endWatchedTurn();
    const resultAt = Date.now();
    log(
      "daemon[timing]: result message +" +
        (resultAt - agentTurnStartedAt) +
        "ms after turn start",
    );

    if (daemonTurn?.kind === "synthetic") {
      await finalizeSyntheticTurn(agentTurnOutput);
    } else {
      await finalizeTurn(agentTurnOutput);
      log(
        "daemon[timing]: finalizeTurn took " + (Date.now() - resultAt) + "ms",
      );
      daemonTurn = null;
    }
    // Leave any already-queued SDK messages in the pump. The next loop
    // iteration will ensureSyntheticTurn() / handle them — draining here
    // orphaned background-agent "report back" continuations (session 43).

    if (pendingClaimedTurn !== null && daemonTurn === null) {
      const parked = pendingClaimedTurn;
      pendingClaimedTurn = null;
      await handleClaimedTurn(parked, agentRunner, convRunner);
    }
  }
}

/** Processes one SDK message through the streaming pipeline. */
function handleDaemonMessage(
  message: DaemonMessage,
  output: string,
  turnStartedAt: number,
  sawFirstMessageThisTurn: { value: boolean },
  sawAssistantThisTurn: { value: boolean },
): { output: string; isResult: boolean } {
  const messageType = typeof message.type === "string" ? message.type : "?";
  if (!sawFirstMessageThisTurn.value) {
    sawFirstMessageThisTurn.value = true;
    log(
      "daemon[timing]: first SDK message (" +
        messageType +
        ") +" +
        (Date.now() - turnStartedAt) +
        "ms after turn start",
    );
  }
  if (!sawAssistantThisTurn.value && messageType === "assistant") {
    sawAssistantThisTurn.value = true;
    log(
      "daemon[timing]: first assistant msg +" +
        (Date.now() - turnStartedAt) +
        "ms after turn start",
    );
  }
  const line = JSON.stringify(message) + "\n";
  appendToRawLogFile(line);
  const nextOutput = trimBufferHead(output + line);
  appendToRawOutput(line);
  processRealtimeStdoutChunk(line);

  const isResult = message.type === "result";
  return { output: nextOutput, isResult };
}

/** Pulls visible reply text from a final assistant SDK message. */
function extractAssistantTextFromMessage(
  message: DaemonMessage,
): string | null {
  if (message.type !== "assistant") {
    return null;
  }
  const nested = message.message;
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) {
    return null;
  }
  const content = nested.content;
  if (!Array.isArray(content)) {
    return null;
  }
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) {
      continue;
    }
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  const text = parts.join("");
  return text.length > 0 ? text : null;
}

/** Appends live text_delta tokens (or replaces with a full assistant text). */
function appendConversationalStreamText(
  message: DaemonMessage,
  previous: string,
): string {
  const full = extractAssistantTextFromMessage(message);
  if (full !== null) {
    return full;
  }
  if (message.type !== "stream_event") {
    return previous;
  }
  const event = message.event;
  if (typeof event !== "object" || event === null || Array.isArray(event)) {
    return previous;
  }
  if (event.type !== "content_block_delta") {
    return previous;
  }
  const delta = event.delta;
  if (typeof delta !== "object" || delta === null || Array.isArray(delta)) {
    return previous;
  }
  if (delta.type === "text_delta" && typeof delta.text === "string") {
    return previous + delta.text;
  }
  return previous;
}

function extractResultText(message: DaemonMessage): string | null {
  if (message.type !== "result") {
    return null;
  }
  return typeof message.result === "string" ? message.result : null;
}

function appendSyntheticResultLine(output: string, replyText: string): string {
  const line =
    JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      result: replyText,
    }) + "\n";
  return trimBufferHead(output + line);
}

type WarmRunner = {
  push: (text: string) => void;
  waitMessage: () => Promise<DaemonMessage | null>;
  drainPending: () => DaemonMessage[];
  hasPending: () => boolean;
};

type WarmConversationalRunner = WarmRunner;

/**
 * Persistent conversational query (Haiku, no tools/MCP/resume). Booted once at
 * daemon start so conversational turns only pay model time, not CLI spawn.
 */
function createWarmConversationalRunner(
  sdk: Awaited<ReturnType<typeof loadSdk>>,
): WarmConversationalRunner {
  const { push, iterable } = createPromptStream();
  log("daemon: booting warm conversational query()");
  const query = sdk.query({
    prompt: iterable,
    options: buildConversationalSdkOptions(),
  });

  const pending: DaemonMessage[] = [];
  let notify: (() => void) | null = null;
  let pumpFinished = false;

  const wakeWaiters = (): void => {
    const resume = notify;
    notify = null;
    if (resume) resume();
  };

  void (async () => {
    try {
      for await (const raw of query) {
        if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
          continue;
        }
        pending.push(raw);
        wakeWaiters();
      }
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      log("daemon: conversational query pump failed — " + messageText);
    } finally {
      pumpFinished = true;
      wakeWaiters();
    }
  })();

  const waitMessage = async (): Promise<DaemonMessage | null> => {
    while (pending.length === 0) {
      if (pumpFinished) return null;
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
      if (pending.length === 0 && pumpFinished) return null;
    }
    const message = pending.shift();
    return message ?? null;
  };

  const drainPending = (): DaemonMessage[] => {
    const drained = pending.slice();
    pending.length = 0;
    return drained;
  };

  const hasPending = (): boolean => pending.length > 0;

  return { push, waitMessage, drainPending, hasPending };
}

/**
 * Session-lifetime agent query pump. Same queue-backed shape as the
 * conversational runner so turn boundaries are state changes, not loop exits.
 */
function createWarmAgentRunner(
  sdk: Awaited<ReturnType<typeof loadSdk>>,
  options: ReturnType<typeof buildSdkOptions>,
): WarmRunner {
  const { push, iterable } = createPromptStream();
  log("daemon: booting warm agent query()");
  const query = sdk.query({ prompt: iterable, options });

  const pending: DaemonMessage[] = [];
  let notify: (() => void) | null = null;
  let pumpFinished = false;

  const wakeWaiters = (): void => {
    const resume = notify;
    notify = null;
    if (resume) resume();
  };

  void (async () => {
    try {
      for await (const raw of query) {
        if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
          continue;
        }
        pending.push(raw);
        wakeWaiters();
      }
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      log("daemon: agent query pump failed — " + messageText);
    } finally {
      pumpFinished = true;
      wakeWaiters();
    }
  })();

  const waitMessage = async (): Promise<DaemonMessage | null> => {
    while (pending.length === 0) {
      if (pumpFinished) return null;
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
      if (pending.length === 0 && pumpFinished) return null;
    }
    const message = pending.shift();
    return message ?? null;
  };

  const drainPending = (): DaemonMessage[] => {
    const drained = pending.slice();
    pending.length = 0;
    return drained;
  };

  const hasPending = (): boolean => pending.length > 0;

  return { push, waitMessage, drainPending, hasPending };
}

/** Drops post-assistant SDK messages until the turn's result line is consumed. */
async function drainUntilConversationalResult(
  runner: WarmConversationalRunner,
): Promise<void> {
  while (true) {
    const message = await runner.waitMessage();
    if (message === null) {
      return;
    }
    if (message.type === "result") {
      return;
    }
  }
}

/**
 * Feed a prompt into the warm conversational query and wait for its result.
 * Returns `"escalated"` when Haiku asks for the full agent path (sentinel);
 * the caller re-dispatches the same turn without waiting for a new claim.
 */
async function runConversationalWarmTurn(
  runner: WarmConversationalRunner,
  prompt: string,
): Promise<"completed" | "escalated"> {
  resetTurnState();
  const turnStartedAt = Date.now();
  S.activeAttemptStartedAt = turnStartedAt;
  beginWatchedTurn();
  log("daemon: conversational warm turn started");
  runner.push(prompt);
  let output = "";
  const sawFirstMessageThisTurn = { value: false };
  const sawAssistantThisTurn = { value: false };
  // Hold stream_event flushes while text is still a prefix of the escalation
  // sentinel so `<<EVA_ESCALATE>>` never flashes in the UI.
  let holdStreaming = true;
  const heldLines: string[] = [];
  let streamedText = "";

  const releaseOrHoldStream = (line: string): void => {
    if (!holdStreaming) {
      processRealtimeStdoutChunk(line);
      return;
    }
    if (shouldHoldConversationalStream(streamedText)) {
      heldLines.push(line);
      return;
    }
    holdStreaming = false;
    for (const held of heldLines) {
      processRealtimeStdoutChunk(held);
    }
    heldLines.length = 0;
    processRealtimeStdoutChunk(line);
  };

  const processConversationalMessage = (
    message: DaemonMessage,
  ): { isResult: boolean } => {
    const messageType = typeof message.type === "string" ? message.type : "?";
    if (!sawFirstMessageThisTurn.value) {
      sawFirstMessageThisTurn.value = true;
      log(
        "daemon[timing]: first SDK message (" +
          messageType +
          ") +" +
          (Date.now() - turnStartedAt) +
          "ms after turn start",
      );
    }
    if (!sawAssistantThisTurn.value && messageType === "assistant") {
      sawAssistantThisTurn.value = true;
      log(
        "daemon[timing]: first assistant msg +" +
          (Date.now() - turnStartedAt) +
          "ms after turn start",
      );
    }
    const line = JSON.stringify(message) + "\n";
    appendToRawLogFile(line);
    output = trimBufferHead(output + line);
    appendToRawOutput(line);
    streamedText = appendConversationalStreamText(message, streamedText);
    releaseOrHoldStream(line);
    return { isResult: message.type === "result" };
  };

  const escalateTurn = async (): Promise<"escalated"> => {
    endWatchedTurn();
    resetTurnState();
    await drainUntilConversationalResult(runner);
    log(
      "daemon[timing]: conversational escalated +" +
        (Date.now() - turnStartedAt) +
        "ms",
    );
    return "escalated";
  };

  while (true) {
    const message = await runner.waitMessage();
    if (message === null) {
      // The warm Haiku query ended without a result — surface a failure so the
      // workflow's awaitEvent resolves instead of hanging, then respawn.
      return failTurnAndExit(
        "The assistant could not generate a reply. Please try again.",
      );
    }
    noteWatchedMessage();
    const processed = processConversationalMessage(message);
    if (!processed.isResult) {
      const replyText = extractAssistantTextFromMessage(message);
      if (replyText !== null) {
        if (isEscalationReply(replyText)) {
          return escalateTurn();
        }
        endWatchedTurn();
        output = appendSyntheticResultLine(output, replyText);
        const resultAt = Date.now();
        log(
          "daemon[timing]: conversational early result (assistant) +" +
            (resultAt - turnStartedAt) +
            "ms after turn start",
        );
        await finalizeTurn(output, { skipBookkeeping: true });
        log(
          "daemon[timing]: conversational finalizeTurn took " +
            (Date.now() - resultAt) +
            "ms",
        );
        resetTurnState();
        await drainUntilConversationalResult(runner);
        return "completed";
      }
      continue;
    }
    const resultText = extractResultText(message);
    if (
      (resultText !== null && isEscalationReply(resultText)) ||
      isEscalationReply(streamedText)
    ) {
      return escalateTurn();
    }
    endWatchedTurn();
    const resultAt = Date.now();
    log(
      "daemon[timing]: conversational result +" +
        (resultAt - turnStartedAt) +
        "ms after turn start",
    );
    await finalizeTurn(output, { skipBookkeeping: true });
    log(
      "daemon[timing]: conversational finalizeTurn took " +
        (Date.now() - resultAt) +
        "ms",
    );
    resetTurnState();
    return "completed";
  }
}

/**
 * Returns true when a newer callback bundle was uploaded while this daemon is
 * running — exit cleanly so the next prewarm can spawn with fresh code.
 */
function callbackScriptWentStaleOnDisk(): boolean {
  if (!CALLBACK_SCRIPT_FP) return false;
  try {
    const onDisk = readFileSync("/tmp/eva-callback-fp", "utf8").trim();
    return onDisk !== CALLBACK_SCRIPT_FP;
  } catch {
    return false;
  }
}

/**
 * Polls the claimPendingTurn mutation until a turn is staged for this session
 * (daemon-pull), then returns it. Returns null on idle timeout so the
 * daemon can exit and free the sandbox. The claim is atomic server-side, so a
 * prompt is handed to exactly one poll and never re-executed.
 */
/** Mirrors attachmentExtensionForMimeType in convex/_daytona/attachments.ts. */
function attachmentExtensionForMimeType(mimeType: string): string {
  const type = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (type) {
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "text/html":
      return ".html";
    case "text/markdown":
      return ".md";
    case "text/plain":
      return ".txt";
    default:
      if (type.startsWith("image/")) return ".png";
      return ".bin";
  }
}

/**
 * Downloads this turn's input attachments into the sandbox filesystem and
 * appends a note pointing the agent at them, so a claimed turn's prompt
 * references files that already exist on disk (no race — the daemon owns
 * ordering). Uses the same flat `/tmp/eva-attachment-<n>.<ext>` scheme + note
 * text as the CLI launch path (convex/_daytona/attachments.ts). Failed
 * downloads are skipped.
 */
async function materializeTurnAttachments(turn: ClaimedTurn): Promise<void> {
  if (turn.attachmentUrls.length === 0) return;
  const paths: string[] = [];
  for (let index = 0; index < turn.attachmentUrls.length; index++) {
    const url = turn.attachmentUrls[index];
    if (!url) continue;
    try {
      const res = await fetchWithTimeout(url, { method: "GET" });
      if (!res.ok) {
        log(`daemon: attachment download failed status=${res.status}`);
        continue;
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      const extension = attachmentExtensionForMimeType(
        res.headers.get("content-type") ?? "",
      );
      const path = `/tmp/eva-attachment-${index}${extension}`;
      writeFileSync(path, bytes);
      paths.push(path);
    } catch (error) {
      log(
        `daemon: attachment download error ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  if (paths.length === 0) return;
  const list = paths.map((p) => `- ${p}`).join("\n");
  turn.prompt += `\n\n---\nThe user attached the following file(s). Read them with your file-reading tool before responding:\n${list}`;
}

/**
 * Persistent warm-session daemon. Creates one `query()` and feeds it prompts
 * across turns so only the first turn pays the CLI/MCP/API boot; later turns
 * cost model time only. Session-only (entity/streaming/completion are stable
 * per session — only the prompt varies). Falls back to the one-shot path (via
 * launchOnExistingSandbox respawn) if this process dies.
 */
export async function runSdkDaemon(): Promise<void> {
  writeFileSync(DAEMON_PID_FILE, String(process.pid));
  writeFileSync(DAEMON_ENTITY_FILE, ENTITY_ID ?? "");
  writeFileSync(DAEMON_OPTS_FILE, DAEMON_OPTS_SIG);

  const preflightOk = await runPreflightHeartbeat();
  if (!preflightOk) {
    log("daemon: preflight failed");
    process.exit(1);
  }
  startStreamingLoops();
  await ensureGithubToken();

  // Session mode establishes/continues the Claude session id used for resume.
  const sessionMode = prepareClaudeSessionState();
  const options = buildSdkOptions(sessionMode);
  const sdk = await loadSdk();
  const convRunner = createWarmConversationalRunner(sdk);
  const agentRunner = createWarmAgentRunner(sdk, options);

  log(
    "runSdkDaemon started (entityId=" +
      (ENTITY_ID ?? "none") +
      ", mode=" +
      sessionMode.mode +
      ")",
  );

  // Daemon-pull: the claim watcher polls claimPendingTurn every 50ms while the
  // agent pump consumes the session-lifetime SDK stream (including synthetic
  // continuations between real turns).
  log("daemon: warm query() live, claim watcher started");
  startTurnWatchdog();
  startClaimWatcher(convRunner);

  try {
    await runDaemonMessagePump(agentRunner, convRunner);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    log("daemon: query failed — " + messageText);
    try {
      await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", {
        [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
        success: false,
        result: null,
        error: "Agent SDK daemon failed: " + messageText,
        activityLog: serializeSteps(S.accumulatedSteps),
      });
    } catch {
      /* ignore */
    }
  } finally {
    try {
      unlinkSync(DAEMON_PID_FILE);
    } catch {
      /* ignore */
    }
    await stopStreamingLoops();
  }
  process.exit(0);
}
