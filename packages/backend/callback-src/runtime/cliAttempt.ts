import { spawn } from "child_process";
import { writeFileSync } from "fs";
import {
  FIRST_ASSISTANT_EVENT_TIMEOUT_MS,
  FIRST_EVENT_TIMEOUT_MS,
  MAX_TOTAL_RUNTIME_MS,
  NO_OUTPUT_CHECK_INTERVAL_MS,
  SCRIPT_STARTED_AT,
  WORK_DIR,
} from "../config.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { processRealtimeStdoutChunk } from "../parse/streamRouter.js";
import { elapsedAttemptMs, log } from "../utils.js";
import {
  appendToRawLogFile,
  appendToRawOutput,
  trimBufferHead,
} from "./buffers.js";
import { callbackState as S } from "./state.js";
import { isChildZombie, terminateAttemptProcess } from "./processControl.js";
import type {
  AttemptHealthInput,
  AttemptHealthResult,
  CliAttemptOptions,
  CliAttemptResult,
} from "../types.js";

export function evaluateAttemptHealth(
  input: AttemptHealthInput,
): AttemptHealthResult {
  const result: AttemptHealthResult = {
    shouldTerminate: false,
    timedOutForZombie: false,
    timedOutForMaxRuntime: false,
    timedOutForFirstEvent: false,
    timedOutForFirstAssistant: false,
    timedOutAfterFirstText: false,
    timedOutForNoOutput: false,
    toolStallErrorMessage: input.toolStallErrorMessage,
  };

  if (S.fatalHeartbeatErrorMessage) {
    result.shouldTerminate = true;
    return result;
  }

  if (isChildZombie(input.childPid)) {
    if (S.resultEventSeen) {
      result.logMessage =
        input.processLabel +
        " detected zombie state for pid=" +
        String(input.childPid) +
        " after result event; terminating for cleanup";
      result.shouldTerminate = true;
      return result;
    }
    result.timedOutForZombie = true;
    result.logMessage =
      input.processLabel +
      " detected zombie state for pid=" +
      String(input.childPid) +
      "; terminating";
    result.shouldTerminate = true;
    return result;
  }

  if (Date.now() - SCRIPT_STARTED_AT > MAX_TOTAL_RUNTIME_MS) {
    result.timedOutForMaxRuntime = true;
    result.shouldTerminate = true;
    return result;
  }

  if (
    S.parsedStreamEventCount === input.parsedEventsAtStart &&
    Date.now() - input.attemptStartedAt > FIRST_EVENT_TIMEOUT_MS
  ) {
    result.timedOutForFirstEvent = true;
    result.shouldTerminate = true;
    return result;
  }

  if (
    S.waitingForFirstAssistantEvent &&
    S.claudeInitAt > 0 &&
    Date.now() - S.claudeInitAt > FIRST_ASSISTANT_EVENT_TIMEOUT_MS
  ) {
    result.timedOutForFirstAssistant = true;
    result.logMessage =
      input.processLabel +
      " stalled waiting for first assistant event for " +
      String(Date.now() - S.claudeInitAt) +
      "ms after init; terminating process";
    result.shouldTerminate = true;
    return result;
  }

  if (S.inFlightToolUses > 0 || S.resultEventSeen) {
    return result;
  }

  return result;
}

export function resetAttemptState(): void {
  S.realtimeOutputBuffer = "";
  S.resultEventSeen = false;
  S.waitingForFirstAssistantEvent = false;
  S.claudeInitAt = 0;
  S.currentStreamedContent = "";
  S.firstAssistantEventAt = 0;
  S.firstTextBlockAt = 0;
  S.fatalHeartbeatErrorMessage = "";
  S.heartbeatFailureStreakStartedAt = 0;
  S.inFlightToolUses = 0;
  S.codexToolItemIds.clear();
}

