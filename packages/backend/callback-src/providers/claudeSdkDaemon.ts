import { unlinkSync, writeFileSync, readFileSync } from "fs";
import {
  CLAIM_MUTATION,
  COMPLETE_SYNTHETIC_TURN_MUTATION,
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
  OPEN_SYNTHETIC_TURN_MUTATION,
  REPO_ID,
  RUN_ID,
  UPDATE_BACKGROUND_AGENTS_MUTATION,
} from "../config.js";
import {
  resolveDaemonPaths,
  resolveLegacySessionDaemonPaths,
} from "./daemonPaths.js";
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
import { buildSdkOptions, loadSdk, type SdkUserMessage } from "./claudeSdk.js";
import { callbackState as S } from "../runtime/state.js";
import { persistTurnWork } from "../runtime/turnPersist.js";
import {
  getCurrentTurnLease,
  setCurrentTurnLease,
  type TurnLeaseIdentity,
} from "../runtime/turnLease.js";
import { log, readResponseJson } from "../utils.js";
import type { JsonObject, JsonValue } from "../types.js";
import {
  readCancelRequested,
  readStopTaskToolUseIds,
  readTurnLeaseIdentity,
} from "./claimPendingTurnParse.js";
import { decideCallbackRefresh } from "./callbackRefresh.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when `pid` refers to a live process this user can signal. */
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Reads the entity daemon pidfile; NaN when missing or unreadable. */
function readDaemonPidFile(): number {
  try {
    return Number(readFileSync(DAEMON_PID_FILE, "utf8").trim());
  } catch {
    return Number.NaN;
  }
}

// Entity-scoped daemon marker paths (see daemonPaths.ts). Legacy session paths
// are cleaned up on exit when this daemon is session-scoped.
const daemonPaths = resolveDaemonPaths();
const DAEMON_PID_FILE = daemonPaths.pid;
const DAEMON_ENTITY_FILE = daemonPaths.entity;
const DAEMON_OPTS_FILE = daemonPaths.opts;

// Exit if no new turn arrives for this long, so the sandbox can be reclaimed.
// Kept generous so a normal work session never pays a mid-session respawn (the
// respawn — re-upload + boot — is the ~20s "slow hi" users feel). Matches the
// keep-warm window of comparable agents (t3code reaps at 30min).
const IDLE_EXIT_MS = 45 * 60 * 1000;
// How often a daemon re-checks that it still owns the entity pidfile. Concurrent
// launches race the multi-second gap between the launcher's alive-check and the
// pidfile write below, so several daemons can boot for one entity (observed in
// prod: 5 daemons flip-flopping one streaming row). Deposed daemons exit here.
const FENCE_POLL_INTERVAL_MS = 5000;
// Poll interval for the claim mutation. Low enough to keep handoff→turn-start
// latency to ~one poll; the turn itself dominates so this only trims the tail.
const PROMPT_POLL_INTERVAL_MS = 50;
// Idle backoff for that poll. At 50ms an idle daemon burns ~20 Convex mutation
// calls/s (~54k per 45-min idle window) purely to notice a turn that is not
// coming, and those silent executions flood `convex logs`. Once no turn is in
// flight and nothing has happened for PROMPT_POLL_FAST_WINDOW_MS, poll at the
// idle interval instead — worst case adds ~1s before an idle daemon claims a
// fresh send, invisible next to model time-to-first-token. Any in-flight turn
// keeps the 50ms cadence so cancel/stop-task drains (which ride the same
// mutation) stay prompt even through long-silent tool runs.
const PROMPT_POLL_IDLE_INTERVAL_MS = 1000;
const PROMPT_POLL_FAST_WINDOW_MS = 30_000;

// Per-turn watchdog. Without this a turn whose SDK query stalls or ends without
// emitting a result would never send a completion event, so the workflow's
// awaitEvent hangs until the 2h stale-session timeout (empty "Working…" bubble).
// Mirrors the one-shot path (claudeSdk.ts): fail the turn if it produces no SDK
// message for a while, or exceeds the hard runtime cap. Silence while a tool is
// in flight (S.inFlightToolUses > 0) is exempt — the SDK emits nothing during a
// tool run, so a long bash call would otherwise be killed as a hang (seen in
// prod). On a fire we send a failure completion (resolving awaitEvent) and exit
// so the next turn respawns a clean daemon rather than reusing a wedged query.
const NO_MESSAGE_TIMEOUT_MS = NO_OUTPUT_TIMEOUT_MS * 5;
const WATCHDOG_TICK_MS = 5000;

