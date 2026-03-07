import dayjs from "@conductor/shared/dates";

export type RepoStatsRange =
  | "1d"
  | "3d"
  | "1w"
  | "1m"
  | "3m"
  | "6m"
  | "1y"
  | "all";

export const repoStatsRangeOptions: {
  value: RepoStatsRange;
  label: string;
}[] = [
  { value: "1d", label: "1D" },
  { value: "3d", label: "3D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

export function isRepoStatsRange(value: string): value is RepoStatsRange {
  return repoStatsRangeOptions.some((option) => option.value === value);
}

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

export function getStatsStartTime(range: RepoStatsRange): number | undefined {
  if (range === "all") return undefined;
  if (range === "1d") return dayjs().subtract(1, "day").valueOf();
  if (range === "3d") return dayjs().subtract(3, "day").valueOf();
  if (range === "1w") return dayjs().subtract(1, "week").valueOf();
  if (range === "1m") return dayjs().subtract(1, "month").valueOf();
  if (range === "3m") return dayjs().subtract(3, "month").valueOf();
  if (range === "6m") return dayjs().subtract(6, "month").valueOf();
  return dayjs().subtract(1, "year").valueOf();
}

export function getTimelineWindow(range: RepoStatsRange): {
  startTime: number;
  bucketSizeMs: number;
} {
  if (range === "all") {
    return { startTime: 0, bucketSizeMs: 30 * DAY_MS };
  }
  if (range === "1d") {
    return {
      startTime: dayjs().subtract(1, "day").valueOf(),
      bucketSizeMs: 2 * HOUR_MS,
    };
  }
  if (range === "3d") {
    return {
      startTime: dayjs().subtract(3, "day").valueOf(),
      bucketSizeMs: 6 * HOUR_MS,
    };
  }
  if (range === "1w") {
    return {
      startTime: dayjs().subtract(1, "week").valueOf(),
      bucketSizeMs: DAY_MS,
    };
  }
  if (range === "1m") {
    return {
      startTime: dayjs().subtract(1, "month").valueOf(),
      bucketSizeMs: 3 * DAY_MS,
    };
  }
  if (range === "3m") {
    return {
      startTime: dayjs().subtract(3, "month").valueOf(),
      bucketSizeMs: 7 * DAY_MS,
    };
  }
  if (range === "6m") {
    return {
      startTime: dayjs().subtract(6, "month").valueOf(),
      bucketSizeMs: 14 * DAY_MS,
    };
  }
  return {
    startTime: dayjs().subtract(1, "year").valueOf(),
    bucketSizeMs: 30 * DAY_MS,
  };
}
