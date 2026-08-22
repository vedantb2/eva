import { REPO_ID } from "../config.js";
import { callConvexWithRetry } from "../http/convexClient.js";
import type {
  JsonObject,
  JsonValue,
  UsageLimitSnapshot,
  UsageLimitStatus,
  UsageLimitWindow,
} from "../types.js";
import { log } from "../utils.js";
import { callbackState as S } from "./state.js";

/** Convex mutation that upserts the (repo, provider) usage-limit row. */
const REPORT_MUTATION = "usageLimits:report";

/**
 * A single retry only: this is best-effort telemetry reported alongside the
 * turn's completion, so a long backoff would just hold a promise open past the
 * point anyone cares about the reading.
 */
const REPORT_MAX_RETRIES = 1;

/**
 * Bound on the experimental `/usage` lookup. It rides the SDK's control channel,
 * which a finished one-shot query may already have torn down — a torn-down
 * channel that never answers would otherwise hold a turn open indefinitely.
 */
const USAGE_LOOKUP_TIMEOUT_MS = 5_000;

/** Provider whose plan usage is tracked. Mirrors the Convex validator. */
export type UsageLimitProvider = "claude" | "cursor";

/**
 * Display labels for the Agent SDK's rate-limit window keys. Shared by both
 * Claude capture paths (the `rate_limit_event` stream message names one window;
 * the `/usage` lookup names several) so a window's label never depends on which
 * source observed it first.
 */
const CLAUDE_WINDOW_LABELS: Record<string, string> = {
  five_hour: "5h",
  seven_day: "Weekly (all models)",
  seven_day_oauth_apps: "Weekly (apps)",
  seven_day_opus: "Weekly (Opus)",
  seven_day_sonnet: "Weekly (Sonnet)",
  seven_day_overage_included: "Weekly (overage included)",
  overage: "Extra usage",
};

/**
 * Minimal structural view of the Agent SDK's EXPERIMENTAL `/usage` response.
 * Declared here rather than imported so the pinned SDK renaming or dropping the
 * method cannot break this module's types; every value read is still guarded,
 * because the SDK documents the shape itself as unstable.
 */
export type ClaudeUsageWindowLike = {
  utilization?: number | null;
  resets_at?: string | null;
} | null;

export type ClaudeUsageResponseLike = {
  subscription_type?: string | null;
  rate_limits_available?: boolean;
  rate_limits?: {
    five_hour?: ClaudeUsageWindowLike;
    seven_day?: ClaudeUsageWindowLike;
    seven_day_oauth_apps?: ClaudeUsageWindowLike;
    seven_day_opus?: ClaudeUsageWindowLike;
    seven_day_sonnet?: ClaudeUsageWindowLike;
    model_scoped?: {
      display_name?: string;
      utilization?: number | null;
      resets_at?: string | null;
    }[];
  } | null;
};

/** Minimal structural view of the Cursor SDK's `AgentUsage`. */
export type CursorUsageLike = {
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    totalTokens?: number;
  } | null;
  cost?: { chargedCents?: number } | null;
};

