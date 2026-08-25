import { describe, expect, it } from "vitest";
import {
  isAuthoritativeReading,
  isUsageLimitReadingFresh,
  mergeUsageLimitWindows,
  USAGE_LIMIT_READING_MAX_AGE_MS,
} from "../convex/usageLimits";

describe("usage limit report semantics", () => {
  it("merges a partial window without erasing fuller stored data", () => {
    expect(
      mergeUsageLimitWindows(
        [
          { key: "five_hour", label: "5h", utilization: 40 },
          { key: "seven_day", label: "Weekly", utilization: 60 },
        ],
        [{ key: "five_hour", label: "5h", utilization: 90 }],
      ),
    ).toEqual([
      { key: "five_hour", label: "5h", utilization: 90 },
      { key: "seven_day", label: "Weekly", utilization: 60 },
    ]);
  });

  it("only replaces the stored row for a complete provider reading", () => {
    expect(isAuthoritativeReading("complete", undefined)).toBe(true);
    // A refusal and a passing observation both merge: neither has seen the
    // whole picture, so neither may clear windows an earlier read established.
    expect(isAuthoritativeReading("refused", undefined)).toBe(false);
    expect(isAuthoritativeReading("partial", undefined)).toBe(false);
    // The discriminant wins over the legacy boolean when both arrive.
    expect(isAuthoritativeReading("refused", true)).toBe(false);
  });

  it("honours the pre-discriminant boolean from older callback bundles", () => {
    expect(isAuthoritativeReading(undefined, true)).toBe(true);
    expect(isAuthoritativeReading(undefined, false)).toBe(false);
    expect(isAuthoritativeReading(undefined, undefined)).toBe(false);
  });

  it("expires old readings at the shared 24-hour threshold", () => {
    const now = 1_800_000_000_000;
    expect(
      isUsageLimitReadingFresh(now - USAGE_LIMIT_READING_MAX_AGE_MS, now),
    ).toBe(true);
    expect(
      isUsageLimitReadingFresh(now - USAGE_LIMIT_READING_MAX_AGE_MS - 1, now),
    ).toBe(false);
  });
});
