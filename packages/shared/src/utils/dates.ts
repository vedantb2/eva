import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function compactRelativeTime(date: number | string | Date): string {
  const now = dayjs();
  const then = dayjs(date);
  const diffSeconds = now.diff(then, "second");

  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMinutes = now.diff(then, "minute");
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = now.diff(then, "hour");
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = now.diff(then, "day");
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = now.diff(then, "month");
  if (diffMonths < 12) return `${diffMonths}mo`;
  const diffYears = now.diff(then, "year");
  return `${diffYears}y`;
}

export default dayjs;
