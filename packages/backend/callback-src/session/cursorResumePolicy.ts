import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { JsonValue } from "../types.js";
import { tryParseJson } from "../utils.js";

/**
 * Rotate only when resuming would replay a nearly full context window. Grok's
 * window is ~256k tokens, so at 160k a resume already pays a slow, expensive
 * replay of the whole history and the next few tool results force the model to
 * summarise anyway. Below it, resuming is cheap and keeps the agent's memory —
 * which matters far more than the replay cost.
 */
export const CURSOR_MAX_RESUME_CONTEXT_TOKENS = 160_000;

export type CursorResumeStats = {
  /** The newest run found for the persisted agent. */
  runId: string;
  /**
   * Live context of that run's LAST model request: `inputTokens +
   * cacheReadTokens`. Deliberately NOT the run's stored `usage`, which the SDK
   * writes as the SUM of every model request in the turn — that reaches
   * hundreds of thousands on any normal agentic turn and says nothing at all
   * about how full the context window actually is.
   */
  contextTokens: number;
};

type JsonRecord = { [key: string]: JsonValue };

function asRecord(value: JsonValue | undefined): JsonRecord | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function asId(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** `inputTokens + cacheReadTokens` of one request, or null when unreported. */
function readContextTokens(usage: JsonRecord | null): number | null {
  if (!usage) return null;
  const input = usage.inputTokens;
  if (typeof input !== "number" || !Number.isFinite(input)) return null;
  const cacheRead = usage.cacheReadTokens;
  const cached =
    typeof cacheRead === "number" && Number.isFinite(cacheRead) ? cacheRead : 0;
  return Math.max(0, input) + Math.max(0, cached);
}

type RunEventLine = {
  runId: string | null;
  agentId: string | null;
  /** Set only on the per-request usage event (`turn-ended`). */
  contextTokens: number | null;
};

/**
 * One line of Cursor's `run_events.ndjson`, as written by JsonlLocalAgentStore:
 *
 * ```
 * { runId, seq, offset, eventType: "run_stream_event", payload: {
 *     schemaVersion: 1, type: "sdk_message", agentId, runId,
 *     message: { type: "usage", agent_id, run_id, usage: {
 *       inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens,
 *       totalTokens, reasoningTokens? } } },
 *   payloadRef, idempotencyKey, createdAt }
 * ```
 *
 * The SDK turns each `turn-ended` stream update into that `usage` message, so
 * one line per model request. Ids are read from the envelope, the payload and
 * the message in both casings: a rename inside the SDK must not silently turn
 * every lookup into a rotation, and the usage object is located structurally
 * rather than by trusting the message's `type` string.
 */
function readRunEventLine(line: string): RunEventLine | null {
  const record = asRecord(tryParseJson(line));
  if (!record) return null;
  const payload = asRecord(record.payload);
  const message = payload ? asRecord(payload.message) : null;
  const runId =
    asId(record.runId) ??
    asId(record.run_id) ??
    asId(payload?.runId) ??
    asId(payload?.run_id) ??
    asId(message?.run_id) ??
    asId(message?.runId);
  const agentId =
    asId(payload?.agentId) ??
    asId(payload?.agent_id) ??
    asId(message?.agent_id) ??
    asId(message?.agentId);
  return {
    runId,
    agentId,
    contextTokens: readContextTokens(asRecord(message?.usage)),
  };
}

/**
 * Measures how full the resumed context really is, from Cursor's append-only
 * JSONL store. Run events carry the agent id themselves, so `runs.ndjson` is
 * not needed: the newest run for this agent is the one owning the last line
 * mentioning it, and its LAST usage event is the live context size.
 *
 * Returns null for "unknown" — missing store, unparseable lines, or a newest
 * run that never reported usage.
 */
export function readCursorResumeStats(
  storeDir: string,
  agentId: string,
): CursorResumeStats | null {
  const eventsFile = join(storeDir, "run_events.ndjson");
  if (!existsSync(eventsFile)) return null;

  try {
    const lines = readFileSync(eventsFile, "utf8").split("\n");
    let newestRunId: string | null = null;
    for (let index = lines.length - 1; index >= 0; index--) {
      const line = lines[index];
      if (!line) continue;
      const event = readRunEventLine(line);
      if (!event || event.runId === null) continue;
      if (newestRunId === null) {
        if (event.agentId !== agentId) continue;
        newestRunId = event.runId;
      }
      // Only the newest run's own requests describe the checkpoint we are about
      // to resume; a finished older run's context is irrelevant.
      if (event.runId !== newestRunId) continue;
      if (event.contextTokens !== null) {
        return { runId: newestRunId, contextTokens: event.contextTokens };
      }
    }
  } catch (error) {
    console.error("Failed to inspect Cursor resume history:", String(error));
  }
  return null;
}

/**
 * Rotates only on hard evidence of a near-full window. Unknown (`null`) resumes
 * instead: a wrongly-fresh agent silently loses every memory of its own work,
 * while a wrongly-resumed one at worst pays for one replay.
 */
export function shouldRotateCursorSession(
  stats: CursorResumeStats | null,
): boolean {
  if (stats === null) return false;
  return stats.contextTokens >= CURSOR_MAX_RESUME_CONTEXT_TOKENS;
}