// Safety net for a cancel whose interrupted `result` never arrives (SDK
// interrupt() hung, or silently dropped it). The normal per-turn watchdog
// above is disarmed at cancel time (endWatchedTurn already ran), so without
// this a lost interrupt would wedge the daemon forever with daemonTurn stuck
// non-null. See turnCancelInFlight and startTurnWatchdog.
const CANCEL_SETTLE_TIMEOUT_MS = 30_000;

let turnActive = false;
let turnStartedAtMs = 0;
let lastMessageAtMs = 0;

type ClaimedTurn = {
  prompt: string;
  attachmentUrls: string[];
  turnLease: TurnLeaseIdentity | null;
};

type DaemonMessage = Record<string, JsonValue>;

type DaemonTurn = { kind: "real" } | { kind: "synthetic"; messageId: string };

type WarmRunner = {
  push: (text: string) => void;
  waitMessage: () => Promise<DaemonMessage | null>;
  drainPending: () => DaemonMessage[];
  hasPending: () => boolean;
  stopTask: (taskId: string) => Promise<void>;
  /** Interrupts the in-flight turn (cancel). Logs and no-ops when the SDK
   * query handle does not support it. */
  interrupt: () => Promise<void>;
};

type BackgroundAgentEntry = {
  toolUseId: string;
  taskId?: string;
  description?: string;
  status: string;
  backgrounded?: boolean;
  startedAt: number;
  settledAt?: number;
};

let daemonTurn: DaemonTurn | null = null;
let pendingClaimedTurn: ClaimedTurn | null = null;
let daemonExiting = false;
let callbackRefreshPending = false;
let callbackRefreshDeferralLogged = false;
let openingSyntheticTurn = false;
let lastIdleActivityAtMs = Date.now();
let agentTurnOutput = "";
let agentTurnStartedAt = 0;
let sawFirstMessageThisTurn = { value: false };
let sawAssistantThisTurn = { value: false };
// Cancel state machine: set when a claim response drains a user cancel for
// the in-flight turn (see handleCancelRequested); cleared once that turn's
// result settles in runDaemonMessagePump, or force-exited by the safety net
// in startTurnWatchdog if it never does. While true: the per-turn watchdog is
// already disarmed (endWatchedTurn ran at cancel time), the claim watcher
// parks — rather than discards — any turn the same claim also carried, and
// the message pump drops the interrupted turn's tail instead of streaming or
// finalizing it.
let turnCancelInFlight = false;
let turnCancelRequestedAtMs = 0;

const recognisedSubagentToolUseIds = new Set<string>();
const settledSubagentToolUseIds = new Set<string>();
const unsettledBackgroundAgents = new Map<string, BackgroundAgentEntry>();
const pendingAgentStops = new Set<string>();
let currentAgentRunner: WarmRunner | null = null;

function entityMutationArgs(
  fields: Record<string, JsonValue>,
): Record<string, JsonValue> {
  return {
    [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
    ...fields,
  };
}

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
  // Only unlink a pidfile this daemon still owns — a deposed daemon that
  // deferred its fence exit through this failing turn would otherwise delete
  // the rival's pidfile and take the healthy daemon down with it.
  if (readDaemonPidFile() === process.pid) {
    try {
      unlinkSync(DAEMON_PID_FILE);
    } catch {
      /* ignore */
    }
  }
  await stopStreamingLoops();
  process.exit(1);
}

/**
 * Cleans up like failTurnAndExit (pid file + streaming loops) but WITHOUT
 * posting a completion mutation, then returns so the caller can let the
 * daemon shut down through runSdkDaemon's ordinary finally block instead of a
 * forced process.exit. Only used when the server already finalized the
 * user-facing turn itself (a drained cancel) — posting a completion here
 * could resolve the NEXT turn's workflow event instead of this
 * already-settled one.
 */
async function exitWithoutCompletion(reason: string): Promise<void> {
  log("daemon: exiting without completion — " + reason);
  // Same ownership gate as failTurnAndExit: never delete a rival's pidfile.
  if (readDaemonPidFile() === process.pid) {
    try {
      unlinkSync(DAEMON_PID_FILE);
    } catch {
      /* ignore */
    }
  }
  await stopStreamingLoops();
}

