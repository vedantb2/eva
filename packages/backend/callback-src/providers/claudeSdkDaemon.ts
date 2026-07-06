import { unlinkSync, writeFileSync } from "fs";
import {
  COMPLETION_MUTATION,
  CONVEX_TOKEN,
  CONVEX_URL,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  REPO_ID,
  RUN_ID,
} from "../config.js";
import { callConvexWithRetry, fetchWithTimeout } from "../http/convexClient.js";
import { extractResultEvent } from "../runtime/completion.js";
import {
  flushStreaming,
  runPreflightHeartbeat,
  startStreamingLoops,
  stopStreamingLoops,
} from "../runtime/heartbeats.js";
import { processRealtimeStdoutChunk } from "../parse/streamRouter.js";
import {
  appendToRawLogFile,
  appendToRawOutput,
  trimBufferHead,
} from "../runtime/buffers.js";
import { syncClaudeStateToPersist } from "../session/claudeSession.js";
import { prepareClaudeSessionState } from "../session/claudeSession.js";
import { buildSdkOptions, loadSdk, type SdkUserMessage } from "./claudeSdk.js";
import { callbackState as S } from "../runtime/state.js";
import { log } from "../utils.js";
import type { JsonValue } from "../types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The daemon writes its pid + entity so the backend's prewarm alive-check can
// confirm a live, matching daemon (and skip respawning one). Prompts are no
// longer delivered by file: the daemon PULLS each turn from Convex via
// claimPendingTurn (daemon-pull), so there is no prompt/ready file to poll.
export const DAEMON_PID_FILE = "/tmp/eva-daemon.pid";
export const DAEMON_ENTITY_FILE = "/tmp/eva-daemon.entity";

// Public Convex mutation the daemon polls to atomically claim the next staged
// turn's prompt for THIS session (ENTITY_ID). Mirrors how COMPLETION_MUTATION is
// invoked over /api/mutation with the sandbox CONVEX_TOKEN identity.
const CLAIM_PENDING_TURN_MUTATION = "sessionWorkflow:claimPendingTurn";

// Exit if no new turn arrives for this long, so the sandbox can be reclaimed.
// Kept generous so a normal work session never pays a mid-session respawn (the
// respawn — re-upload + boot — is the ~20s "slow hi" users feel). Matches the
// keep-warm window of comparable agents (t3code reaps at 30min).
const IDLE_EXIT_MS = 45 * 60 * 1000;
// Poll interval for the claim mutation. Low enough to keep handoff→turn-start
// latency to ~one poll; the turn itself dominates so this only trims the tail.
const PROMPT_POLL_INTERVAL_MS = 200;

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
    const data: unknownJson = await res.json();
    const token = readToken(data);
    if (token) {
      process.env.GITHUB_TOKEN = token;
      process.env.GH_TOKEN = token;
    }
  } catch {
    /* non-fatal */
  }
}

type unknownJson =
  | string
  | number
  | boolean
  | null
  | unknownJson[]
  | { [key: string]: unknownJson };

function readToken(data: unknownJson): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const value = data.value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return typeof value.token === "string" ? value.token : null;
}

/** Clears the per-turn accumulators so the next turn starts clean on the same query. */
function resetTurnState(): void {
  S.accumulatedSteps.length = 0;
  S.currentStreamedContent = "";
  S.resultEventSeen = false;
  S.rawOutput = "";
  S.inFlightToolUses = 0;
  S.pendingQuestionData = "";
  S.lastStepType = "thinking";
}

