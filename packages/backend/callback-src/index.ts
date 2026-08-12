import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import {
  ALLOWED_TOOLS,
  CLAIM_MUTATION,
  COMPLETION_MUTATION,
  CONVEX_TOKEN,
  CONVEX_URL,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  MODEL,
  PROVIDER,
  READY_FILE,
  REPO_ID,
  REQUIRE_TASK_COMMIT,
  RUN_ID,
  SCRIPT_STARTED_AT,
  WORK_DIR,
  hasMcpConfig,
} from "./config.js";
import { runSdkDaemon } from "./providers/claudeSdkDaemon.js";
import { runCodexAppServerDaemon } from "./providers/codexAppServerDaemon.js";
import { fetchWithTimeout, callConvexWithRetry } from "./http/convexClient.js";
import { callbackState as S } from "./runtime/state.js";
import { persistTurnWork } from "./runtime/turnPersist.js";
import { materializeSystemSkills } from "./runtime/systemSkills.js";
import {
  flushStreaming,
  runPreflightHeartbeat,
  setFinalizingState,
  startStreamingLoops,
  stopStreamingLoops,
} from "./runtime/heartbeats.js";
import {
  appendDiagnosticTail,
  buildErrorMessage,
  deliverCompletionWithMedia,
  extractResultEvent,
  hasToolActivity,
  writeDoneFile,
} from "./runtime/completion.js";
import {
  prepareProviderSessionState,
  runProviderAttempt,
  syncProviderStateToPersist,
} from "./providers/attempts.js";
import {
  hasNewTaskCommitSince,
  log,
  readGitHeadSha,
  readResponseJson,
} from "./utils.js";
import { serializeSteps } from "./parse/stepBudget.js";

process.on("exit", (code) => {
  writeDoneFile("unexpected-exit", {
    exitCode: typeof code === "number" ? code : null,
  });
  try {
    if (S.rawLogStream) S.rawLogStream.end();
  } catch {
    /* ignore */
  }
});

try {
  unlinkSync(READY_FILE);
} catch {
  /* ignore */
}

// Bias the kernel OOM killer away from this callback. If the sandbox runs out
// of memory during a heavy tool step (e.g. `npx tsc`), the agent subtree should
// die — not the process responsible for heartbeats and failure reporting.
// Lowering our own score requires privilege, so this is best-effort; a spawned
// child's score is raised at spawn time in cliAttempt.ts as the portable half.
try {
  writeFileSync("/proc/self/oom_score_adj", "-600");
} catch {
  /* unprivileged or non-Linux — ignore */
}

S.lastStepType = "thinking";

// Before either provider path starts — the agent scans `.agents/skills` on
// startup, so installed Eva skills must already be on disk.
materializeSystemSkills();

// Interactive chats keep one provider process warm and claim staged turns.
// Jobs (tasks / automations / arena) omit CLAIM_MUTATION and stay one-shot.
if (CLAIM_MUTATION) {
  if (PROVIDER === "claude") {
    await runSdkDaemon();
  }
  if (PROVIDER === "codex") {
    await runCodexAppServerDaemon();
  }
}

const preflightOk = await runPreflightHeartbeat();

if (!preflightOk) {
  writeDoneFile("preflight-failed");
  process.exit(1);
}

startStreamingLoops();

for (const d of [WORK_DIR + "/screenshots", WORK_DIR + "/recordings"]) {
  if (existsSync(d)) {
    for (const f of readdirSync(d)) {
      try {
        unlinkSync(d + "/" + f);
      } catch {
        /* ignore */
      }
    }
  } else {
    try {
      mkdirSync(d, { recursive: true });
    } catch {
      /* ignore */
    }
  }
}

if (REPO_ID && CONVEX_URL && CONVEX_TOKEN) {
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
    if (res.ok) {
      const data = await readResponseJson(res);
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        data.value &&
        typeof data.value === "object" &&
        !Array.isArray(data.value) &&
        typeof data.value.token === "string"
      ) {
        process.env.GITHUB_TOKEN = data.value.token;
        process.env.GH_TOKEN = data.value.token;
      }
    }
  } catch {
    /* ignore github token fetch errors */
  }
}

log(
  "entityId=" +
    ENTITY_ID +
    " provider=" +
    PROVIDER +
    " model=" +
    MODEL +
    " tools=" +
    ALLOWED_TOOLS +
    " sessionId=" +
    (process.env.CLAUDE_SESSION_ID || "none") +
    " mcp=" +
    (hasMcpConfig ? "yes" : "no"),
);

