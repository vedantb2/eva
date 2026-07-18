import {
  CODEX_PRICING_PER_MILLION,
  ENTITY_ID,
  ENTITY_ID_FIELD,
  PROVIDER,
  RUN_ID,
  SCRIPT_STARTED_AT,
  TASK_PROOF_CAPTURE_ENABLED,
  TOOL_STEP_TYPES,
  DONE_FILE,
  FIRST_ASSISTANT_EVENT_TIMEOUT_MS,
  FIRST_EVENT_TIMEOUT_MS,
  MAX_TOTAL_RUNTIME_MS,
  NO_OUTPUT_TIMEOUT_MS,
  POST_TEXT_STALL_TIMEOUT_MS,
  WORK_DIR,
  normalizedCodexModel,
  normalizedCursorModel,
  normalizedOpencodeModel,
} from "../config.js";
import { callConvexWithRetry, fetchWithTimeout } from "../http/convexClient.js";
import { getCodexAgentMessageText } from "../parse/toolSteps.js";
import { callbackState as S } from "../runtime/state.js";
import type { JsonObject, ResultEvent } from "../types.js";
import { attemptElapsedMs, readResponseJson, tryParseJson } from "../utils.js";
import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";

function parseJsonObject(line: string): JsonObject | null {
  const parsed = tryParseJson(line);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed;
}

/** Idempotent done-file writer. */
export function writeDoneFile(
  status: string,
  extras?: Record<string, string | number | boolean | null>,
): void {
  if (S.doneFileWritten) return;
  S.doneFileWritten = true;
  try {
    const payload = {
      endedAt: Date.now(),
      startedAt: SCRIPT_STARTED_AT,
      durationMs: Date.now() - SCRIPT_STARTED_AT,
      status,
      provider: PROVIDER,
      entityId: ENTITY_ID || null,
      runId: RUN_ID || null,
      resultEventSeen: S.resultEventSeen,
      accumulatedStepCount: S.accumulatedSteps.length,
      parsedStreamEventCount: S.parsedStreamEventCount,
      rawLogBytesWritten: S.rawLogBytesWritten,
      ...extras,
    };
    writeFileSync(DONE_FILE, JSON.stringify(payload));
  } catch (err) {
    console.error(
      "Failed to write done file: " +
        String(err instanceof Error ? err.message : err),
    );
  }
}

function computeCodexCostUsd(
  model: string,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
): number {
  const pricing = CODEX_PRICING_PER_MILLION[model];
  if (!pricing) return 0;
  const nonCachedInput = Math.max(0, inputTokens - cachedInputTokens);
  return (
    (nonCachedInput * pricing.input) / 1_000_000 +
    (cachedInputTokens * pricing.cached) / 1_000_000 +
    (outputTokens * pricing.output) / 1_000_000
  );
}

function buildClaudeShapedResult(args: {
  provider: string;
  totalCostUsd: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  model: string;
}): string {
  return JSON.stringify({
    type: "result",
    provider: args.provider,
    total_cost_usd: args.totalCostUsd,
    duration_ms: args.durationMs,
    usage: {
      input_tokens: args.inputTokens,
      output_tokens: args.outputTokens,
      cache_read_input_tokens: args.cacheReadInputTokens,
      cache_creation_input_tokens: args.cacheCreationInputTokens,
    },
    modelUsage: args.model ? { [args.model]: {} } : {},
  });
}

