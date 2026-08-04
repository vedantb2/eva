import { CLAIM_MUTATION, ENTITY_ID } from "../config.js";
import { callConvexWithRetry } from "../http/convexClient.js";
import { callbackState as S } from "./state.js";
import { activeTurnIdentityArgs } from "./turnIdentity.js";
import type { JsonValue } from "../types.js";
import type { SdkCanUseTool } from "../providers/claudeSdk.js";
import { log, tryParseJson } from "../utils.js";

// How often the paused turn polls Convex for the user's answer. Matches the
// daemon's turn-claim cadence — the model is idle while waiting, so this only
// adds at most one poll of latency once the answer lands.
const POLL_INTERVAL_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads `.value.answer` (a JSON string, or null) out of a claimAnswer result.
 * Convex's `/api/mutation` wraps returns in `{ status, value }`, so the answer
 * lives under `.value`; falls back to the top level for an unwrapped value.
 */
function readClaimedAnswer(result: JsonValue): string | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  const payload =
    typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? inner
      : result;
  const answer = payload.answer;
  return typeof answer === "string" ? answer : null;
}

/** Publishes the question so the UI can render it and collect an answer. */
async function postQuestion(toolUseId: string, payload: string): Promise<void> {
  await callConvexWithRetry("mutation", "pendingQuestions:post", {
    entityId: ENTITY_ID ?? "",
    toolUseId,
    payload,
    ...activeTurnIdentityArgs(),
  });
}

/** Polls until the user answers, or the turn is cancelled (signal aborts). */
async function pollForAnswer(
  toolUseId: string,
  signal: AbortSignal,
): Promise<string | null> {
  while (!signal.aborted) {
    const result = await callConvexWithRetry(
      "mutation",
      "pendingQuestions:claimAnswer",
      {
        entityId: ENTITY_ID ?? "",
        toolUseId,
        ...activeTurnIdentityArgs(),
      },
    );
    const answer = readClaimedAnswer(result);
    if (answer !== null) return answer;
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

/** Parses the stored answer JSON into an object safe to merge into tool input. */
export function parsePendingQuestionAnswers(
  answerJson: string,
): Record<string, string> {
  const parsed = tryParseJson(answerJson);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") answers[key] = value;
    }
    return answers;
  }
  return {};
}

/** Publishes a blocking interaction and waits for the UI's structured answer. */
export async function waitForPendingQuestionAnswer(
  toolUseId: string,
  payload: string,
  signal: AbortSignal,
): Promise<Record<string, string> | null> {
  S.awaitingQuestionAnswer = true;
  try {
    await postQuestion(toolUseId, payload);
    // Blocking questions live only in the exact pendingQuestions row. Keeping
    // the legacy stream/message copy would let an answered request reappear.
    S.pendingQuestionData = "";
    const answerJson = await pollForAnswer(toolUseId, signal);
    return answerJson === null ? null : parsePendingQuestionAnswers(answerJson);
  } finally {
    S.awaitingQuestionAnswer = false;
  }
}

/**
 * Builds the SDK `canUseTool` gate used when blocking questions are enabled.
 * Every tool is auto-allowed EXCEPT AskUserQuestion, which posts the question to
 * Convex and blocks (no timeout) until the user answers — then returns the
 * answer as the tool's input so the model continues the SAME turn with a real
 * tool_result rather than the question ending the turn.
 */
export function buildCanUseTool(): SdkCanUseTool {
  return async (toolName, input, options) => {
    // Policy A: Bash may background (session panel tracks/kills it), but on
    // one-shot job runs (no CLAIM_MUTATION) Agent/Task sub-agents must stay
    // foreground so the SDK result still covers their work. Warm daemon chat
    // allows background. Named `Agent` since Claude Code v2.1.63; older CLIs
    // still emit `Task`.
    if (
      !CLAIM_MUTATION &&
      (toolName === "Agent" || toolName === "Task") &&
      input.run_in_background === true
    ) {
      return {
        behavior: "allow",
        updatedInput: { ...input, run_in_background: false },
      };
    }
    if (toolName !== "AskUserQuestion") {
      return { behavior: "allow", updatedInput: input };
    }
    const toolUseId =
      typeof options.toolUseID === "string" && options.toolUseID
        ? options.toolUseID
        : "";
    log("canUseTool: AskUserQuestion — posting question, awaiting user answer");
    const answers = await waitForPendingQuestionAnswer(
      toolUseId,
      JSON.stringify(input),
      options.signal,
    );
    if (answers === null) {
      return { behavior: "deny", message: "The question was cancelled." };
    }
    return {
      behavior: "allow",
      updatedInput: { ...input, answers },
    };
  };
}