try {
  const taskCommitBaselineHead = REQUIRE_TASK_COMMIT ? readGitHeadSha() : "";
  if (REQUIRE_TASK_COMMIT) {
    log(
      "task commit gate enabled baselineHead=" +
        (taskCommitBaselineHead || "unavailable"),
    );
  }

  const initialSessionMode = prepareProviderSessionState();
  const firstAttempt = await runProviderAttempt(initialSessionMode);
  await flushStreaming();

  let finalCode = firstAttempt.code;
  let finalTimedOutForNoOutput = Boolean(firstAttempt.timedOutForNoOutput);
  let finalTimedOutForMaxRuntime = Boolean(firstAttempt.timedOutForMaxRuntime);
  let finalTimedOutForFirstEvent = Boolean(firstAttempt.timedOutForFirstEvent);
  let finalTimedOutForFirstAssistant = Boolean(
    firstAttempt.timedOutForFirstAssistant,
  );
  let finalTimedOutAfterFirstText = Boolean(
    firstAttempt.timedOutAfterFirstText,
  );
  let finalTimedOutForZombie = Boolean(firstAttempt.timedOutForZombie);
  const finalTerminatedBySignal = firstAttempt.terminatedBySignal;
  const finalToolStallErrorMessage = firstAttempt.toolStallErrorMessage || "";
  let finalResultEvent = extractResultEvent(firstAttempt.output);
  log(
    "firstAttempt result: code=" +
      firstAttempt.code +
      " isError=" +
      Boolean(finalResultEvent?.isError) +
      " hasToolActivity=" +
      hasToolActivity(),
  );

  if (!S.resultEventSeen) {
    syncProviderStateToPersist("post-attempt");
  } else {
    log("skipping post-attempt sync because result-event sync already ran");
  }

  await setFinalizingState();

  // Cursor can flush partial assistant text while a SIGTERM/SIGKILL is tearing
  // down the process. extractResultEvent deliberately falls back to that text,
  // so without this guard an interrupted recording turn reported its
  // "recording now…" preamble as a successful final answer. Node reports a
  // direct signal with `code=null`; shells can translate it to 137/143. Keep
  // both forms so neither can masquerade as genuine completion.
  const agentWasInterrupted =
    finalTerminatedBySignal || finalCode === 137 || finalCode === 143;

  const attemptEndedDueToTimeout =
    finalTimedOutAfterFirstText ||
    finalTimedOutForNoOutput ||
    finalTimedOutForMaxRuntime ||
    finalTimedOutForFirstEvent ||
    finalTimedOutForFirstAssistant ||
    finalTimedOutForZombie ||
    Boolean(finalToolStallErrorMessage);

  const runSucceededWithResult =
    finalResultEvent != null &&
    !finalResultEvent.isError &&
    !agentWasInterrupted;

  let errorValue: string | null = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (
    (!runSucceededWithResult && finalCode !== 0) ||
    (attemptEndedDueToTimeout && !runSucceededWithResult)
  ) {
    errorValue = appendDiagnosticTail(
      buildErrorMessage(
        finalCode,
        S.fatalHeartbeatErrorMessage,
        finalToolStallErrorMessage,
        finalTimedOutForMaxRuntime,
        finalTimedOutForNoOutput,
        finalTimedOutForFirstEvent,
        finalTimedOutForFirstAssistant,
        finalTimedOutAfterFirstText,
        finalTimedOutForZombie,
      ),
    );
  }

  // The final result text is delivered separately (rendered as the chat
  // message via `result`/`resultSummary`). If the last streamed "response"
  // step carries essentially the same text, drop it so the response isn't
  // shown twice. Trailing thinking steps are skipped when locating it (a
  // status step may have been pushed after the response). Intermediate
  // response steps (earlier turns before a tool call, etc.) are untouched.
  const finalResultText = (finalResultEvent?.result ?? "").trim();
  if (finalResultText) {
    let lastIdx = S.accumulatedSteps.length - 1;
    while (lastIdx >= 0 && S.accumulatedSteps[lastIdx].type === "thinking") {
      lastIdx--;
    }
    const candidate = lastIdx >= 0 ? S.accumulatedSteps[lastIdx] : undefined;
    if (candidate && candidate.type === "response") {
      const detail = (candidate.detail ?? "").trim();
      if (
        detail &&
        (finalResultText === detail ||
          finalResultText.startsWith(detail) ||
          detail.startsWith(finalResultText))
      ) {
        S.accumulatedSteps.splice(lastIdx, 1);
      }
    }
  }

  for (const step of S.accumulatedSteps) step.status = "complete";
  const activityLog = serializeSteps(S.accumulatedSteps);

  let completionSuccess = agentWasInterrupted
    ? false
    : finalResultEvent
      ? !finalResultEvent.isError
      : finalCode === 0;
  if (attemptEndedDueToTimeout && !runSucceededWithResult) {
    completionSuccess = false;
  }
  if (completionSuccess && REQUIRE_TASK_COMMIT) {
    if (!hasNewTaskCommitSince(taskCommitBaselineHead)) {
      completionSuccess = false;
      const commitGateMessage =
        "Agent finished without creating a new git commit. Edit the required files, run git add and git commit locally, then try again.";
      errorValue = errorValue
        ? errorValue + "\n\n" + commitGateMessage
        : commitGateMessage;
      log(
        "completion: rejected — no new commit (baseline=" +
          (taskCommitBaselineHead || "none") +
          " current=" +
          (readGitHeadSha() || "none") +
          ")",
      );
    }
  }
  log(
    "completion: success=" +
      completionSuccess +
      " code=" +
      finalCode +
      " hasResult=" +
      Boolean(finalResultEvent) +
      " error=" +
      (errorValue ? errorValue.slice(0, 200) : "none") +
      " steps=" +
      S.accumulatedSteps.length,
  );

  const completionArgs: Record<string, string | boolean | null> = {
    [ENTITY_ID_FIELD ?? "entityId"]: ENTITY_ID ?? "",
    success: completionSuccess,
    result: finalResultEvent?.result ?? S.rawOutput,
    error: errorValue,
    activityLog,
  };
  if (RUN_ID) completionArgs.runId = RUN_ID;
  if (finalResultEvent?.rawResultEvent) {
    completionArgs.rawResultEvent = finalResultEvent.rawResultEvent;
  }
  if (S.pendingQuestionData) {
    completionArgs.pendingQuestion = S.pendingQuestionData;
  }

  // Durability BEFORE completion: commit + push the turn's work so a VM death
  // after this point cannot erase it (no-op for task runs — the commit gate
  // and the run workflow's own push steps own those semantics).
  persistTurnWork();

  try {
    await deliverCompletionWithMedia(completionArgs);
    syncProviderStateToPersist("completion");
    await stopStreamingLoops();
    writeDoneFile(completionSuccess ? "success" : "error", {
      exitCode: finalCode,
      error: errorValue,
    });
    // Hard-exit: a tool step can leave a background child holding our stdio
    // fds, which keeps the event loop alive forever. A lingering runner keeps
    // holding the per-entity spawn flock, so every later one-shot launch for
    // this entity loses the lock and the chat sticks on "Working…" (its
    // heartbeat also keeps fooling the stall watchdog's liveness probe).
    process.exit(0);
  } catch (e) {
    console.error("Failed to send completion:", e);
    syncProviderStateToPersist("completion-error");
    await stopStreamingLoops();
    writeDoneFile("completion-error", {
      exitCode: finalCode,
      error: e instanceof Error ? e.message : String(e),
    });
    process.exit(1);
  }
} catch (err) {
  syncProviderStateToPersist("fatal-error");
  await stopStreamingLoops();
  writeDoneFile("fatal-error", {
    error: err instanceof Error ? err.message : String(err),
  });
  const errorArgs: Record<string, string | boolean | null> = {
    [ENTITY_ID_FIELD ?? "entityId"]: ENTITY_ID ?? "",
    success: false,
    result: null,
    error: appendDiagnosticTail(
      err instanceof Error
        ? err.message
        : "Failed to run " +
            (PROVIDER === "codex"
              ? "Codex SDK"
              : PROVIDER === "opencode"
                ? "Opencode CLI"
                : PROVIDER === "cursor"
                  ? "Cursor CLI"
                  : "Claude CLI"),
    ),
    activityLog: serializeSteps(S.accumulatedSteps),
  };
  if (RUN_ID) errorArgs.runId = RUN_ID;
  try {
    await callConvexWithRetry("mutation", COMPLETION_MUTATION ?? "", errorArgs);
  } catch {
    /* ignore completion error path failures */
  }
  process.exit(1);
}

void SCRIPT_STARTED_AT;
