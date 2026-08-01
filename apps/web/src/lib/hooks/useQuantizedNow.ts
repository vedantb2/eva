import { useSyncExternalStore } from "react";

/**
 * The current time rounded down to a multiple of `intervalMs`, advancing once
 * per interval.
 *
 * Exists because Convex queries must not read the clock: results are cached and
 * invalidated on data, never on time, so a query that calls `Date.now()` keeps
 * serving the answer it computed the first time it ran. Passing the timestamp in
 * as an argument fixes that — but a raw `Date.now()` in a render body is a
 * different value every render, so the query would resubscribe on each one and
 * never hit the cache.
 *
 * Rounding gives both properties: the argument is identical for the whole
 * interval, and it advances predictably. Pick the interval from how fresh the
 * answer has to be — a minute for a live count, a day for a date window.
 */
export function useQuantizedNow(intervalMs: number): number {
  return useSyncExternalStore(
    (onChange) => {
      // Chained to the next boundary rather than setInterval: an interval
      // started mid-period fires mid-period forever, so the value would lag the
      // boundary it is supposed to land on by however late the mount was.
      let timer: ReturnType<typeof setTimeout>;
      const scheduleNextBoundary = () => {
        timer = setTimeout(
          () => {
            onChange();
            scheduleNextBoundary();
          },
          intervalMs - (Date.now() % intervalMs),
        );
      };
      scheduleNextBoundary();
      return () => clearTimeout(timer);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
  );
}