/** Arms the per-turn watchdog interval for the daemon's lifetime. */
function startTurnWatchdog(): void {
  const timer = setInterval(() => {
    const now = Date.now();
    if (turnCancelInFlight) {
      if (now - turnCancelRequestedAtMs > CANCEL_SETTLE_TIMEOUT_MS) {
        // The server already finalized this turn when it drained the
        // cancel, so — like exitWithoutCompletion — do not post a completion
        // here; it could resolve the NEXT turn's workflow event instead.
        // Force-exit so prewarm respawns a clean daemon for whatever is next.
        log("daemon: cancelled turn did not settle in time — exiting");
        process.exit(1);
      }
      return;
    }
    if (!turnActive) return;
    // A turn paused on a blocking question emits no SDK messages by design —
    // keep both timers fresh so the wait is never mistaken for a stalled turn.
    if (S.awaitingQuestionAnswer) {
      turnStartedAtMs = now;
      lastMessageAtMs = now;
      return;
    }
    // The SDK emits nothing between a tool_use and its tool_result, so a
    // long-running tool (Bash allows 10min; subagent Task calls longer) is
    // indistinguishable from a hang by message silence alone: while a tool is
    // in flight only the hard runtime cap
    // applies, and the silence clock restarts once the tool result lands.
    if (S.inFlightToolUses > 0) {
      lastMessageAtMs = now;
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

/** Reports one finished turn to the session workflow (mirrors the one-shot completion). */
async function finalizeTurn(output: string): Promise<void> {
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
  const completionArgs: Record<string, JsonValue> = {
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
  const turnLease = getCurrentTurnLease();
  if (turnLease) {
    completionArgs.turnId = turnLease.turnId;
    completionArgs.leaseGeneration = turnLease.leaseGeneration;
  }
  // Final streaming reconcile BEFORE completion. The completion mutation
  // finalizes the assistant message, after which the server clears the
  // streaming row and may immediately dequeue the next queued turn — so this
  // daemon must not write streaming state past that point. When this ran
  // post-completion it landed after that clear and resurrected this turn's
  // full reply text into the row, which the NEXT turn's placeholder rendered
  // as its response until the real reply arrived (stale-reply bug).
  // setFinalizingState (not plain flushStreaming, which would early-return on
  // the already-drained buffer) pushes the now-complete steps and final text.
  if (await setFinalizingState()) return;
  // Durability BEFORE completion: commit + push the turn's work so a VM death
  // after this point cannot erase it (a hard death snapshots nothing and the
  // next resume rolls the filesystem back — see turnPersist.ts).
  persistTurnWork();
  // Completion first, then media: attachMedia patches the assistant message
  // that was just written.
  const completionSentAt = Date.now();
  await deliverCompletionWithMedia(completionArgs);
  setCurrentTurnLease(null);
  log(
    "daemon: turn finalized success=" +
      success +
      " steps=" +
      activityLog.length +
      " (completion mutation " +
      (Date.now() - completionSentAt) +
      "ms)",
  );
  // Persist the Claude transcript to the volume for restart recovery. Runs
  // AFTER completion so the ~5s synchronous transcript copy never delays the
  // reply the user is waiting on. The sandbox stays warm between turns, so
  // this only guards against a sandbox restart. accumulatedSteps is still
  // populated (resetTurnState runs after this returns).
  const bookkeepingAt = Date.now();
  syncClaudeStateToPersist("daemon-turn");
  log(
    "daemon: post-turn bookkeeping took " + (Date.now() - bookkeepingAt) + "ms",
  );
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
    return { prompt, attachmentUrls: [], turnLease: null };
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  return {
    prompt,
    attachmentUrls: readClaimedAttachmentUrls(payload),
    turnLease: readTurnLeaseIdentity(result),
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

/**
 * Synara-compatible mint gate: only open a synthetic turn for main-context
 * assistant/stream traffic, or messages routed under a recognised Agent/Task
 * tool_use id. Between-turn system/task/telemetry noise must not mint — a
 * background Bash exit would otherwise open an empty bubble that the watchdog
 * fails as "The assistant stopped responding".
 */
function shouldMintSyntheticTurn(message: DaemonMessage): boolean {
  if (message.type === "assistant" || message.type === "stream_event") {
    return true;
  }
  const parentId = readParentToolUseId(message);
  if (parentId === null) {
    return false;
  }
  return recognisedSubagentToolUseIds.has(parentId);
}

function completeSubtaskStep(toolUseId: string): void {
  for (const step of S.accumulatedSteps) {
    if (step.type === "subtask" && step.toolUseId === toolUseId) {
      step.status = "complete";
    }
  }
}

function settleSubagent(toolUseId: string, terminalStatus: string): void {
  settledSubagentToolUseIds.add(toolUseId);
  const entry = unsettledBackgroundAgents.get(toolUseId);
  unsettledBackgroundAgents.delete(toolUseId);
  completeSubtaskStep(toolUseId);
  if (entry) {
    void syncBackgroundAgentsToConvex([
      {
        ...entry,
        status: terminalStatus,
        settledAt: Date.now(),
      },
    ]);
  }
}

function toConvexBackgroundAgent(
  entry: BackgroundAgentEntry,
): Record<string, string | number | boolean> {
  const payload: Record<string, string | number | boolean> = {
    toolUseId: entry.toolUseId,
    status: entry.status,
    startedAt: entry.startedAt,
  };
  if (entry.taskId) {
    payload.taskId = entry.taskId;
  }
  if (entry.description) {
    payload.description = entry.description;
  }
  if (entry.backgrounded === true) {
    payload.backgrounded = true;
  }
  if (entry.settledAt !== undefined) {
    payload.settledAt = entry.settledAt;
  }
  return payload;
}

async function syncBackgroundAgentsToConvex(
  agents: BackgroundAgentEntry[],
): Promise<void> {
  if (agents.length === 0) {
    return;
  }
  try {
    await callConvexWithRetry(
      "mutation",
      UPDATE_BACKGROUND_AGENTS_MUTATION ?? "",
      entityMutationArgs({
        agents: agents.map(toConvexBackgroundAgent),
      }),
    );
  } catch {
    /* best-effort */
  }
}

function findAgentByTaskId(taskId: string): BackgroundAgentEntry | undefined {
  for (const entry of unsettledBackgroundAgents.values()) {
    if (entry.taskId === taskId) {
      return entry;
    }
  }
  return undefined;
}

function markAgentsBackgrounded(taskIds: string[]): void {
  const patches: BackgroundAgentEntry[] = [];
  for (const taskId of taskIds) {
    const entry = findAgentByTaskId(taskId);
    if (!entry || entry.backgrounded === true) {
      continue;
    }
    entry.backgrounded = true;
    patches.push({ ...entry });
  }
  if (patches.length > 0) {
    void syncBackgroundAgentsToConvex(patches);
  }
}

async function dispatchPendingAgentStops(
  agentRunner: WarmRunner,
): Promise<void> {
  const pendingStops: string[] = [];
  pendingAgentStops.forEach((toolUseId) => {
    pendingStops.push(toolUseId);
  });
  for (const toolUseId of pendingStops) {
    const entry = unsettledBackgroundAgents.get(toolUseId);
    if (!entry?.taskId) {
      continue;
    }
    pendingAgentStops.delete(toolUseId);
    try {
      await agentRunner.stopTask(entry.taskId);
      log("daemon: stopTask dispatched taskId=" + entry.taskId);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      log("daemon: stopTask failed — " + messageText);
      pendingAgentStops.add(toolUseId);
    }
  }
}

function handleBackgroundTasksChanged(message: DaemonMessage): void {
  if (
    message.type !== "system" ||
    message.subtype !== "background_tasks_changed"
  ) {
    return;
  }
  const tasksField = message.tasks;
  if (!Array.isArray(tasksField)) {
    return;
  }
  const taskIds: string[] = [];
  for (const task of tasksField) {
    if (typeof task !== "object" || task === null || Array.isArray(task)) {
      continue;
    }
    const taskIdField = task.task_id;
    const taskId =
      typeof taskIdField === "string" && taskIdField.trim()
        ? taskIdField.trim()
        : undefined;
    if (taskId) {
      taskIds.push(taskId);
    }
  }
  // Mark backgrounded idempotently from the full roster (markAgentsBackgrounded
  // skips already-marked entries). Do NOT consume diffNewBackgroundTaskIds here:
  // the parse layer owns that dedup set and diffs it to push the "Agent moved to
  // background" notice step — consuming it first leaves that diff empty and
  // the notice never renders.
  markAgentsBackgrounded(taskIds);
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
    const entry: BackgroundAgentEntry = {
      toolUseId,
      taskId: readStringField(message, "task_id"),
      description: readStringField(message, "description"),
      status: "running",
      startedAt: Date.now(),
    };
    unsettledBackgroundAgents.set(toolUseId, entry);
    void syncBackgroundAgentsToConvex([entry]);
    if (currentAgentRunner) {
      void dispatchPendingAgentStops(currentAgentRunner);
    }
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
      status === "stopped" ||
      subtype === "task_notification";
    if (terminal) {
      settleSubagent(toolUseId, status ?? "completed");
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
    const turnLease = getCurrentTurnLease();
    await callConvexWithRetry(
      "mutation",
      COMPLETE_SYNTHETIC_TURN_MUTATION ?? "",
      entityMutationArgs({
        messageId,
        success: false,
        result: null,
        error,
        activityLog: serializeSteps(S.accumulatedSteps),
        ...(turnLease ?? {}),
      }),
    );
  } catch {
    /* best-effort */
  }
  endWatchedTurn();
  resetTurnState();
  setCurrentTurnLease(null);
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
      OPEN_SYNTHETIC_TURN_MUTATION ?? "",
      entityMutationArgs({}),
    );
    const messageId = readSyntheticTurnMessageId(result);
    if (messageId === null) {
      log("daemon: openSyntheticTurn returned no messageId");
      return;
    }
    resetTurnState();
    setCurrentTurnLease(readTurnLeaseIdentity(result));
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
  const completionArgs: Record<string, JsonValue> = entityMutationArgs({
    messageId,
    success,
    result: resultEvent?.result ?? S.rawOutput,
    error: resultEvent?.isError ? resultEvent.result : null,
    activityLog,
  });
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }
  const turnLease = getCurrentTurnLease();
  if (turnLease) {
    completionArgs.turnId = turnLease.turnId;
    completionArgs.leaseGeneration = turnLease.leaseGeneration;
  }
  await callConvexWithRetry(
    "mutation",
    COMPLETE_SYNTHETIC_TURN_MUTATION ?? "",
    completionArgs,
  );
  syncClaudeStateToPersist("daemon-synthetic-turn");
  endWatchedTurn();
  resetTurnState();
  setCurrentTurnLease(null);
  daemonTurn = null;
  agentTurnOutput = "";
  log("daemon: synthetic turn finalized success=" + success);
}

function startRealAgentTurn(turn: ClaimedTurn, agentRunner: WarmRunner): void {
  // Do not drain the agent pump here: buffered post-result / background-agent
  // messages must stay queued so the main loop can open a synthetic turn (or
  // attribute them into this real turn once it is live).
  resetTurnState();
  setCurrentTurnLease(turn.turnLease);
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

/**
 * Handles a drained `cancelRequested` flag from a claim response: disarms the
 * per-turn watchdog and asks the SDK query to interrupt the in-flight turn.
 * Idempotent — a stale flag with no active turn, or one arriving while a
 * cancel is already in flight, is ignored (logged once). The turn itself is
 * not torn down here; runDaemonMessagePump settles it once the interrupted
 * turn's result arrives (or the watchdog's cancel-settle timeout fires).
 */
function handleCancelRequested(agentRunner: WarmRunner): void {
  if (daemonTurn === null) {
    log("daemon: cancelRequested with no active turn — ignored");
    return;
  }
  if (turnCancelInFlight) {
    return;
  }
  turnCancelInFlight = true;
  turnCancelRequestedAtMs = Date.now();
  endWatchedTurn();
  log("daemon: cancel requested — interrupting in-flight turn");
  void agentRunner.interrupt().catch((error) => {
    const messageText = error instanceof Error ? error.message : String(error);
    log("daemon: interrupt failed — " + messageText);
  });
}

function startClaimWatcher(agentRunner: WarmRunner): void {
  void (async () => {
    while (!daemonExiting) {
      if (callbackScriptWentStaleOnDisk()) {
        callbackRefreshPending = true;
      }
      const refreshDecision = decideCallbackRefresh({
        refreshPending: callbackRefreshPending,
        watchedTurnActive: turnActive,
        daemonTurnActive: daemonTurn !== null,
        claimedTurnPending: pendingClaimedTurn !== null,
        cancellationInFlight: turnCancelInFlight,
        backgroundAgentCount: unsettledBackgroundAgents.size,
        sdkMessagePending: agentRunner.hasPending(),
        syntheticTurnOpening: openingSyntheticTurn,
      });
      if (refreshDecision.action === "defer") {
        if (!callbackRefreshDeferralLogged) {
          log(
            "daemon: callback script updated on disk — deferring respawn until active work settles (" +
              refreshDecision.blocker +
              ")",
          );
          callbackRefreshDeferralLogged = true;
        }
        await sleep(PROMPT_POLL_INTERVAL_MS);
        continue;
      }
      if (refreshDecision.action === "exit") {
        log("daemon: callback script updated on disk — exiting for respawn");
        daemonExiting = true;
        return;
      }
      try {
        const claimed = await callConvexWithRetry(
          "mutation",
          CLAIM_MUTATION ?? "",
          entityMutationArgs({ model: MODEL }),
        );
        const stopIds = readStopTaskToolUseIds(claimed);
        for (const toolUseId of stopIds) {
          pendingAgentStops.add(toolUseId);
        }
        await dispatchPendingAgentStops(agentRunner);
        if (readCancelRequested(claimed)) {
          handleCancelRequested(agentRunner);
        }
        const turn = readClaimedTurn(claimed);
        if (turn !== null) {
          await materializeTurnAttachments(turn);
          lastIdleActivityAtMs = Date.now();
          // claimPendingTurn already cleared session.pendingTurn atomically, so
          // any branch that does not park/start the claim loses that prompt.
          // Normal startExecute queues while a real turn/workflow is active, so
          // the discard paths below should stay unreachable — log clearly if not.
          if (daemonTurn === null) {
            pendingClaimedTurn = turn;
          } else if (daemonTurn.kind === "synthetic") {
            pendingClaimedTurn = turn;
          } else if (turnCancelInFlight) {
            // The same claim response can carry both the cancel flag and the
            // next queued prompt — cancelling dequeues it server-side in the
            // same mutation. daemonTurn stays non-null until the cancelled
            // turn's result settles in runDaemonMessagePump, so park this
            // instead of discarding it (that would lose the prompt for good,
            // since claimPendingTurn already cleared it server-side).
            pendingClaimedTurn = turn;
          } else {
            log(
              "daemon: claim discarded while real turn active (prompt lost; pendingTurn was already cleared)",
            );
          }
        }
      } catch {
        /* retry on next poll */
      }
      const turnInFlight =
        daemonTurn !== null || pendingClaimedTurn !== null || turnCancelInFlight;
      const recentlyActive =
        Date.now() - lastIdleActivityAtMs < PROMPT_POLL_FAST_WINDOW_MS;
      await sleep(
        turnInFlight || recentlyActive
          ? PROMPT_POLL_INTERVAL_MS
          : PROMPT_POLL_IDLE_INTERVAL_MS,
      );
    }
  })();
}

async function runDaemonMessagePump(agentRunner: WarmRunner): Promise<void> {
  while (!daemonExiting) {
    if (daemonTurn === null && pendingClaimedTurn !== null) {
      const turn = pendingClaimedTurn;
      pendingClaimedTurn = null;
      startRealAgentTurn(turn, agentRunner);
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
      if (turnCancelInFlight) {
        // The SDK query's async iterable ended while we were waiting out an
        // interrupted turn's tail. The server already finalized the
        // user-facing turn when it drained the cancel, so exit like
        // failTurnAndExit but WITHOUT posting a completion — one here could
        // resolve the NEXT turn's workflow event instead of this
        // already-settled one.
        await exitWithoutCompletion("pump ended while a cancel was settling");
        return;
      }
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
    handleBackgroundTasksChanged(message);

    if (turnCancelInFlight) {
      if (message.type !== "result") {
        // Drop the interrupted turn's tail from user-visible streaming (no
        // processRealtimeStdoutChunk) — the server already finalized the
        // user-facing message for this turn. Background-agent bookkeeping
        // above still ran unconditionally.
        continue;
      }
      // The cancelled turn's result has arrived. Do not finalize or post a
      // completion — the server already finalized this turn when it drained
      // the cancel. Reset per-turn state and let the pump either pick up a
      // parked turn (next loop iteration) or go idle.
      resetTurnState();
      setCurrentTurnLease(null);
      daemonTurn = null;
      agentTurnOutput = "";
      turnCancelInFlight = false;
      continue;
    }

    if (message.type === "result" && daemonTurn === null) {
      log("daemon: result with no live turn — ignored");
      continue;
    }

    if (daemonTurn === null) {
      if (!shouldMintSyntheticTurn(message)) {
        const messageType =
          typeof message.type === "string" ? message.type : "?";
        log(
          "daemon: between-turn " +
            messageType +
            " consumed without minting a synthetic turn",
        );
        continue;
      }
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
      startRealAgentTurn(parked, agentRunner);
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

/**
 * Session-lifetime agent query pump. Turn boundaries are state changes (see
 * daemonTurn), not loop exits — the same query() serves every turn for the
 * life of the daemon.
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

  const stopTask = async (taskId: string): Promise<void> => {
    if (typeof query.stopTask === "function") {
      await query.stopTask(taskId);
      return;
    }
    log("daemon: stopTask unavailable on SDK query handle");
  };

  const interrupt = async (): Promise<void> => {
    if (typeof query.interrupt === "function") {
      await query.interrupt();
      return;
    }
    log("daemon: interrupt unavailable on SDK query handle");
  };

  return { push, waitMessage, drainPending, hasPending, stopTask, interrupt };
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
/** Mirrors attachmentExtensionForMimeType in convex/_sandbox_runtime/attachments.ts. */
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
 * text as the CLI launch path (convex/_sandbox_runtime/attachments.ts). Failed
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
  if (!CLAIM_MUTATION) {
    log("daemon: CLAIM_MUTATION env is required in sdk-daemon mode");
    process.exit(1);
  }
  if (!OPEN_SYNTHETIC_TURN_MUTATION || !COMPLETE_SYNTHETIC_TURN_MUTATION) {
    log(
      "daemon: synthetic turn mutation env vars are required in sdk-daemon mode",
    );
    process.exit(1);
  }

  // Single-daemon fence, part 1 (boot claim): if a live rival already owns the
  // pidfile, exit without touching its marker files. First writer wins. A dead
  // pid in the file (e.g. after KILL_PRIOR_AGENT_PROCESSES_CMD) is overwritten.
  const rivalPid = readDaemonPidFile();
  if (
    !Number.isNaN(rivalPid) &&
    rivalPid !== process.pid &&
    pidAlive(rivalPid)
  ) {
    log(
      `daemon: rival daemon pid=${rivalPid} already owns ${DAEMON_PID_FILE} — exiting`,
    );
    process.exit(0);
  }

  writeFileSync(DAEMON_PID_FILE, String(process.pid));
  writeFileSync(DAEMON_ENTITY_FILE, ENTITY_ID ?? "");
  writeFileSync(DAEMON_OPTS_FILE, DAEMON_OPTS_SIG);

  // Single-daemon fence, part 2: a launch racing past the boot claim (or an
  // optsmismatch respawn) overwrites the pidfile; the deposed daemon must exit
  // or it lives forever, double-claiming turns and flip-flopping the shared
  // streaming row. Deferred while a real turn is active so work is never
  // killed mid-flight — the rival idles on claim polling meanwhile. A missing
  // pidfile also means deposed (a kill+respawn removed it; the successor will
  // claim it).
  let deposedLogged = false;
  setInterval(() => {
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
          `daemon: deposed (pidfile owner=${ownerLabel}) — exiting after active turn`,
        );
      }
      return;
    }
    log(`daemon: deposed (pidfile owner=${ownerLabel}) — exiting`);
    process.exit(0);
  }, FENCE_POLL_INTERVAL_MS);

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
  const agentRunner = createWarmAgentRunner(sdk, options);
  currentAgentRunner = agentRunner;

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
  startClaimWatcher(agentRunner);

  try {
    await runDaemonMessagePump(agentRunner);
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
    // Only tear down markers this daemon still owns — after a fence
    // deposition a rival owns them (fence exits bypass this via
    // process.exit, but an SDK failure can reach here deposed).
    if (readDaemonPidFile() === process.pid) {
      try {
        unlinkSync(DAEMON_PID_FILE);
        unlinkSync(DAEMON_ENTITY_FILE);
        unlinkSync(DAEMON_OPTS_FILE);
        if (ENTITY_ID_FIELD === "sessionId") {
          const legacy = resolveLegacySessionDaemonPaths();
          try {
            unlinkSync(legacy.pid);
          } catch {
            /* ignore */
          }
          try {
            unlinkSync(legacy.entity);
          } catch {
            /* ignore */
          }
          try {
            unlinkSync(legacy.opts);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    }
    await stopStreamingLoops();
  }
  process.exit(0);
}