export async function runCliAttempt(
  options: CliAttemptOptions,
): Promise<CliAttemptResult> {
  resetAttemptState();
  S.activeAttemptStartedAt = Date.now();
  updateThinkingStep(options.startupStep.label, options.startupStep.detail);
  if (options.onStart) {
    options.onStart();
  }
  return await new Promise((resolve, reject) => {
    const child = spawn(
      "bash",
      ["-c", "cd " + WORK_DIR + " && " + options.cmd],
      {
        env: options.env,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    S.activeAttemptChild = child;
    // Make the kernel OOM killer prefer the CLI subtree (bash → CLI → tool
    // processes like tsc, which all inherit this score) over the callback, so
    // an out-of-memory sandbox kills the work — not the heartbeat/reporting
    // process. Raising a score on our own child is always permitted.
    if (child.pid) {
      try {
        writeFileSync("/proc/" + String(child.pid) + "/oom_score_adj", "300");
      } catch {
        /* non-Linux or already exited — ignore */
      }
    }
    log(
      options.processLabel +
        " process spawned after " +
        String(elapsedAttemptMs()) +
        "ms pid=" +
        String(child.pid || "unknown"),
    );
    let attemptOutput = "";
    const attemptStartedAt = Date.now();
    const parsedEventsAtStart = S.parsedStreamEventCount;
    let lastStdoutAt = Date.now();
    let timedOutForNoOutput = false;
    let timedOutForMaxRuntime = false;
    let timedOutForFirstEvent = false;
    let timedOutForFirstAssistant = false;
    let timedOutAfterFirstText = false;
    let timedOutForZombie = false;
    let toolStallErrorMessage = "";
    const noOutputTimer = setInterval(() => {
      const health = evaluateAttemptHealth({
        childPid: child.pid,
        parsedEventsAtStart,
        attemptStartedAt,
        lastStdoutAt,
        processLabel: options.processLabel,
        toolStallErrorMessage,
      });
      toolStallErrorMessage = health.toolStallErrorMessage;
      if (health.logMessage) {
        log(health.logMessage);
      }
      if (!health.shouldTerminate) {
        return;
      }
      timedOutForZombie = health.timedOutForZombie;
      timedOutForMaxRuntime = health.timedOutForMaxRuntime;
      timedOutForFirstEvent = health.timedOutForFirstEvent;
      timedOutForFirstAssistant = health.timedOutForFirstAssistant;
      timedOutAfterFirstText = health.timedOutAfterFirstText;
      timedOutForNoOutput = health.timedOutForNoOutput;
      terminateAttemptProcess(child);
    }, NO_OUTPUT_CHECK_INTERVAL_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      appendToRawLogFile(text);
      attemptOutput = trimBufferHead(attemptOutput + text);
      appendToRawOutput(text);
      lastStdoutAt = Date.now();
      processRealtimeStdoutChunk(text);
      if (options.onStdoutText) {
        options.onStdoutText(text);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      appendToRawLogFile(
        "[stderr] " + text + (text.endsWith("\n") ? "" : "\n"),
      );
      S.stderrOutput = trimBufferHead(S.stderrOutput + text);
    });
    child.on("close", (code, signal) => {
      clearInterval(noOutputTimer);
      S.activeAttemptChild = null;
      const terminatedBySignal = signal !== null;
      log(
        options.attemptLabel +
          " finished in " +
          elapsedAttemptMs() +
          "ms (code=" +
          code +
          ", signal=" +
          (signal ?? "none") +
          ", timedOutForNoOutput=" +
          timedOutForNoOutput +
          ", timedOutForMaxRuntime=" +
          timedOutForMaxRuntime +
          ", timedOutForFirstEvent=" +
          timedOutForFirstEvent +
          ", timedOutForFirstAssistant=" +
          timedOutForFirstAssistant +
          ", timedOutAfterFirstText=" +
          timedOutAfterFirstText +
          ", timedOutForZombie=" +
          timedOutForZombie +
          ", toolStallError=" +
          (toolStallErrorMessage || "none") +
          ", outputBytes=" +
          attemptOutput.length +
          ", stderrBytes=" +
          S.stderrOutput.length +
          ")",
      );
      resolve({
        code: code ?? 1,
        terminatedBySignal,
        output: attemptOutput,
        timedOutForNoOutput,
        timedOutForMaxRuntime,
        timedOutForFirstEvent,
        timedOutForFirstAssistant,
        timedOutAfterFirstText,
        timedOutForZombie,
        toolStallErrorMessage,
      });
    });
    child.on("error", (err) => {
      clearInterval(noOutputTimer);
      reject(err);
    });
  });
}
