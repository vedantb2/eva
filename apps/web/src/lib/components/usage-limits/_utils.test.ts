import { expect, test } from "vitest";
import {
  chipSummary,
  formatCostCents,
  formatResetDistanceMs,
  maxUtilization,
  newestCapturedAt,
  orderedSections,
  providerHeading,
  reportedWindows,
  resetsInLabel,
  sectionKey,
  toneForUtilization,
  type UsageSnapshot,
  worseTone,
} from "./_utils";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = 1_700_000_000_000;

function claude(overrides: Partial<UsageSnapshot> = {}): UsageSnapshot {
  return {
    provider: "claude",
    capturedAt: NOW - 5 * 60 * 1000,
    subscriptionType: "max",
    status: "allowed",
    windows: [
      { key: "5h", label: "5h", utilization: 42 },
      { key: "week", label: "Weekly (all models)", utilization: 62 },
    ],
    ...overrides,
  };
}

function cursor(overrides: Partial<UsageSnapshot> = {}): UsageSnapshot {
  return {
    provider: "cursor",
    capturedAt: NOW - 60 * 1000,
    costCents: 142,
    tokens: {
      input: 1_200_000,
      output: 34_000,
      cacheRead: 900_000,
      cacheWrite: 12_000,
      total: 2_146_000,
    },
    ...overrides,
  };
}

test("tone buckets sit on the 80 and 95 thresholds", () => {
  expect(toneForUtilization(79.9)).toBe("neutral");
  expect(toneForUtilization(80)).toBe("warning");
  expect(toneForUtilization(94.9)).toBe("warning");
  expect(toneForUtilization(95)).toBe("danger");
});

test("a reported status is never softened by a low window", () => {
  // The provider's own warning is the part worth surfacing, not the 42% bar.
  expect(worseTone("neutral", "warning")).toBe("warning");
  expect(
    chipSummary([claude({ status: "allowed_warning" })])?.tone,
  ).toBe("warning");
  expect(chipSummary([claude({ status: "rejected" })])?.tone).toBe("danger");
});

test("the chip shows the tightest window across a Claude row", () => {
  expect(maxUtilization(claude())).toBe(62);
  expect(chipSummary([claude()])).toEqual({
    label: "62%",
    utilization: 62,
    tone: "neutral",
  });
});

test("windows with no utilisation are skipped, not drawn at zero", () => {
  const snapshot = claude({
    windows: [
      { key: "5h", label: "5h", utilization: 30 },
      { key: "opus", label: "Weekly (Opus)" },
    ],
  });
  expect(reportedWindows(snapshot).map((w) => w.key)).toEqual(["5h"]);
  expect(maxUtilization(claude({ windows: [] }))).toBeUndefined();
  expect(maxUtilization(cursor())).toBeUndefined();
});

test("a Cursor-only repo falls back to cumulative cost", () => {
  expect(chipSummary([cursor()])).toEqual({ label: "$1.42", tone: "neutral" });
  expect(formatCostCents(0)).toBe("$0.00");
  expect(formatCostCents(7)).toBe("$0.07");
});

test("Claude windows win over a Cursor cost when both have reported", () => {
  expect(chipSummary([cursor(), claude()])?.label).toBe("62%");
});

test("the chip shows the tightest window across every account, not the freshest", () => {
  // Two Claude accounts on one repo. The newer row is the roomier one, so a
  // first-match chip would have understated how close the other is to refusal.
  const roomy = claude({ capturedAt: NOW, windows: [{ key: "5h", label: "5h", utilization: 18 }] });
  const tight = claude({
    capturedAt: NOW - 60_000,
    windows: [{ key: "5h", label: "5h", utilization: 83 }],
  });
  expect(chipSummary([roomy, tight])).toEqual({
    label: "83%",
    utilization: 83,
    tone: "warning",
  });
});

test("one account's flagged status colours the chip the whole card shares", () => {
  // The collapsed chip stands in for every account, so a rejection sitting
  // behind a lower utilisation must not be hidden by it.
  const calm = claude({ windows: [{ key: "5h", label: "5h", utilization: 70 }] });
  const rejected = claude({
    status: "rejected",
    windows: [{ key: "5h", label: "5h", utilization: 12 }],
  });
  expect(chipSummary([calm, rejected])).toEqual({
    label: "70%",
    utilization: 70,
    tone: "danger",
  });
});