/** Extracts the final result event from CLI output. */
export function extractResultEvent(output: string): ResultEvent | null {
  if (PROVIDER === "cursor") {
    let resultText = "";
    let isError = false;
    let sawResult = false;
    let durationMs = 0;
    const assistantParts: string[] = [];
    for (const line of output.split("\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (parsed.type === "result") {
          sawResult = true;
          isError = Boolean(parsed.is_error);
          if (typeof parsed.duration_ms === "number")
            durationMs = parsed.duration_ms;
          if (typeof parsed.result === "string") {
            resultText = parsed.result;
          } else if (parsed.result !== undefined) {
            resultText = JSON.stringify(parsed.result);
          }
          continue;
        }
        if (
          parsed.type === "assistant" &&
          parsed.message &&
          typeof parsed.message === "object" &&
          !Array.isArray(parsed.message) &&
          Array.isArray(parsed.message.content)
        ) {
          for (const block of parsed.message.content) {
            if (
              block &&
              typeof block === "object" &&
              !Array.isArray(block) &&
              block.type === "text" &&
              typeof block.text === "string"
            ) {
              assistantParts.push(block.text);
            }
          }
        }
      } catch {
        /* skip malformed lines */
      }
    }
    if (sawResult) {
      return {
        result: resultText || assistantParts.join(""),
        isError,
        rawResultEvent: buildClaudeShapedResult({
          provider: "cursor",
          totalCostUsd: 0,
          durationMs: durationMs || attemptElapsedMs(),
          inputTokens: 0,
          outputTokens: 0,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
          model: normalizedCursorModel,
        }),
      };
    }
    if (assistantParts.length > 0) {
      return {
        result: assistantParts.join(""),
        isError: false,
        rawResultEvent: "",
      };
    }
    return null;
  }

  if (PROVIDER === "opencode") {
    let finalMessageId = "";
    let sawStopStep = false;
    let errorLine = "";
    let errorMessage = "";
    const textByMessageId = new Map<string, string>();
    let totalCostUsd = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let reasoningTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let stepModel = "";
    for (const line of output.split("\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (parsed.type === "step_finish" && parsed.part) {
          const part =
            typeof parsed.part === "object" && !Array.isArray(parsed.part)
              ? parsed.part
              : null;
          if (part && typeof part.cost === "number") totalCostUsd += part.cost;
          const t = part && part.tokens;
          if (t && typeof t === "object" && !Array.isArray(t)) {
            if (typeof t.input === "number") inputTokens = t.input;
            if (typeof t.output === "number") outputTokens += t.output;
            if (typeof t.reasoning === "number") reasoningTokens += t.reasoning;
            if (
              t.cache &&
              typeof t.cache === "object" &&
              !Array.isArray(t.cache)
            ) {
              if (typeof t.cache.read === "number")
                cacheReadTokens = t.cache.read;
              if (typeof t.cache.write === "number")
                cacheWriteTokens += t.cache.write;
            }
          }
          if (part && typeof part.modelID === "string" && part.modelID) {
            stepModel = part.modelID;
          }
          if (
            part &&
            part.reason === "stop" &&
            typeof part.messageID === "string" &&
            part.messageID
          ) {
            finalMessageId = part.messageID;
            sawStopStep = true;
          }
          continue;
        }
        if (
          parsed.type === "text" &&
          parsed.part &&
          typeof parsed.part === "object" &&
          !Array.isArray(parsed.part) &&
          typeof parsed.part.messageID === "string" &&
          parsed.part.messageID &&
          typeof parsed.part.text === "string"
        ) {
          const existing = textByMessageId.get(parsed.part.messageID) || "";
          textByMessageId.set(
            parsed.part.messageID,
            existing + parsed.part.text,
          );
          continue;
        }
        if (parsed.type === "error") {
          errorLine = clean;
          const err =
            parsed.error &&
            typeof parsed.error === "object" &&
            !Array.isArray(parsed.error)
              ? parsed.error
              : null;
          if (
            err &&
            err.data &&
            typeof err.data === "object" &&
            !Array.isArray(err.data) &&
            typeof err.data.message === "string"
          ) {
            errorMessage = err.data.message;
          } else if (err && typeof err.name === "string") {
            errorMessage = err.name;
          } else {
            errorMessage = "Opencode error";
          }
        }
      } catch {
        /* skip malformed lines */
      }
    }
    if (sawStopStep) {
      return {
        result: textByMessageId.get(finalMessageId) || "",
        isError: false,
        rawResultEvent: buildClaudeShapedResult({
          provider: "opencode",
          totalCostUsd,
          durationMs: attemptElapsedMs(),
          inputTokens,
          outputTokens: outputTokens + reasoningTokens,
          cacheReadInputTokens: cacheReadTokens,
          cacheCreationInputTokens: cacheWriteTokens,
          model: stepModel || normalizedOpencodeModel,
        }),
      };
    }
    if (errorMessage) {
      return { result: errorMessage, isError: true, rawResultEvent: errorLine };
    }
    return null;
  }

  if (PROVIDER === "codex") {
    let finalText = "";
    let lastInputTokens = 0;
    let lastCachedInputTokens = 0;
    let lastOutputTokens = 0;
    for (const line of output.split("\n")) {
      const clean = line.trim();
      if (!clean) continue;
      try {
        const parsed = parseJsonObject(clean);
        if (!parsed) continue;
        if (
          parsed.type === "item.completed" &&
          parsed.item &&
          typeof parsed.item === "object" &&
          !Array.isArray(parsed.item) &&
          parsed.item.type === "agent_message"
        ) {
          const messageText = getCodexAgentMessageText(parsed.item);
          if (messageText) finalText = messageText;
          continue;
        }
        if (parsed.type === "token_count" && parsed.info) {
          const info =
            typeof parsed.info === "object" && !Array.isArray(parsed.info)
              ? parsed.info
              : null;
          const total = info && info.total_token_usage;
          if (total && typeof total === "object" && !Array.isArray(total)) {
            if (typeof total.input_tokens === "number")
              lastInputTokens = total.input_tokens;
            if (typeof total.cached_input_tokens === "number")
              lastCachedInputTokens = total.cached_input_tokens;
            if (typeof total.output_tokens === "number")
              lastOutputTokens = total.output_tokens;
          }
        }
      } catch {
        /* skip malformed lines */
      }
    }
    if (!finalText) return null;
    const nonCachedInput = Math.max(0, lastInputTokens - lastCachedInputTokens);
    return {
      result: finalText,
      isError: false,
      rawResultEvent: buildClaudeShapedResult({
        provider: "codex",
        totalCostUsd: computeCodexCostUsd(
          normalizedCodexModel,
          lastInputTokens,
          lastCachedInputTokens,
          lastOutputTokens,
        ),
        durationMs: attemptElapsedMs(),
        inputTokens: nonCachedInput,
        outputTokens: lastOutputTokens,
        cacheReadInputTokens: lastCachedInputTokens,
        cacheCreationInputTokens: 0,
        model: normalizedCodexModel,
      }),
    };
  }

  let resultEvent: ResultEvent | null = null;
  for (const line of output.split("\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = parseJsonObject(clean);
      if (!parsed) continue;
      if (parsed.type === "result") {
        const r = parsed.result ?? "";
        const withProvider = JSON.stringify({ ...parsed, provider: "claude" });
        resultEvent = {
          result: typeof r === "string" ? r : JSON.stringify(r),
          isError: Boolean(parsed.is_error),
          rawResultEvent: withProvider,
        };
      }
    } catch {
      /* skip malformed lines */
    }
  }
  return resultEvent;
}

