import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  buildDiffFileEntries,
  type DiffFileEntry,
} from "./components/sandbox/diffFiles";

/**
 * Client-side stale-while-revalidate cache for the three PR review payloads.
 *
 * Overview/diff/header all come from Convex *actions*, which are one-shot RPCs
 * rather than reactive queries, so the results were previously held in component
 * state and thrown away on unmount — every navigation paid a full GitHub round
 * trip again. Caching them at module scope means a revisit paints immediately
 * and refreshes in the background, and a hover over the reviews list can warm
 * everything before the click.
 */

/** How old a cached payload may be before a read triggers a background refetch. */
const STALE_MS = 30_000;
/** Enough for the PRs one session touches; oldest write is dropped past this. */
const MAX_ENTRIES = 20;

export interface PrKey {
  readonly repoId: Id<"githubRepos">;
  readonly prNumber: number;
}

function cacheKey({ repoId, prNumber }: PrKey): string {
  return `${repoId}:${prNumber}`;
}

interface CacheEntry<T> {
  readonly value: T;
  readonly fetchedAt: number;
}

export interface PeekResult<T> {
  readonly value: T;
  /** True once the entry is older than `STALE_MS` — paint it, then revalidate. */
  readonly stale: boolean;
}

interface SwrCache<T> {
  peek(key: string): PeekResult<T> | undefined;
  fetch(key: string, run: () => Promise<T>, force: boolean): Promise<T>;
}

// Exported for tests (in-flight dedupe / staleness), not used by other app code.
export function createSwrCache<T>(): SwrCache<T> {
  const entries = new Map<string, CacheEntry<T>>();
  const inflight = new Map<string, Promise<T>>();

  function set(key: string, value: T): void {
    // Delete first so a re-fetched key moves to the end of the insertion order,
    // which is what makes the eviction below drop the least recently written.
    entries.delete(key);
    entries.set(key, { value, fetchedAt: Date.now() });
    while (entries.size > MAX_ENTRIES) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  return {
    peek(key) {
      const entry = entries.get(key);
      if (entry === undefined) return undefined;
      return {
        value: entry.value,
        stale: Date.now() - entry.fetchedAt > STALE_MS,
      };
    },

    fetch(key, run, force) {
      // Concurrent readers of the same PR share one request. A forced fetch
      // deliberately does not join, because the point is to bypass every cache.
      if (!force) {
        const existing = inflight.get(key);
        if (existing !== undefined) return existing;
      }
      const promise: Promise<T> = run().then(
        (value) => {
          if (inflight.get(key) === promise) inflight.delete(key);
          set(key, value);
          return value;
        },
        (error: Error) => {
          // No negative caching: clearing the slot lets the next read retry.
          if (inflight.get(key) === promise) inflight.delete(key);
          throw error;
        },
      );
      inflight.set(key, promise);
      return promise;
    },
  };
}

/** Every cached action takes the same arguments, so one runner shape covers all. */
type PrRunner<T> = (args: {
  repoId: Id<"githubRepos">;
  prNumber: number;
  force?: boolean;
}) => Promise<T>;

type PrDiffPayload = FunctionReturnType<typeof api.github.getPrDiff>;
type PrOverviewPayload = FunctionReturnType<
  typeof api.github.getPullRequestOverview
>;
type PrHeaderPayload = FunctionReturnType<
  typeof api.github.getPullRequestHeader
>;

/**
 * A PR diff as the Diffs tab consumes it. The raw diff text is split into
 * per-file entries here, once per fetch, rather than on every render.
 */
export interface PrDiffData {
  readonly entries: readonly DiffFileEntry[];
  readonly truncated: boolean;
  readonly baseSha: string;
  readonly headSha: string;
  readonly repoUrl: string;
}

const diffCache = createSwrCache<PrDiffData>();
const overviewCache = createSwrCache<PrOverviewPayload>();
const headerCache = createSwrCache<PrHeaderPayload>();

export function peekPrDiff(key: PrKey): PeekResult<PrDiffData> | undefined {
  return diffCache.peek(cacheKey(key));
}

export function loadPrDiff(
  run: PrRunner<PrDiffPayload>,
  key: PrKey,
  force = false,
): Promise<PrDiffData> {
  return diffCache.fetch(
    cacheKey(key),
    () =>
      run({ ...key, force }).then((res) => ({
        entries: buildDiffFileEntries(res.diff),
        truncated: res.truncated,
        baseSha: res.baseSha,
        headSha: res.headSha,
        repoUrl: res.repoUrl,
      })),
    force,
  );
}

export function peekPrOverview(
  key: PrKey,
): PeekResult<PrOverviewPayload> | undefined {
  return overviewCache.peek(cacheKey(key));
}

export function loadPrOverview(
  run: PrRunner<PrOverviewPayload>,
  key: PrKey,
  force = false,
): Promise<PrOverviewPayload> {
  return overviewCache.fetch(
    cacheKey(key),
    () => run({ ...key, force }),
    force,
  );
}

export function peekPrHeader(
  key: PrKey,
): PeekResult<PrHeaderPayload> | undefined {
  return headerCache.peek(cacheKey(key));
}

export function loadPrHeader(
  run: PrRunner<PrHeaderPayload>,
  key: PrKey,
  force = false,
): Promise<PrHeaderPayload> {
  return headerCache.fetch(cacheKey(key), () => run({ ...key, force }), force);
}

export interface PrReviewRunners {
  readonly diff: PrRunner<PrDiffPayload>;
  readonly overview: PrRunner<PrOverviewPayload>;
  readonly header: PrRunner<PrHeaderPayload>;
}

/** Keys already warmed, so repeated hovers over one row cost nothing. */
const prefetched = new Set<string>();

/**
 * Warms all three payloads for a PR — called on hover intent in the reviews
 * list so the click itself has nothing left to fetch. Fire and forget: a failure
 * un-marks the key, leaving the retry to the next hover or the click.
 */
export function prefetchPrReview(runners: PrReviewRunners, key: PrKey): void {
  const id = cacheKey(key);
  if (prefetched.has(id)) return;
  prefetched.add(id);
  const forget = () => {
    prefetched.delete(id);
  };
  loadPrDiff(runners.diff, key).catch(forget);
  loadPrOverview(runners.overview, key).catch(forget);
  loadPrHeader(runners.header, key).catch(forget);
}
