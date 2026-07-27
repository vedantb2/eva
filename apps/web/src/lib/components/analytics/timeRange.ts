/**
 * The analytics time-range vocabulary, and the windows each range selects.
 *
 * Separate from `TimeRangeFilter.tsx` because these are the arguments the
 * analytics queries run on: pure, testable, and free of the component's UI
 * imports.
 */

export const DAY_MS = 86_400_000;

export const TIME_RANGES = ["7d", "30d", "90d", "all"] as const;

export type TimeRange = (typeof TIME_RANGES)[number];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;

export function isTimeRange(value: string): value is TimeRange {
  const ranges: ReadonlyArray<string> = TIME_RANGES;
  return ranges.includes(value);
}

/**
 * Start of the selected window, measured back from `now`, or undefined for all
 * time.
 *
 * `now` is a parameter rather than a `Date.now()` call so that a render cannot
 * change it: these values are Convex query arguments, and a start time that
 * drifts by a millisecond per render resubscribes every query on the page.
 * Callers pass a quantized timestamp (see `useQuantizedNow`).
 */
export function getStartTime(
  range: TimeRange,
  now: number,
): number | undefined {
  if (range === "all") return undefined;
  return now - RANGE_DAYS[range] * DAY_MS;
}

/** Start of the equal-length window immediately before `getStartTime`. */
export function getPreviousStartTime(
  range: TimeRange,
  now: number,
): number | undefined {
  const start = getStartTime(range, now);
  return start === undefined ? undefined : start - (now - start);
}

/** Bucket width for the activity timeline: daily up to 30 days, else weekly. */
export function getBucketSize(range: TimeRange): number {
  return range === "7d" || range === "30d" ? DAY_MS : 7 * DAY_MS;
}