function readFiniteNumber(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readNonEmptyString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStatus(
  value: JsonValue | undefined,
): UsageLimitStatus | undefined {
  return value === "allowed" ||
    value === "allowed_warning" ||
    value === "rejected"
    ? value
    : undefined;
}

/** ISO 8601 timestamp to epoch ms, or undefined when unparseable. */
export function readIsoMs(value: JsonValue | undefined): number | undefined {
  const text = readNonEmptyString(value);
  if (!text) return undefined;
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : undefined;
}

function buildWindow(
  key: string,
  label: string,
  utilization: number | undefined,
  resetsAt: number | undefined,
): UsageLimitWindow {
  return {
    key,
    label,
    ...(utilization === undefined ? {} : { utilization }),
    ...(resetsAt === undefined ? {} : { resetsAt }),
  };
}

/**
 * Replaces the same-keyed window in place, appending when it is new. Each
 * source only ever knows about some of the windows, so merging by key is what
 * stops a single-window `rate_limit_event` from erasing the others.
 */
function mergeWindow(
  snapshot: UsageLimitSnapshot,
  window: UsageLimitWindow,
): void {
  const windows = snapshot.windows ?? [];
  const index = windows.findIndex((existing) => existing.key === window.key);
  if (index >= 0) {
    windows[index] = window;
  } else {
    windows.push(window);
  }
  snapshot.windows = windows;
}

function ensureSnapshot(): UsageLimitSnapshot {
  const existing = S.usageLimitSnapshot;
  if (existing) return existing;
  const created: UsageLimitSnapshot = {};
  S.usageLimitSnapshot = created;
  return created;
}

/**
 * Folds one Claude `rate_limit_event` stream message into the snapshot. The
 * event carries the plan-wide status plus exactly ONE window's utilization, so
 * it is merged per window key and never treated as the whole picture.
 */
export function mergeClaudeRateLimitEvent(event: JsonObject): void {
  const info = event.rate_limit_info;
  if (typeof info !== "object" || info === null || Array.isArray(info)) return;
  const status = readStatus(info.status);
  const key = readNonEmptyString(info.rateLimitType);
  if (!status && !key) return;
  const snapshot = ensureSnapshot();
  if (status) snapshot.status = status;
  if (!key) return;
  // The stream event reports `resetsAt` in epoch SECONDS, unlike the `/usage`
  // lookup's ISO strings — normalize both to epoch ms here.
  const resetsAtSeconds = readFiniteNumber(info.resetsAt);
  mergeWindow(
    snapshot,
    buildWindow(
      key,
      CLAUDE_WINDOW_LABELS[key] ?? key,
      readFiniteNumber(info.utilization),
      resetsAtSeconds === undefined
        ? undefined
        : Math.round(resetsAtSeconds * 1000),
    ),
  );
}

function pushUsageWindow(
  windows: UsageLimitWindow[],
  key: string,
  entry: ClaudeUsageWindowLike | undefined,
  label?: string,
): void {
  if (!entry) return;
  const utilization = readFiniteNumber(entry.utilization);
  const resetsAt = readIsoMs(entry.resets_at);
  // A window the server reports as entirely null carries nothing to show.
  if (utilization === undefined && resetsAt === undefined) return;
  windows.push(
    buildWindow(
      key,
      label ?? CLAUDE_WINDOW_LABELS[key] ?? key,
      utilization,
      resetsAt,
    ),
  );
}

/** Every populated window in a `/usage` response, in display order. */
export function readClaudeUsageWindows(
  response: ClaudeUsageResponseLike | null | undefined,
): UsageLimitWindow[] {
  const limits = response?.rate_limits;
  if (!limits) return [];
  const windows: UsageLimitWindow[] = [];
  pushUsageWindow(windows, "five_hour", limits.five_hour);
  pushUsageWindow(windows, "seven_day", limits.seven_day);
  pushUsageWindow(windows, "seven_day_opus", limits.seven_day_opus);
  pushUsageWindow(windows, "seven_day_sonnet", limits.seven_day_sonnet);
  pushUsageWindow(windows, "seven_day_oauth_apps", limits.seven_day_oauth_apps);
  for (const entry of limits.model_scoped ?? []) {
    const name = readNonEmptyString(entry.display_name);
    if (!name) continue;
    // Model-scoped entries are weekly windows too, so they are labelled like
    // the fixed ones ("Weekly (Fable)") rather than by bare model name.
    pushUsageWindow(
      windows,
      "model_scoped:" + name,
      entry,
      `Weekly (${name})`,
    );
  }
  return windows;
}

/**
 * Reads the Agent SDK's EXPERIMENTAL plan-usage endpoint and merges what it
 * reports into the snapshot. The SDK states outright that this API may change or
 * vanish without notice, so every failure — a missing method, a transport error,
 * an unexpected shape — is swallowed with a log line. A usage reading is never
 * worth failing a turn for.
 */
export async function captureClaudeUsage(
  readUsage: () => Promise<ClaudeUsageResponseLike | null>,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      readUsage(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), USAGE_LOOKUP_TIMEOUT_MS);
      }),
    ]);
    if (response === "timeout") {
      log("usage limits: claude usage lookup timed out");
      return;
    }
    if (!response) return;
    const snapshot = ensureSnapshot();
    const subscriptionType = readNonEmptyString(response.subscription_type);
    if (subscriptionType) snapshot.subscriptionType = subscriptionType;
    // False for API key, Bedrock and Vertex sessions — there are no plan
    // windows to read, and `rate_limits` is null.
    if (response.rate_limits_available !== true) return;
    for (const window of readClaudeUsageWindows(response)) {
      mergeWindow(snapshot, window);
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    log("usage limits: claude usage lookup failed — " + messageText);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Reads Cursor's cumulative `AgentUsage`. Cursor exposes no plan windows, so the
 * agent-lifetime token totals and charged cost are what its row shows instead.
 */
export function readCursorUsageSnapshot(
  value: CursorUsageLike | null | undefined,
): UsageLimitSnapshot | null {
  if (!value) return null;
  const snapshot: UsageLimitSnapshot = {};
  const tokens = value.usage;
  if (tokens) {
    snapshot.tokens = {
      input: readFiniteNumber(tokens.inputTokens) ?? 0,
      output: readFiniteNumber(tokens.outputTokens) ?? 0,
      cacheRead: readFiniteNumber(tokens.cacheReadTokens) ?? 0,
      cacheWrite: readFiniteNumber(tokens.cacheWriteTokens) ?? 0,
      total: readFiniteNumber(tokens.totalTokens) ?? 0,
    };
  }
  const costCents = readFiniteNumber(value.cost?.chargedCents);
  if (costCents !== undefined) snapshot.costCents = costCents;
  if (!snapshot.tokens && snapshot.costCents === undefined) return null;
  return snapshot;
}

/** Records Cursor's cumulative usage. The totals supersede any prior reading. */
export function captureCursorUsage(
  value: CursorUsageLike | null | undefined,
): void {
  const snapshot = readCursorUsageSnapshot(value);
  if (snapshot) S.usageLimitSnapshot = snapshot;
}

function windowToJson(window: UsageLimitWindow): JsonObject {
  return {
    key: window.key,
    label: window.label,
    ...(window.utilization === undefined
      ? {}
      : { utilization: window.utilization }),
    ...(window.resetsAt === undefined ? {} : { resetsAt: window.resetsAt }),
  };
}

/** The mutation payload minus `capturedAt`, so it doubles as the dedup key. */
export function buildUsageLimitReportArgs(
  repoId: string,
  provider: UsageLimitProvider,
  snapshot: UsageLimitSnapshot,
): JsonObject {
  const tokens = snapshot.tokens;
  return {
    repoId,
    provider,
    ...(snapshot.subscriptionType === undefined
      ? {}
      : { subscriptionType: snapshot.subscriptionType }),
    ...(snapshot.status === undefined ? {} : { status: snapshot.status }),
    ...(snapshot.windows === undefined
      ? {}
      : { windows: snapshot.windows.map(windowToJson) }),
    ...(tokens === undefined
      ? {}
      : {
          tokens: {
            input: tokens.input,
            output: tokens.output,
            cacheRead: tokens.cacheRead,
            cacheWrite: tokens.cacheWrite,
            total: tokens.total,
          },
        }),
    ...(snapshot.costCents === undefined
      ? {}
      : { costCents: snapshot.costCents }),
  };
}

/**
 * Upserts the run's usage-limit snapshot in Convex at the end of a turn.
 *
 * Fire-and-forget by contract: nothing here may affect the turn's outcome, so
 * every failure is logged and swallowed. An unchanged reading is skipped, which
 * also caps a warm daemon at one write per turn.
 */
export async function reportUsageLimits(
  provider: UsageLimitProvider,
): Promise<void> {
  const snapshot = S.usageLimitSnapshot;
  if (!snapshot) return;
  if (!REPO_ID) {
    log("usage limits: no REPO_ID in the environment — not reporting");
    return;
  }
  const args = buildUsageLimitReportArgs(REPO_ID, provider, snapshot);
  const fingerprint = JSON.stringify(args);
  if (fingerprint === S.lastReportedUsageLimits) return;
  S.lastReportedUsageLimits = fingerprint;
  try {
    await callConvexWithRetry(
      "mutation",
      REPORT_MUTATION,
      { ...args, capturedAt: Date.now() },
      REPORT_MAX_RETRIES,
    );
  } catch (error) {
    // Clear the fingerprint so the next turn retries this reading.
    S.lastReportedUsageLimits = "";
    const messageText = error instanceof Error ? error.message : String(error);
    log("usage limits: report failed — " + messageText);
  }
}