test("a section is keyed by account, so two of one provider stay distinct", () => {
  expect(sectionKey({ provider: "claude", providerAccountId: "acc-a" })).toBe(
    "claude:acc-a",
  );
  expect(sectionKey({ provider: "claude", providerAccountId: "acc-b" })).not.toBe(
    sectionKey({ provider: "claude", providerAccountId: "acc-a" }),
  );
  // A run on the shared team credential has no account, and still keys.
  expect(sectionKey({ provider: "cursor" })).toBe("cursor:");
});

test("a provider's accounts render adjacently, newest provider first", () => {
  // Newest-first rows can interleave providers; grouping must not let the
  // Cursor section split the two Claude accounts apart.
  const rows = [
    { provider: "claude" as const, providerAccountId: "acc-a" },
    { provider: "cursor" as const },
    { provider: "claude" as const, providerAccountId: "acc-b" },
  ];
  expect(orderedSections(rows).map(sectionKey)).toEqual([
    "claude:acc-a",
    "claude:acc-b",
    "cursor:",
  ]);
  expect(orderedSections([])).toEqual([]);
});

test("a flagged reading still shows even with nothing to measure", () => {
  expect(
    chipSummary([
      { provider: "claude", capturedAt: NOW, status: "rejected" },
    ]),
  ).toEqual({ label: "Limit reached", tone: "danger" });
  expect(
    chipSummary([
      { provider: "claude", capturedAt: NOW, status: "allowed_warning" },
    ])?.label,
  ).toBe("Near limit");
});

test("nothing to show renders nothing at all", () => {
  expect(chipSummary([])).toBeUndefined();
  expect(
    chipSummary([{ provider: "claude", capturedAt: NOW, status: "allowed" }]),
  ).toBeUndefined();
});

test("reset labels count down, and stop at the reset", () => {
  expect(resetsInLabel(NOW + 2 * HOUR + 15 * 60 * 1000, NOW)).toBe(
    "resets in 2h 15m",
  );
  expect(resetsInLabel(NOW + 9 * 60 * 1000, NOW)).toBe("resets in 9m");
  expect(resetsInLabel(NOW - 1000, NOW)).toBe("resets now");
});

test("a reset more than a day out is counted in days, not raw hours", () => {
  expect(formatResetDistanceMs(2 * DAY + 23 * HOUR)).toBe("2d 23h");
  expect(formatResetDistanceMs(6 * DAY + 12 * HOUR)).toBe("6d 12h");
  // Whole days drop the "0h", and the last minutes of a day roll up into it.
  expect(formatResetDistanceMs(3 * DAY)).toBe("3d");
  expect(formatResetDistanceMs(DAY - 30 * 1000)).toBe("1d");
  expect(resetsInLabel(NOW + 2 * DAY + 23 * HOUR, NOW)).toBe(
    "resets in 2d 23h",
  );
});

test("under a day stays on hours and minutes, under an hour on minutes", () => {
  expect(formatResetDistanceMs(23 * HOUR + 59 * 60 * 1000)).toBe("23h 59m");
  expect(formatResetDistanceMs(2 * HOUR + 28 * 60 * 1000)).toBe("2h 28m");
  expect(formatResetDistanceMs(2 * HOUR)).toBe("2h");
  expect(formatResetDistanceMs(45 * 60 * 1000)).toBe("45m");
  // Rounding up keeps a live countdown off "0m" while time remains.
  expect(formatResetDistanceMs(30 * 1000)).toBe("1m");
});

test("the provider heading names the plan only when there is one", () => {
  expect(providerHeading(claude())).toBe("Claude · Max plan");
  expect(providerHeading(claude({ subscriptionType: undefined }))).toBe(
    "Claude",
  );
  expect(providerHeading(cursor())).toBe("Cursor");
});

test("the footer stamps the freshest reading of the lot", () => {
  expect(newestCapturedAt([claude(), cursor()])).toBe(cursor().capturedAt);
  expect(newestCapturedAt([])).toBeUndefined();
});
