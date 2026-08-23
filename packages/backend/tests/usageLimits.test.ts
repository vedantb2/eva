import { describe, expect, it } from "vitest";
import {
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
