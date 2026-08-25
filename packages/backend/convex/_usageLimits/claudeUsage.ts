import { z } from "zod";
import type { Infer } from "convex/values";
import type { usageLimitWindowValidator } from "../validators";

/**
 * Reading Claude's OAuth plan-usage endpoint (`GET /api/oauth/usage`).
 *
 * The sandbox captures the same numbers through the Agent SDK during a turn;
 * this is the server-side path, so the UI can pull a fresh reading without
 * waiting for one. The window keys, labels and display order are duplicated
 * from `callback-src/runtime/usageLimits.ts` — that is a separate esbuild
 * bundle which `convex/` cannot import — so a label added on one side belongs
 * on the other too.
 *
 * The response is parsed rather than trusted: the endpoint is undocumented and
 * answers an expired or wrong-scope token with HTTP 200 carrying an error
 * envelope instead of any of the window keys.
 */

export type UsageWindow = Infer<typeof usageLimitWindowValidator>;

/** Display labels for the endpoint's fixed window keys. */
const CLAUDE_WINDOW_LABELS: Record<string, string> = {
  five_hour: "5h",
  seven_day: "Weekly (all models)",
  seven_day_oauth_apps: "Weekly (apps)",
  seven_day_opus: "Weekly (Opus)",
  seven_day_sonnet: "Weekly (Sonnet)",
};

/** The five fixed windows, in the order they are shown. */
const FIXED_WINDOW_KEYS = [
  "five_hour",
  "seven_day",
  "seven_day_opus",
  "seven_day_sonnet",
  "seven_day_oauth_apps",
] as const;

const windowSchema = z
  .object({
    /** Percentage of the window consumed, 0-100. */
    utilization: z.number().nullish(),
    /** ISO 8601 timestamp, unlike `limits[].resets_at` below. */
    resets_at: z.string().nullish(),
  })
  .passthrough();

const scopedLimitSchema = z
  .object({
    kind: z.string().nullish(),
    percent: z.number().nullish(),
    /** Epoch SECONDS here, unlike the fixed windows' ISO strings. */
    resets_at: z.number().nullish(),
    scope: z
      .object({
        model: z
          .object({ display_name: z.string().nullish() })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const rateLimitsSchema = z
  .object({
    five_hour: windowSchema.nullish(),
    seven_day: windowSchema.nullish(),
    seven_day_oauth_apps: windowSchema.nullish(),
    seven_day_opus: windowSchema.nullish(),
    seven_day_sonnet: windowSchema.nullish(),
  })
  .passthrough();

export const claudeUsageBodySchema = z
  .object({
    five_hour: windowSchema.nullish(),
    seven_day: windowSchema.nullish(),
    seven_day_oauth_apps: windowSchema.nullish(),
    seven_day_opus: windowSchema.nullish(),
    seven_day_sonnet: windowSchema.nullish(),
    // The Agent SDK wraps the same windows under `rate_limits`. The raw
    // `/usage` endpoint usually sends them at the top level; both shapes are
    // accepted so a wrapper change cannot look like "Claude reported nothing".
    rate_limits: rateLimitsSchema.nullish(),
    limits: z.array(scopedLimitSchema).nullish(),
  })
  .passthrough();

export type ClaudeUsageBody = z.infer<typeof claudeUsageBodySchema>;

/**
 * Whether the body is a usage report at all. The endpoint answers a rejected
 * token with HTTP 200 and an error envelope, which parses cleanly against the
 * all-optional schema above — so "did it report any rate limits" is the only
 * honest test, and a body that reports none must not overwrite a stored row.
 */
export function hasPlanRateLimits(body: ClaudeUsageBody): boolean {
  return readClaudeUsageWindows(body).length > 0;
}

function finiteOrUndefined(
  value: number | null | undefined,
): number | undefined {
  if (typeof value !== "number") return undefined;
  return Number.isFinite(value) ? value : undefined;
}

function isoToMs(value: string | null | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pushWindow(
  windows: UsageWindow[],
  key: string,
  label: string,
  utilization: number | undefined,
  resetsAt: number | undefined,
): void {
  // A window the server reports as entirely null carries nothing to show.
  if (utilization === undefined && resetsAt === undefined) return;
  windows.push({
    key,
    label,
    ...(utilization === undefined ? {} : { utilization }),
    ...(resetsAt === undefined ? {} : { resetsAt }),
  });
}

/**
 * Every populated window in a `/usage` body, in display order.
 *
 * `extra_usage` is deliberately excluded: it meters spend beyond the plan, not
 * headroom within it, so folding it in would let a spend figure stand in for
 * how close the plan is to refusing work.
 */
export function readClaudeUsageWindows(body: ClaudeUsageBody): UsageWindow[] {
  const windows: UsageWindow[] = [];
  const nested = body.rate_limits;
  for (const key of FIXED_WINDOW_KEYS) {
    const entry = body[key] ?? nested?.[key];
    if (entry === undefined || entry === null) continue;
    pushWindow(
      windows,
      key,
      CLAUDE_WINDOW_LABELS[key] ?? key,
      finiteOrUndefined(entry.utilization),
      isoToMs(entry.resets_at),
    );
  }
  for (const entry of body.limits ?? []) {
    if (entry.kind !== "weekly_scoped") continue;
    const name = entry.scope?.model?.display_name?.trim();
    if (!name) continue;
    const resetsAtSeconds = finiteOrUndefined(entry.resets_at);
    // Model-scoped entries are weekly windows too, so they are labelled like
    // the fixed ones ("Weekly (Opus 5)") rather than by bare model name.
    pushWindow(
      windows,
      `model_scoped:${name}`,
      `Weekly (${name})`,
      finiteOrUndefined(entry.percent),
      resetsAtSeconds === undefined
        ? undefined
        : Math.round(resetsAtSeconds * 1000),
    );
  }
  return windows;
}