export function buildErrorMessage(
  code: number,
  fatalHeartbeatError: string,
  toolStallError: string,
  timedOutForMaxRuntime: boolean,
  timedOutForNoOutput: boolean,
  timedOutForFirstEvent: boolean,
  timedOutForFirstAssistant: boolean,
  timedOutAfterFirstText: boolean,
  timedOutForZombie: boolean,
): string {
  const cliName =
    PROVIDER === "codex"
      ? "Codex CLI"
      : PROVIDER === "opencode"
        ? "Opencode CLI"
        : PROVIDER === "cursor"
          ? "Cursor CLI"
          : "Claude CLI";
  if (fatalHeartbeatError) return fatalHeartbeatError;
  if (toolStallError) return toolStallError;
  if (timedOutForZombie) {
    return (
      cliName +
      " terminated because the CLI process entered zombie state (likely a grandchild held stdio open after the CLI exited)"
    );
  }
  if (timedOutForMaxRuntime) {
    return (
      cliName +
      " terminated after max runtime of " +
      MAX_TOTAL_RUNTIME_MS +
      "ms"
    );
  }
  if (timedOutForFirstEvent) {
    return (
      cliName +
      " produced no parseable stream-json events within " +
      FIRST_EVENT_TIMEOUT_MS +
      "ms"
    );
  }
  if (timedOutForFirstAssistant) {
    return (
      cliName +
      " initialized but produced no assistant response within " +
      FIRST_ASSISTANT_EVENT_TIMEOUT_MS +
      "ms — likely MCP initialization or API congestion"
    );
  }
  if (timedOutAfterFirstText) {
    return (
      cliName +
      " stalled after first text block for " +
      POST_TEXT_STALL_TIMEOUT_MS +
      "ms"
    );
  }
  if (timedOutForNoOutput) {
    return (
      cliName + " terminated after no stdout for " + NO_OUTPUT_TIMEOUT_MS + "ms"
    );
  }
  return cliName + " exited with code " + code;
}