/** Reports one finished turn to the session workflow (mirrors the one-shot completion). */
async function finalizeTurn(output: string): Promise<void> {
  // Realtime parsing (processRealtimeStdoutChunk) has already folded every
  // message — including the result — into S.accumulatedSteps inline, so the
  // completion payload is ready WITHOUT a preceding streaming flush. Sending the
  // completion first is what resolves the workflow's awaitEvent and surfaces the
  // reply to the user, so it must not sit behind the ~5s streaming heartbeat.
  const resultEvent = extractResultEvent(output);
  for (const step of S.accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(S.accumulatedSteps);
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
  // Send completion FIRST — this resolves the workflow's awaitEvent and surfaces
  // the reply. Everything that follows is recovery bookkeeping that must not sit
  // on the reply-critical path.
  const completionSentAt = Date.now();
  await callConvexWithRetry(
    "mutation",
    COMPLETION_MUTATION ?? "",
    completionArgs,
  );
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
  const bookkeepingAt = Date.now();
  syncClaudeStateToPersist("daemon-turn");
  await flushStreaming();
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

/**
 * Polls the claimPendingTurn mutation until a turn is staged for this session
 * (daemon-pull), then returns its prompt. Returns null on idle timeout so the
 * daemon can exit and free the sandbox. The claim is atomic server-side, so a
 * prompt is handed to exactly one poll and never re-executed.
 */
async function waitForNextPrompt(): Promise<string | null> {
  const idleDeadline = Date.now() + IDLE_EXIT_MS;
  while (Date.now() < idleDeadline) {
    const claimed = await callConvexWithRetry(
      "mutation",
      CLAIM_PENDING_TURN_MUTATION,
      { sessionId: ENTITY_ID ?? "" },
    );
    const prompt = readClaimedPrompt(claimed);
    if (prompt !== null) {
      return prompt;
    }
    await sleep(PROMPT_POLL_INTERVAL_MS);
  }
  return null;
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
  const { push, iterable } = createPromptStream();
  const query = sdk.query({ prompt: iterable, options });

  log(
    "runSdkDaemon started (entityId=" +
      (ENTITY_ID ?? "none") +
      ", mode=" +
      sessionMode.mode +
      ")",
  );

  // Feed the first turn. Daemon-pull: the prompt is no longer uploaded to a
  // file — every turn (including the first, whether this daemon was booted by a
  // session-open prewarm or by the turn's own workflow) is PULLED from Convex
  // via claimPendingTurn. The expensive boot (spawning the claude CLI, MCP init,
  // API handshake) already happened above when query() was created, so here we
  // just wait for the first staged prompt to appear.
  log("daemon: warm query() live, waiting for first prompt (pull)");
  const firstPrompt = await waitForNextPrompt();
  if (firstPrompt === null) {
    log("daemon: idle timeout before first prompt — exiting");
    try {
      unlinkSync(DAEMON_PID_FILE);
    } catch {
      /* ignore */
    }
    await stopStreamingLoops();
    process.exit(0);
  }
  let turnStartedAt = Date.now();
  let sawFirstMessageThisTurn = false;
  push(firstPrompt);
  S.activeAttemptStartedAt = turnStartedAt;

  let output = "";
  let sawAssistantThisTurn = false;
  try {
    for await (const message of query) {
      const messageType = typeof message.type === "string" ? message.type : "?";
      if (!sawFirstMessageThisTurn) {
        sawFirstMessageThisTurn = true;
        log(
          "daemon[timing]: first SDK message (" +
            messageType +
            ") +" +
            (Date.now() - turnStartedAt) +
            "ms after push",
        );
      }
      if (!sawAssistantThisTurn && messageType === "assistant") {
        sawAssistantThisTurn = true;
        log(
          "daemon[timing]: first assistant msg +" +
            (Date.now() - turnStartedAt) +
            "ms after push",
        );
      }
      const line = JSON.stringify(message) + "\n";
      appendToRawLogFile(line);
      output = trimBufferHead(output + line);
      appendToRawOutput(line);
      processRealtimeStdoutChunk(line);

      const isResult =
        typeof message === "object" &&
        message !== null &&
        !Array.isArray(message) &&
        message.type === "result";
      if (!isResult) continue;

      const resultAt = Date.now();
      log(
        "daemon[timing]: result message +" +
          (resultAt - turnStartedAt) +
          "ms after push",
      );
      await finalizeTurn(output);
      log(
        "daemon[timing]: finalizeTurn took " + (Date.now() - resultAt) + "ms",
      );
      resetTurnState();
      output = "";

      const nextPrompt = await waitForNextPrompt();
      if (nextPrompt === null) {
        log("daemon: idle timeout — exiting");
        break;
      }
      log("daemon: next turn received");
      turnStartedAt = Date.now();
      sawFirstMessageThisTurn = false;
      sawAssistantThisTurn = false;
      S.activeAttemptStartedAt = turnStartedAt;
      push(nextPrompt);
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    log("daemon: query failed — " + messageText);
    // Report the in-flight turn as failed so the workflow's awaitEvent resolves.
    try {
      await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", {
        [ENTITY_ID_FIELD ?? "sessionId"]: ENTITY_ID ?? "",
        success: false,
        result: null,
        error: "Agent SDK daemon failed: " + messageText,
        activityLog: JSON.stringify(S.accumulatedSteps),
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
