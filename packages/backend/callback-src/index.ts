import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import {
  ALLOWED_TOOLS,
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
  mcpArg,
} from "./config.js";
import { fetchWithTimeout } from "./http/convexClient.js";
import { callConvexWithRetry } from "./http/convexClient.js";
import { callbackState as S } from "./runtime/state.js";
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
  extractResultEvent,
  hasToolActivity,
  persistTaskProofIfNeeded,
  saveProofFailureMessageIfNeeded,
  uploadMediaFile,
  writeDoneFile,
} from "./runtime/completion.js";
import {
  prepareProviderSessionState,
  runProviderAttempt,
  syncProviderStateToPersist,
} from "./providers/attempts.js";
import { hasNewTaskCommitSince, log, readGitHeadSha } from "./utils.js";

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

S.accumulatedSteps.push({
  type: "thinking",
  label:
    PROVIDER === "codex"
      ? "Preparing Codex session..."
      : PROVIDER === "opencode"
        ? "Preparing Opencode session..."
        : PROVIDER === "cursor"
          ? "Preparing Cursor session..."
          : "Preparing Claude session...",
  detail: "Initializing callback...",
  status: "active",
});

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
      const data = await res.json();
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
    (mcpArg ? "yes" : "no"),
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

  const attemptEndedDueToTimeout =
    finalTimedOutAfterFirstText ||
    finalTimedOutForNoOutput ||
    finalTimedOutForMaxRuntime ||
    finalTimedOutForFirstEvent ||
    finalTimedOutForFirstAssistant ||
    finalTimedOutForZombie ||
    Boolean(finalToolStallErrorMessage);

  const runSucceededWithResult =
    finalResultEvent !== undefined && !finalResultEvent.isError;

  let errorValue: string | null = null;
  if (finalResultEvent?.isError) {
    errorValue = finalResultEvent.result;
  } else if (
    (!runSucceededWithResult && finalCode !== 0) ||
    attemptEndedDueToTimeout
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

  for (const step of S.accumulatedSteps) step.status = "complete";
  const activityLog = JSON.stringify(S.accumulatedSteps);

  let completionSuccess = finalResultEvent
    ? !finalResultEvent.isError
    : finalCode === 0;
  if (attemptEndedDueToTimeout) {
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

  try {
    await callConvexWithRetry(
      "mutation",
      COMPLETION_MUTATION ?? "",
      completionArgs,
    );
    let videoStorageId: string | null = null;
    let imageStorageId: string | null = null;
    let lastFileName: string | null = null;
    const recDir = WORK_DIR + "/recordings";
    if (existsSync(recDir)) {
      for (const file of readdirSync(recDir)) {
        if (!/\.(webm|mp4|mov|avi)$/i.test(file)) continue;
        const fp = recDir + "/" + file;
        const mimeType = file.endsWith(".mp4") ? "video/mp4" : "video/webm";
        try {
          videoStorageId = await uploadMediaFile(fp, mimeType);
          lastFileName = file;
        } catch {
          /* ignore upload errors */
        }
        try {
          unlinkSync(fp);
        } catch {
          /* ignore */
        }
      }
    }
    if (!videoStorageId) {
      const ssDir = WORK_DIR + "/screenshots";
      if (existsSync(ssDir)) {
        for (const file of readdirSync(ssDir)) {
          if (!/\.(png|jpg|jpeg|gif|webp)$/i.test(file)) continue;
          const fp = ssDir + "/" + file;
          const ext = file.split(".").pop()?.toLowerCase() ?? "png";
          const mimeMap: Record<string, string> = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            webp: "image/webp",
          };
          const mimeType = mimeMap[ext] || "image/png";
          try {
            imageStorageId = await uploadMediaFile(fp, mimeType);
            lastFileName = file;
          } catch {
            /* ignore upload errors */
          }
          try {
            unlinkSync(fp);
          } catch {
            /* ignore */
          }
        }
      }
    }
    try {
      await persistTaskProofIfNeeded(
        videoStorageId,
        imageStorageId,
        lastFileName,
      );
    } catch (e) {
      console.error("Failed to persist task proof:", e);
      const proofError = e instanceof Error ? e.message : String(e);
      await saveProofFailureMessageIfNeeded(
        "Proof capture failed after completion: " + proofError,
      );
    }
    syncProviderStateToPersist("completion");
    await stopStreamingLoops();
    writeDoneFile(completionSuccess ? "success" : "error", {
      exitCode: finalCode,
      error: errorValue,
    });
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
              ? "Codex"
              : PROVIDER === "opencode"
                ? "Opencode"
                : PROVIDER === "cursor"
                  ? "Cursor"
                  : "Claude") +
            " CLI",
    ),
    activityLog: JSON.stringify(S.accumulatedSteps),
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