export function appendDiagnosticTail(message: string): string {
  const details: string[] = [];
  const stdoutTail = S.rawOutput.slice(-1500).trim();
  const stderrTail = S.stderrOutput.slice(-1500).trim();
  if (stdoutTail) details.push("stdout tail:\n" + stdoutTail);
  if (stderrTail) details.push("stderr tail:\n" + stderrTail);
  if (details.length === 0) {
    details.push(
      "(stdout and stderr were empty — CLI likely hung before emitting stream-json, e.g. bad --model)",
    );
  }
  return message + "\n\n" + details.join("\n\n");
}

export async function uploadMediaFile(
  filePath: string,
  mimeType: string,
): Promise<string> {
  const urlRes = await callConvexWithRetry(
    "mutation",
    "screenshots:generateUploadUrl",
    {},
    3,
  );
  const urlValue =
    urlRes &&
    typeof urlRes === "object" &&
    !Array.isArray(urlRes) &&
    urlRes.value &&
    typeof urlRes.value === "string"
      ? urlRes.value
      : "";
  if (!urlValue) throw new Error("Missing upload URL");
  const fileData = readFileSync(filePath);
  const uploadRes = await fetchWithTimeout(
    urlValue,
    {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: fileData,
    },
    30000,
  );
  if (!uploadRes.ok) {
    throw new Error("Upload failed: " + uploadRes.status);
  }
  const uploadJson = await readResponseJson(uploadRes);
  if (
    uploadJson &&
    typeof uploadJson === "object" &&
    !Array.isArray(uploadJson) &&
    typeof uploadJson.storageId === "string"
  ) {
    return uploadJson.storageId;
  }
  throw new Error("Missing storageId in upload response");
}

export async function persistTaskProofIfNeeded(
  videoStorageId: string | null,
  imageStorageId: string | null,
  lastFileName: string | null,
): Promise<void> {
  if (videoStorageId || imageStorageId) {
    if (ENTITY_ID_FIELD === "taskId") {
      const storageId = videoStorageId || imageStorageId;
      const saveArgs: JsonObject = {
        taskId: ENTITY_ID ?? "",
        storageId: storageId ?? "",
        fileName: lastFileName ?? "",
      };
      if (RUN_ID) saveArgs.runId = RUN_ID;
      await callConvexWithRetry("mutation", "taskProof:save", saveArgs, 3);
      return;
    }
    const mediaArgs: JsonObject = { parentId: ENTITY_ID ?? "" };
    if (videoStorageId) mediaArgs.videoStorageId = videoStorageId;
    if (imageStorageId) mediaArgs.imageStorageId = imageStorageId;
    await callConvexWithRetry(
      "action",
      "screenshots:attachMedia",
      mediaArgs,
      3,
    );
    return;
  }
  if (ENTITY_ID_FIELD === "taskId") {
    if (!TASK_PROOF_CAPTURE_ENABLED) return;
    const messageArgs: JsonObject = {
      taskId: ENTITY_ID ?? "",
      message: "No UI changes",
    };
    if (RUN_ID) messageArgs.runId = RUN_ID;
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      messageArgs,
      3,
    );
  }
}

/**
 * Scans sandbox `recordings/` then `screenshots/`, uploads the newest media,
 * and attaches it to the last session message (or task proof). Shared by the
 * one-shot callback and the Claude sdk-daemon finalize path — daemon turns
 * previously skipped this, so chat never showed agent recordings.
 *
 * Prefer calling after the completion mutation so `screenshots:attachMedia`
 * patches the assistant message that was just written.
 */
export async function uploadAndAttachSandboxMedia(): Promise<void> {
  if (!TASK_PROOF_CAPTURE_ENABLED) return;

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
}

export async function saveProofFailureMessageIfNeeded(
  message: string,
): Promise<void> {
  if (ENTITY_ID_FIELD !== "taskId") return;
  if (!TASK_PROOF_CAPTURE_ENABLED) return;
  try {
    const failureArgs: JsonObject = {
      taskId: ENTITY_ID ?? "",
      message,
    };
    if (RUN_ID) failureArgs.runId = RUN_ID;
    await callConvexWithRetry(
      "mutation",
      "taskProof:saveMessage",
      failureArgs,
      2,
    );
  } catch (error) {
    console.error("Failed to record proof persistence error:", error);
  }
}

export function hasToolActivity(): boolean {
  return S.accumulatedSteps.some((step) => TOOL_STEP_TYPES.has(step.type));
}
