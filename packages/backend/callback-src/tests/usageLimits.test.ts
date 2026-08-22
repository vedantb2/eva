import { beforeEach, expect, test } from "vitest";
import { callbackState as S, resetStateForTests } from "../runtime/state.js";
import {
  buildUsageLimitReportArgs,
  mergeClaudeRateLimitEvent,
  readClaudeUsageWindows,
  readCursorUsageSnapshot,
  readIsoMs,
} from "../runtime/usageLimits.js";

beforeEach(() => {
  resetStateForTests();
});

test("mergeClaudeRateLimitEvent labels the window and converts epoch seconds", () => {
  mergeClaudeRateLimitEvent({
    type: "rate_limit_event",
    rate_limit_info: {
      status: "allowed_warning",
      rateLimitType: "five_hour",
      utilization: 82.5,
      resetsAt: 1_770_000_000,
    },
  });
  expect(S.usageLimitSnapshot).toEqual({
    status: "allowed_warning",
    windows: [
      {
        key: "five_hour",
        label: "5h",
        utilization: 82.5,
        resetsAt: 1_770_000_000_000,
      },
    ],
  });
});

test("mergeClaudeRateLimitEvent merges per window without clobbering the others", () => {
  mergeClaudeRateLimitEvent({
    rate_limit_info: {
      status: "allowed",
      rateLimitType: "five_hour",
      utilization: 10,
    },
  });
  mergeClaudeRateLimitEvent({
    rate_limit_info: {
      status: "allowed",
      rateLimitType: "seven_day_opus",
      utilization: 40,
    },
  });
  // A second reading for a window already seen replaces only that window.
  mergeClaudeRateLimitEvent({
    rate_limit_info: {
      status: "rejected",
      rateLimitType: "five_hour",
      utilization: 100,
    },
  });
  expect(S.usageLimitSnapshot).toEqual({
    status: "rejected",
    windows: [
      { key: "five_hour", label: "5h", utilization: 100 },
      { key: "seven_day_opus", label: "Weekly (Opus)", utilization: 40 },
    ],
  });
});

test("mergeClaudeRateLimitEvent ignores payloads it cannot read", () => {
  mergeClaudeRateLimitEvent({ type: "rate_limit_event" });
  mergeClaudeRateLimitEvent({ rate_limit_info: "nope" });
  mergeClaudeRateLimitEvent({ rate_limit_info: { status: "unheard-of" } });
  expect(S.usageLimitSnapshot).toBeNull();
});

test("mergeClaudeRateLimitEvent keeps an unknown window key as its own label", () => {
  mergeClaudeRateLimitEvent({
    rate_limit_info: { status: "allowed", rateLimitType: "ten_minute" },
  });
  expect(S.usageLimitSnapshot?.windows).toEqual([
    { key: "ten_minute", label: "ten_minute" },
  ]);
});

test("readIsoMs parses ISO timestamps and rejects everything else", () => {
  expect(readIsoMs("2026-08-22T10:00:00.000Z")).toBe(
    Date.parse("2026-08-22T10:00:00.000Z"),
  );
  expect(readIsoMs("not-a-date")).toBeUndefined();
  expect(readIsoMs(null)).toBeUndefined();
  expect(readIsoMs(undefined)).toBeUndefined();
  expect(readIsoMs(1_770_000_000)).toBeUndefined();
});

test("readClaudeUsageWindows builds every populated window in display order", () => {
  expect(
    readClaudeUsageWindows({
      subscription_type: "max",
      rate_limits_available: true,
      rate_limits: {
        five_hour: {
          utilization: 12,
          resets_at: "2026-08-22T10:00:00.000Z",
        },
        seven_day: { utilization: 55, resets_at: null },
        // Reported but entirely null — nothing to show, so no window.
        seven_day_opus: { utilization: null, resets_at: null },
        seven_day_sonnet: null,
        model_scoped: [
          { display_name: "Fable", utilization: 3, resets_at: null },
          // No display name means no label and no stable key.
          { utilization: 9, resets_at: null },
        ],
      },
    }),
  ).toEqual([
    {
      key: "five_hour",
      label: "5h",
      utilization: 12,
      resetsAt: Date.parse("2026-08-22T10:00:00.000Z"),
    },
    { key: "seven_day", label: "Weekly (all models)", utilization: 55 },
    { key: "model_scoped:Fable", label: "Fable", utilization: 3 },
  ]);
});

test("readClaudeUsageWindows is empty when the plan reports no limits", () => {
  expect(readClaudeUsageWindows(null)).toEqual([]);
  expect(readClaudeUsageWindows({ rate_limits: null })).toEqual([]);
});

test("readCursorUsageSnapshot normalizes cumulative tokens and charged cost", () => {
  expect(
    readCursorUsageSnapshot({
      usage: {
        inputTokens: 100,
        outputTokens: 20,
        cacheReadTokens: 5,
        cacheWriteTokens: 2,
        totalTokens: 127,
      },
      cost: { chargedCents: 41.5 },
    }),
  ).toEqual({
    tokens: { input: 100, output: 20, cacheRead: 5, cacheWrite: 2, total: 127 },
    costCents: 41.5,
  });
  // Cost absent (not yet reported by the backend) is not zero.
  expect(
    readCursorUsageSnapshot({ usage: { inputTokens: 7 } })?.costCents,
  ).toBeUndefined();
  // Nothing to read from is null, never a throw.
  expect(readCursorUsageSnapshot(undefined)).toBeNull();
  expect(readCursorUsageSnapshot({})).toBeNull();
});

test("buildUsageLimitReportArgs omits every field the snapshot did not observe", () => {
  expect(
    buildUsageLimitReportArgs("repo-1", "claude", {
      subscriptionType: "max",
      status: "allowed",
      windows: [{ key: "five_hour", label: "5h", utilization: 12 }],
    }),
  ).toEqual({
    repoId: "repo-1",
    provider: "claude",
    subscriptionType: "max",
    status: "allowed",
    windows: [{ key: "five_hour", label: "5h", utilization: 12 }],
  });
  expect(
    buildUsageLimitReportArgs("repo-1", "cursor", { costCents: 0 }),
  ).toEqual({ repoId: "repo-1", provider: "cursor", costCents: 0 });
});
